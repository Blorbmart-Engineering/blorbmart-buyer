import { useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useProducts } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { ProductCard } from '../../components/ProductCard'
import {
  SearchIcon, FilterIcon, GridIcon, ListIcon, ChevronRightIcon, CloseIcon,
  HomeIcon, HeartIcon, ReceiptIcon, UserIcon,
} from '../../components/icons'

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'newest'

const CATEGORY_MAP: Record<string, string> = {
  '1': 'electronics', '2': 'food', '3': 'accessories', '4': 'beauty',
  '5': 'fashion', '6': 'books', '7': 'stationery', '8': 'health',
}
const CATEGORY_LABELS: Record<string, string> = {
  '1': 'Electronics', '2': 'Food & Drinks', '3': 'Accessories', '4': 'Beauty',
  '5': 'Fashion', '6': 'Books', '7': 'Stationery', '8': 'Health',
}
const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }))

const pageTitle = (pathname: string, categoryId?: string, search?: string) => {
  if (search) return `Results for "${search}"`
  if (pathname === '/deals') return "Today's Deals"
  if (pathname === '/categories') return 'All Categories'
  if (pathname === '/shop') return 'All Products'
  if (categoryId) return CATEGORY_LABELS[categoryId] ?? 'Products'
  return 'Products'
}

// ─── Extra CSS ────────────────────────────────────────────────────────────────
const extraCss = `
  .cat-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }

  .cat-header {
    position: sticky; top: 0; z-index: 30;
    background: rgba(255,255,255,.95); backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
  }
  .cat-header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
  .cat-back-btn {
    width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff;
    display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
    transition: border-color .15s;
  }
  .cat-back-btn:hover { border-color: var(--blue); color: var(--blue); }
  .cat-logo { display: flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0; text-decoration: none; }
  .cat-logo-mark { width: 28px; height: 28px; border-radius: 7px; background: var(--blue); overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .cat-logo-mark img { width: 100%; height: 100%; object-fit: cover; }
  .cat-logo-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 800; letter-spacing: -.02em; }
  .cat-logo-name span { color: var(--blue); }
  .cat-search-bar { flex: 1; display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1.5px solid var(--border); border-radius: 999px; padding: 8px 14px; transition: border-color .2s; }
  .cat-search-bar:focus-within { border-color: var(--blue); background: #fff; }
  .cat-search-bar input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }

  .cat-body { max-width: 1280px; margin: 0 auto; padding: 20px 16px 100px; display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
  @media (max-width: 820px) { .cat-body { grid-template-columns: 1fr; } .cat-sidebar { display: none; } }

  /* Sidebar */
  .cat-sidebar { position: sticky; top: 72px; align-self: start; }
  .cat-filter-card { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 18px; margin-bottom: 16px; }
  .cat-filter-title { font-weight: 800; font-size: 14px; color: var(--text); margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .cat-filter-clear { font-size: 12px; font-weight: 600; color: var(--blue); background: none; border: none; cursor: pointer; padding: 0; }
  .cat-check-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; cursor: pointer; font-size: 13px; color: var(--text-2); font-weight: 500; }
  .cat-check-row:hover { color: var(--text); }
  .cat-checkbox { width: 16px; height: 16px; border: 2px solid #d1d5db; border-radius: 5px; background: #fff; display: flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
  .cat-checkbox.checked { background: var(--blue); border-color: var(--blue); }
  .cat-checkbox.checked::after { content: ''; width: 4px; height: 7px; border-right: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(45deg) translateY(-1px); display: block; }

  .cat-price-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .cat-price-input { border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 12px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); outline: none; width: 100%; }
  .cat-price-input:focus { border-color: var(--blue); }

  .cat-sort-select { width: 100%; border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); outline: none; background: #fff; cursor: pointer; }
  .cat-sort-select:focus { border-color: var(--blue); }

  /* Toolbar (mobile + desktop) */
  .cat-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
  .cat-count { font-size: 13px; color: var(--text-3); font-weight: 600; }
  .cat-toolbar-right { display: flex; align-items: center; gap: 8px; }
  .cat-mobile-filter-btn { display: none; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; font-size: 12px; font-weight: 600; color: var(--text); cursor: pointer; }
  @media (max-width: 820px) { .cat-mobile-filter-btn { display: flex; } }

  /* Breadcrumb */
  .cat-breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-3); margin-bottom: 20px; flex-wrap: wrap; }
  .cat-breadcrumb a { color: var(--text-3); text-decoration: none; cursor: pointer; transition: color .15s; }
  .cat-breadcrumb a:hover { color: var(--blue); }
  .cat-breadcrumb span { color: var(--text); font-weight: 600; }

  /* Category chips */
  .cat-chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 20px; }
  .cat-chips::-webkit-scrollbar { height: 0; }
  .cat-chip { flex-shrink: 0; padding: 6px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: #fff; font-size: 12px; font-weight: 600; color: var(--text-2); cursor: pointer; transition: all .15s; white-space: nowrap; }
  .cat-chip:hover { border-color: var(--blue); color: var(--blue); }
  .cat-chip.active { background: var(--blue); border-color: var(--blue); color: #fff; }

  /* Empty state */
  .cat-empty { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 60px 24px; text-align: center; }
  .cat-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .cat-empty-title { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 8px; font-family: 'Bricolage Grotesque', sans-serif; }
  .cat-empty-sub { font-size: 13px; color: var(--text-3); margin-bottom: 20px; }
  .cat-empty-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--blue); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Filter sheet (mobile) */
  .cat-sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 60; display: flex; align-items: flex-end; }
  .cat-sheet { width: 100%; background: #fff; border-radius: 24px 24px 0 0; padding: 20px 20px 40px; max-height: 85vh; overflow-y: auto; animation: slideUp .3s ease; }
  .cat-sheet-handle { width: 36px; height: 4px; background: #D1D5DB; border-radius: 2px; margin: 0 auto 20px; }
  .cat-sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .cat-sheet-title { font-size: 18px; font-weight: 800; font-family: 'Bricolage Grotesque', sans-serif; }
  .cat-apply-btn { width: 100%; padding: 14px; background: var(--blue); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 24px; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Bottom nav */
  .cat-bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top: 1px solid var(--border); padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px)); z-index: 50; box-shadow: 0 -8px 24px rgba(15,23,42,.08); display: none; }
  @media (max-width: 820px) { .cat-bottom-nav { display: block; } }
  .cat-bottom-nav-inner { max-width: 720px; margin: 0 auto; display: flex; gap: 4px; justify-content: space-around; }
  .cat-bottom-item { flex: 1; background: none; border: none; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; color: #94A3B8; font-size: 10px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  .cat-bottom-item.active { color: var(--blue); }
`

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="bm-products-grid">
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1.5px solid #E2E8F0' }}>
          <div className="bm-skeleton" style={{ height: 200 }} />
          <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="bm-skeleton" style={{ height: 11, width: '50%' }} />
            <div className="bm-skeleton" style={{ height: 13, width: '80%' }} />
            <div className="bm-skeleton" style={{ height: 10, width: '40%' }} />
            <div className="bm-skeleton" style={{ height: 18, width: '45%' }} />
            <div className="bm-skeleton" style={{ height: 34 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Sidebar / Filter Panel ───────────────────────────────────────────────────
function FilterPanel({
  selectedCategories,
  onToggleCategory,
  minPrice,
  maxPrice,
  onMinPrice,
  onMaxPrice,
  sortKey,
  onSort,
  onClear,
}: {
  selectedCategories: string[]
  onToggleCategory: (id: string) => void
  minPrice: string; maxPrice: string
  onMinPrice: (v: string) => void; onMaxPrice: (v: string) => void
  sortKey: SortKey; onSort: (k: SortKey) => void
  onClear: () => void
}) {
  return (
    <>
      <div className="cat-filter-card">
        <div className="cat-filter-title">
          Sort By
        </div>
        <select className="cat-sort-select" value={sortKey} onChange={e => onSort(e.target.value as SortKey)}>
          <option value="default">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      <div className="cat-filter-card">
        <div className="cat-filter-title">
          Category
          {selectedCategories.length > 0 && (
            <button className="cat-filter-clear" onClick={onClear}>Clear</button>
          )}
        </div>
        {ALL_CATEGORIES.map(c => (
          <label key={c.id} className="cat-check-row" onClick={() => onToggleCategory(c.id)}>
            <div className={`cat-checkbox ${selectedCategories.includes(c.id) ? 'checked' : ''}`} />
            {c.label}
          </label>
        ))}
      </div>

      <div className="cat-filter-card">
        <div className="cat-filter-title">Price Range (₦)</div>
        <div className="cat-price-inputs">
          <input className="cat-price-input" type="number" placeholder="Min" value={minPrice} onChange={e => onMinPrice(e.target.value)} />
          <input className="cat-price-input" type="number" placeholder="Max" value={maxPrice} onChange={e => onMaxPrice(e.target.value)} />
        </div>
      </div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CatalogPage() {
  const navigate = useNavigate()
  const { id: categoryId } = useParams()
  const location = useLocation()
  const searchParam = new URLSearchParams(location.search).get('q') ?? ''

  const { products, loading } = useProducts(100)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState(searchParam)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryId ? [categoryId] : [])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [wishlist] = useState<Set<string>>(new Set())

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const clearFilters = () => {
    setSelectedCategories([])
    setMinPrice('')
    setMaxPrice('')
    setSortKey('default')
  }

  const filtered = useMemo(() => {
    let list = [...products]

    // Route-level filter
    if (location.pathname === '/deals') {
      list = list.filter(p => typeof p.discountPrice === 'number' && p.discountPrice < p.price)
    }

    // Search
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(p => {
        const hay = [p.name, p.categoryName, p.subCategoryName, p.storeName].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
    }

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter(p => {
        return selectedCategories.some(cid => {
          const keyword = CATEGORY_MAP[cid] ?? ''
          const hay = [p.categoryName, p.subCategoryName, p.name].filter(Boolean).join(' ').toLowerCase()
          return hay.includes(keyword)
        })
      })
    }

    // Price filter
    if (minPrice) list = list.filter(p => (p.discountPrice ?? p.price) >= Number(minPrice))
    if (maxPrice) list = list.filter(p => (p.discountPrice ?? p.price) <= Number(maxPrice))

    // Sort
    if (sortKey === 'price-asc') list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price))
    if (sortKey === 'price-desc') list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price))
    if (sortKey === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

    return list
  }, [products, location.pathname, searchQuery, selectedCategories, minPrice, maxPrice, sortKey])

  const title = pageTitle(location.pathname, categoryId, searchParam)
  const activeFiltersCount = selectedCategories.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0)

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{extraCss}</style>

      <div className="cat-root">
        {/* Header */}
        <header className="cat-header">
          <div className="cat-header-inner">
            <button className="cat-back-btn" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="cat-logo" onClick={() => navigate('/dashboard')}>
              <div className="cat-logo-mark"><img src="/bluelogo.png" alt="" /></div>
              <span className="cat-logo-name">Blorb<span>mart</span></span>
            </div>
            <form className="cat-search-bar" onSubmit={e => e.preventDefault()}>
              <span style={{ color: 'var(--text-3)', display: 'flex' }}><SearchIcon /></span>
              <input
                placeholder="Search products…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </header>

        <div className="cat-body">
          {/* Sidebar (desktop) */}
          <aside className="cat-sidebar">
            <FilterPanel
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              minPrice={minPrice} maxPrice={maxPrice}
              onMinPrice={setMinPrice} onMaxPrice={setMaxPrice}
              sortKey={sortKey} onSort={setSortKey}
              onClear={clearFilters}
            />
          </aside>

          {/* Main content */}
          <main>
            {/* Breadcrumb */}
            <div className="cat-breadcrumb">
              <a onClick={() => navigate('/dashboard')}>Home</a>
              <ChevronRightIcon />
              <a onClick={() => navigate('/shop')}>Shop</a>
              {categoryId && (
                <>
                  <ChevronRightIcon />
                  <span>{CATEGORY_LABELS[categoryId]}</span>
                </>
              )}
            </div>

            {/* Category chips */}
            <div className="cat-chips">
              <div
                className={`cat-chip ${selectedCategories.length === 0 ? 'active' : ''}`}
                onClick={() => setSelectedCategories([])}
              >
                All
              </div>
              {ALL_CATEGORIES.map(c => (
                <div
                  key={c.id}
                  className={`cat-chip ${selectedCategories.includes(c.id) ? 'active' : ''}`}
                  onClick={() => toggleCategory(c.id)}
                >
                  {c.label}
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="cat-toolbar">
              <div className="cat-count">
                {loading ? 'Loading…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
                {activeFiltersCount > 0 && (
                  <span style={{ marginLeft: 8, background: 'var(--blue)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="cat-toolbar-right">
                <button className="cat-mobile-filter-btn" type="button" onClick={() => setShowFilterSheet(true)}>
                  <FilterIcon />
                  Filter & Sort
                  {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
                </button>
                <div className="bm-view-toggle">
                  <button className={`bm-view-btn ${viewMode === 'grid' ? 'active' : ''}`} type="button" onClick={() => setViewMode('grid')}>
                    <GridIcon />
                  </button>
                  <button className={`bm-view-btn ${viewMode === 'list' ? 'active' : ''}`} type="button" onClick={() => setViewMode('list')}>
                    <ListIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <SkeletonGrid />
            ) : filtered.length === 0 ? (
              <div className="cat-empty">
                <div className="cat-empty-icon"><SearchIcon /></div>
                <div className="cat-empty-title">No products found</div>
                <div className="cat-empty-sub">
                  Try adjusting your filters or search for something else
                </div>
                <button className="cat-empty-btn" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={`bm-products-grid ${viewMode === 'list' ? 'list' : ''}`}>
                {filtered.map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    wishlisted={wishlist.has(item.id)}
                    badge={location.pathname === '/deals' ? 'sale' : undefined}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Mobile filter sheet */}
        {showFilterSheet && (
          <div className="cat-sheet-overlay" onClick={() => setShowFilterSheet(false)}>
            <div className="cat-sheet" onClick={e => e.stopPropagation()}>
              <div className="cat-sheet-handle" />
              <div className="cat-sheet-head">
                <span className="cat-sheet-title">Filter & Sort</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }} onClick={() => setShowFilterSheet(false)}>
                  <CloseIcon />
                </button>
              </div>
              <FilterPanel
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                minPrice={minPrice} maxPrice={maxPrice}
                onMinPrice={setMinPrice} onMaxPrice={setMaxPrice}
                sortKey={sortKey} onSort={setSortKey}
                onClear={clearFilters}
              />
              <button className="cat-apply-btn" type="button" onClick={() => setShowFilterSheet(false)}>
                Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <nav className="cat-bottom-nav">
          <div className="cat-bottom-nav-inner">
            {[
              { label: 'Home', path: '/dashboard', icon: HomeIcon },
              { label: 'Wishlist', path: '/wishlist', icon: HeartIcon },
              { label: 'Orders', path: '/track', icon: ReceiptIcon },
              { label: 'Account', path: '/profile', icon: UserIcon },
            ].map(({ label, path, icon: Icon }) => (
              <button key={label} className="cat-bottom-item" type="button" onClick={() => navigate(path)}>
                <span style={{ fontSize: 18 }}><Icon filled={false} /></span>
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}
