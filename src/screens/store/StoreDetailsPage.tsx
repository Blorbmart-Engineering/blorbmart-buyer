import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { PackageIcon } from '../../components/icons'
import { ProductCard } from '../../components/ProductCard'
import { StarIcon, ClockIcon, TruckIcon } from '../../components/icons'

type Store = {
  id: string; storeName: string; logoUrl?: string; coverImageUrl?: string
  description?: string; rating?: number; totalRatings?: number
  deliveryTime?: number; deliveryFee?: number; category?: string
  isActive?: boolean; phone?: string
}

type Product = {
  id: string; name: string; price: number; discountPrice?: number
  rating?: number; totalReviews?: number; totalSold?: number
  stockQuantity?: number; images?: string[]; storeName?: string
}

const css = `
  .sd-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; }
  .sd-header { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
  .sd-back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .sd-header-title { font-size: 16px; font-weight: 700; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .sd-cover { width: 100%; height: 220px; object-fit: cover; background: linear-gradient(135deg, #2563EB, #7C3AED); display: block; }
  .sd-cover-placeholder { width: 100%; height: 220px; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); }

  .sd-body { max-width: 1280px; margin: 0 auto; padding: 0 16px 60px; }

  .sd-info-card { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-top: -30px; position: relative; margin-bottom: 28px; display: flex; align-items: flex-start; gap: 16px; box-shadow: var(--shadow); }
  .sd-avatar { width: 64px; height: 64px; border-radius: 16px; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.12); overflow: hidden; background: var(--blue-light); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: var(--blue); flex-shrink: 0; }
  .sd-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .sd-info { flex: 1; min-width: 0; }
  .sd-store-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 6px; }
  .sd-store-desc { font-size: 13px; color: var(--text-2); line-height: 1.5; margin-bottom: 10px; }
  .sd-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .sd-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: var(--blue-light); color: var(--blue); font-size: 12px; font-weight: 600; }
  .sd-chip.green { background: #d1fae5; color: #065f46; }
  .sd-chip.orange { background: #fff7ed; color: #c2410c; }

  .sd-section-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 16px; }
  .sd-empty { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 60px 20px; text-align: center; }
  .sd-empty-icon { font-size: 48px; margin-bottom: 12px; }
  .sd-empty-text { font-size: 16px; font-weight: 700; color: var(--text-2); }
`

const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export function StoreDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        // Try vendors collection first, then stores
        let snap = await getDoc(doc(db, 'vendors', id))
        if (!snap.exists()) snap = await getDoc(doc(db, 'stores', id))
        if (snap.exists()) {
          setStore({ id: snap.id, ...snap.data() } as Store)
        }

        // Fetch store's products
        const q = query(collection(db, 'products'), where('vendorId', '==', id), limit(20))
        const prodSnap = await getDocs(q)
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="sd-root">
        <header className="sd-header">
          <button className="sd-back" type="button" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="sd-header-title">{store?.storeName ?? 'Store'}</span>
        </header>

        {/* Cover image */}
        {store?.coverImageUrl
          ? <img className="sd-cover" src={store.coverImageUrl} alt="" />
          : <div className="sd-cover-placeholder" />
        }

        <div className="sd-body">
          {loading ? (
            <div style={{ padding: '40px 0' }}>
              <div className="bm-skeleton" style={{ height: 110, borderRadius: 16, marginBottom: 24 }} />
              <div className="bm-products-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1.5px solid #E2E8F0' }}>
                    <div className="bm-skeleton" style={{ height: 180 }} />
                    <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="bm-skeleton" style={{ height: 12, width: '60%' }} />
                      <div className="bm-skeleton" style={{ height: 18, width: '50%' }} />
                      <div className="bm-skeleton" style={{ height: 34 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Store info card */}
              <div className="sd-info-card">
                <div className="sd-avatar">
                  {store?.logoUrl
                    ? <img src={store.logoUrl} alt={store.storeName} />
                    : getInitials(store?.storeName ?? 'S')
                  }
                </div>
                <div className="sd-info">
                  <div className="sd-store-name">{store?.storeName ?? 'Store'}</div>
                  {store?.description && (
                    <div className="sd-store-desc">{store.description}</div>
                  )}
                  <div className="sd-chips">
                    {store?.rating !== undefined && (
                      <span className="sd-chip">
                        <StarIcon size={11} />
                        {store.rating.toFixed(1)} ({store.totalRatings ?? 0})
                      </span>
                    )}
                    {store?.deliveryTime !== undefined && (
                      <span className="sd-chip orange">
                        <ClockIcon />
                        {store.deliveryTime}–{store.deliveryTime + 15} min
                      </span>
                    )}
                    {store?.deliveryFee !== undefined && (
                      <span className="sd-chip green">
                        <TruckIcon />
                        {store.deliveryFee === 0 ? 'Free delivery' : `₦${store.deliveryFee} delivery`}
                      </span>
                    )}
                    {store?.category && (
                      <span className="sd-chip">{store.category}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="sd-section-title">
                Products ({products.length})
              </div>
              {products.length === 0 ? (
                <div className="sd-empty">
                  <div className="sd-empty-icon"><PackageIcon size={32} /></div>
                  <div className="sd-empty-text">No products listed yet</div>
                </div>
              ) : (
                <div className="bm-products-grid">
                  {products.map(item => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
