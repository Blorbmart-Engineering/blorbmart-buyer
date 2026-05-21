import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { StarIcon, ClockIcon, ChevronRightIcon } from '../icons'

type Store = {
  id: string
  storeName: string
  logoUrl?: string
  coverImageUrl?: string
  rating?: number
  deliveryTime?: number
  category?: string
  isActive?: boolean
}

export function FeaturedStores() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const q = query(
          collection(db, 'vendors'),
          where('accountStatus', '==', 'active'),
          limit(8)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          setStores(snap.docs.map(d => ({ id: d.id, ...d.data() } as Store)))
        }
      } catch {
        // silently fail — section just won't render
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  if (!loading && stores.length === 0) return null

  return (
    <section className="bm-section bm-animate bm-animate-4">
      <div className="bm-section-head">
        <div>
          <div className="bm-section-title">Featured Stores</div>
          <div className="bm-section-sub">Browse our top vendors</div>
        </div>
        <button className="bm-see-all" type="button" onClick={() => navigate('/categories')}>
          All stores <ChevronRightIcon />
        </button>
      </div>

      <div className="bm-stores-scroll">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 180, borderRadius: 14, overflow: 'hidden', border: '1.5px solid #E2E8F0', background: '#fff' }}>
                <div className="bm-skeleton" style={{ height: 100 }} />
                <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="bm-skeleton" style={{ height: 12, width: '70%' }} />
                  <div className="bm-skeleton" style={{ height: 10, width: '50%' }} />
                </div>
              </div>
            ))
          : stores.map(store => (
              <div
                key={store.id}
                className="bm-store-card"
                onClick={() => navigate(`/store/${store.id}`)}
              >
                <img
                  className="bm-store-img"
                  src={store.coverImageUrl ?? store.logoUrl ?? '/second.jpg'}
                  alt={store.storeName}
                  loading="lazy"
                />
                <div className="bm-store-body">
                  <div className="bm-store-name">{store.storeName}</div>
                  <div className="bm-store-meta">
                    <span className="bm-store-rating">
                      <StarIcon size={11} />
                      {(store.rating ?? 4.5).toFixed(1)}
                    </span>
                    <span>·</span>
                    <span className="bm-store-delivery">
                      <ClockIcon />
                      {store.deliveryTime ?? 30}–{(store.deliveryTime ?? 30) + 15} min
                    </span>
                  </div>
                  {store.category && (
                    <div className="bm-store-badge">{store.category}</div>
                  )}
                </div>
              </div>
            ))}
      </div>
    </section>
  )
}
