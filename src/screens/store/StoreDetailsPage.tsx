import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { PackageIcon, CloseIcon, UserCircleIcon, MapPinIcon } from '../../components/icons'
import { ProductCard } from '../../components/ProductCard'
import { StarIcon, ClockIcon, TruckIcon } from '../../components/icons'
import { FoodCartBar } from '../../components/FoodCartBar'

type Store = {
  id: string; vendorId?: string; storeName: string; logoUrl?: string; coverImageUrl?: string
  description?: string; rating?: number; totalRatings?: number
  deliveryTime?: number; deliveryFee?: number; category?: string
  isActive?: boolean; phone?: string; address?: string
}

type StoreReview = {
  id?: string; userId: string; userName: string; userImageUrl?: string
  rating: number; comment: string; createdAt?: Date
}

const formatReviewDate = (date?: Date) => {
  if (!date) return ''
  const diffMs = Date.now() - date.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days > 365) { const y = Math.floor(days / 365); return `${y} year${y > 1 ? 's' : ''} ago` }
  if (days > 30) { const m = Math.floor(days / 30); return `${m} month${m > 1 ? 's' : ''} ago` }
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  const hours = Math.floor(diffMs / 3600000)
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const mins = Math.floor(diffMs / 60000)
  if (mins > 0) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  return 'Just now'
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

  .sd-address-row { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-3); margin-top: 8px; }

  .sd-section-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 16px; }
  .sd-empty { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 60px 20px; text-align: center; }
  .sd-empty-icon { font-size: 48px; margin-bottom: 12px; }
  .sd-empty-text { font-size: 16px; font-weight: 700; color: var(--text-2); }

  /* Reviews */
  .sd-review-write-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; border-radius: var(--radius); border: 1.5px solid var(--blue); background: var(--blue-light); color: var(--blue); font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 14px; }
  .sd-review-write-btn:hover { background: var(--blue); color: #fff; }
  .sd-reviewed-badge { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: var(--radius); background: #ECFDF5; color: #047857; font-size: 13px; font-weight: 600; margin-bottom: 14px; }
  .sd-review-item { display: flex; gap: 12px; padding: 14px; background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius); margin-bottom: 10px; }
  .sd-review-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; overflow: hidden; }
  .sd-review-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .sd-review-name { font-size: 13.5px; font-weight: 700; color: var(--text); }
  .sd-review-meta-row { display: flex; align-items: center; gap: 8px; margin: 2px 0 6px; }
  .sd-review-date { font-size: 11.5px; color: var(--text-3); }
  .sd-review-comment { font-size: 13px; color: var(--text-2); line-height: 1.6; }
  .sd-review-empty { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); text-align: center; padding: 30px 16px; color: var(--text-3); }

  /* Review modal */
  .sd-modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  @media (min-width: 640px) { .sd-modal-backdrop { align-items: center; } }
  .sd-modal { background: #fff; border-radius: 20px 20px 0 0; padding: 22px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
  @media (min-width: 640px) { .sd-modal { border-radius: 20px; } }
  .sd-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .sd-modal-title { font-size: 17px; font-weight: 800; font-family: 'Bricolage Grotesque', sans-serif; }
  .sd-modal-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--bg-2, #F1F5F9); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-3); }
  .sd-star-picker { display: flex; gap: 6px; justify-content: center; margin-bottom: 16px; }
  .sd-star-picker button { background: none; border: none; cursor: pointer; padding: 2px; }
  .sd-modal textarea { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 12px 14px; font-size: 13.5px; font-family: 'Plus Jakarta Sans', sans-serif; resize: vertical; min-height: 90px; margin-bottom: 16px; color: var(--text); }
  .sd-modal-submit { width: 100%; padding: 13px; border-radius: var(--radius); border: none; background: var(--blue); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
  .sd-modal-submit:disabled { opacity: .6; cursor: not-allowed; }
`

const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export function StoreDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [reviews, setReviews] = useState<StoreReview[]>([])
  const [hasPurchased, setHasPurchased] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewStars, setReviewStars] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        // Try vendors collection first, then stores
        let snap = await getDoc(doc(db, 'vendors', id))
        if (!snap.exists()) snap = await getDoc(doc(db, 'stores', id))

        let vendorId = id
        let resolvedStoreName = 'Store'
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>
          vendorId = (data['vendorId'] as string) ?? id
          const name = (data['storeName'] ?? data['name'] ?? data['businessName']) as string | undefined
          resolvedStoreName = name ?? 'Store'
          const logo = (data['logoUrl'] ?? data['logo'] ?? data['logoImageUrl'] ?? data['imageUrl']) as string | undefined
          const cover = (data['coverImageUrl'] ?? data['coverImage'] ?? data['bannerUrl']) as string | undefined
          setStore({
            id: snap.id, vendorId,
            storeName: name ?? 'Store',
            logoUrl: logo,
            coverImageUrl: cover,
            description: data['description'] as string | undefined,
            rating: data['rating'] !== undefined ? Number(data['rating']) : undefined,
            totalRatings: data['totalRatings'] !== undefined ? Number(data['totalRatings']) : (data['totalReviews'] !== undefined ? Number(data['totalReviews']) : undefined),
            deliveryTime: data['deliveryTime'] !== undefined ? Number(data['deliveryTime']) : undefined,
            deliveryFee: data['deliveryFee'] !== undefined ? Number(data['deliveryFee']) : undefined,
            category: (data['category'] ?? data['categoryName']) as string | undefined,
            isActive: data['isActive'] as boolean | undefined,
            phone: data['phone'] as string | undefined,
            address: (data['address'] ?? data['lga']) as string | undefined,
          })
        }

        // Fetch store's products — by vendorId first, fall back to storeId (matches Flutter logic)
        let prodSnap = await getDocs(query(collection(db, 'products'), where('vendorId', '==', vendorId), limit(20)))
        if (prodSnap.empty && id !== vendorId) {
          prodSnap = await getDocs(query(collection(db, 'products'), where('storeId', '==', id), limit(20)))
        }
        if (prodSnap.empty) {
          prodSnap = await getDocs(query(collection(db, 'products'), where('storeId', '==', vendorId), limit(20)))
        }
        setProducts(prodSnap.docs.map(d => {
          const data = d.data() as Record<string, unknown>
          return {
            id: d.id,
            ...data,
            vendorId: (data.vendorId as string) || vendorId,
            storeId: snap.exists() ? snap.id : id,
            storeName: (data.storeName as string) || (data.name as string) || resolvedStoreName,
          } as Product
        }))

        // Fetch store reviews
        try {
          const reviewsSnap = await getDocs(query(collection(db, 'stores', id, 'reviews'), orderBy('createdAt', 'desc')))
          setReviews(reviewsSnap.docs.map(d => {
            const rd = d.data()
            return {
              id: d.id, userId: rd.userId ?? '', userName: rd.userName ?? 'Anonymous', userImageUrl: rd.userImageUrl ?? '',
              rating: Number(rd.rating) || 0, comment: rd.comment ?? '',
              createdAt: rd.createdAt?.toDate ? rd.createdAt.toDate() : undefined,
            }
          }))
        } catch { /* no reviews */ }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Check whether the user already reviewed this store, or has a delivered order from it
  useEffect(() => {
    const checkPurchaseAndReview = async () => {
      if (!user || !id) return
      try {
        const existing = await getDocs(query(
          collection(db, 'stores', id, 'reviews'),
          where('userId', '==', user.uid),
          limit(1)
        ))
        if (!existing.empty) { setHasReviewed(true); return }

        const ordersSnap = await getDocs(query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          where('orderStatus', '==', 'delivered')
        ))
        for (const orderDoc of ordersSnap.docs) {
          const storeOrdersSnap = await getDocs(query(
            collection(db, 'orders', orderDoc.id, 'storeOrders'),
            where('storeId', '==', id),
            limit(1)
          ))
          if (!storeOrdersSnap.empty) { setHasPurchased(true); return }
        }
      } catch { /* ignore */ }
    }
    checkPurchaseAndReview()
  }, [user, id])

  const submitStoreReview = async () => {
    if (!user || !id || submittingReview || !reviewComment.trim()) return
    setSubmittingReview(true)
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const ud = userSnap.exists() ? userSnap.data() : {}
      const name = `${ud?.firstName ?? ''} ${ud?.lastName ?? ''}`.trim() || user.displayName || 'Verified Buyer'
      const imageUrl = ud?.photoUrl ?? user.photoURL ?? ''

      await addDoc(collection(db, 'stores', id, 'reviews'), {
        userId: user.uid, userName: name, userImageUrl: imageUrl,
        rating: reviewStars, comment: reviewComment.trim(), verified: true, createdAt: serverTimestamp(),
      })

      const allSnap = await getDocs(collection(db, 'stores', id, 'reviews'))
      const avg = allSnap.docs.reduce((s, d) => s + (Number(d.data().rating) || 0), 0) / allSnap.docs.length
      await updateDoc(doc(db, 'stores', id), { rating: Number(avg.toFixed(1)) })

      setReviews(rs => [{ userId: user.uid, userName: name, userImageUrl: imageUrl, rating: reviewStars, comment: reviewComment.trim(), createdAt: new Date() }, ...rs])
      setStore(s => s ? { ...s, rating: Number(avg.toFixed(1)) } : s)
      setHasReviewed(true)
      setReviewModalOpen(false)
      setReviewComment('')
      setReviewStars(5)
    } catch { /* ignore */ } finally {
      setSubmittingReview(false)
    }
  }

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
                  {store?.address && (
                    <div className="sd-address-row">
                      <MapPinIcon size={13} />
                      {store.address}
                    </div>
                  )}
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

              {/* Store reviews */}
              <div className="sd-section-title" style={{ marginTop: 32 }}>
                Store Reviews ({reviews.length})
              </div>

              {hasPurchased && !hasReviewed && (
                <button className="sd-review-write-btn" type="button" onClick={() => setReviewModalOpen(true)}>
                  <StarIcon size={14} /> Write a Review
                </button>
              )}
              {hasReviewed && (
                <div className="sd-reviewed-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  You've reviewed this store
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="sd-review-empty">
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>No reviews yet</div>
                  <div style={{ fontSize: 12.5 }}>Be the first to review this store</div>
                </div>
              ) : (
                reviews.map((r, i) => (
                  <div className="sd-review-item" key={r.id ?? i}>
                    <div className="sd-review-avatar">
                      {r.userImageUrl ? <img src={r.userImageUrl} alt={r.userName} /> : (r.userName ? getInitials(r.userName) : <UserCircleIcon />)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="sd-review-name">{r.userName}</div>
                      <div className="sd-review-meta-row">
                        <span style={{ display: 'flex', gap: 1 }}>
                          {[...Array(5)].map((_, si) => (
                            <span key={si} style={{ opacity: si < Math.round(r.rating) ? 1 : .25 }}><StarIcon size={11} /></span>
                          ))}
                        </span>
                        <span className="sd-review-date">{formatReviewDate(r.createdAt)}</span>
                      </div>
                      <div className="sd-review-comment">{r.comment}</div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {reviewModalOpen && (
        <div className="sd-modal-backdrop" onClick={() => setReviewModalOpen(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-head">
              <span className="sd-modal-title">Write a Review</span>
              <button className="sd-modal-close" type="button" onClick={() => setReviewModalOpen(false)}><CloseIcon /></button>
            </div>
            <div className="sd-star-picker">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setReviewStars(n)} style={{ opacity: n <= reviewStars ? 1 : .3 }}>
                  <StarIcon size={28} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share your experience with this store..."
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
            />
            <button className="sd-modal-submit" type="button" disabled={submittingReview || !reviewComment.trim()} onClick={submitStoreReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
      <FoodCartBar />
    </>
  )
}
