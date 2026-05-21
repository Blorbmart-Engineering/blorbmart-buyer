import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ZapIcon, ClockIcon, FilterIcon, GridIcon, ListIcon, ChevronRightIcon } from '../icons'
import { ProductCard } from '../ProductCard'

type Product = {
  id: string; name: string; price: number; discountPrice?: number
  rating?: number; totalReviews?: number; totalSold?: number
  stockQuantity?: number; images?: string[]; storeName?: string
}

function useCountdown(init: number) {
  const [secs, setSecs] = useState(init)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { h, m, s }
}

export function FlashSaleSection({
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const countdown = useCountdown(9910)

  return (
    <section className="bm-section bm-animate bm-animate-3">
      <div className="bm-flash-bar">
        <div className="bm-flash-left">
          <div className="bm-flash-zap"><ZapIcon /></div>
          <div>
            <div className="bm-flash-label">Flash Sales</div>
            <div className="bm-flash-desc">Limited time offers</div>
          </div>
        </div>
        <div className="bm-flash-right">
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockIcon /> Ends in
          </div>
          <div className="bm-timer-blocks">
            <div className="bm-timer-block">{countdown.h}</div>
            <span className="bm-timer-sep">:</span>
            <div className="bm-timer-block">{countdown.m}</div>
            <span className="bm-timer-sep">:</span>
            <div className="bm-timer-block">{countdown.s}</div>
          </div>
          <button className="bm-see-all" style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,.5)' }} type="button" onClick={() => navigate('/deals')}>
            See all <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="bm-products-toolbar">
        <div className="bm-products-count">
          {loading ? 'Loading...' : `${products.length} deals`}
        </div>
        <div className="bm-toolbar-right">
          <button className="bm-filter-btn" type="button">
            <FilterIcon /> Filter
          </button>
          <div className="bm-view-toggle">
            <button className={`bm-view-btn ${viewMode === 'grid' ? 'active' : ''}`} type="button" onClick={() => setViewMode('grid')}>
              <GridIcon />
            </button>
            <button className={`bm-view-btn ${viewMode === 'list' ? 'active' : ''}`} type="button" onClick={() => setViewMode('list')}>
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`bm-products-grid ${viewMode === 'list' ? 'list' : ''}`}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1.5px solid #E2E8F0' }}>
              <div className="bm-skeleton" style={{ height: 180 }} />
              <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="bm-skeleton" style={{ height: 12, width: '60%' }} />
                <div className="bm-skeleton" style={{ height: 10, width: '40%' }} />
                <div className="bm-skeleton" style={{ height: 18, width: '50%' }} />
                <div className="bm-skeleton" style={{ height: 34 }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-3)', fontSize: 13 }}>
          No flash deals right now — check back soon!
        </div>
      ) : (
        <div className={`bm-products-grid ${viewMode === 'list' ? 'list' : ''}`}>
          {products.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              badge="flash"
              wishlisted={wishlist.has(item.id)}
              onWishlist={onWishlist}
            />
          ))}
        </div>
      )}
    </section>
  )
}
