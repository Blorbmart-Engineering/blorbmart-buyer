import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth, useUserData } from '../../hooks/useFirebaseData'
import { createOrder } from '../../services/orderService'
import { getPreorderOptions, type PreorderOption, type PreorderOptions } from '../../services/preorderService'
import { apiFetchAuth } from '../../lib/api'
import {
  calculateOrderPricing, getDeliveryZones,
  initializePaystackCheckout, payForOrderWithWallet,
  verifyPaystackCheckout, notifyNewOrder, type CheckoutPricing, type CampusLocation,
} from '../../services/checkoutService'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import {
  HomeIcon, BuildingIcon, BriefcaseIcon, MapPinIcon, CreditCardIcon, CartIcon,
  PhoneIcon, EditIcon, WalletIcon, ReceiptIcon, LockIcon, ClockIcon,
} from '../../components/icons'

// ─── Types ────────────────────────────────────────────────────────────────────
type Address = {
  docId: string; name: string; addressLine1: string; addressLine2?: string
  city: string; state: string; phone: string; isDefault: boolean
}

type PayMethod = 'wallet' | 'paystack'

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  .co-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }

  .co-header { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); padding: 12px 16px; }
  .co-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
  .co-back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .co-header-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 800; flex: 1; }

  /* Steps indicator */
  .co-steps { display: flex; align-items: center; gap: 0; }
  .co-step { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-3); }
  .co-step.active { color: var(--blue); }
  .co-step.done { color: #10b981; }
  .co-step-num { width: 24px; height: 24px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
  .co-step.done .co-step-num { background: #10b981; border-color: #10b981; color: #fff; }
  .co-step.active .co-step-num { background: var(--blue); border-color: var(--blue); color: #fff; }
  .co-step-line { width: 28px; height: 2px; background: var(--border); margin: 0 4px; flex-shrink: 0; }
  .co-step-line.done { background: #10b981; }

  /* Body */
  .co-body { max-width: 1100px; margin: 0 auto; padding: 24px 16px 80px; display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
  @media (max-width: 820px) { .co-body { grid-template-columns: 1fr; } }

  /* Cards */
  .co-card { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 16px; }
  .co-card-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .co-card-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }

  /* Address cards */
  .co-addr-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  .co-addr-card { border: 2px solid var(--border); border-radius: var(--radius); padding: 14px 16px; cursor: pointer; transition: all .15s; display: flex; gap: 12px; align-items: flex-start; }
  .co-addr-card:hover { border-color: var(--blue); }
  .co-addr-card.selected { border-color: var(--blue); background: var(--blue-light); }
  .co-addr-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; transition: all .15s; }
  .co-addr-card.selected .co-addr-radio { border-color: var(--blue); background: var(--blue); }
  .co-addr-card.selected .co-addr-radio::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #fff; }
  .co-addr-label { font-size: 12px; font-weight: 700; color: var(--blue); background: var(--blue-light); padding: 2px 8px; border-radius: 999px; display: inline-block; margin-bottom: 4px; }
  .co-addr-line1 { font-size: 14px; font-weight: 600; color: var(--text); }
  .co-addr-line2 { font-size: 12px; color: var(--text-3); margin-top: 2px; }
  .co-add-addr-btn { display: flex; align-items: center; gap: 8px; border: 2px dashed var(--border); border-radius: var(--radius); padding: 12px 16px; background: none; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-2); width: 100%; font-family: 'Plus Jakarta Sans', sans-serif; transition: all .15s; }
  .co-add-addr-btn:hover { border-color: var(--blue); color: var(--blue); }

  /* Form fields */
  .co-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .co-form-grid { grid-template-columns: 1fr; } }
  .co-full { grid-column: 1 / -1; }
  .co-field { display: flex; flex-direction: column; gap: 5px; }
  .co-label { font-size: 13px; font-weight: 600; color: var(--text-2); }
  .co-input { border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 13px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); outline: none; transition: border-color .2s; width: 100%; }
  .co-input:focus { border-color: var(--blue); }
  .co-input[readonly] { background: #f8fafc; color: var(--text-2); cursor: not-allowed; }

  /* Payment method cards */
  .co-pay-list { display: flex; flex-direction: column; gap: 10px; }
  .co-pay-card { border: 2px solid var(--border); border-radius: var(--radius); padding: 14px 16px; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 14px; }
  .co-pay-card:hover { border-color: var(--blue); }
  .co-pay-card.selected { border-color: var(--blue); background: var(--blue-light); }
  .co-pay-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .co-pay-icon.cod { background: #fff7ed; }
  .co-pay-icon.wallet { background: #eff6ff; }
  .co-pay-icon.card { background: #f0fdf4; }
  .co-pay-title { font-size: 14px; font-weight: 700; }
  .co-pay-sub { font-size: 12px; color: var(--text-3); margin-top: 2px; }
  .co-pay-badge { margin-left: auto; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; flex-shrink: 0; }
  .co-pay-badge.warn { background: #fef3c7; color: #92400e; }
  .co-pay-badge.ok { background: #d1fae5; color: #065f46; }

  /* Order items (summary side) */
  .co-order-item { display: flex; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .co-order-item:last-child { border-bottom: none; }
  .co-order-img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; background: #EEF2FF; flex-shrink: 0; }
  .co-order-name { font-size: 13px; font-weight: 600; flex: 1; line-height: 1.3; }
  .co-order-qty { font-size: 11px; color: var(--text-3); margin-top: 2px; }
  .co-order-price { font-size: 13px; font-weight: 800; color: var(--blue); text-align: right; flex-shrink: 0; }
  .co-store-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .06em; padding: 8px 0 4px; }

  /* Summary rows */
  .co-sum-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--text-2); margin-bottom: 10px; }
  .co-sum-row.total { font-size: 17px; font-weight: 800; color: var(--text); margin-top: 6px; }
  .co-sum-row.discount { color: #10b981; }
  .co-sum-divider { height: 1px; background: var(--border); margin: 12px 0; }

  /* CTA */
  .co-place-btn { width: 100%; padding: 15px; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all .2s; background: var(--blue); color: #fff; margin-top: 16px; }
  .co-place-btn:hover { background: #1d4ed8; }
  .co-place-btn:disabled { background: #93c5fd; cursor: not-allowed; }
  .co-secure { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; color: var(--text-3); margin-top: 10px; }

  /* Error */
  .co-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #b91c1c; margin-top: 12px; display: flex; gap: 8px; align-items: flex-start; }

  /* Modal overlay */
  .co-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 80; display: flex; align-items: flex-end; justify-content: center; }
  @media (min-width: 600px) { .co-modal-overlay { align-items: center; } }
  .co-modal { background: #fff; border-radius: 24px 24px 0 0; width: 100%; max-width: 520px; padding: 24px 20px 32px; max-height: 90vh; overflow-y: auto; animation: slideUpModal .3s ease; }
  @media (min-width: 600px) { .co-modal { border-radius: 24px; } }
  .co-modal-handle { width: 36px; height: 4px; background: #D1D5DB; border-radius: 2px; margin: 0 auto 20px; }
  .co-modal-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 20px; }
  .co-modal-save-btn { width: 100%; padding: 14px; background: var(--blue); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 20px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .co-modal-save-btn:disabled { opacity: .6; cursor: not-allowed; }

  /* Label chips */
  .co-label-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .co-label-chip { padding: 6px 14px; border-radius: 999px; border: 1.5px solid var(--border); font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; background: #fff; color: var(--text-2); }
  .co-label-chip.active { background: var(--blue); border-color: var(--blue); color: #fff; }

  /* Paystack modal */
  .co-paystack-modal { background: #fff; border-radius: 24px; width: 100%; max-width: 420px; padding: 28px 24px; text-align: center; animation: slideUpModal .3s ease; }
  .co-paystack-icon { font-size: 48px; margin-bottom: 12px; }
  .co-paystack-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 8px; }
  .co-paystack-sub { font-size: 14px; color: var(--text-2); margin-bottom: 24px; line-height: 1.5; }
  .co-paystack-verify { width: 100%; padding: 14px; background: #059669; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; margin-bottom: 10px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .co-paystack-cancel { width: 100%; padding: 10px; background: none; border: 1.5px solid var(--border); border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; color: var(--text-2); font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes slideUpModal { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .co-preorder-banner { background: #fff7ed; border: 1.5px solid rgba(249,115,22,.25); border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }
  .co-preorder-title { font-size: 14px; font-weight: 800; color: #c2410c; margin-bottom: 4px; }
  .co-preorder-sub { font-size: 12.5px; color: var(--text-2); line-height: 1.5; }
  .co-preorder-options { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .co-preorder-option { border: 2px solid var(--border); border-radius: 12px; padding: 12px 14px; cursor: pointer; transition: all .15s; }
  .co-preorder-option.selected { border-color: #f97316; background: #fff7ed; }
  .co-preorder-option-label { font-size: 14px; font-weight: 700; color: var(--text); }
  .co-preorder-option-cutoff { font-size: 12px; color: var(--text-3); margin-top: 3px; }

  /* Mobile footer */
  .co-mobile-footer { display: none; position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top: 1px solid var(--border); padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); z-index: 40; }
  @media (max-width: 820px) { .co-mobile-footer { display: block; } .co-body { padding-bottom: 120px; } }
`

// ─── Add Address Modal ────────────────────────────────────────────────────────
const ADDRESS_LABELS = ['Home', 'Hostel', 'Office', 'Other']

function AddAddressModal({
  onSave, onClose, saving,
}: {
  onSave: (addr: Omit<Address, 'docId' | 'isDefault'>) => Promise<void>
  onClose: () => void
  saving: boolean
}) {
  const [label, setLabel] = useState('Home')
  const [customLabel, setCustomLabel] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [phone, setPhone] = useState('')

  const finalLabel = label === 'Other' ? customLabel : label

  const handleSave = async () => {
    if (!addressLine1 || !city || !state || !phone) return
    await onSave({ name: finalLabel || 'Address', addressLine1, addressLine2, city, state, phone })
  }

  return (
    <div className="co-modal-overlay" onClick={onClose}>
      <div className="co-modal" onClick={e => e.stopPropagation()}>
        <div className="co-modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="co-modal-title" style={{ margin: 0 }}>Add Delivery Address</div>
          <button onClick={onClose} type="button" style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', lineHeight: 1, color: 'var(--text-2)', flexShrink: 0 }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="co-label" style={{ marginBottom: 8 }}>Label</div>
          <div className="co-label-chips">
            {ADDRESS_LABELS.map(l => (
              <div key={l} className={`co-label-chip ${label === l ? 'active' : ''}`} onClick={() => setLabel(l)}>
                {l === 'Home' ? <HomeIcon filled={false} /> : l === 'Hostel' ? <BuildingIcon size={16} /> : l === 'Office' ? <BriefcaseIcon size={16} /> : <MapPinIcon size={16} />} {l}
              </div>
            ))}
          </div>
          {label === 'Other' && (
            <input className="co-input" placeholder="Label (e.g. Campus Gate)" value={customLabel} onChange={e => setCustomLabel(e.target.value)} style={{ marginTop: 4 }} />
          )}
        </div>

        <div className="co-form-grid">
          <div className="co-field co-full">
            <label className="co-label">Street Address *</label>
            <input className="co-input" placeholder="e.g. 12 Adeleke Street" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
          </div>
          <div className="co-field co-full">
            <label className="co-label">Apartment / Landmark (optional)</label>
            <input className="co-input" placeholder="e.g. Beside the gate, Room 204" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
          </div>
          <div className="co-field">
            <label className="co-label">City *</label>
            <input className="co-input" placeholder="e.g. Ile-Ife" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="co-field">
            <label className="co-label">State *</label>
            <input className="co-input" placeholder="e.g. Osun" value={state} onChange={e => setState(e.target.value)} />
          </div>
          <div className="co-field co-full">
            <label className="co-label">Phone Number *</label>
            <input className="co-input" type="tel" placeholder="+234 800 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        <button
          className="co-modal-save-btn"
          type="button"
          onClick={handleSave}
          disabled={saving || !addressLine1 || !city || !state || !phone}
        >
          {saving ? 'Saving…' : 'Save Address'}
        </button>
      </div>
    </div>
  )
}

// ─── Paystack Modal ───────────────────────────────────────────────────────────
function PaystackModal({
  authUrl, onVerify, onCancel, verifying, popupBlocked,
}: {
  authUrl: string; onVerify: () => void; onCancel: () => void; verifying: boolean; popupBlocked: boolean
}) {
  return (
    <div className="co-modal-overlay">
      <div className="co-paystack-modal">
        <div className="co-paystack-icon"><CreditCardIcon /></div>
        <div className="co-paystack-title">Complete Payment</div>

        {popupBlocked ? (
          <div className="co-paystack-sub">
            Your browser blocked the payment page from opening.<br />
            Tap the button below to open it.
          </div>
        ) : (
          <div className="co-paystack-sub">
            <strong>Step 1:</strong> A Paystack payment page opened in a <strong>new browser tab</strong>. Switch to that tab and pay.<br /><br />
            <strong>Step 2:</strong> After paying, that tab will close itself. Come back to <strong>this tab</strong> (the one you're reading right now) and tap <strong>"I've Paid"</strong> below.
          </div>
        )}

        <button
          type="button"
          onClick={() => window.open(authUrl, '_blank', 'noopener,noreferrer')}
          className="co-paystack-verify"
          style={{ marginBottom: 8 }}
        >
          {popupBlocked ? '↗ Open Payment Page' : '↗ Reopen Payment Page'}
        </button>

        <button className="co-paystack-verify" type="button" onClick={onVerify} disabled={verifying}>
          {verifying ? 'Verifying…' : "✓ I've Paid — Confirm Order"}
        </button>
        <button className="co-paystack-cancel" type="button" onClick={onCancel}>
          Not yet — Go Back
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { userData } = useUserData(user?.uid)
  const { items, subtotal, clearCart, isFoodCart } = useCart()

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null)
  const [loadingAddrs, setLoadingAddrs] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [savingAddr, setSavingAddr] = useState(false)

  // Delivery note
  const [note, setNote] = useState('')

  // Delivery zone (campus vs off-campus)
  const [deliveryZone, setDeliveryZone] = useState<'campus' | 'off_campus'>('campus')
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([])
  const [campusLocationName, setCampusLocationName] = useState('')
  const [campusDeliveryFee, setCampusDeliveryFee] = useState(300)
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(500)
  const [serviceFee, setServiceFee] = useState(0)
  const [contactPhone, setContactPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('paystack')
  const [promoCode, setPromoCode] = useState('')
  const [pricing, setPricing] = useState<CheckoutPricing | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  // Paystack flow
  const [paystackUrl, setPaystackUrl] = useState('')
  const [paystackRef, setPaystackRef] = useState('')
  const [paystackOrderId, setPaystackOrderId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showPaystackModal, setShowPaystackModal] = useState(false)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const [preorderOptions, setPreorderOptions] = useState<PreorderOptions | null>(null)
  const [loadingPreorder, setLoadingPreorder] = useState(false)
  const [selectedPreorder, setSelectedPreorder] = useState<PreorderOption | null>(null)
  const [fulfillmentMode, setFulfillmentMode] = useState<'asap' | 'preorder'>('asap')

  const foodStoreId = isFoodCart ? (items[0]?.storeId || items[0]?.vendorId || '') : ''

  const fullName = useMemo(() => {
    return [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'Buyer'
  }, [user?.email, userData?.firstName, userData?.lastName])

  const selectedAddress = addresses.find(a => a.docId === selectedAddrId)
  const estimatedDeliveryFee = deliveryZone === 'campus' ? campusDeliveryFee : defaultDeliveryFee
  const estimatedTotal = subtotal + estimatedDeliveryFee + serviceFee
  const total = pricing?.totalAmount ?? estimatedTotal
  const deliveryReady = Boolean(contactPhone.trim()) && (deliveryZone === 'campus'
    ? Boolean(campusLocationName)
    : Boolean(selectedAddress))
  const step = !deliveryReady ? 1 : 2

  // Load saved addresses from backend API
  useEffect(() => {
    if (!user?.uid) return
    const load = async () => {
      try {
        const res = await apiFetchAuth('/api/addresses')
        const payload = await res.json().catch(() => ({}))
        const addrs: Address[] = payload?.data ?? []
        setAddresses(addrs)
        const def = addrs.find(a => a.isDefault)
        if (def) setSelectedAddrId(def.docId)
        else if (addrs.length > 0) setSelectedAddrId(addrs[0].docId)
      } catch { /* silent — user can still add address */ }
      finally { setLoadingAddrs(false) }
    }
    load()
  }, [user?.uid])

  // Prefill contact phone from the selected saved address (until the user edits it)
  useEffect(() => {
    if (!phoneTouched && selectedAddress?.phone) {
      setContactPhone(selectedAddress.phone)
    }
  }, [selectedAddress, phoneTouched])

  // Load campus delivery zones
  useEffect(() => {
    getDeliveryZones()
      .then(({ campusDeliveryFee, defaultDeliveryFee, serviceFee, locations }) => {
        setCampusDeliveryFee(campusDeliveryFee)
        setDefaultDeliveryFee(defaultDeliveryFee)
        setServiceFee(serviceFee)
        setCampusLocations(locations)
        if (locations.length && !campusLocationName) setCampusLocationName(locations[0].name)
      })
      .catch(() => { /* fall back to off-campus only */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isFoodCart || !foodStoreId) {
      setPreorderOptions(null)
      setSelectedPreorder(null)
      setFulfillmentMode('asap')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoadingPreorder(true)
      try {
        const data = await getPreorderOptions(foodStoreId)
        if (cancelled) return
        setPreorderOptions(data)
        const first = data?.options?.[0] ?? null
        setSelectedPreorder(first)
        if (data?.preorderEnabled && !data.allowAsapWhenOpen) {
          setFulfillmentMode('preorder')
        } else {
          setFulfillmentMode('asap')
        }
      } finally {
        if (!cancelled) setLoadingPreorder(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [foodStoreId, isFoodCart])

  const preorderRequired = Boolean(
    preorderOptions?.preorderEnabled && !preorderOptions.allowAsapWhenOpen,
  )
  const preorderAvailable = Boolean(preorderOptions?.preorderEnabled && preorderOptions.options.length)
  const effectiveFulfillmentType: 'asap' | 'preorder' =
    preorderRequired || fulfillmentMode === 'preorder' ? 'preorder' : 'asap'
  const checkoutBlockedReason = useMemo(() => {
    if (!isFoodCart) return null
    if (preorderRequired && !preorderAvailable) {
      return preorderOptions?.statusMessage || 'Preorders are closed for this vendor right now.'
    }
    if (effectiveFulfillmentType === 'preorder' && !selectedPreorder) {
      return 'Please select a fulfillment date for your preorder.'
    }
    return null
  }, [effectiveFulfillmentType, isFoodCart, preorderAvailable, preorderOptions?.statusMessage, preorderRequired, selectedPreorder])

  // Save new address via backend API
  const handleSaveAddress = async (addr: Omit<Address, 'docId' | 'isDefault'>) => {
    setSavingAddr(true)
    try {
      const isDefault = addresses.length === 0
      const res = await apiFetchAuth('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ ...addr, isDefault }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.message || 'Could not save address')
      const newAddr: Address = payload.data ?? { docId: Date.now().toString(), ...addr, isDefault }
      setAddresses(prev => [...prev, newAddr])
      setSelectedAddrId(newAddr.docId)
      setShowAddModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save address')
    } finally {
      setSavingAddr(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!user || !items.length) {
      setError('Your cart is empty.')
      return
    }
    if (checkoutBlockedReason) {
      setError(checkoutBlockedReason)
      return
    }
    if (!contactPhone.trim()) {
      setError('Please enter a phone number so the driver can reach you.')
      return
    }
    if (deliveryZone === 'campus') {
      if (!campusLocationName) {
        setError('Please select your campus location.')
        return
      }
    } else if (!selectedAddress) {
      setError('Please select a delivery address.')
      return
    }
    try {
      setPlacing(true)
      setError('')

      const paymentExtras = effectiveFulfillmentType === 'preorder' && selectedPreorder
        ? {
            fulfillmentType: 'preorder' as const,
            scheduledFor: selectedPreorder.scheduledFor,
          }
        : { fulfillmentType: 'asap' as const }

      const result = await createOrder({
        user,
        items,
        customerName: fullName,
        phone: contactPhone.trim(),
        address: deliveryZone === 'campus'
          ? {
              street: campusLocationName,
              city: 'Campus',
              state: selectedAddress?.state || '',
              landmark: campusLocationName,
              note,
              deliveryZone: 'campus',
            }
          : {
              street: selectedAddress!.addressLine1,
              city: selectedAddress!.city,
              state: selectedAddress!.state,
              landmark: selectedAddress!.addressLine2 || '',
              note,
              deliveryZone: 'off_campus',
            },
        paymentMethod,
        fulfillmentType: paymentExtras.fulfillmentType,
        ...(paymentExtras.fulfillmentType === 'preorder' && selectedPreorder
          ? {
              scheduledFor: selectedPreorder.scheduledFor,
              preorderCutoffAt: selectedPreorder.cutoffAt,
              scheduledLabel: selectedPreorder.label,
            }
          : {}),
      })

      const orderPricing = await calculateOrderPricing(result.orderId, promoCode.trim() || undefined)
      setPricing(orderPricing)

      if (paymentMethod === 'wallet') {
        await payForOrderWithWallet(result.orderId, promoCode.trim() || undefined, paymentExtras)
        await notifyNewOrder(result.orderId)
        clearCart()
        navigate(`/track?orderId=${encodeURIComponent(result.orderId)}`)
        return
      }

      // Paystack
      const checkout = await initializePaystackCheckout(
        result.orderId,
        promoCode.trim() || undefined,
        paymentExtras,
      )
      const newTab = window.open(checkout.authorization_url, '_blank', 'noopener,noreferrer')
      setPopupBlocked(!newTab)
      setPaystackUrl(checkout.authorization_url)
      setPaystackRef(checkout.paymentReference || checkout.reference)
      setPaystackOrderId(result.orderId)
      setShowPaystackModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const handleVerifyPaystack = useCallback(async (options?: { silent?: boolean }) => {
    if (!paystackRef || !paystackOrderId) return false
    if (!options?.silent) setVerifying(true)
    try {
      let lastError: unknown = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await verifyPaystackCheckout(paystackRef, paystackOrderId)
          await notifyNewOrder(paystackOrderId)
          clearCart()
          setShowPaystackModal(false)
          navigate(`/track?orderId=${encodeURIComponent(paystackOrderId)}`)
          return true
        } catch (err) {
          lastError = err
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
          }
        }
      }
      throw lastError
    } catch {
      if (!options?.silent) {
        setError('Payment verification failed. If money was deducted, keep this page open or contact support — we can verify from admin.')
      }
      return false
    } finally {
      if (!options?.silent) setVerifying(false)
    }
  }, [clearCart, navigate, paystackOrderId, paystackRef])

  // Auto-verify when the user returns from the Paystack tab
  useEffect(() => {
    if (!showPaystackModal || !paystackRef) return
    const onFocus = () => {
      void handleVerifyPaystack({ silent: true })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [handleVerifyPaystack, showPaystackModal, paystackRef])

  // Group items by store for display
  const storeGroups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.storeName || 'Blorbmart Store'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const ctaLabel = placing ? 'Processing…'
    : checkoutBlockedReason ? 'Preorder unavailable'
    : paymentMethod === 'wallet' ? `Pay ₦${Math.round(total).toLocaleString()} with Wallet`
    : effectiveFulfillmentType === 'preorder' ? 'Pay Preorder with Paystack →'
    : 'Pay with Paystack →'

  if (!items.length) {
    return (
      <>
        <style>{dashboardCss}</style>
        <style>{css}</style>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, border: '1.5px solid var(--border)', textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 52, marginBottom: 16, display: 'flex', justifyContent: 'center' }}><CartIcon /></div>
            <h2 style={{ margin: '0 0 8px', fontFamily: 'Bricolage Grotesque, sans-serif' }}>Nothing to check out</h2>
            <p style={{ color: 'var(--text-3)', marginBottom: 24, fontSize: 14 }}>Add products to your cart before continuing.</p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              style={{ border: 'none', background: 'var(--blue)', color: '#fff', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Browse Shop
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="co-root">
        {/* Header */}
        <header className="co-header">
          <div className="co-header-inner">
            <button className="co-back" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="co-header-title">Checkout</span>
            {/* Steps */}
            <div className="co-steps">
              <div className={`co-step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                <div className="co-step-num">{step > 1 ? '✓' : '1'}</div>
                <span className="bm-desktop-only">Address</span>
              </div>
              <div className={`co-step-line ${step > 1 ? 'done' : ''}`} />
              <div className={`co-step ${step >= 2 ? 'active' : ''}`}>
                <div className="co-step-num">2</div>
                <span className="bm-desktop-only">Payment</span>
              </div>
            </div>
          </div>
        </header>

        <div className="co-body">
          {/* Left column */}
          <div>
            {/* Delivery address */}
            <div className="co-card">
              <div className="co-card-title">
                <div className="co-card-icon"><MapPinIcon size={16} /></div>
                Delivery Address
              </div>

              {/* On Campus / Off Campus toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {([
                  { key: 'campus' as const, label: `On Campus (₦${campusDeliveryFee.toLocaleString()})` },
                  { key: 'off_campus' as const, label: 'Off Campus' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDeliveryZone(opt.key)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                      border: `2px solid ${deliveryZone === opt.key ? 'var(--blue)' : 'var(--border)'}`,
                      background: deliveryZone === opt.key ? 'var(--blue-light)' : '#fff',
                      color: deliveryZone === opt.key ? 'var(--blue)' : 'var(--text)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {deliveryZone === 'campus' && (
                <div style={{ marginBottom: 16 }}>
                  <label className="co-label">Campus Location</label>
                  {campusLocations.length ? (
                    <select
                      className="co-input"
                      value={campusLocationName}
                      onChange={e => setCampusLocationName(e.target.value)}
                    >
                      {campusLocations.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No campus locations available yet. Please choose Off Campus.</p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                    Flat delivery fee of ₦{campusDeliveryFee.toLocaleString()} applies for any on-campus order.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="co-label">Contact Phone Number</label>
                <input
                  className="co-input"
                  type="tel"
                  placeholder="e.g. 080xxxxxxxx"
                  value={contactPhone}
                  onChange={e => { setContactPhone(e.target.value); setPhoneTouched(true) }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                  The delivery rider will call this number when they arrive.
                </p>
              </div>

              {deliveryZone === 'off_campus' && (loadingAddrs ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(2)].map((_, i) => <div key={i} className="bm-skeleton" style={{ height: 72, borderRadius: 12 }} />)}
                </div>
              ) : (
                <>
                  <div className="co-addr-list">
                    {addresses.map(addr => (
                      <div
                        key={addr.docId}
                        className={`co-addr-card ${selectedAddrId === addr.docId ? 'selected' : ''}`}
                        onClick={() => setSelectedAddrId(addr.docId)}
                      >
                        <div className="co-addr-radio" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="co-addr-label">{addr.name}</div>
                          <div className="co-addr-line1">{addr.addressLine1}</div>
                          <div className="co-addr-line2">
                            {[addr.addressLine2, addr.city, addr.state].filter(Boolean).join(', ')}
                          </div>
                          <div className="co-addr-line2" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><PhoneIcon size={13} /> {addr.phone}</div>
                        </div>
                        <button
                          type="button"
                          onClick={async e => {
                            e.stopPropagation()
                            try {
                              await apiFetchAuth(`/api/addresses/${encodeURIComponent(addr.docId)}`, { method: 'DELETE' })
                            } catch { /* best-effort */ }
                            setAddresses(prev => prev.filter(a => a.docId !== addr.docId))
                            if (selectedAddrId === addr.docId) setSelectedAddrId(null)
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '2px 0', flexShrink: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="co-add-addr-btn" type="button" onClick={() => setShowAddModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add New Address
                  </button>
                </>
              ))}
            </div>

            {isFoodCart && (loadingPreorder || preorderOptions?.preorderEnabled) && (
              <div className="co-card">
                <div className="co-card-title">
                  <div className="co-card-icon"><ClockIcon /></div>
                  Fulfillment
                </div>

                {loadingPreorder ? (
                  <div className="bm-skeleton" style={{ height: 72, borderRadius: 12 }} />
                ) : (
                  <>
                    {preorderOptions?.statusMessage && (
                      <div className="co-preorder-banner">
                        <div className="co-preorder-title">
                          {preorderRequired ? 'Preorder only' : 'Preorders available'}
                        </div>
                        <div className="co-preorder-sub">{preorderOptions.statusMessage}</div>
                      </div>
                    )}

                    {preorderAvailable && preorderOptions?.allowAsapWhenOpen && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        {([
                          { key: 'asap' as const, label: 'Deliver ASAP' },
                          { key: 'preorder' as const, label: 'Preorder for later' },
                        ]).map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setFulfillmentMode(opt.key)}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: 12,
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              border: `2px solid ${fulfillmentMode === opt.key ? '#f97316' : 'var(--border)'}`,
                              background: fulfillmentMode === opt.key ? '#fff7ed' : '#fff',
                              color: fulfillmentMode === opt.key ? '#c2410c' : 'var(--text)',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {(preorderRequired || fulfillmentMode === 'preorder') && (
                      <div className="co-preorder-options">
                        {(preorderOptions?.options ?? []).map((opt) => (
                          <div
                            key={opt.scheduledFor}
                            className={`co-preorder-option ${selectedPreorder?.scheduledFor === opt.scheduledFor ? 'selected' : ''}`}
                            onClick={() => setSelectedPreorder(opt)}
                          >
                            <div className="co-preorder-option-label">{opt.label}</div>
                            <div className="co-preorder-option-cutoff">Order by {opt.cutoffLabel}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {checkoutBlockedReason && (
                      <div className="co-error" style={{ marginTop: 12 }}>
                        {checkoutBlockedReason}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Delivery note */}
            <div className="co-card">
              <div className="co-card-title">
                <div className="co-card-icon"><EditIcon size={16} /></div>
                Delivery Note
              </div>
              <textarea
                className="co-input"
                placeholder="Any special delivery instructions? (Optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Payment method */}
            <div className="co-card">
              <div className="co-card-title">
                <div className="co-card-icon"><CreditCardIcon size={16} /></div>
                Payment Method
              </div>
              <div className="co-pay-list">
                {([
                  {
                    key: 'wallet' as PayMethod,
                    icon: WalletIcon, iconClass: 'wallet',
                    title: 'Wallet',
                    sub: 'Wallet funding is coming soon',
                    badge: { label: 'Coming soon', cls: 'warn' },
                    disabled: true,
                  },
                  {
                    key: 'paystack' as PayMethod,
                    icon: CreditCardIcon, iconClass: 'card',
                    title: 'Pay with Paystack',
                    sub: 'Card, bank transfer, USSD',
                  },
                ] as const).map(opt => (
                  <div
                    key={opt.key}
                    className={`co-pay-card ${paymentMethod === opt.key ? 'selected' : ''}`}
                    onClick={() => { if (!('disabled' in opt && opt.disabled)) setPaymentMethod(opt.key) }}
                    style={'disabled' in opt && opt.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    <div className={`co-pay-icon ${opt.iconClass}`}><opt.icon /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="co-pay-title">{opt.title}</div>
                      <div className="co-pay-sub">{opt.sub}</div>
                    </div>
                    {'badge' in opt && opt.badge && (
                      <span className={`co-pay-badge ${opt.badge.cls}`}>{opt.badge.label}</span>
                    )}
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${paymentMethod === opt.key ? 'var(--blue)' : 'var(--border)'}`, background: paymentMethod === opt.key ? 'var(--blue)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                      {paymentMethod === opt.key && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div style={{ marginTop: 16 }}>
                <div className="co-label" style={{ marginBottom: 6 }}>Promo Code (optional)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="co-input"
                    placeholder="ENTER CODE"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {error && (
                <div className="co-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right: order summary */}
          <aside className="co-card" style={{ position: 'sticky', top: 72 }}>
            <div className="co-card-title" style={{ marginBottom: 12 }}>
              <div className="co-card-icon"><ReceiptIcon filled={false} /></div>
              Order Summary
            </div>

            {/* Items grouped by store */}
            {Object.entries(storeGroups).map(([storeName, storeItems]) => (
              <div key={storeName} style={{ marginBottom: 8 }}>
                <div className="co-store-label">{storeName}</div>
                {storeItems.map(item => (
                  <div key={item.id} className="co-order-item">
                    <img className="co-order-img" src={item.image || '/second.jpg'} alt={item.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="co-order-name">{item.name}</div>
                      <div className="co-order-qty">Qty: {item.quantity}</div>
                    </div>
                    <div className="co-order-price">{fmt(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            ))}

            <div className="co-sum-divider" />

            <div className="co-sum-row">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {pricing ? (
              <>
                <div className="co-sum-row">
                  <span>Delivery fee</span>
                  <span>{pricing.deliveryFee === 0 ? 'Free' : fmt(pricing.deliveryFee)}</span>
                </div>
                <div className="co-sum-row">
                  <span>Service fee</span>
                  <span>{fmt(pricing.serviceFee)}</span>
                </div>
                {pricing.discountAmount > 0 && (
                  <div className="co-sum-row discount">
                    <span>Promo discount</span>
                    <span>-{fmt(pricing.discountAmount)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="co-sum-row">
                  <span>Delivery fee {deliveryZone === 'campus' ? '(on campus)' : '(estimated)'}</span>
                  <span>{estimatedDeliveryFee === 0 ? 'Free' : fmt(estimatedDeliveryFee)}</span>
                </div>
                <div className="co-sum-row">
                  <span>Service fee</span>
                  <span>{fmt(serviceFee)}</span>
                </div>
              </>
            )}

            <div className="co-sum-divider" />
            <div className="co-sum-row total">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            {/* Delivery address preview */}
            {deliveryZone === 'campus' ? (
              campusLocationName && (
                <div style={{ marginTop: 14, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Delivering to</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{campusLocationName} (On Campus)</div>
                </div>
              )
            ) : selectedAddress && (
              <div style={{ marginTop: 14, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Delivering to</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedAddress.addressLine1}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{[selectedAddress.city, selectedAddress.state].join(', ')}</div>
              </div>
            )}

            {effectiveFulfillmentType === 'preorder' && selectedPreorder && (
              <div style={{ marginTop: 14, background: '#fff7ed', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(249,115,22,.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>Preorder for</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412' }}>{selectedPreorder.label}</div>
              </div>
            )}

            <button
              className="co-place-btn"
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing || !deliveryReady || Boolean(checkoutBlockedReason)}
            >
              {ctaLabel}
            </button>
            <div className="co-secure" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LockIcon size={14} /> Your payment info is encrypted</div>
          </aside>
        </div>

        {/* Mobile sticky footer */}
        <div className="co-mobile-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>Total</span>
            <strong style={{ fontSize: 16 }}>{fmt(total)}</strong>
          </div>
          <button
            className="co-place-btn"
            type="button"
            onClick={handlePlaceOrder}
            disabled={placing || !deliveryReady || Boolean(checkoutBlockedReason)}
            style={{ marginTop: 0 }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <AddAddressModal
          onSave={handleSaveAddress}
          onClose={() => setShowAddModal(false)}
          saving={savingAddr}
        />
      )}

      {/* Paystack Confirm Modal */}
      {showPaystackModal && (
        <div className="co-modal-overlay">
          <PaystackModal
            authUrl={paystackUrl}
            onVerify={handleVerifyPaystack}
            onCancel={() => {
              const leave = window.confirm(
                'Payment is not confirmed yet. If you already paid on Paystack, stay on this page and tap "I\'ve Paid". Leave anyway?'
              )
              if (leave) setShowPaystackModal(false)
            }}
            verifying={verifying}
            popupBlocked={popupBlocked}
          />
        </div>
      )}
    </>
  )
}
