import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { BagIcon } from './icons'

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const css = `
  .food-cart-bar {
    position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 60;
    max-width: 600px; margin: 0 auto;
    display: flex; align-items: center; gap: 10px;
    padding: 14px 18px; border-radius: 16px; cursor: pointer;
    background: linear-gradient(135deg, #FF5500, #FF8C00);
    box-shadow: 0 8px 24px rgba(255,85,0,.4);
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    animation: foodCartIn .25s ease;
  }
  @keyframes foodCartIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .food-cart-bar-badge {
    padding: 2px 8px; border-radius: 10px; background: rgba(255,255,255,.25);
    font-size: 13px; font-weight: 800; flex-shrink: 0;
  }
  .food-cart-bar-label { font-size: 15px; font-weight: 700; flex: 1; }
  .food-cart-bar-total { font-size: 15px; font-weight: 800; }
`

export function FoodCartBar() {
  const navigate = useNavigate()
  const { items, itemCount, subtotal, isFoodCart } = useCart()

  if (!isFoodCart || items.length === 0) return null

  return (
    <>
      <style>{css}</style>
      <div className="food-cart-bar" onClick={() => navigate('/cart')}>
        <span className="food-cart-bar-badge">{itemCount}</span>
        <span className="food-cart-bar-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BagIcon size={18} /> View Cart
        </span>
        <span className="food-cart-bar-total">{fmt(subtotal)}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </>
  )
}
