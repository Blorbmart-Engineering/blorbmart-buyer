import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, doc, getDocs, getDoc, orderBy,
  query, where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { useUserLocation } from '../../hooks/useUserLocation'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { SearchIcon, StarIcon, UtensilsIcon, TimerIcon, MapPinIcon, HeartIcon, BagIcon } from '../../components/icons'

// ─── Types ───────────────────────────────────────────────────────────────────

type Restaurant = {
  id: string
  vendorId: string
  name: string
  imageUrl?: string
  cuisineType: string
  rating: number
  deliveryTime: number
  deliveryFee: number
  isOpen: boolean
  address: string
  totalReviews: number
  businessType: string
}

type RecentOrder = {
  id: string
  restaurantName: string
  itemNames: string
  total: number
  vendorId?: string
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function parseRestaurant(d: Record<string, unknown>, id: string): Restaurant {
  const cuisines = d['cuisineTypes']
  let cuisine = (d['category'] as string) ?? 'Nigerian Cuisine'
  if (Array.isArray(cuisines) && cuisines.length > 0) cuisine = (cuisines as string[]).join(', ')
  else if (typeof cuisines === 'string' && cuisines.length > 0) cuisine = cuisines

  const imageUrl = (d['logo'] ?? d['logoUrl'] ?? d['logoImageUrl'] ?? d['imageUrl'] ?? d['coverImage']) as string | undefined

  let isOpen = true
  if (typeof d['isOpen'] === 'boolean') isOpen = d['isOpen']
  else if (typeof d['kitchenOpen'] === 'boolean') isOpen = d['kitchenOpen']
  else isOpen = d['vendorStatus'] === 'active' || d['status'] === 'active'

  return {
    id,
    vendorId: (d['vendorId'] as string) ?? id,
    name: (d['name'] as string) ?? (d['businessName'] as string) ?? 'Restaurant',
    imageUrl: imageUrl || undefined,
    cuisineType: cuisine,
    rating: Number(d['rating'] ?? 4.0),
    deliveryTime: Number(d['deliveryTime'] ?? 25),
    deliveryFee: Number(d['deliveryFee'] ?? 200),
    isOpen,
    address: (d['address'] as string) ?? (d['lga'] as string) ?? '',
    totalReviews: Number(d['totalReviews'] ?? 0),
    businessType: (d['businessType'] as string) ?? '',
  }
}

async function loadRestaurants(): Promise<Restaurant[]> {
  const restaurants: Restaurant[] = []
  const seen = new Set<string>()

  // Query vendors + stores with isRestaurant == true
  try {
    const snap = await getDocs(query(collection(db, 'vendors'), where('isRestaurant', '==', true)))
    snap.docs.forEach(d => {
      if (!seen.has(d.id)) { seen.add(d.id); restaurants.push(parseRestaurant(d.data() as Record<string, unknown>, d.id)) }
    })
  } catch {}
  try {
    const snap = await getDocs(query(collection(db, 'stores'), where('isRestaurant', '==', true)))
    snap.docs.forEach(d => {
      if (!seen.has(d.id)) { seen.add(d.id); restaurants.push(parseRestaurant(d.data() as Record<string, unknown>, d.id)) }
    })
  } catch {}

  // Fallback: all vendors/stores if none returned
  if (restaurants.length === 0) {
    try {
      const snap = await getDocs(collection(db, 'vendors'))
      snap.docs.forEach(d => {
        if (!seen.has(d.id)) { seen.add(d.id); restaurants.push(parseRestaurant(d.data() as Record<string, unknown>, d.id)) }
      })
    } catch {}
    try {
      const snap = await getDocs(collection(db, 'stores'))
      snap.docs.forEach(d => {
        if (!seen.has(d.id)) { seen.add(d.id); restaurants.push(parseRestaurant(d.data() as Record<string, unknown>, d.id)) }
      })
    } catch {}
  }

  // Open first, then by rating
  return restaurants.sort((a, b) => {
    if (a.isOpen && !b.isOpen) return -1
    if (!a.isOpen && b.isOpen) return 1
    return b.rating - a.rating
  })
}

// ─── Filter config (matching Flutter exactly) ─────────────────────────────────

const FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'rice',    label: 'Rice & Swallow' },
  { id: 'soup',    label: 'Soups' },
  { id: 'protein', label: 'Proteins' },
  { id: 'drinks',  label: 'Drinks' },
]

function matchesFilter(r: Restaurant, filterId: string): boolean {
  if (filterId === 'all') return true
  const c = r.cuisineType.toLowerCase()
  if (filterId === 'rice') return c.includes('rice') || c.includes('swallow') || c.includes('jollof')
  if (filterId === 'soup') return c.includes('soup') || c.includes('egusi') || c.includes('banga')
  if (filterId === 'protein') return c.includes('protein') || c.includes('chicken') || c.includes('fish') || c.includes('meat') || c.includes('grill')
  if (filterId === 'drinks') return c.includes('drink') || c.includes('beverage') || c.includes('juice') || c.includes('smoothie')
  return true
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  .fp-root { min-height:100vh; background:#f8fafc; font-family:'Plus Jakarta Sans',sans-serif; }

  /* Orange gradient header */
  .fp-header {
    background:linear-gradient(135deg,#FF5500 0%,#FF7A00 100%);
    padding: env(safe-area-inset-top,0) 0 0;
  }
  .fp-header-top {
    display:flex; align-items:center; padding:16px 16px 14px; gap:0;
  }
  .fp-back {
    width:36px; height:36px; border-radius:50%;
    background:rgba(255,255,255,.2); border:none;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; flex-shrink:0; color:#fff; margin-right:10px;
  }
  .fp-location {
    flex:1; cursor:pointer; min-width:0;
  }
  .fp-location-label {
    font-size:11px; color:rgba(255,255,255,.75); display:flex; align-items:center; gap:3px;
  }
  .fp-location-name {
    font-size:14px; font-weight:700; color:#fff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:52vw;
  }
  .fp-cart-btn {
    position:relative; width:40px; height:40px;
    background:rgba(255,255,255,.18); border:none; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#fff; flex-shrink:0;
  }
  .fp-cart-badge {
    position:absolute; top:2px; right:2px;
    width:17px; height:17px; border-radius:50%;
    background:#fff; color:#FF5500;
    font-size:9px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
  }

  /* Search bar (inside page, below header) */
  .fp-search-wrap {
    position:relative; margin:16px 16px 0;
  }
  .fp-search {
    width:100%; box-sizing:border-box;
    border:1.5px solid var(--border); border-radius:14px;
    padding:13px 16px 13px 44px;
    font-size:14px; outline:none;
    background:#fff; color:var(--text);
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 2px 8px rgba(0,0,0,.06);
  }
  .fp-search:focus { border-color:#FF5500; }
  .fp-search-icon {
    position:absolute; left:16px; top:50%; transform:translateY(-50%);
    color:#FF5500; pointer-events:none;
  }
  .fp-search-clear {
    position:absolute; right:12px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    color:var(--text-3); font-size:18px; line-height:1; padding:2px;
  }

  /* Filter chips */
  .fp-filters {
    display:flex; gap:8px; overflow-x:auto; padding:12px 16px 4px;
    scrollbar-width:none;
  }
  .fp-filters::-webkit-scrollbar { display:none; }
  .fp-chip {
    flex-shrink:0; display:flex; align-items:center; gap:5px;
    padding:6px 14px; border-radius:20px;
    border:1.5px solid var(--border); background:#fff;
    font-size:12px; font-weight:600; cursor:pointer;
    color:var(--text); white-space:nowrap;
    font-family:'Plus Jakarta Sans',sans-serif;
    transition:all .15s;
  }
  .fp-chip.active {
    background:#FF5500; border-color:#FF5500; color:#fff;
    box-shadow:0 4px 12px rgba(255,85,0,.35);
  }
  .fp-chip-icon { font-size:14px; }

  /* Page body */
  .fp-body { padding:0 0 100px; }

  /* Recent orders strip */
  .fp-recent-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 16px 8px;
  }
  .fp-recent-title {
    font-family:'Bricolage Grotesque',sans-serif;
    font-size:17px; font-weight:800; color:var(--text);
  }
  .fp-recent-see-all {
    font-size:12px; font-weight:600; color:#FF5500;
    background:none; border:none; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif;
  }
  .fp-recent-scroll {
    display:flex; gap:12px; overflow-x:auto; padding:0 16px 4px;
    scrollbar-width:none;
  }
  .fp-recent-scroll::-webkit-scrollbar { display:none; }
  .fp-recent-card {
    flex-shrink:0; width:215px;
    background:#fff; border-radius:16px; padding:13px;
    box-shadow:0 3px 12px rgba(0,0,0,.07);
    display:flex; flex-direction:column; gap:6px;
  }
  .fp-recent-store { display:flex; align-items:center; gap:7px; }
  .fp-recent-store-icon {
    width:28px; height:28px; border-radius:8px;
    background:rgba(255,85,0,.1);
    display:flex; align-items:center; justify-content:center;
    color:#FF5500; flex-shrink:0;
  }
  .fp-recent-name { font-size:12px; font-weight:700; color:var(--text); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
  .fp-recent-items { font-size:11px; color:var(--text-2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .fp-recent-amount { font-size:15px; font-weight:800; color:#5156f1; }
  .fp-recent-reorder {
    background:linear-gradient(135deg,#FF5500,#FF8C00);
    border:none; border-radius:10px; padding:7px;
    font-size:11px; font-weight:700; color:#fff;
    cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
    text-align:center; width:100%;
  }

  /* Section header */
  .fp-section-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 16px 6px;
  }
  .fp-section-title {
    font-family:'Bricolage Grotesque',sans-serif;
    font-size:17px; font-weight:800; color:var(--text);
  }
  .fp-section-count { font-size:12px; color:var(--text-2); }

  /* Restaurant card (full-width, Flutter style) */
  .fp-card {
    margin:0 16px 14px;
    background:#fff; border-radius:18px;
    box-shadow:0 5px 16px rgba(0,0,0,.08);
    overflow:hidden; cursor:pointer;
    transition:transform .15s, box-shadow .15s;
  }
  .fp-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.12); }
  .fp-card-img-wrap { position:relative; height:148px; background:#f1f5f9; overflow:hidden; }
  .fp-card-img { width:100%; height:100%; object-fit:cover; display:block; }
  .fp-card-img-placeholder {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#fff3e0,#ffe0cc); color:#FF5500;
  }
  .fp-card-img-overlay {
    position:absolute; inset:0;
    background:linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.28));
  }
  .fp-card-heart {
    position:absolute; top:10px; left:10px;
    width:34px; height:34px; border-radius:50%;
    background:rgba(255,255,255,.92);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,.15);
  }
  .fp-card-status-badge {
    position:absolute; top:10px; right:10px;
    padding:4px 10px; border-radius:12px;
    font-size:11px; font-weight:700; color:#fff;
  }
  .fp-card-status-badge.open { background:#00B894; }
  .fp-card-status-badge.closed { background:rgba(0,0,0,.45); }
  .fp-card-body { padding:14px; }
  .fp-card-name {
    font-family:'Bricolage Grotesque',sans-serif;
    font-size:16px; font-weight:800; color:var(--text); margin-bottom:4px;
  }
  .fp-card-cuisine { font-size:12px; color:var(--text-2); margin-bottom:10px; }
  .fp-card-meta { display:flex; gap:14px; flex-wrap:wrap; }
  .fp-card-meta-item {
    display:flex; align-items:center; gap:4px;
    font-size:12px; color:var(--text-2); font-weight:600;
  }
  .fp-card-meta-item svg { flex-shrink:0; }

  /* Empty state */
  .fp-empty {
    text-align:center; padding:60px 20px;
    margin:0 16px;
  }
  .fp-empty-icon { color:var(--text-3); margin-bottom:14px; display:flex; justify-content:center; }
  .fp-empty-title { font-size:17px; font-weight:800; color:var(--text); margin-bottom:8px; }
  .fp-empty-sub { font-size:13px; color:var(--text-2); }

  /* Skeleton */
  .fp-skeleton { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
  @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
`

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ margin: '0 16px 14px', background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 5px 16px rgba(0,0,0,.08)' }}>
      <div className="fp-skeleton" style={{ height: 148 }} />
      <div style={{ padding: 14 }}>
        <div className="fp-skeleton" style={{ height: 16, width: '55%', marginBottom: 8 }} />
        <div className="fp-skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="fp-skeleton" style={{ height: 12, width: 48 }} />
          <div className="fp-skeleton" style={{ height: 12, width: 48 }} />
          <div className="fp-skeleton" style={{ height: 12, width: 60 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FoodPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const location = useUserLocation()

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [favourites, setFavourites] = useState<Set<string>>(new Set())
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])

  useEffect(() => {
    loadRestaurants().then(list => { setRestaurants(list); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!user) return
    const loadRecent = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
        )
        const orders: RecentOrder[] = []
        snap.docs.slice(0, 5).forEach(d => {
          const o = d.data() as Record<string, unknown>
          const storeOrders = (o['storeOrders'] as Record<string, unknown>[] | undefined) ?? []
          const firstStore = storeOrders[0] as Record<string, unknown> | undefined
          const restaurantName = String(
            firstStore?.['storeName'] ?? firstStore?.['restaurantName'] ?? o['restaurantName'] ?? 'Restaurant'
          )
          const items = (firstStore?.['items'] as Record<string, unknown>[] | undefined) ?? []
          const itemNames = items.slice(0, 2).map(it => String(it['name'] ?? '')).filter(Boolean).join(', ')
          orders.push({
            id: d.id,
            restaurantName,
            itemNames,
            total: Number(o['totalAmount'] ?? 0),
            vendorId: String(firstStore?.['storeId'] ?? firstStore?.['vendorId'] ?? ''),
          })
        })
        setRecentOrders(orders)
      } catch {}
    }
    loadRecent()
  }, [user])

  const toggleFavourite = useCallback((id: string) => {
    setFavourites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const displayed = useMemo(() => {
    let list = restaurants.filter(r => matchesFilter(r, activeFilter))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisineType.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q)
      )
    }
    return list
  }, [restaurants, activeFilter, search])

  const filterIcon = (id: string) => {
    if (id === 'all') return '🍽️'
    if (id === 'rice') return '🍚'
    if (id === 'soup') return '🥣'
    if (id === 'protein') return '🍗'
    if (id === 'drinks') return '🥤'
    return '🍽️'
  }

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="fp-root">

        {/* Orange gradient header */}
        <header className="fp-header">
          <div className="fp-header-top">
            <button className="fp-back" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Delivery location */}
            <div className="fp-location" onClick={location.detect} style={{ cursor: 'pointer' }}>
              <div className="fp-location-label">
                <MapPinIcon size={12} />
                Deliver to
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div className="fp-location-name">
                {location.loading
                  ? 'Getting location…'
                  : location.denied
                    ? 'Enable location'
                    : location.label || 'Your location'
                }
              </div>
            </div>

            {/* Cart button */}
            <button className="fp-cart-btn" type="button" onClick={() => navigate('/cart')}>
              <BagIcon size={20} />
            </button>
          </div>
        </header>

        <div className="fp-body">

          {/* Search bar */}
          <div className="fp-search-wrap">
            <span className="fp-search-icon"><SearchIcon size={18} /></span>
            <input
              className="fp-search"
              placeholder="Search restaurants or dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="fp-search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>

          {/* Recent orders */}
          {recentOrders.length > 0 && (
            <div>
              <div className="fp-recent-header">
                <div className="fp-recent-title">Order Again</div>
                <button className="fp-recent-see-all" onClick={() => navigate('/track')}>See all</button>
              </div>
              <div className="fp-recent-scroll">
                {recentOrders.map(o => (
                  <div key={o.id} className="fp-recent-card">
                    <div className="fp-recent-store">
                      <div className="fp-recent-store-icon"><UtensilsIcon size={14} /></div>
                      <div className="fp-recent-name">{o.restaurantName}</div>
                    </div>
                    {o.itemNames && <div className="fp-recent-items">{o.itemNames}</div>}
                    <div className="fp-recent-amount">{fmt(o.total)}</div>
                    <button
                      className="fp-recent-reorder"
                      onClick={() => {
                        if (o.vendorId) navigate(`/store/${o.vendorId}`)
                        else navigate('/track')
                      }}
                    >
                      Order Again
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter chips */}
          <div className="fp-filters">
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`fp-chip${activeFilter === f.id ? ' active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                <span className="fp-chip-icon">{filterIcon(f.id)}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Section header */}
          <div className="fp-section-header">
            <div className="fp-section-title">
              {activeFilter === 'all' ? 'Restaurants Near You' : FILTERS.find(f => f.id === activeFilter)?.label}
            </div>
            {!loading && <div className="fp-section-count">{displayed.length} found</div>}
          </div>

          {/* Restaurant list */}
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : displayed.length === 0 ? (
            <div className="fp-empty">
              <div className="fp-empty-icon"><UtensilsIcon size={48} /></div>
              <div className="fp-empty-title">
                {search ? 'No results found' : 'No restaurants yet'}
              </div>
              <div className="fp-empty-sub">
                {search
                  ? 'Try a different search or filter'
                  : 'Check back soon — vendors are joining Blorbmart!'}
              </div>
            </div>
          ) : (
            displayed.map(r => (
              <div key={r.id} className="fp-card" onClick={() => navigate(`/store/${r.id}`)}>
                {/* Cover image */}
                <div className="fp-card-img-wrap">
                  {r.imageUrl
                    ? <img className="fp-card-img" src={r.imageUrl} alt={r.name} />
                    : (
                      <div className="fp-card-img-placeholder">
                        <UtensilsIcon size={40} />
                      </div>
                    )
                  }
                  <div className="fp-card-img-overlay" />

                  {/* Heart button */}
                  <button
                    className="fp-card-heart"
                    type="button"
                    onClick={e => { e.stopPropagation(); toggleFavourite(r.id) }}
                  >
                    <HeartIcon filled={favourites.has(r.id)} />
                  </button>

                  {/* Open / Closed badge */}
                  <div className={`fp-card-status-badge ${r.isOpen ? 'open' : 'closed'}`}>
                    {r.isOpen ? 'Open' : 'Closed'}
                  </div>
                </div>

                {/* Card body */}
                <div className="fp-card-body">
                  <div className="fp-card-name">{r.name}</div>
                  <div className="fp-card-cuisine">{r.cuisineType}</div>
                  <div className="fp-card-meta">
                    <div className="fp-card-meta-item">
                      <StarIcon size={13} />
                      <span>{r.rating.toFixed(1)}</span>
                      {r.totalReviews > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({r.totalReviews})</span>}
                    </div>
                    <div className="fp-card-meta-item">
                      <TimerIcon size={13} />
                      <span>{r.deliveryTime} mins</span>
                    </div>
                    <div className="fp-card-meta-item">
                      <span>Del: {fmt(r.deliveryFee)}</span>
                    </div>
                    {r.address && (
                      <div className="fp-card-meta-item">
                        <MapPinIcon size={13} />
                        <span style={{ maxWidth: 120, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {r.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </>
  )
}
