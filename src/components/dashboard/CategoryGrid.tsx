import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from '../icons'

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', emoji: '💻', color: '#1f77f1', path: '/category/electronics' },
  { id: 'food_drinks', label: 'Food & Drinks', emoji: '🍔', color: '#ff5500', path: '/food' },
  { id: 'accessories', label: 'Accessories', emoji: '👜', color: '#ffc200', path: '/category/accessories' },
  { id: 'beauty', label: 'Beauty', emoji: '💄', color: '#5156f1', path: '/category/beauty' },
  { id: 'fashion', label: 'Fashion', emoji: '👗', color: '#e91e63', path: '/category/fashion' },
  { id: 'furniture', label: 'Furniture', emoji: '🪑', color: '#8bc34a', path: '/category/furniture' },
  { id: 'health', label: 'Health', emoji: '💊', color: '#4caf50', path: '/category/health' },
  { id: 'stationery', label: 'Stationery', emoji: '📚', color: '#795548', path: '/category/stationery' },
]

export function CategoryGrid() {
  const navigate = useNavigate()
  return (
    <section className="bm-section bm-animate bm-animate-2">
      <div className="bm-section-head">
        <div>
          <div className="bm-section-title">Categories</div>
          <div className="bm-section-sub">Find exactly what you need</div>
        </div>
        <button className="bm-see-all" type="button" onClick={() => navigate('/categories')}>
          All <ChevronRightIcon />
        </button>
      </div>

      {/* Desktop grid */}
      <div className="bm-cats-grid">
        {CATEGORIES.map(c => (
          <div key={c.id} className="bm-cat" onClick={() => navigate(c.path)}>
            <div className="bm-cat-icon" style={{ background: `${c.color}18`, borderColor: `${c.color}30` }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
            </div>
            <span className="bm-cat-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Mobile horizontal scroll (Flutter-style) */}
      <div className="bm-cats-scroll">
        {CATEGORIES.map(c => (
          <div key={c.id} className="bm-cat-scroll-item" onClick={() => navigate(c.path)}>
            <div className="bm-cat-scroll-icon" style={{ background: `${c.color}18`, borderColor: `${c.color}30` }}>
              <span>{c.emoji}</span>
            </div>
            <span className="bm-cat-scroll-label">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
