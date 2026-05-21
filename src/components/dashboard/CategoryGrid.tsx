import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon } from '../icons'

const CATEGORIES = [
  { id: 1, label: 'Electronics', img: '/categories/electronics.jpg' },
  { id: 2, label: 'Food & Drinks', img: '/categories/food.jpg' },
  { id: 3, label: 'Accessories', img: '/categories/accessories.jpg' },
  { id: 4, label: 'Beauty', img: '/categories/beauty.jpg' },
  { id: 5, label: 'Fashion', img: '/categories/fashion.jpg' },
  { id: 6, label: 'Books', img: '/categories/books.jpg' },
  { id: 7, label: 'Stationery', img: '/categories/books.jpg' },
  { id: 8, label: 'Health', img: '/categories/beauty.jpg' },
]

export function CategoryGrid() {
  const navigate = useNavigate()
  return (
    <section className="bm-section bm-animate bm-animate-2">
      <div className="bm-section-head">
        <div>
          <div className="bm-section-title">Shop by Category</div>
          <div className="bm-section-sub">Find exactly what you need</div>
        </div>
        <button className="bm-see-all" type="button" onClick={() => navigate('/categories')}>
          All <ChevronRightIcon />
        </button>
      </div>
      <div className="bm-cats-grid">
        {CATEGORIES.map(c => (
          <div key={c.id} className="bm-cat" onClick={() => navigate(`/category/${c.id}`)}>
            <div className="bm-cat-icon">
              <img src={c.img} alt={c.label} loading="lazy" />
            </div>
            <span className="bm-cat-label">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
