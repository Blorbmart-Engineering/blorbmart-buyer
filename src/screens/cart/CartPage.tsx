import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { apiFetchAuth } from '../../lib/api'
import { SparkleIcon, LockIcon, CartIcon } from '../../components/icons'

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const css = `
  .cart-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }

  /* Header */
  .cart-header { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); padding: 12px 16px; }
  .cart-header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
  .cart-back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: border-color .15s; }
  .cart-back:hover { border-color: var(--blue); color: var(--blue); }
  .cart-header-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 800; flex: 1; }
  .cart-header-count { font-size: 13px; color: var(--text-3); font-weight: 600; }

  /* Body */
  .cart-body { max-width: 1100px; margin: 0 auto; padding: 24px 16px 80px; display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
  @media (max-width: 820px) { .cart-body { grid-template-columns: 1fr; } }

  /* Store group */
  .cart-store-group { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px; }
  .cart-store-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); background: #fafbfd; }
  .cart-store-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
  .cart-store-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .cart-store-count { font-size: 12px; color: var(--text-3); margin-top: 1px; }

  /* Cart item */
  .cart-item { display: flex; gap: 14px; padding: 16px; border-bottom: 1px solid var(--border); }
  .cart-item:last-child { border-bottom: none; }
  .cart-item-img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; background: #EEF2FF; flex-shrink: 0; }
  .cart-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .cart-item-name { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.3; }
  .cart-item-store { font-size: 12px; color: var(--text-3); }
  .cart-item-price { font-size: 15px; font-weight: 800; color: var(--blue); }
  .cart-item-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
  .cart-stepper { display: flex; align-items: center; gap: 10px; }
  .cart-stepper-btn { width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color .15s, color .15s; }
  .cart-stepper-btn:hover { border-color: var(--blue); color: var(--blue); }
  .cart-stepper-btn:disabled { opacity: .4; cursor: not-allowed; }
  .cart-stepper-qty { font-size: 15px; font-weight: 800; min-width: 22px; text-align: center; }
  .cart-remove-btn { font-size: 12px; font-weight: 600; color: #ef4444; background: none; border: none; cursor: pointer; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; opacity: .8; transition: opacity .15s; }
  .cart-remove-btn:hover { opacity: 1; }

  /* Summary sidebar */
  .cart-summary { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 20px; position: sticky; top: 72px; }
  .cart-summary-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 18px; }
  .cart-summary-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: var(--text-2); margin-bottom: 12px; }
  .cart-summary-row.total { font-size: 16px; font-weight: 800; color: var(--text); margin-top: 4px; }
  .cart-divider { height: 1px; background: var(--border); margin: 14px 0; }
  .cart-delivery-note { font-size: 11px; color: var(--text-3); }

  /* Promo code */
  .cart-promo { margin: 16px 0; }
  .cart-promo-label { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .cart-promo-row { display: flex; gap: 8px; }
  .cart-promo-input { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); outline: none; text-transform: uppercase; letter-spacing: .04em; transition: border-color .2s; }
  .cart-promo-input:focus { border-color: var(--blue); }
  .cart-promo-input.applied { border-color: #10b981; background: #f0fdf4; }
  .cart-promo-input.error { border-color: #ef4444; background: #fef2f2; }
  .cart-promo-btn { padding: 10px 14px; border-radius: 10px; border: none; background: var(--blue); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif; transition: background .15s; }
  .cart-promo-btn:hover { background: #1d4ed8; }
  .cart-promo-btn:disabled { opacity: .6; cursor: not-allowed; }
  .cart-promo-btn.clear { background: #f1f5f9; color: var(--text-2); }
  .cart-promo-btn.clear:hover { background: #e2e8f0; }
  .cart-promo-feedback { font-size: 12px; margin-top: 6px; display: flex; align-items: center; gap: 5px; }
  .cart-promo-feedback.ok { color: #10b981; }
  .cart-promo-feedback.err { color: #ef4444; }

  /* Checkout CTA */
  .cart-cta { width: 100%; padding: 15px; background: var(--blue); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: background .2s; margin-top: 16px; }
  .cart-cta:hover { background: #1d4ed8; }
  .cart-cta:disabled { opacity: .6; cursor: not-allowed; }
  .cart-secure { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; color: var(--text-3); margin-top: 10px; }

  /* Empty state */
  .cart-empty { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 80px 24px; text-align: center; }
  .cart-empty-icon { font-size: 64px; margin-bottom: 16px; }
  .cart-empty-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
  .cart-empty-sub { font-size: 14px; color: var(--text-3); margin-bottom: 24px; line-height: 1.5; }
  .cart-empty-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: var(--blue); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Mobile sticky footer */
  .cart-mobile-footer { display: none; position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top: 1px solid var(--border); padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); z-index: 40; }
  @media (max-width: 820px) { .cart-mobile-footer { display: block; } .cart-body { padding-bottom: 120px; } }

  /* Savings badge */
  .cart-savings { display: inline-flex; align-items: center; gap: 5px; background: #d1fae5; color: #065f46; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 14px; }
`

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Group items by store
  const storeGroups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.storeName || 'Blorbmart Store'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const handleQtyChange = (id: string, qty: number) => {
    if (qty < 1) { removeItem(id); return }
    updateQuantity(id, qty)
    // Debounce any sync logic here if needed
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Future: sync to Firestore cart
    }, 500)
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await apiFetchAuth('/api/promo/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode.trim(), subtotal }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.discount) {
        setPromoDiscount(data.discount)
        setPromoApplied(true)
      } else {
        setPromoError(data.message || 'Invalid promo code')
      }
    } catch {
      setPromoError('Could not validate promo code. Try again.')
    } finally {
      setPromoLoading(false)
    }
  }

  const clearPromo = () => {
    setPromoCode('')
    setPromoDiscount(0)
    setPromoApplied(false)
    setPromoError('')
  }

  const total = subtotal - promoDiscount
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const SummaryPanel = () => (
    <>
      <div className="cart-summary-title">Order Summary</div>

      {promoDiscount > 0 && (
        <div className="cart-savings" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SparkleIcon /> You're saving {fmt(promoDiscount)}!
        </div>
      )}

      <div className="cart-summary-row">
        <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        <span>{fmt(subtotal)}</span>
      </div>
      {promoDiscount > 0 && (
        <div className="cart-summary-row" style={{ color: '#10b981' }}>
          <span>Promo discount</span>
          <span>-{fmt(promoDiscount)}</span>
        </div>
      )}
      <div className="cart-summary-row">
        <span>Delivery</span>
        <span className="cart-delivery-note">Calculated at checkout</span>
      </div>
      <div className="cart-divider" />
      <div className="cart-summary-row total">
        <span>Estimated Total</span>
        <span>{fmt(total)}</span>
      </div>

      {/* Promo code */}
      <div className="cart-promo">
        <div className="cart-promo-label">Promo Code</div>
        <div className="cart-promo-row">
          <input
            className={`cart-promo-input ${promoApplied ? 'applied' : ''} ${promoError ? 'error' : ''}`}
            placeholder="ENTER CODE"
            value={promoCode}
            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }}
            disabled={promoApplied}
          />
          {promoApplied ? (
            <button className="cart-promo-btn clear" type="button" onClick={clearPromo}>Remove</button>
          ) : (
            <button className="cart-promo-btn" type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}>
              {promoLoading ? '...' : 'Apply'}
            </button>
          )}
        </div>
        {promoApplied && (
          <div className="cart-promo-feedback ok">✓ Promo code applied — {fmt(promoDiscount)} off</div>
        )}
        {promoError && (
          <div className="cart-promo-feedback err">✗ {promoError}</div>
        )}
      </div>

      <button className="cart-cta" type="button" onClick={() => navigate('/checkout')}>
        Proceed to Checkout →
      </button>
      <div className="cart-secure" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <LockIcon size={14} /> Secure checkout · All payments encrypted
      </div>
    </>
  )

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="cart-root">
        {/* Header */}
        <header className="cart-header">
          <div className="cart-header-inner">
            <button className="cart-back" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="cart-header-title">My Cart</span>
            {items.length > 0 && (
              <span className="cart-header-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            )}
          </div>
        </header>

        {/* Empty state */}
        {items.length === 0 ? (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 16px' }}>
            <div className="cart-empty">
              <div className="cart-empty-icon"><CartIcon /></div>
              <div className="cart-empty-title">Your cart is empty</div>
              <div className="cart-empty-sub">
                Looks like you haven't added anything yet.<br />
                Start shopping to fill it up!
              </div>
              <button className="cart-empty-btn" type="button" onClick={() => navigate('/shop')}>
                Start Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-body">
            {/* Items column */}
            <div>
              {/* Continue shopping link */}
              <button
                type="button"
                onClick={() => navigate('/shop')}
                style={{ background: 'none', border: 'none', color: 'var(--blue)', font: '600 13px/1 "Plus Jakarta Sans", sans-serif', cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ← Continue Shopping
              </button>

              {Object.entries(storeGroups).map(([storeName, storeItems]) => (
                <div key={storeName} className="cart-store-group">
                  {/* Store header */}
                  <div className="cart-store-header">
                    <div className="cart-store-avatar">{getInitials(storeName)}</div>
                    <div>
                      <div className="cart-store-name">{storeName}</div>
                      <div className="cart-store-count">{storeItems.length} item{storeItems.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Items in this store */}
                  {storeItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <img
                        className="cart-item-img"
                        src={item.image || '/second.jpg'}
                        alt={item.name}
                      />
                      <div className="cart-item-body">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-store">{item.storeName || 'Blorbmart Store'}</div>
                        <div className="cart-item-price">{fmt(item.price * item.quantity)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(item.price)} each</div>
                        <div className="cart-item-bottom">
                          <div className="cart-stepper">
                            <button
                              className="cart-stepper-btn"
                              type="button"
                              onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                            >
                              {item.quantity === 1 ? (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                </svg>
                              ) : '−'}
                            </button>
                            <span className="cart-stepper-qty">{item.quantity}</span>
                            <button
                              className="cart-stepper-btn"
                              type="button"
                              onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="cart-remove-btn"
                            type="button"
                            onClick={() => removeItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Summary sidebar (desktop) */}
            <aside className="cart-summary">
              <SummaryPanel />
            </aside>
          </div>
        )}

        {/* Mobile sticky footer */}
        {items.length > 0 && (
          <div className="cart-mobile-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>Total</span>
              <strong style={{ fontSize: 16 }}>{fmt(total)}</strong>
            </div>
            <button className="cart-cta" type="button" onClick={() => navigate('/checkout')}>
              Checkout · {fmt(total)}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
