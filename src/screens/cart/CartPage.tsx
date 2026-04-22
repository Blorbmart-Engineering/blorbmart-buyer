import { useNavigate } from 'react-router-dom'

import { useCart } from '../../contexts/CartContext'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

export function CartPage() {
  const navigate = useNavigate()
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Your Cart</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>{items.length} item(s) ready for checkout</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 12, padding: '10px 16px', cursor: 'pointer' }}
          >
            Continue Shopping
          </button>
        </div>

        {items.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ margin: 0 }}>Your cart is empty</h2>
            <p style={{ margin: '10px 0 0', color: '#64748b' }}>Add a few products and come back here to check out.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {items.map((item) => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 20, padding: 18, border: '1px solid #e2e8f0', display: 'flex', gap: 16 }}>
                  <img
                    src={item.image || '/second.jpg'}
                    alt={item.name}
                    style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 16, background: '#e2e8f0' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 18 }}>{item.name}</h3>
                        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>{item.storeName || 'Blorbmart Store'}</p>
                      </div>
                      <strong>{formatCurrency(item.price * item.quantity)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside style={{ background: '#fff', borderRadius: 24, padding: 22, border: '1px solid #e2e8f0', height: 'fit-content' }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Order Summary</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 12 }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 18 }}>
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div style={{ height: 1, background: '#e2e8f0', marginBottom: 18 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <span style={{ fontWeight: 700 }}>Estimated Total</span>
                <strong style={{ fontSize: 20 }}>{formatCurrency(subtotal)}</strong>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', border: 'none', background: '#2563eb', color: '#fff', borderRadius: 14, padding: '14px 18px', fontWeight: 700, cursor: 'pointer' }}
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
