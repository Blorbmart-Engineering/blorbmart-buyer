import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { ProductCard } from '../../components/ProductCard'
import { StarIcon, HeartIcon, ChevronRightIcon, CartIcon, FaceFrownIcon, CloseIcon, UserCircleIcon } from '../../components/icons'

type Product = {
  id: string; name: string; description?: string
  price: number; discountPrice?: number; vendorId?: string; storeId?: string
  rating?: number; totalReviews?: number; totalSold?: number; stockQuantity?: number
  images?: string[]; categoryName?: string; subCategoryName?: string; storeName?: string
}

type ProductVariant = { name: string; additionalPrice: number; stockQuantity: number }

type Review = {
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

const css = `
  .pd-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }

  /* Header */
  .pd-header { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); padding: 12px 16px; }
  .pd-header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
  .pd-icon-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: border-color .15s; }
  .pd-icon-btn:hover { border-color: var(--blue); color: var(--blue); }
  .pd-header-title { flex: 1; font-size: 16px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Body layout */
  .pd-body { max-width: 1280px; margin: 0 auto; padding: 24px 16px 100px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  @media (max-width: 820px) { .pd-body { grid-template-columns: 1fr; padding: 12px 12px 120px; gap: 0; } }

  /* Image gallery */
  .pd-gallery { position: sticky; top: 72px; align-self: start; }
  .pd-main-img { width: 100%; border-radius: var(--radius-lg); overflow: hidden; background: #EEF2FF; aspect-ratio: 1; position: relative; }
  .pd-main-img img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; }
  .pd-img-nav { position: absolute; top: 50%; transform: translateY(-50%); display: flex; justify-content: space-between; width: 100%; padding: 0 10px; pointer-events: none; }
  .pd-img-arrow { pointer-events: all; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.9); border: 1.5px solid var(--border); cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .pd-thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; }
  .pd-thumbs::-webkit-scrollbar { height: 0; }
  .pd-thumb { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; cursor: pointer; flex-shrink: 0; transition: border-color .15s; }
  .pd-thumb.active { border-color: var(--blue); }
  .pd-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .pd-dots-row { display: flex; gap: 6px; justify-content: center; margin-top: 10px; }
  .pd-dot { width: 7px; height: 7px; border-radius: 50%; background: #D7DBE5; transition: all .3s; cursor: pointer; }
  .pd-dot.active { width: 18px; border-radius: 999px; background: var(--blue); }

  /* Details */
  .pd-details { }
  .pd-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); margin-bottom: 14px; flex-wrap: wrap; }
  .pd-breadcrumb a { color: var(--text-3); text-decoration: none; cursor: pointer; }
  .pd-breadcrumb a:hover { color: var(--blue); }
  .pd-category-badge { display: inline-block; background: var(--blue-light); color: var(--blue); font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; margin-bottom: 10px; }
  .pd-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(20px, 3vw, 28px); font-weight: 800; line-height: 1.2; margin-bottom: 12px; }
  .pd-meta-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .pd-rating-pill { display: inline-flex; align-items: center; gap: 5px; background: #FEF3C7; color: #92400E; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 700; }
  .pd-meta-text { font-size: 13px; color: var(--text-3); }
  .pd-divider { width: 4px; height: 4px; border-radius: 50%; background: var(--border); }

  .pd-price-block { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; }
  .pd-price-main { font-size: 28px; font-weight: 800; color: var(--blue); }
  .pd-price-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .pd-price-old { font-size: 15px; color: #94A3B8; text-decoration: line-through; }
  .pd-off-badge { background: #FEE2E2; color: #B91C1C; font-weight: 700; font-size: 12px; padding: 3px 8px; border-radius: 999px; }
  .pd-stock { font-size: 12px; color: var(--text-3); margin-top: 6px; }
  .pd-stock strong { color: #10b981; }
  .pd-stock.low strong { color: #f59e0b; }
  .pd-stock.out strong { color: #ef4444; }

  .pd-qty-row { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 12px 16px; margin-bottom: 16px; }
  .pd-qty-label { font-size: 13px; color: var(--text-2); font-weight: 500; }
  .pd-stepper { display: flex; align-items: center; gap: 12px; }
  .pd-stepper button { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; font-weight: 700; font-size: 16px; cursor: pointer; transition: border-color .15s, color .15s; display: flex; align-items: center; justify-content: center; }
  .pd-stepper button:hover { border-color: var(--blue); color: var(--blue); }
  .pd-stepper button:disabled { opacity: .4; cursor: not-allowed; }
  .pd-stepper strong { font-size: 16px; font-weight: 800; min-width: 24px; text-align: center; }

  .pd-cta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .pd-cta-btn { padding: 14px; border-radius: var(--radius); border: none; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all .2s; }
  .pd-cta-btn.cart { background: var(--blue-light); color: var(--blue); border: 1.5px solid var(--blue); }
  .pd-cta-btn.cart:hover { background: var(--blue); color: #fff; }
  .pd-cta-btn.buy { background: var(--text); color: #fff; }
  .pd-cta-btn.buy:hover { background: #1e293b; }

  .pd-section { margin-bottom: 20px; }
  .pd-section-title { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 10px; font-family: 'Bricolage Grotesque', sans-serif; }
  .pd-desc { font-size: 14px; color: var(--text-2); line-height: 1.7; }

  .pd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pd-info-item { background: var(--blue-light); border-radius: 10px; padding: 10px 14px; }
  .pd-info-label { font-size: 11px; color: var(--blue); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 3px; }
  .pd-info-value { font-size: 13px; font-weight: 700; color: var(--text); }

  .pd-store-card { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 14px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
  .pd-store-card:hover { border-color: var(--blue); box-shadow: var(--shadow-sm); }
  .pd-store-avatar { width: 48px; height: 48px; border-radius: 12px; background: var(--blue-light); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: var(--blue); flex-shrink: 0; overflow: hidden; }
  .pd-store-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pd-store-name { font-size: 14px; font-weight: 700; }
  .pd-store-meta { font-size: 12px; color: var(--text-3); margin-top: 2px; }
  .pd-store-arrow { margin-left: auto; color: var(--text-3); }

  /* Related section */
  .pd-related { max-width: 1280px; margin: 0 auto; padding: 0 16px 40px; }
  .pd-related-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 20px; }

  /* Variants */
  .pd-variants { display: flex; flex-wrap: wrap; gap: 10px; }
  .pd-variant-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; transition: all .15s; min-width: 100px; }
  .pd-variant-chip:hover { border-color: var(--blue); }
  .pd-variant-chip.active { border-color: var(--blue); background: var(--blue-light); }
  .pd-variant-chip.disabled { opacity: .45; cursor: not-allowed; }
  .pd-variant-name { font-size: 13px; font-weight: 700; color: var(--text); }
  .pd-variant-extra { font-size: 12px; color: var(--blue); font-weight: 600; }
  .pd-variant-stock { font-size: 11px; color: var(--text-3); }

  /* Reviews */
  .pd-review-write-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; border-radius: var(--radius); border: 1.5px solid var(--blue); background: var(--blue-light); color: var(--blue); font-weight: 700; font-size: 14px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 14px; }
  .pd-review-write-btn:hover { background: var(--blue); color: #fff; }
  .pd-reviewed-badge { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: var(--radius); background: #ECFDF5; color: #047857; font-size: 13px; font-weight: 600; margin-bottom: 14px; }
  .pd-review-stats { display: flex; align-items: center; gap: 20px; background: var(--bg-2, #F8FAFC); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; }
  .pd-review-avg { font-size: 36px; font-weight: 800; color: var(--text); line-height: 1; }
  .pd-review-stars-row { display: flex; gap: 2px; margin-top: 6px; }
  .pd-review-count { font-size: 12px; color: var(--text-3); margin-top: 4px; }
  .pd-review-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .pd-review-item:last-child { border-bottom: none; }
  .pd-review-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; overflow: hidden; }
  .pd-review-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pd-review-name { font-size: 13.5px; font-weight: 700; color: var(--text); }
  .pd-review-meta-row { display: flex; align-items: center; gap: 8px; margin: 2px 0 6px; }
  .pd-review-date { font-size: 11.5px; color: var(--text-3); }
  .pd-review-comment { font-size: 13px; color: var(--text-2); line-height: 1.6; }
  .pd-review-empty { text-align: center; padding: 30px 16px; color: var(--text-3); }

  /* Review modal */
  .pd-modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  @media (min-width: 640px) { .pd-modal-backdrop { align-items: center; } }
  .pd-modal { background: #fff; border-radius: 20px 20px 0 0; padding: 22px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
  @media (min-width: 640px) { .pd-modal { border-radius: 20px; } }
  .pd-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .pd-modal-title { font-size: 17px; font-weight: 800; font-family: 'Bricolage Grotesque', sans-serif; }
  .pd-modal-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--bg-2, #F1F5F9); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-3); }
  .pd-star-picker { display: flex; gap: 6px; justify-content: center; margin-bottom: 16px; }
  .pd-star-picker button { background: none; border: none; cursor: pointer; padding: 2px; }
  .pd-modal textarea { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 12px 14px; font-size: 13.5px; font-family: 'Plus Jakarta Sans', sans-serif; resize: vertical; min-height: 90px; margin-bottom: 16px; color: var(--text); }
  .pd-modal-submit { width: 100%; padding: 13px; border-radius: var(--radius); border: none; background: var(--blue); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
  .pd-modal-submit:disabled { opacity: .6; cursor: not-allowed; }

  /* Mobile fixed footer */
  .pd-mobile-footer { display: none; position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top: 1px solid var(--border); padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px)); z-index: 50; }
  @media (max-width: 820px) { .pd-mobile-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .pd-cta-row { display: none; } }

  /* Skeleton */
  .pd-skel-gallery { aspect-ratio: 1; border-radius: var(--radius-lg); }
  .pd-skel-line { border-radius: 6px; }
`

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

function SkeletonPage() {
  return (
    <div className="pd-body">
      <div>
        <div className="bm-skeleton pd-skel-gallery" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="bm-skeleton" style={{ width: 64, height: 64, borderRadius: 10 }} />)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="bm-skeleton pd-skel-line" style={{ height: 14, width: '40%' }} />
        <div className="bm-skeleton pd-skel-line" style={{ height: 32, width: '85%' }} />
        <div className="bm-skeleton pd-skel-line" style={{ height: 24, width: '50%' }} />
        <div className="bm-skeleton pd-skel-line" style={{ height: 80, borderRadius: 14 }} />
        <div className="bm-skeleton pd-skel-line" style={{ height: 56, borderRadius: 14 }} />
        <div className="bm-skeleton pd-skel-line" style={{ height: 100, borderRadius: 14 }} />
        <div className="bm-skeleton pd-skel-line" style={{ height: 60, borderRadius: 14 }} />
      </div>
    </div>
  )
}

export function ProductDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<Product[]>([])
  const [imageIndex, setImageIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)

  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(-1)

  const [reviews, setReviews] = useState<Review[]>([])
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
        const snap = await getDoc(doc(db, 'products', id))
        if (snap.exists()) {
          const data = snap.data() as Omit<Product, 'id'>
          const p = { id: snap.id, ...data }
          setProduct(p)

          // Fetch related products
          try {
            const q = query(
              collection(db, 'products'),
              where('categoryName', '==', p.categoryName ?? ''),
              limit(5)
            )
            const relSnap = await getDocs(q)
            setRelated(relSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)).filter(r => r.id !== id))
          } catch { /* no related */ }

          // Fetch variants
          try {
            const variantsSnap = await getDocs(collection(db, 'products', id, 'variants'))
            setVariants(variantsSnap.docs.map(d => {
              const vd = d.data()
              return { name: vd.name ?? '', additionalPrice: Number(vd.additionalPrice) || 0, stockQuantity: Number(vd.stockQuantity) || 0 }
            }))
          } catch { /* no variants */ }

          // Fetch reviews
          try {
            const reviewsSnap = await getDocs(query(collection(db, 'products', id, 'reviews'), orderBy('createdAt', 'desc')))
            setReviews(reviewsSnap.docs.map(d => {
              const rd = d.data()
              return {
                id: d.id, userId: rd.userId ?? '', userName: rd.userName ?? 'Anonymous', userImageUrl: rd.userImageUrl ?? '',
                rating: Number(rd.rating) || 0, comment: rd.comment ?? '',
                createdAt: rd.createdAt?.toDate ? rd.createdAt.toDate() : undefined,
              }
            }))
          } catch { /* no reviews */ }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // Check whether the user already reviewed, or has a delivered order containing this product
  useEffect(() => {
    const checkPurchaseAndReview = async () => {
      if (!user || !product) return
      try {
        const existing = await getDocs(query(
          collection(db, 'products', product.id, 'reviews'),
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
            where('storeId', '==', product.storeId ?? product.vendorId ?? '')
          ))
          for (const so of storeOrdersSnap.docs) {
            const items = (so.data().items ?? []) as Array<{ productId?: string }>
            if (items.some(i => i.productId === product.id)) { setHasPurchased(true); return }
          }
        }
      } catch { /* ignore */ }
    }
    checkPurchaseAndReview()
  }, [user, product])

  const images = useMemo(() => product?.images?.length ? product.images : ['/second.jpg'], [product])
  const selectedVariant = selectedVariantIndex >= 0 ? variants[selectedVariantIndex] : undefined
  const price = (product?.discountPrice ?? product?.price ?? 0) + (selectedVariant?.additionalPrice ?? 0)
  const oldPrice = (!selectedVariant && product?.discountPrice) ? product?.price : undefined
  const discountPct = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null
  // undefined stockQuantity = made-to-order (food), treat as unlimited
  const stock = selectedVariant ? selectedVariant.stockQuantity : product?.stockQuantity
  const isOutOfStock = stock !== undefined && stock === 0
  const stockClass = isOutOfStock ? 'out' : (stock !== undefined && stock <= 5) ? 'low' : ''

  const handleAddToCart = () => {
    if (!product) return
    addItem({
      id: product.id, name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      price, image: images[0], storeName: product.storeName, vendorId: product.vendorId, categoryName: product.categoryName,
    }, qty)
  }

  const submitReview = async () => {
    if (!user || !product || submittingReview || !reviewComment.trim()) return
    setSubmittingReview(true)
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const ud = userSnap.exists() ? userSnap.data() : {}
      const name = `${ud?.firstName ?? ''} ${ud?.lastName ?? ''}`.trim() || user.displayName || 'Verified Buyer'
      const imageUrl = ud?.photoUrl ?? user.photoURL ?? ''

      await addDoc(collection(db, 'products', product.id, 'reviews'), {
        userId: user.uid, userName: name, userImageUrl: imageUrl,
        rating: reviewStars, comment: reviewComment.trim(), verified: true, createdAt: serverTimestamp(),
      })

      const allSnap = await getDocs(collection(db, 'products', product.id, 'reviews'))
      const avg = allSnap.docs.reduce((s, d) => s + (Number(d.data().rating) || 0), 0) / allSnap.docs.length
      await updateDoc(doc(db, 'products', product.id), {
        rating: Number(avg.toFixed(1)), totalReviews: allSnap.docs.length,
      })

      setReviews(rs => [{ userId: user.uid, userName: name, userImageUrl: imageUrl, rating: reviewStars, comment: reviewComment.trim(), createdAt: new Date() }, ...rs])
      setHasReviewed(true)
      setReviewModalOpen(false)
      setReviewComment('')
      setReviewStars(5)
    } catch { /* ignore */ } finally {
      setSubmittingReview(false)
    }
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/checkout')
  }

  const prevImage = () => setImageIndex(i => (i - 1 + images.length) % images.length)
  const nextImage = () => setImageIndex(i => (i + 1) % images.length)

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="pd-root">
        {/* Header */}
        <header className="pd-header">
          <div className="pd-header-inner">
            <button className="pd-icon-btn" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="pd-header-title">{product?.name ?? 'Product'}</span>
            <button className="pd-icon-btn" type="button" onClick={() => navigate('/cart')}>
              <CartIcon />
            </button>
          </div>
        </header>

        {loading ? (
          <>
            <style>{`.pd-body { padding: 24px 16px 100px; }`}</style>
            <SkeletonPage />
          </>
        ) : !product ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><FaceFrownIcon size={48} /></div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Product not found</div>
            <button style={{ padding: '10px 20px', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/shop')}>
              Browse Shop
            </button>
          </div>
        ) : (
          <>
            <div className="pd-body">
              {/* Left: Image gallery */}
              <div className="pd-gallery">
                <div className="pd-main-img">
                  <img src={images[imageIndex]} alt={product.name} onClick={nextImage} />
                  {images.length > 1 && (
                    <div className="pd-img-nav">
                      <button className="pd-img-arrow" type="button" onClick={e => { e.stopPropagation(); prevImage() }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button className="pd-img-arrow" type="button" onClick={e => { e.stopPropagation(); nextImage() }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="pd-thumbs">
                    {images.map((img, i) => (
                      <div key={i} className={`pd-thumb ${i === imageIndex ? 'active' : ''}`} onClick={() => setImageIndex(i)}>
                        <img src={img} alt={`View ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}
                {images.length > 1 && (
                  <div className="pd-dots-row">
                    {images.map((_, i) => (
                      <div key={i} className={`pd-dot ${i === imageIndex ? 'active' : ''}`} onClick={() => setImageIndex(i)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="pd-details">
                {/* Breadcrumb */}
                <div className="pd-breadcrumb">
                  <a onClick={() => navigate('/dashboard')}>Home</a>
                  <ChevronRightIcon />
                  <a onClick={() => navigate('/shop')}>Shop</a>
                  {product.categoryName && (
                    <>
                      <ChevronRightIcon />
                      <a onClick={() => navigate('/shop')}>{product.categoryName}</a>
                    </>
                  )}
                </div>

                {product.categoryName && (
                  <div className="pd-category-badge">{product.categoryName}</div>
                )}

                <div className="pd-title">{product.name}</div>

                {/* Meta row */}
                <div className="pd-meta-row">
                  <div className="pd-rating-pill">
                    <StarIcon size={12} />
                    {(product.rating ?? 0).toFixed(1)}
                  </div>
                  <span className="pd-meta-text">{product.totalReviews ?? 0} reviews</span>
                  <div className="pd-divider" />
                  <span className="pd-meta-text">{product.totalSold ?? 0} sold</span>
                </div>

                {/* Price */}
                <div className="pd-price-block">
                  <div className="pd-price-row">
                    <div className="pd-price-main">{fmt(price)}</div>
                    {oldPrice && <div className="pd-price-old">{fmt(oldPrice)}</div>}
                    {discountPct && <div className="pd-off-badge">{discountPct}% OFF</div>}
                  </div>
                  <div className={`pd-stock ${stockClass}`}>
                    {isOutOfStock
                      ? <><strong>Out of stock</strong></>
                      : stock === undefined
                        ? <><strong>Available</strong></>
                        : stock <= 5
                          ? <><strong>{stock} left</strong> — order soon!</>
                          : <><strong>{stock}</strong> in stock</>
                    }
                  </div>
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div className="pd-section">
                    <div className="pd-section-title">Available Variants</div>
                    <div className="pd-variants">
                      {variants.map((v, i) => {
                        const active = selectedVariantIndex === i
                        const out = v.stockQuantity === 0
                        return (
                          <div
                            key={v.name + i}
                            className={`pd-variant-chip ${active ? 'active' : ''} ${out ? 'disabled' : ''}`}
                            onClick={() => { if (out) return; setSelectedVariantIndex(active ? -1 : i); setQty(1) }}
                          >
                            <span className="pd-variant-name">{v.name}</span>
                            {v.additionalPrice > 0 && <span className="pd-variant-extra">+{fmt(v.additionalPrice)}</span>}
                            <span className="pd-variant-stock">{out ? 'Out of stock' : `${v.stockQuantity} in stock`}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="pd-qty-row">
                  <span className="pd-qty-label">Quantity</span>
                  <div className="pd-stepper">
                    <button type="button" onClick={() => setQty(v => Math.max(1, v - 1))} disabled={qty <= 1}>−</button>
                    <strong>{qty}</strong>
                    <button type="button" onClick={() => setQty(v => Math.min(stock ?? 99, v + 1))} disabled={stock !== undefined && qty >= stock}>+</button>
                  </div>
                </div>

                {/* CTA buttons (desktop) */}
                <div className="pd-cta-row">
                  <button className="pd-cta-btn cart" type="button" onClick={handleAddToCart} disabled={isOutOfStock}>
                    Add to Cart
                  </button>
                  <button className="pd-cta-btn buy" type="button" onClick={handleBuyNow} disabled={isOutOfStock}>
                    Buy Now
                  </button>
                </div>

                {/* Wishlist */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => setWishlisted(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: wishlisted ? '#ef4444' : 'var(--text-2)', fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all .15s' }}
                  >
                    <HeartIcon filled={wishlisted} />
                    {wishlisted ? 'Saved' : 'Save to Wishlist'}
                  </button>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="pd-section">
                    <div className="pd-section-title">Description</div>
                    <p className="pd-desc">{product.description}</p>
                  </div>
                )}

                {/* Info grid */}
                <div className="pd-section">
                  <div className="pd-section-title">Product Details</div>
                  <div className="pd-info-grid">
                    {product.categoryName && (
                      <div className="pd-info-item">
                        <div className="pd-info-label">Category</div>
                        <div className="pd-info-value">{product.categoryName}</div>
                      </div>
                    )}
                    {product.subCategoryName && (
                      <div className="pd-info-item">
                        <div className="pd-info-label">Subcategory</div>
                        <div className="pd-info-value">{product.subCategoryName}</div>
                      </div>
                    )}
                    <div className="pd-info-item">
                      <div className="pd-info-label">Total Sold</div>
                      <div className="pd-info-value">{product.totalSold ?? 0}</div>
                    </div>
                    <div className="pd-info-item">
                      <div className="pd-info-label">Rating</div>
                      <div className="pd-info-value">{(product.rating ?? 0).toFixed(1)} / 5.0</div>
                    </div>
                  </div>
                </div>

                {/* Store card */}
                {product.storeName && (
                  <div className="pd-section">
                    <div className="pd-section-title">Sold by</div>
                    <div
                      className="pd-store-card"
                      onClick={() => product.vendorId ? navigate(`/store/${product.vendorId}`) : undefined}
                    >
                      <div className="pd-store-avatar">
                        {getInitials(product.storeName)}
                      </div>
                      <div>
                        <div className="pd-store-name">{product.storeName}</div>
                        <div className="pd-store-meta">
                          {product.categoryName ?? 'General Store'} · Tap to visit store
                        </div>
                      </div>
                      <div className="pd-store-arrow"><ChevronRightIcon /></div>
                    </div>
                  </div>
                )}

                {/* Reviews */}
                <div className="pd-section">
                  <div className="pd-section-title">Reviews ({reviews.length})</div>

                  {hasPurchased && !hasReviewed && (
                    <button className="pd-review-write-btn" type="button" onClick={() => setReviewModalOpen(true)}>
                      <StarIcon size={14} /> Write a Review
                    </button>
                  )}
                  {hasReviewed && (
                    <div className="pd-reviewed-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                      You've reviewed this product
                    </div>
                  )}

                  {reviews.length === 0 ? (
                    <div className="pd-review-empty">
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>No reviews yet</div>
                      <div style={{ fontSize: 12.5 }}>Be the first to review this product</div>
                    </div>
                  ) : (
                    <>
                      <div className="pd-review-stats">
                        <div>
                          <div className="pd-review-avg">{(product.rating ?? 0).toFixed(1)}</div>
                          <div className="pd-review-stars-row">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ opacity: i < Math.round(product.rating ?? 0) ? 1 : .25 }}><StarIcon size={13} /></span>
                            ))}
                          </div>
                          <div className="pd-review-count">{product.totalReviews ?? reviews.length} reviews</div>
                        </div>
                      </div>
                      {reviews.map((r, i) => (
                        <div className="pd-review-item" key={r.id ?? i}>
                          <div className="pd-review-avatar">
                            {r.userImageUrl ? <img src={r.userImageUrl} alt={r.userName} /> : (r.userName ? getInitials(r.userName) : <UserCircleIcon />)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="pd-review-name">{r.userName}</div>
                            <div className="pd-review-meta-row">
                              <span style={{ display: 'flex', gap: 1 }}>
                                {[...Array(5)].map((_, si) => (
                                  <span key={si} style={{ opacity: si < Math.round(r.rating) ? 1 : .25 }}><StarIcon size={11} /></span>
                                ))}
                              </span>
                              <span className="pd-review-date">{formatReviewDate(r.createdAt)}</span>
                            </div>
                            <div className="pd-review-comment">{r.comment}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Related products */}
            {related.length > 0 && (
              <div className="pd-related">
                <div className="pd-related-title">You might also like</div>
                <div className="bm-products-grid">
                  {related.slice(0, 4).map(item => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Mobile fixed CTA */}
            <div className="pd-mobile-footer">
              <button className="pd-cta-btn cart" type="button" onClick={handleAddToCart} disabled={isOutOfStock}>
                Add to Cart
              </button>
              <button className="pd-cta-btn buy" type="button" onClick={handleBuyNow} disabled={isOutOfStock}>
                Buy Now
              </button>
            </div>
          </>
        )}

        {reviewModalOpen && (
          <div className="pd-modal-backdrop" onClick={() => setReviewModalOpen(false)}>
            <div className="pd-modal" onClick={e => e.stopPropagation()}>
              <div className="pd-modal-head">
                <span className="pd-modal-title">Write a Review</span>
                <button className="pd-modal-close" type="button" onClick={() => setReviewModalOpen(false)}><CloseIcon /></button>
              </div>
              <div className="pd-star-picker">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewStars(n)} style={{ opacity: n <= reviewStars ? 1 : .3 }}>
                    <StarIcon size={28} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share your experience with this product..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
              <button className="pd-modal-submit" type="button" disabled={submittingReview || !reviewComment.trim()} onClick={submitReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
