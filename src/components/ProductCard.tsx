import { useNavigate } from 'react-router-dom'
import { HeartIcon, StarIcon, ZapIcon, StoreIcon, PlusIcon } from './icons'
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
  categoryId?: string
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

  const isFood = item.categoryId === 'food_drinks'
  const accent = isFood ? '#ff5500' : 'var(--blue)'

  const hasDiscount = !!item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price
  const displayPrice = hasDiscount ? (item.discountPrice as number) : item.price

  const discountPct = hasDiscount
    ? Math.round(((item.price - (item.discountPrice as number)) / item.price) * 100)
    : null

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      id: item.id,
      name: item.name,
      price: displayPrice,
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
          {isFood && <span className="bm-badge bm-badge-food">Food</span>}
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
        <div className="bm-product-name">{item.name}</div>
        {item.storeName && (
          <div className="bm-product-store">
            <StoreIcon size={11} /> Sold by {item.storeName}
          </div>
        )}
        {(item.rating !== undefined || item.totalReviews !== undefined) && (
          <div className="bm-product-meta-row">
            <StarIcon size={13} />
            <span className="bm-product-rating-val">{(item.rating ?? 0).toFixed(1)}</span>
            {item.totalSold ? (
              <span className="bm-product-sold">({item.totalSold})</span>
            ) : (
              <span className="bm-product-reviews">({item.totalReviews ?? 0})</span>
            )}
          </div>
        )}
        <div className="bm-product-prices">
          <div className="bm-product-price-col">
            <span className="bm-product-price" style={{ color: accent }}>{fmt(displayPrice)}</span>
            {hasDiscount && (
              <span className="bm-product-original">{fmt(item.price)}</span>
            )}
          </div>
          <button className="bm-add-cart-circle" type="button" style={{ background: accent }} onClick={handleAddToCart}>
            <PlusIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
