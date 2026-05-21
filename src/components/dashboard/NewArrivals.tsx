import { useState, useEffect } from 'react'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { ChevronRightIcon, SparkleIcon } from '../icons'
import { ProductCard } from '../ProductCard'
import { useNavigate } from 'react-router-dom'

type Product = {
  id: string; name: string; price: number; discountPrice?: number
  rating?: number; totalReviews?: number; totalSold?: number
  stockQuantity?: number; images?: string[]; storeName?: string
}

export function NewArrivals() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNew = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4))
        const snap = await getDocs(q)
        if (!snap.empty) {
          setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)))
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchNew()
  }, [])

  if (!loading && products.length === 0) return null

  return (
    <section className="bm-section bm-animate bm-animate-5">
      <div className="bm-section-head">
        <div>
          <div className="bm-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--orange)' }}><SparkleIcon /></span>
            New Arrivals
          </div>
          <div className="bm-section-sub">Just landed in our store</div>
        </div>
        <button className="bm-see-all" type="button" onClick={() => navigate('/shop')}>
          See all <ChevronRightIcon />
        </button>
      </div>

      {loading ? (
        <div className="bm-products-grid">
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
      ) : (
        <div className="bm-products-grid">
          {products.map(item => (
            <ProductCard key={item.id} item={item} badge="new" />
          ))}
        </div>
      )}
    </section>
  )
}
