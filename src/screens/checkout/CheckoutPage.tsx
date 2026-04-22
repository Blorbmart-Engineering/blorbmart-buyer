import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCart } from '../../contexts/CartContext'
import { useAuth, useUserData } from '../../hooks/useFirebaseData'
import { createOrder } from '../../services/orderService'
import {
  calculateOrderPricing,
  getWalletBalance,
  initializePaystackCheckout,
  payForOrderWithWallet,
  verifyPaystackCheckout,
  type CheckoutPricing,
} from '../../services/checkoutService'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

export function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { userData } = useUserData(user?.uid)
  const { items, subtotal, clearCart } = useCart()

  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [landmark, setLandmark] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState(userData?.phone || '')
  const [promoCode, setPromoCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'wallet' | 'paystack'>('cash_on_delivery')
  const [walletBalance, setWalletBalance] = useState(0)
  const [pricing, setPricing] = useState<CheckoutPricing | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const fullName = useMemo(() => {
    const name = [userData?.firstName, userData?.lastName].filter(Boolean).join(' ').trim()
    return name || user?.email || 'Buyer'
  }, [user?.email, userData?.firstName, userData?.lastName])

  const total = pricing?.totalAmount ?? subtotal

  useEffect(() => {
    if (user?.uid) {
      getWalletBalance(user.uid)
        .then(setWalletBalance)
        .catch((walletError) => {
          console.error('Failed to load wallet balance:', walletError)
          setWalletBalance(0)
        })
    }
  }, [user?.uid])

  useEffect(() => {
    if (userData?.phone) {
      setPhone(userData.phone)
    }
  }, [userData?.phone])

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!items.length) {
      setError('Your cart is empty.')
      return
    }

    if (!street || !city || !state || !phone || !landmark) {
      setError('Please complete your delivery details.')
      return
    }

    try {
      setPlacing(true)
      setError('')
      const result = await createOrder({
        user,
        items,
        customerName: fullName,
        phone,
        address: { street, city, state, landmark, note },
        paymentMethod,
      })
      const orderPricing = await calculateOrderPricing(result.orderId, promoCode.trim() || undefined)
      setPricing(orderPricing)

      if (paymentMethod === 'wallet') {
        await payForOrderWithWallet(result.orderId, promoCode.trim() || undefined)
        clearCart()
        navigate(`/track?orderId=${encodeURIComponent(result.orderId)}`)
        return
      }

      if (paymentMethod === 'paystack') {
        const checkout = await initializePaystackCheckout(result.orderId, promoCode.trim() || undefined)
        window.open(checkout.authorization_url, '_blank', 'noopener,noreferrer')
        const shouldVerify = window.confirm('Complete the Paystack payment in the opened tab, then click OK here to verify it.')
        if (!shouldVerify) {
          navigate(`/track?orderId=${encodeURIComponent(result.orderId)}`)
          return
        }
        await verifyPaystackCheckout(checkout.reference, result.orderId)
        clearCart()
        navigate(`/track?orderId=${encodeURIComponent(result.orderId)}`)
        return
      }

      clearCart()
      navigate(`/track?orderId=${encodeURIComponent(result.orderId)}`)
    } catch (checkoutError) {
      console.error('Checkout failed:', checkoutError)
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to place your order right now. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  if (!items.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ marginTop: 0 }}>Nothing to check out yet</h1>
          <p style={{ color: '#64748b' }}>Add products to your cart before continuing to checkout.</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: 16, border: 'none', background: '#2563eb', color: '#fff', borderRadius: 14, padding: '12px 18px', cursor: 'pointer' }}
          >
            Back to marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 16px 80px' }}>
        <h1 style={{ marginTop: 0 }}>Checkout</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Place your order and choose cash on delivery, wallet, or Paystack.</p>

        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
          <section style={{ background: '#fff', borderRadius: 24, padding: 24, border: '1px solid #e2e8f0' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Delivery details</h2>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="customer-name" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>Full name</label>
                <input id="customer-name" value={fullName} readOnly style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, background: '#f8fafc' }} />
              </div>
              <div>
                <label htmlFor="phone" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>Phone</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }} />
              </div>
              <div>
                <label htmlFor="state" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>State</label>
                <input id="state" value={state} onChange={(e) => setState(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }} />
              </div>
              <div>
                <label htmlFor="landmark" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>Landmark</label>
                <input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="street" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>Street address</label>
                <input id="street" value={street} onChange={(e) => setStreet(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="city" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>City / campus area</label>
                <input id="city" value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="note" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>Delivery note</label>
                <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 16, borderRadius: 16, background: '#eff6ff', color: '#1d4ed8' }}>
              Choose how you want to pay for this order.
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, border: '1px solid #cbd5e1', borderRadius: 14, background: paymentMethod === 'cash_on_delivery' ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 'cash_on_delivery'} onChange={() => setPaymentMethod('cash_on_delivery')} />
                <span>
                  <strong>Cash on delivery</strong>
                  <div style={{ color: '#64748b', fontSize: 14 }}>Place the order now and pay when it arrives.</div>
                </span>
              </label>

              <label style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, border: '1px solid #cbd5e1', borderRadius: 14, background: paymentMethod === 'wallet' ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                <span>
                  <strong>Wallet</strong>
                  <div style={{ color: '#64748b', fontSize: 14 }}>Available balance: {formatCurrency(walletBalance)}</div>
                </span>
              </label>

              <label style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, border: '1px solid #cbd5e1', borderRadius: 14, background: paymentMethod === 'paystack' ? '#eff6ff' : '#fff' }}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 'paystack'} onChange={() => setPaymentMethod('paystack')} />
                <span>
                  <strong>Paystack</strong>
                  <div style={{ color: '#64748b', fontSize: 14 }}>Pay online with card or bank transfer.</div>
                </span>
              </label>
            </div>

            <div style={{ marginTop: 16 }}>
              <label htmlFor="promoCode" style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#475569' }}>Promo code</label>
              <input id="promoCode" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Optional" style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12 }} />
            </div>

            {error ? (
              <div style={{ marginTop: 18, padding: 12, borderRadius: 12, background: '#fef2f2', color: '#b91c1c' }}>{error}</div>
            ) : null}
          </section>

          <aside style={{ background: '#fff', borderRadius: 24, padding: 22, border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Order Summary</h2>
            <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: '#e2e8f0', marginBottom: 18 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 8 }}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 18 }}>
              <span>Delivery</span>
              <span>
                {pricing ? (pricing.deliveryFee === 0 ? 'Free' : formatCurrency(pricing.deliveryFee)) : 'Calculated after submit'}
              </span>
            </div>
            {pricing ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 8 }}>
                  <span>Service fee</span>
                  <span>{formatCurrency(pricing.serviceFee)}</span>
                </div>
                {pricing.discountAmount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: 18 }}>
                    <span>Promo discount</span>
                    <span>-{formatCurrency(pricing.discountAmount)}</span>
                  </div>
                ) : null}
              </>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <strong style={{ fontSize: 20 }}>{formatCurrency(total)}</strong>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              style={{ width: '100%', border: 'none', background: placing ? '#93c5fd' : '#2563eb', color: '#fff', borderRadius: 14, padding: '14px 18px', fontWeight: 700, cursor: placing ? 'not-allowed' : 'pointer' }}
            >
              {placing ? 'Processing...' : paymentMethod === 'wallet' ? 'Pay with Wallet' : paymentMethod === 'paystack' ? 'Pay with Paystack' : 'Place Order'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
