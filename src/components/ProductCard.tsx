import { useNavigate } from 'react-router-dom'
import { HeartIcon, StarIcon, ZapIcon } from './icons'
import { useCart } from '../contexts/CartContext'

type Product = {
  id: string
  name: string
  price: number
  discountPrice?: number
  rating?: number
  totalReviews?: number
  totalSold?: number
  stockQuantity?: number
  images?: string[]
  categoryName?: string
  storeName?: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

export function ProductCard({
  item,
  wishlisted = false,
  onWishlist,
  badge,
}: {
  item: Product
  wishlisted?: boolean
  onWishlist?: (id: string) => void
  badge?: 'flash' | 'new' | 'sale'
}) {
  const navigate = useNavigate()
  const { addItem } = useCart()

  const discountPct =
    item.price && item.discountPrice && item.price > item.discountPrice
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      id: item.id,
      name: item.name,
      price: item.discountPrice ?? item.price,
      image: item.images?.[0] ?? '',
      storeName: item.storeName ?? '',
    })
  }

  return (
    <div className="bm-product-card" onClick={() => navigate(`/product/${item.id}`)}>
      <div className="bm-product-img-wrap">
        <img src={item.images?.[0] ?? '/second.jpg'} alt={item.name} loading="lazy" />
        <div className="bm-badge-wrap">
          {badge === 'flash' && <span className="bm-badge bm-badge-flash"><ZapIcon /> Flash</span>}
          {badge === 'new' && <span className="bm-badge bm-badge-new">New</span>}
          {badge === 'sale' && discountPct && (
            <span className="bm-badge bm-badge-sale">-{discountPct}%</span>
          )}
          {item.stockQuantity !== undefined && item.stockQuantity <= 5 && item.stockQuantity > 0 && (
            <span className="bm-badge bm-badge-low">Low Stock</span>
          )}
        </div>
        {onWishlist && (
          <button
            className={`bm-product-wishlist ${wishlisted ? 'active' : ''}`}
            type="button"
            onClick={e => { e.stopPropagation(); onWishlist(item.id) }}
          >
            <HeartIcon filled={wishlisted} />
          </button>
        )}
      </div>
      <div className="bm-product-body">
        {item.storeName && <div className="bm-product-store">{item.storeName}</div>}
        <div className="bm-product-name">{item.name}</div>
        {(item.rating !== undefined || item.totalReviews !== undefined) && (
          <div className="bm-product-meta-row">
            <div className="bm-product-stars">
              {[1,2,3,4,5].map(s => <StarIcon key={s} size={10} />)}
            </div>
            <span className="bm-product-rating-val">{(item.rating ?? 0).toFixed(1)}</span>
            <span className="bm-product-reviews">({item.totalReviews ?? 0})</span>
            {item.totalSold ? (
              <>
                <div className="bm-product-sep" />
                <span className="bm-product-sold">{item.totalSold} sold</span>
              </>
            ) : null}
          </div>
        )}
        <div className="bm-product-prices">
          <span className="bm-product-price">{fmt(item.discountPrice ?? item.price)}</span>
          {item.discountPrice && item.price > item.discountPrice && (
            <span className="bm-product-original">{fmt(item.price)}</span>
          )}
          {discountPct && <span className="bm-product-discount-tag">-{discountPct}%</span>}
        </div>
        <div className="bm-product-actions">
          <button className="bm-add-cart" type="button" onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button
            className="bm-quick-view"
            type="button"
            onClick={e => { e.stopPropagation(); navigate(`/product/${item.id}`) }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}
