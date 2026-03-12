import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

type Product = {
  id: string
  name: string
  description?: string
  price: number
  discountPrice?: number
  rating?: number
  totalReviews?: number
  totalSold?: number
  stockQuantity?: number
  images?: string[]
  categoryName?: string
  subCategoryName?: string
  storeName?: string
  hasVariants?: boolean
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #4F5BFF;
    --bg: #F6F7FB;
    --text: #1F2937;
    --muted: #7C8AA5;
    --border: #E7EAF0;
  }

  .pd-root { min-height: 100dvh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
  .pd-hero {
    position: relative;
    background: #fff;
    border-radius: 0 0 26px 26px;
    overflow: hidden;
  }
  .pd-hero-img {
    width: 100%;
    height: 360px;
    object-fit: cover;
    display: block;
    background: #F1F3F8;
  }
  .pd-top-actions {
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .pd-icon-btn {
    width: 40px; height: 40px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: rgba(255,255,255,.92);
    display: grid; place-items: center;
    cursor: pointer;
    backdrop-filter: blur(6px);
  }
  .pd-dots {
    display: flex; gap: 6px; justify-content: center;
    padding: 10px 0 16px;
    background: #fff;
  }
  .pd-dot { width: 7px; height: 7px; border-radius: 50%; background: #D7DBE5; }
  .pd-dot.active { width: 18px; border-radius: 999px; background: var(--blue); }

  .pd-content { padding: 18px 18px 100px; }
  .pd-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; }
  .pd-meta { display: flex; align-items: center; gap: 10px; margin-top: 10px; color: var(--muted); font-size: 13px; }
  .pd-pill { display: inline-flex; align-items: center; gap: 6px; background: #FFF7ED; color: #F97316; padding: 4px 8px; border-radius: 10px; font-weight: 600; }

  .pd-price { display: flex; align-items: baseline; gap: 10px; margin-top: 14px; }
  .pd-price-main { font-size: 26px; font-weight: 800; color: var(--blue); }
  .pd-price-old { font-size: 14px; color: #9AA3B2; text-decoration: line-through; }
  .pd-off { background: #FFE7E5; color: #F43F5E; font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 999px; }

  .pd-qty {
    margin-top: 18px;
    display: flex; align-items: center; justify-content: space-between;
    background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 12px 14px;
  }
  .pd-qty span { color: var(--muted); font-size: 13px; }
  .pd-stepper { display: flex; align-items: center; gap: 10px; }
  .pd-stepper button {
    width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border);
    background: #fff; font-weight: 700; cursor: pointer;
  }

  .pd-section { margin-top: 22px; }
  .pd-section h3 { font-family: 'Sora', sans-serif; font-size: 16px; margin-bottom: 8px; }
  .pd-desc { color: var(--muted); font-size: 14px; line-height: 1.6; }

  .pd-info-card {
    margin-top: 12px; background: #F4F6FF; border: 1px solid #E4E8FF; color: #3E4BFF;
    border-radius: 16px; padding: 12px 14px; display: flex; gap: 16px;
  }
  .pd-info-col { flex: 1; }
  .pd-info-col small { display: block; font-size: 11px; color: #7480FF; }
  .pd-info-col strong { font-size: 13px; color: #1F2937; }

  .pd-variants { display: flex; gap: 12px; flex-wrap: wrap; }
  .pd-variant { border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; background: #fff; min-width: 120px; }
  .pd-variant strong { display: block; margin-bottom: 4px; }
  .pd-variant small { color: var(--muted); }

  .pd-seller {
    margin-top: 12px; background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 14px;
    display: flex; align-items: center; gap: 12px;
  }
  .pd-seller-icon { width: 46px; height: 46px; border-radius: 14px; background: #F1F5F9; display: grid; place-items: center; color: var(--blue); }
  .pd-seller-name { font-weight: 700; }
  .pd-seller-meta { color: var(--muted); font-size: 12px; margin-top: 3px; }

  .pd-footer {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 0; width: 100%; max-width: 430px;
    background: #fff; border-top: 1px solid var(--border); padding: 12px 16px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .pd-btn {
    border: none; border-radius: 16px; padding: 14px 16px; font-weight: 700; cursor: pointer;
  }
  .pd-btn.secondary { background: #4F5BFF; color: #fff; }
  .pd-btn.primary { background: #111827; color: #fff; }

  .pd-empty { padding: 80px 20px; text-align: center; color: var(--muted); }
`

const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
)

export function ProductDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageIndex, setImageIndex] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const snap = await getDoc(doc(db, 'products', id))
        if (snap.exists()) {
          const data = snap.data() as Omit<Product, 'id'>
          setProduct({ id: snap.id, ...data })
        } else {
          setProduct(null)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const images = useMemo(() => product?.images ?? [], [product])
  const price = product?.discountPrice ?? product?.price ?? 0
  const oldPrice = product?.discountPrice ? product?.price : undefined
  const rating = product?.rating ?? 0
  const reviews = product?.totalReviews ?? 0
  const sold = product?.totalSold ?? 0
  const stock = product?.stockQuantity ?? 0

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="pd-root">
          <div className="pd-empty">Loading product...</div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <style>{css}</style>
        <div className="pd-root">
          <div className="pd-empty">Product not found.</div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{css}</style>
      <div className="pd-root">
        <section className="pd-hero">
          <img
            className="pd-hero-img"
            src={images[imageIndex] ?? '/second.jpg'}
            alt={product.name}
            onClick={() => {
              if (images.length > 0) {
                setImageIndex((idx) => (idx + 1) % images.length)
              }
            }}
          />
          <div className="pd-top-actions">
            <button className="pd-icon-btn" type="button" onClick={() => navigate(-1)}>
              <ArrowLeft />
            </button>
            <button className="pd-icon-btn" type="button">
              <HeartIcon />
            </button>
          </div>
          <div className="pd-dots">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`pd-dot ${idx === imageIndex ? 'active' : ''}`}
                onClick={() => setImageIndex(idx)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        </section>

        <section className="pd-content">
          <div className="pd-title">{product.name}</div>
          <div className="pd-meta">
            <span className="pd-pill"><StarIcon /> {rating.toFixed(1)}</span>
            <span>{reviews} reviews</span>
            <span>? {sold} sold</span>
          </div>

          <div className="pd-price">
            <div className="pd-price-main">{formatCurrency(price)}</div>
            {oldPrice ? <div className="pd-price-old">{formatCurrency(oldPrice)}</div> : null}
            {oldPrice ? <div className="pd-off">{Math.round(((oldPrice - price) / oldPrice) * 100)}% OFF</div> : null}
          </div>

          <div className="pd-qty">
            <span>Quantity: <strong>{stock}</strong> available</span>
            <div className="pd-stepper">
              <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))}>-</button>
              <strong>{qty}</strong>
              <button type="button" onClick={() => setQty((v) => v + 1)}>+</button>
            </div>
          </div>

          <div className="pd-section">
            <h3>Description</h3>
            <p className="pd-desc">{product.description}</p>

            <div className="pd-info-card">
              <div className="pd-info-col">
                <small>Category</small>
                <strong>{product.categoryName ?? 'N/A'}</strong>
              </div>
              <div className="pd-info-col">
                <small>Subcategory</small>
                <strong>{product.subCategoryName ?? 'N/A'}</strong>
              </div>
            </div>
          </div>

          {product.hasVariants && (
            <div className="pd-section">
              <h3>Available Variants</h3>
              <div className="pd-variants">
                <div className="pd-variant">
                  <strong>Medium</strong>
                  <small>+???25.00</small>
                  <small>39 in stock</small>
                </div>
              </div>
            </div>
          )}

          <div className="pd-section">
            <h3>Sold by</h3>
            <div className="pd-seller">
              <div className="pd-seller-icon">
                <span>???</span>
              </div>
              <div>
                <div className="pd-seller-name">{product.storeName ?? 'Store'}</div>
                <div className="pd-seller-meta">General</div>
              </div>
            </div>
          </div>

          <div className="pd-section">
            <h3>Reviews ({reviews})</h3>
          </div>
        </section>

        <div className="pd-footer">
          <button className="pd-btn secondary" type="button">Add to Cart</button>
          <button className="pd-btn primary" type="button">Buy Now</button>
        </div>
      </div>
    </>
  )
}
