import { useNavigate } from 'react-router-dom'
import { StarIcon, ChevronRightIcon, TrophyIcon } from '../icons'

type Product = {
  id: string; name: string; price: number; discountPrice?: number
  rating?: number; totalSold?: number; images?: string[]; storeName?: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

export function TopSellingSection({
  products,
  loading,
  wishlist,
  onWishlist,
}: {
  products: Product[]
  loading: boolean
  wishlist: Set<string>
  onWishlist: (id: string) => void
}) {
  const navigate = useNavigate()

  return (
    <section className="bm-section bm-animate bm-animate-4">
      <div className="bm-section-head">
        <div>
          <div className="bm-section-title">Top Selling</div>
          <div className="bm-section-sub">Products loved by students</div>
        </div>
        <button className="bm-see-all" type="button" onClick={() => navigate('/shop')}>
          See more <ChevronRightIcon />
        </button>
      </div>

      {loading ? (
        <div className="bm-top-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="bm-skeleton" style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0 }} />
              <div className="bm-skeleton" style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="bm-skeleton" style={{ height: 12, width: '80%' }} />
                <div className="bm-skeleton" style={{ height: 10, width: '50%' }} />
                <div className="bm-skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bm-top-grid">
          {products.map((item, i) => (
            <div key={item.id} className="bm-top-card" onClick={() => navigate(`/product/${item.id}`)}>
              <div className={`bm-top-rank ${i < 3 ? 'top' : ''}`}>
                {i < 3 ? <TrophyIcon size={14} /> : `#${i + 1}`}
              </div>
              <div className="bm-top-img">
                <img src={item.images?.[0] ?? '/second.jpg'} alt={item.name} loading="lazy" />
              </div>
              <div className="bm-top-info">
                <div className="bm-top-name">{item.name}</div>
                <div className="bm-top-store">{item.storeName ?? 'Store'}</div>
                <div className="bm-top-price">{fmt(item.discountPrice ?? item.price)}</div>
              </div>
              <div className="bm-top-right">
                <div className="bm-top-sold">{item.totalSold ?? 0} sold</div>
                <div className="bm-top-stars">
                  <StarIcon size={10} />
                  <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>
                    {(item.rating ?? 0).toFixed(1)}
                  </span>
                </div>
                <button
                  style={{ marginTop: 6, background: 'none', border: '1.5px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  type="button"
                  onClick={e => { e.stopPropagation(); onWishlist(item.id) }}
                >
                  {wishlist.has(item.id) ? '♥ Saved' : '♡ Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
