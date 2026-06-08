import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, doc, deleteDoc, getDocs, getDoc,
  orderBy, query, serverTimestamp, setDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { useCart } from '../../contexts/CartContext'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { PackageIcon, HeartIcon, TrashIcon, CartIcon, ListIcon } from '../../components/icons'

// ─── Types ──────────────────────────────────────────────────────────────────────
type WishItem = {
  productId: string
  name: string
  price: number
  discountPrice: number
  images: string[]
  storeName: string
  storeId: string
  vendorId?: string
  rating: number
  totalSold: number
  stockQuantity: number
  categoryName: string
  isOnSale: boolean
  discountPct: number
  addedAt: number
}

type SortKey = 'recent' | 'price-low' | 'price-high' | 'name'

const SORT_LABELS: Record<SortKey, string> = {
  'recent':     'Most Recent',
  'price-low':  'Price: Low to High',
  'price-high': 'Price: High to Low',
  'name':       'Name: A to Z',
}

const CATEGORIES = [
  { key: 'all', label: 'All Items' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'home', label: 'Home & Living' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'food', label: 'Food & Drinks' },
  { key: 'health', label: 'Health' },
  { key: 'other', label: 'Others' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const resolveImage = (images?: unknown): string => {
  if (!images) return ''
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0]
    if (typeof first === 'string') return first
    if (typeof first === 'object' && first !== null && 'url' in first) return String((first as Record<string, unknown>).url ?? '')
  }
  return ''
}

const effectivePrice = (item: WishItem) =>
  item.discountPrice > 0 && item.discountPrice < item.price ? item.discountPrice : item.price

// ─── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  .wi-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }
  .wi-header { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.95); backdrop-filter:blur(8px); border-bottom:1.5px solid var(--border); padding:14px 16px; display:flex; align-items:center; gap:10px; }
  .wi-back { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .wi-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; flex:1; }
  .wi-hbtn { width:36px; height:36px; border-radius:10px; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; }
  .wi-hbtn.active { border-color:var(--blue); background:var(--blue-light); }

  /* select mode header */
  .wi-sel-header { position:sticky; top:0; z-index:30; background:var(--blue); padding:14px 16px; display:flex; align-items:center; gap:12px; }
  .wi-sel-title { color:#fff; font-size:16px; font-weight:700; flex:1; }
  .wi-sel-btn { width:36px; height:36px; border-radius:10px; border:none; background:rgba(255,255,255,.2); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; }

  .wi-body { max-width:1000px; margin:0 auto; padding:20px 16px 80px; }

  /* Stats bar */
  .wi-stats { font-size:13px; color:var(--text-2); margin-bottom:16px; }

  /* Category chips */
  .wi-cats { display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; margin-bottom:16px; }
  .wi-cat { border:1.5px solid var(--border); background:#fff; border-radius:999px; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; color:var(--text-2); font-family:'Plus Jakarta Sans',sans-serif; }
  .wi-cat.active { background:var(--blue); border-color:var(--blue); color:#fff; }

  /* Grid layout */
  .wi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
  @media(max-width:480px) { .wi-grid { grid-template-columns:1fr 1fr; gap:12px; } }

  /* List layout */
  .wi-list { display:flex; flex-direction:column; gap:12px; }

  /* Product card – grid */
  .wi-card { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; cursor:pointer; transition:box-shadow .15s; position:relative; }
  .wi-card:hover { box-shadow:var(--shadow-md); }
  .wi-card.selected { border-color:var(--blue); box-shadow:0 0 0 3px rgba(37,99,235,.15); }
  .wi-card-img { width:100%; aspect-ratio:1; object-fit:cover; background:var(--bg); display:block; }
  .wi-card-img-ph { width:100%; aspect-ratio:1; background:var(--bg); display:flex; align-items:center; justify-content:center; font-size:40px; }
  .wi-card-body { padding:12px; }
  .wi-card-store { font-size:11px; color:var(--text-2); margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .wi-card-name { font-size:13px; font-weight:700; color:var(--text); line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:6px; }
  .wi-card-price { font-size:15px; font-weight:800; color:var(--blue); }
  .wi-card-original { font-size:11px; color:var(--text-3); text-decoration:line-through; margin-left:4px; }
  .wi-card-stars { font-size:10px; color:#fbbf24; margin-top:4px; }
  .wi-card-actions { display:flex; gap:6px; margin-top:10px; }
  .wi-add-cart { flex:1; height:34px; background:var(--blue); color:#fff; border:none; border-radius:var(--radius); font-size:12px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
  .wi-add-cart:disabled { opacity:.5; cursor:not-allowed; }

  /* Remove heart button */
  .wi-remove { position:absolute; top:8px; right:8px; width:30px; height:30px; border-radius:50%; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,.15); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; }
  .wi-remove:hover { background:#fee2e2; }

  /* Sale badge */
  .wi-sale-badge { position:absolute; top:8px; left:8px; background:#ff5500; color:#fff; font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }

  /* Out of stock overlay */
  .wi-oos { position:absolute; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; border-radius:var(--radius-lg); }
  .wi-oos-badge { background:#ef4444; color:#fff; font-size:12px; font-weight:700; padding:6px 14px; border-radius:999px; }

  /* Checkbox for select mode */
  .wi-checkbox { position:absolute; top:8px; left:8px; width:22px; height:22px; border-radius:50%; border:2px solid #fff; background:rgba(255,255,255,.7); display:flex; align-items:center; justify-content:center; font-size:11px; box-shadow:0 1px 4px rgba(0,0,0,.2); }
  .wi-checkbox.checked { background:var(--blue); border-color:var(--blue); color:#fff; }

  /* List card */
  .wi-list-card { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); overflow:hidden; display:flex; cursor:pointer; transition:box-shadow .15s; position:relative; }
  .wi-list-card:hover { box-shadow:var(--shadow-md); }
  .wi-list-card.selected { border-color:var(--blue); }
  .wi-list-img { width:100px; height:100px; object-fit:cover; flex-shrink:0; background:var(--bg); }
  .wi-list-img-ph { width:100px; height:100px; flex-shrink:0; background:var(--bg); display:flex; align-items:center; justify-content:center; font-size:32px; }
  .wi-list-body { flex:1; padding:12px 14px; min-width:0; display:flex; flex-direction:column; justify-content:space-between; }
  .wi-list-actions { display:flex; gap:8px; align-items:center; margin-top:8px; }
  .wi-list-remove { width:32px; height:32px; border-radius:50%; border:1.5px solid var(--border); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
  .wi-list-remove:hover { background:#fee2e2; border-color:#fca5a5; }

  /* Empty state */
  .wi-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:56px 20px; }
  .wi-empty-blob { width:130px; height:130px; border-radius:50%; background:var(--blue-light); display:flex; align-items:center; justify-content:center; font-size:56px; margin-bottom:20px; }
  .wi-empty-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; margin-bottom:8px; }
  .wi-empty-sub { font-size:14px; color:var(--text-2); max-width:260px; line-height:1.6; margin-bottom:24px; }
  .wi-empty-cta { background:var(--blue); color:#fff; border:none; border-radius:var(--radius-lg); padding:14px 28px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

  /* Sort filter modal */
  .wi-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  @media(min-width:600px){ .wi-modal-bg { align-items:center; } }
  .wi-modal { background:#fff; border-radius:24px 24px 0 0; width:100%; max-width:520px; padding:0 24px 28px; max-height:85vh; overflow-y:auto; animation:fadeUp .25s ease; }
  @media(min-width:600px){ .wi-modal { border-radius:24px; } }
  .wi-modal-handle { width:40px; height:4px; background:var(--border); border-radius:2px; margin:12px auto 20px; }
  .wi-modal-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; margin-bottom:16px; }
  .wi-modal-section { font-size:14px; font-weight:700; color:var(--text); margin-bottom:10px; margin-top:20px; }
  .wi-sort-option { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); cursor:pointer; }
  .wi-sort-option:last-child { border-bottom:none; }
  .wi-sort-radio { width:18px; height:18px; border-radius:50%; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .wi-sort-radio.selected { border-color:var(--blue); background:var(--blue); }
  .wi-sort-radio.selected::after { content:''; width:6px; height:6px; border-radius:50%; background:#fff; }
  .wi-sort-label { font-size:14px; color:var(--text); }
  .wi-cat-chip { border:1.5px solid var(--border); background:#fff; border-radius:999px; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer; color:var(--text-2); font-family:'Plus Jakarta Sans',sans-serif; }
  .wi-cat-chip.active { background:var(--blue); border-color:var(--blue); color:#fff; }
  .wi-modal-btns { display:flex; gap:10px; margin-top:24px; }
  .wi-reset-btn { flex:1; height:48px; border:1.5px solid var(--border); background:#fff; border-radius:var(--radius); font-size:14px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; color:var(--text-2); }
  .wi-apply-btn { flex:1; height:48px; background:var(--blue); color:#fff; border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

  /* Toast */
  .wi-toast { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; padding:10px 20px; border-radius:999px; font-size:13px; font-weight:600; z-index:500; white-space:nowrap; animation:fadeUp .2s ease; }
`

// ─── Toast ───────────────────────────────────────────────────────────────────────
function Toast({ msg }: { msg: string }) {
  return <div className="wi-toast">{msg}</div>
}

// ─── Sort/Filter Modal ──────────────────────────────────────────────────────────
function SortFilterModal({
  sort, category,
  onApply, onClose,
}: {
  sort: SortKey; category: string
  onApply: (sort: SortKey, category: string) => void
  onClose: () => void
}) {
  const [tmpSort, setTmpSort] = useState<SortKey>(sort)
  const [tmpCat, setTmpCat] = useState(category)

  return (
    <div className="wi-modal-bg" onClick={onClose}>
      <div className="wi-modal" onClick={e => e.stopPropagation()}>
        <div className="wi-modal-handle" />
        <div className="wi-modal-title">Sort & Filter</div>

        <div className="wi-modal-section">Sort By</div>
        {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
          <div key={k} className="wi-sort-option" onClick={() => setTmpSort(k)}>
            <div className={`wi-sort-radio${tmpSort === k ? ' selected' : ''}`} />
            <span className="wi-sort-label">{SORT_LABELS[k]}</span>
          </div>
        ))}

        <div className="wi-modal-section">Category</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c.key} className={`wi-cat-chip${tmpCat === c.key ? ' active' : ''}`} onClick={() => setTmpCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="wi-modal-btns">
          <button className="wi-reset-btn" onClick={() => { setTmpSort('recent'); setTmpCat('all') }}>Reset</button>
          <button className="wi-apply-btn" onClick={() => { onApply(tmpSort, tmpCat); onClose() }}>Apply</button>
        </div>
      </div>
    </div>
  )
}

// ─── Star row ──────────────────────────────────────────────────────────────────
function Stars({ rating, sold }: { rating: number; sold: number }) {
  return (
    <div className="wi-card-stars">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      {' '}<span style={{ color: 'var(--text-2)' }}>({sold} sold)</span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function WishlistPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()

  const [items, setItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isGrid, setIsGrid] = useState(true)
  const [sort, setSort] = useState<SortKey>('recent')
  const [category, setCategory] = useState('all')
  const [showFilter, setShowFilter] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Load wishlist from Firestore ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const snap = await getDocs(
          query(collection(db, 'users', user.uid, 'wishlist'), orderBy('addedAt', 'desc'))
        )
        const productFetches = snap.docs.map(async d => {
          const productId = d.id
          const wishData = d.data()
          try {
            const pSnap = await getDoc(doc(db, 'products', productId))
            if (!pSnap.exists()) {
              // stale — remove silently
              await deleteDoc(doc(db, 'users', user.uid, 'wishlist', productId))
              return null
            }
            const p = pSnap.data() as Record<string, unknown>
            const price = Number(p.price ?? 0)
            const discountPrice = Number(p.discountPrice ?? 0)
            const isOnSale = discountPrice > 0 && discountPrice < price
            const discountPct = isOnSale ? Math.round(((price - discountPrice) / price) * 100) : 0
            const addedAt = wishData.addedAt?.seconds
              ? wishData.addedAt.seconds * 1000
              : Date.now()
            return {
              productId,
              name: String(p.name ?? 'Product'),
              price,
              discountPrice,
              images: Array.isArray(p.images) ? p.images : [],
              storeName: String(p.storeName ?? ''),
              storeId: String(p.storeId ?? ''),
              vendorId: p.vendorId ? String(p.vendorId) : undefined,
              rating: Number(p.rating ?? 0),
              totalSold: Number(p.totalSold ?? 0),
              stockQuantity: Number(p.stockQuantity ?? 1),
              categoryName: String(p.categoryName ?? p.category ?? 'other').toLowerCase(),
              isOnSale,
              discountPct,
              addedAt,
            } as WishItem
          } catch { return null }
        })
        const results = (await Promise.all(productFetches)).filter(Boolean) as WishItem[]
        setItems(results)
      } catch { setItems([]) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  // ── Sort + filter ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = category === 'all' ? items : items.filter(i => i.categoryName.includes(category))
    switch (sort) {
      case 'price-low':  list = [...list].sort((a, b) => effectivePrice(a) - effectivePrice(b)); break
      case 'price-high': list = [...list].sort((a, b) => effectivePrice(b) - effectivePrice(a)); break
      case 'name':       list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break
      default:           list = [...list].sort((a, b) => b.addedAt - a.addedAt)
    }
    return list
  }, [items, sort, category])

  // ── Remove ────────────────────────────────────────────────────────────────────
  const removeItem = async (productId: string) => {
    if (!user) return
    setItems(prev => prev.filter(i => i.productId !== productId))
    await deleteDoc(doc(db, 'users', user.uid, 'wishlist', productId)).catch(() => {})
    showToast('Removed from wishlist')
  }

  const removeSelected = async () => {
    if (!user || selected.size === 0) return
    const ids = [...selected]
    setItems(prev => prev.filter(i => !ids.includes(i.productId)))
    await Promise.all(ids.map(id => deleteDoc(doc(db, 'users', user.uid, 'wishlist', id)).catch(() => {})))
    setSelected(new Set())
    setSelectMode(false)
    showToast(`Removed ${ids.length} item${ids.length > 1 ? 's' : ''}`)
  }

  // ── Add to cart ───────────────────────────────────────────────────────────────
  const addToCart = async (item: WishItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (item.stockQuantity <= 0) { showToast('Out of stock'); return }
    addItem({
      id: item.productId,
      name: item.name,
      price: effectivePrice(item),
      image: resolveImage(item.images),
      storeName: item.storeName,
    })
    await removeItem(item.productId)
    showToast(`${item.name.slice(0, 20)} added to cart`)
  }

  const addSelectedToCart = async () => {
    const selectedItems = items.filter(i => selected.has(i.productId))
    const outOfStock = selectedItems.filter(i => i.stockQuantity <= 0)
    if (outOfStock.length > 0) { showToast(`${outOfStock.length} item(s) out of stock`); return }
    for (const item of selectedItems) {
      addItem({ id: item.productId, name: item.name, price: effectivePrice(item), image: resolveImage(item.images), storeName: item.storeName })
    }
    const ids = [...selected]
    setItems(prev => prev.filter(i => !ids.includes(i.productId)))
    if (user) await Promise.all(ids.map(id => deleteDoc(doc(db, 'users', user.uid, 'wishlist', id)).catch(() => {})))
    setSelected(new Set())
    setSelectMode(false)
    showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} added to cart`)
  }

  // ── Selection ─────────────────────────────────────────────────────────────────
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      if (n.size === 0) setSelectMode(false)
      return n
    })
  }

  const handleCardClick = (item: WishItem) => {
    if (selectMode) {
      setSelected(prev => {
        const n = new Set(prev)
        n.has(item.productId) ? n.delete(item.productId) : n.add(item.productId)
        if (n.size === 0) setSelectMode(false)
        return n
      })
    } else {
      navigate(`/product/${item.productId}`)
    }
  }

  const handleLongPress = (id: string) => {
    setSelectMode(true)
    setSelected(prev => new Set([...prev, id]))
  }

  // Long-press via pointer events
  const useLongPress = (id: string) => {
    let timer: ReturnType<typeof setTimeout>
    return {
      onPointerDown: () => { timer = setTimeout(() => handleLongPress(id), 500) },
      onPointerUp:   () => clearTimeout(timer),
      onPointerLeave: () => clearTimeout(timer),
    }
  }

  // ── Render card (grid) ────────────────────────────────────────────────────────
  const renderGridCard = (item: WishItem) => {
    const img = resolveImage(item.images)
    const isSelected = selected.has(item.productId)
    return (
      <div
        key={item.productId}
        className={`wi-card${isSelected ? ' selected' : ''}`}
        onClick={() => handleCardClick(item)}
        {...useLongPress(item.productId)}
      >
        {img
          ? <img className="wi-card-img" src={img} alt={item.name} loading="lazy" />
          : <div className="wi-card-img-ph"><PackageIcon /></div>
        }
        {item.isOnSale && item.discountPct > 0 && (
          <div className="wi-sale-badge">-{item.discountPct}%</div>
        )}
        {/* Remove heart */}
        {!selectMode && (
          <button className="wi-remove" onClick={e => { e.stopPropagation(); removeItem(item.productId) }}><HeartIcon filled /></button>
        )}
        {/* Checkbox */}
        {selectMode && (
          <div className={`wi-checkbox${isSelected ? ' checked' : ''}`} onClick={e => toggleSelect(item.productId, e)}>
            {isSelected && '✓'}
          </div>
        )}
        {/* OOS overlay */}
        {item.stockQuantity <= 0 && (
          <div className="wi-oos"><div className="wi-oos-badge">Out of Stock</div></div>
        )}
        <div className="wi-card-body">
          <div className="wi-card-store">{item.storeName}</div>
          <div className="wi-card-name">{item.name}</div>
          <div>
            <span className="wi-card-price">{fmt(effectivePrice(item))}</span>
            {item.isOnSale && <span className="wi-card-original">{fmt(item.price)}</span>}
          </div>
          <Stars rating={item.rating} sold={item.totalSold} />
          {!selectMode && (
            <div className="wi-card-actions">
              <button
                className="wi-add-cart"
                onClick={e => addToCart(item, e)}
                disabled={item.stockQuantity <= 0}
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render card (list) ────────────────────────────────────────────────────────
  const renderListCard = (item: WishItem) => {
    const img = resolveImage(item.images)
    const isSelected = selected.has(item.productId)
    return (
      <div
        key={item.productId}
        className={`wi-list-card${isSelected ? ' selected' : ''}`}
        onClick={() => handleCardClick(item)}
        {...useLongPress(item.productId)}
      >
        {img
          ? <img className="wi-list-img" src={img} alt={item.name} loading="lazy" />
          : <div className="wi-list-img-ph"><PackageIcon /></div>
        }
        {item.isOnSale && item.discountPct > 0 && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: '#ff5500', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>-{item.discountPct}%</div>
        )}
        <div className="wi-list-body">
          <div>
            <div className="wi-card-store">{item.storeName}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 4 }}>{item.name}</div>
            <Stars rating={item.rating} sold={item.totalSold} />
          </div>
          <div className="wi-list-actions">
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue)' }}>{fmt(effectivePrice(item))}</span>
              {item.isOnSale && <span style={{ fontSize: 11, color: 'var(--text-3)', textDecoration: 'line-through', marginLeft: 6 }}>{fmt(item.price)}</span>}
            </div>
            {!selectMode && (
              <>
                <button className="wi-list-remove" onClick={e => { e.stopPropagation(); removeItem(item.productId) }}><HeartIcon filled /></button>
                <button
                  className="wi-add-cart"
                  style={{ width: 'auto', padding: '0 14px', height: 34 }}
                  onClick={e => addToCart(item, e)}
                  disabled={item.stockQuantity <= 0}
                >
                  + Cart
                </button>
              </>
            )}
            {selectMode && (
              <div className={`wi-checkbox${isSelected ? ' checked' : ''}`} style={{ position: 'static' }} onClick={e => toggleSelect(item.productId, e)}>
                {isSelected && '✓'}
              </div>
            )}
          </div>
        </div>
        {item.stockQuantity <= 0 && (
          <div className="wi-oos" style={{ borderRadius: 'var(--radius-lg)' }}><div className="wi-oos-badge">Out of Stock</div></div>
        )}
      </div>
    )
  }

  const activeFilterCount = (sort !== 'recent' ? 1 : 0) + (category !== 'all' ? 1 : 0)

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="wi-root">
        {/* Header */}
        {selectMode ? (
          <header className="wi-sel-header">
            <button className="wi-sel-btn" onClick={() => { setSelectMode(false); setSelected(new Set()) }}>✕</button>
            <span className="wi-sel-title">{selected.size} selected</span>
            {selected.size > 0 && (
              <>
                <button className="wi-sel-btn" onClick={removeSelected} title="Remove selected"><TrashIcon size={16} /></button>
                <button className="wi-sel-btn" onClick={addSelectedToCart} title="Add to cart"><CartIcon /></button>
              </>
            )}
          </header>
        ) : (
          <header className="wi-header">
            <button className="wi-back" type="button" onClick={() => navigate('/dashboard')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="wi-title">My Wishlist</span>
            <button className={`wi-hbtn${isGrid ? ' active' : ''}`} onClick={() => setIsGrid(true)} title="Grid view">⊞</button>
            <button className={`wi-hbtn${!isGrid ? ' active' : ''}`} onClick={() => setIsGrid(false)} title="List view"><ListIcon /></button>
            <button className={`wi-hbtn${activeFilterCount > 0 ? ' active' : ''}`} onClick={() => setShowFilter(true)} title="Sort & Filter">
              {activeFilterCount > 0 ? `⊿${activeFilterCount}` : '⊿'}
            </button>
          </header>
        )}

        <div className="wi-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bm-skeleton" style={{ height: 100, borderRadius: 14 }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="wi-empty">
              <div className="wi-empty-blob"><HeartIcon filled={false} /></div>
              <div className="wi-empty-title">Your Wishlist is Empty</div>
              <p className="wi-empty-sub">Save products you love to your wishlist. Review them anytime and easily move them to cart.</p>
              <button className="wi-empty-cta" onClick={() => navigate('/shop')}>Start Shopping</button>
            </div>
          ) : (
            <>
              {/* Stats + category chips */}
              <div className="wi-stats">{filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}</div>
              <div className="wi-cats">
                {CATEGORIES.map(c => (
                  <button key={c.key} className={`wi-cat${category === c.key ? ' active' : ''}`} onClick={() => setCategory(c.key)}>
                    {c.label}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-2)' }}>
                  No items in this category.
                  <button onClick={() => setCategory('all')} style={{ display: 'block', margin: '12px auto 0', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '8px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    Show all
                  </button>
                </div>
              ) : isGrid ? (
                <div className="wi-grid">{filtered.map(renderGridCard)}</div>
              ) : (
                <div className="wi-list">{filtered.map(renderListCard)}</div>
              )}
            </>
          )}
        </div>
      </div>

      {showFilter && (
        <SortFilterModal
          sort={sort}
          category={category}
          onApply={(s, c) => { setSort(s); setCategory(c) }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {toast && <Toast msg={toast} />}
    </>
  )
}

// ─── Exported helper: add to wishlist (used by ProductCard, ProductDetailsPage) ─
export async function addToWishlist(userId: string, productId: string) {
  await setDoc(doc(db, 'users', userId, 'wishlist', productId), {
    addedAt: serverTimestamp(),
  })
}

export async function removeFromWishlist(userId: string, productId: string) {
  await deleteDoc(doc(db, 'users', userId, 'wishlist', productId))
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', userId, 'wishlist', productId))
  return snap.exists()
}
