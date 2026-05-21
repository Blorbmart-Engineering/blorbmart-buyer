import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useCart } from '../../contexts/CartContext'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { ProductCard } from '../../components/ProductCard'
import { StarIcon, HeartIcon, ChevronRightIcon, CartIcon } from '../../components/icons'

type Product = {
  id: string; name: string; description?: string
  price: number; discountPrice?: number; vendorId?: string
  rating?: number; totalReviews?: number; totalSold?: number; stockQuantity?: number
  images?: string[]; categoryName?: string; subCategoryName?: string; storeName?: string
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

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<Product[]>([])
  const [imageIndex, setImageIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)

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
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const images = useMemo(() => product?.images?.length ? product.images : ['/second.jpg'], [product])
  const price = product?.discountPrice ?? product?.price ?? 0
  const oldPrice = product?.discountPrice ? product?.price : undefined
  const discountPct = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null
  const stock = product?.stockQuantity ?? 0
  const stockClass = stock === 0 ? 'out' : stock <= 5 ? 'low' : ''

  const handleAddToCart = () => {
    if (!product) return
    addItem({ id: product.id, name: product.name, price, image: images[0], storeName: product.storeName, vendorId: product.vendorId, categoryName: product.categoryName }, qty)
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
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
                    {stock === 0
                      ? <><strong>Out of stock</strong></>
                      : stock <= 5
                        ? <><strong>{stock} left</strong> — order soon!</>
                        : <><strong>{stock}</strong> in stock</>
                    }
                  </div>
                </div>

                {/* Quantity */}
                <div className="pd-qty-row">
                  <span className="pd-qty-label">Quantity</span>
                  <div className="pd-stepper">
                    <button type="button" onClick={() => setQty(v => Math.max(1, v - 1))} disabled={qty <= 1}>−</button>
                    <strong>{qty}</strong>
                    <button type="button" onClick={() => setQty(v => Math.min(stock || 99, v + 1))} disabled={stock > 0 && qty >= stock}>+</button>
                  </div>
                </div>

                {/* CTA buttons (desktop) */}
                <div className="pd-cta-row">
                  <button className="pd-cta-btn cart" type="button" onClick={handleAddToCart} disabled={stock === 0}>
                    Add to Cart
                  </button>
                  <button className="pd-cta-btn buy" type="button" onClick={handleBuyNow} disabled={stock === 0}>
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
              <button className="pd-cta-btn cart" type="button" onClick={handleAddToCart} disabled={stock === 0}>
                Add to Cart
              </button>
              <button className="pd-cta-btn buy" type="button" onClick={handleBuyNow} disabled={stock === 0}>
                Buy Now
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
