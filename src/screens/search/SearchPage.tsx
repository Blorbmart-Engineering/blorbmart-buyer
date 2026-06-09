import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProducts } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { ProductCard } from '../../components/ProductCard'
import { SearchIcon, CloseIcon, FilterIcon } from '../../components/icons'

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timerRef.current)
  }, [value, delay])
  return debounced
}

const RECENT_KEY = 'bm-recent-searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function saveRecentSearch(q: string) {
  if (!q.trim()) return
  const current = getRecentSearches().filter(s => s.toLowerCase() !== q.toLowerCase())
  const updated = [q.trim(), ...current].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}
function clearRecentSearches() { localStorage.removeItem(RECENT_KEY) }

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'food_drinks', label: 'Food & Drinks' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'health', label: 'Health' },
  { id: 'stationery', label: 'Stationery' },
]

const POPULAR_SEARCHES = ['Electronics', 'Food', 'Fashion', 'Beauty', 'Books', 'Accessories', 'Health', 'Stationery']

const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const css = `
  .sp-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; }
  .sp-header { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid var(--border); padding: 12px 16px; }
  .sp-header-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
  .sp-back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .sp-search-bar { flex: 1; display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid var(--border); border-radius: 999px; padding: 10px 16px; transition: border-color .2s; }
  .sp-search-bar:focus-within { border-color: var(--blue); background: #fff; }
  .sp-search-bar input { flex: 1; border: none; outline: none; background: transparent; font-size: 15px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }
  .sp-search-clear { background: none; border: none; cursor: pointer; color: var(--text-3); display: flex; align-items: center; padding: 0; }
  .sp-cancel { background: none; border: none; font-size: 14px; font-weight: 600; color: var(--blue); cursor: pointer; white-space: nowrap; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Category chips */
  .sp-cats { display: flex; gap: 8px; overflow-x: auto; padding: 10px 16px; border-bottom: 1px solid var(--border); background: #fff; max-width: 100%; }
  .sp-cats::-webkit-scrollbar { height: 0; }
  .sp-cat { padding: 6px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; white-space: nowrap; transition: all .15s; flex-shrink: 0; }
  .sp-cat.active { border-color: var(--blue); background: var(--blue); color: #fff; }
  .sp-cat:hover:not(.active) { border-color: var(--blue); color: var(--blue); }

  /* Filter panel */
  .sp-filter-bar { background: #fff; border-bottom: 1px solid var(--border); padding: 10px 16px; display: flex; align-items: center; gap: 12px; }
  .sp-filter-btn { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; }
  .sp-filter-btn.active { border-color: var(--blue); color: var(--blue); background: var(--blue-light); }
  .sp-filter-panel { background: #fff; border-bottom: 1.5px solid var(--border); padding: 14px 16px; }
  .sp-filter-panel-inner { max-width: 900px; margin: 0 auto; display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
  .sp-filter-group { display: flex; flex-direction: column; gap: 4px; }
  .sp-filter-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; }
  .sp-filter-input { border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; width: 120px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }
  .sp-filter-input:focus { outline: none; border-color: var(--blue); }
  .sp-filter-reset { background: none; border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 600; color: var(--text-3); cursor: pointer; }

  .sp-body { max-width: 900px; margin: 0 auto; padding: 20px 16px 80px; }
  .sp-meta { font-size: 13px; color: var(--text-3); margin-bottom: 18px; font-weight: 600; }

  .sp-empty { text-align: center; padding: 80px 20px; }
  .sp-empty-icon { display: flex; justify-content: center; margin-bottom: 16px; }
  .sp-empty-title { font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px; font-family: 'Bricolage Grotesque', sans-serif; }
  .sp-empty-sub { font-size: 14px; color: var(--text-3); }

  /* Recent searches */
  .sp-section-title { font-size: 13px; font-weight: 700; color: var(--text-2); margin-bottom: 10px; }
  .sp-recent { display: flex; flex-direction: column; gap: 2px; margin-bottom: 28px; }
  .sp-recent-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: background .12s; }
  .sp-recent-item:hover { background: var(--bg-2, #F8FAFC); }
  .sp-recent-text { flex: 1; font-size: 14px; color: var(--text); }
  .sp-recent-remove { background: none; border: none; cursor: pointer; color: var(--text-3); display: flex; align-items: center; padding: 2px; }
  .sp-clear-all { background: none; border: none; font-size: 12px; font-weight: 600; color: var(--blue); cursor: pointer; padding: 0; margin-left: auto; }

  /* Popular */
  .sp-hints { }
  .sp-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .sp-tag { padding: 7px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; transition: all .15s; }
  .sp-tag:hover { border-color: var(--blue); color: var(--blue); }
`

export function SearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialQ = new URLSearchParams(location.search).get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const debouncedQuery = useDebounce(query, 350)
  const { products, loading } = useProducts(200)

  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const hasFilters = selectedCategory !== 'all' || minPrice !== '' || maxPrice !== ''

  // Persist search query when user submits
  const handleSearch = (q: string) => {
    if (q.trim()) {
      saveRecentSearch(q.trim())
      setRecentSearches(getRecentSearches())
    }
  }

  const removeRecent = (term: string) => {
    const updated = getRecentSearches().filter(s => s !== term)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    setRecentSearches(updated)
  }

  const clearAll = () => { clearRecentSearches(); setRecentSearches([]) }

  const selectTag = (tag: string) => { setQuery(tag); handleSearch(tag) }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(query)
  }, [query])

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    const catFilter = selectedCategory !== 'all' ? selectedCategory : null
    const minP = minPrice !== '' ? Number(minPrice) : null
    const maxP = maxPrice !== '' ? Number(maxPrice) : null

    if (!q && !catFilter && minP === null && maxP === null) return []

    return products.filter(p => {
      if (q) {
        const hay = [p.name, p.categoryName, p.subCategoryName, p.storeName].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (catFilter) {
        const pCat = (p.categoryName ?? '').toLowerCase().replace(/\s+/g, '_')
        if (!pCat.includes(catFilter.replace('_', ' '))) return false
      }
      const effectivePrice = (p as any).discountPrice ?? p.price ?? 0
      if (minP !== null && effectivePrice < minP) return false
      if (maxP !== null && effectivePrice > maxP) return false
      return true
    })
  }, [debouncedQuery, products, selectedCategory, minPrice, maxPrice])

  const showResults = debouncedQuery.trim().length > 0 || hasFilters

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="sp-root">
        <header className="sp-header">
          <div className="sp-header-inner">
            <button className="sp-back" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="sp-search-bar">
              <span style={{ color: 'var(--text-3)', display: 'flex' }}><SearchIcon /></span>
              <input
                placeholder="Search products, stores, categories…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {query && (
                <button className="sp-search-clear" type="button" onClick={() => setQuery('')}>
                  <CloseIcon />
                </button>
              )}
            </div>
            <button className="sp-cancel" type="button" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </header>

        {/* Category chips */}
        <div className="sp-cats">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`sp-cat${selectedCategory === cat.id ? ' active' : ''}`}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="sp-filter-bar">
          <button
            className={`sp-filter-btn${showFilters ? ' active' : ''}`}
            type="button"
            onClick={() => setShowFilters(v => !v)}
          >
            <FilterIcon /> Price Filter {hasFilters && !showFilters ? '•' : ''}
          </button>
          {(minPrice || maxPrice) && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
              {minPrice ? fmt(Number(minPrice)) : '—'} – {maxPrice ? fmt(Number(maxPrice)) : '—'}
            </span>
          )}
        </div>

        {showFilters && (
          <div className="sp-filter-panel">
            <div className="sp-filter-panel-inner">
              <div className="sp-filter-group">
                <label className="sp-filter-label">Min Price (₦)</label>
                <input
                  className="sp-filter-input"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                />
              </div>
              <div className="sp-filter-group">
                <label className="sp-filter-label">Max Price (₦)</label>
                <input
                  className="sp-filter-input"
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>
              <button
                className="sp-filter-reset"
                type="button"
                onClick={() => { setMinPrice(''); setMaxPrice(''); setSelectedCategory('all') }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="sp-body">
          {loading && showResults ? (
            <div className="bm-products-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', border: '1.5px solid #E2E8F0' }}>
                  <div className="bm-skeleton" style={{ height: 180 }} />
                  <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="bm-skeleton" style={{ height: 12, width: '60%' }} />
                    <div className="bm-skeleton" style={{ height: 14, width: '80%' }} />
                    <div className="bm-skeleton" style={{ height: 18, width: '40%' }} />
                    <div className="bm-skeleton" style={{ height: 34 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : showResults ? (
            results.length > 0 ? (
              <>
                <div className="sp-meta">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                  {debouncedQuery.trim() ? ` for "${debouncedQuery}"` : ''}
                  {selectedCategory !== 'all' ? ` in ${CATEGORIES.find(c => c.id === selectedCategory)?.label}` : ''}
                </div>
                <div className="bm-products-grid">
                  {results.map(item => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="sp-empty">
                <div className="sp-empty-icon"><SearchIcon /></div>
                <div className="sp-empty-title">No results found</div>
                <div className="sp-empty-sub">
                  {debouncedQuery.trim() ? `No products match "${debouncedQuery}".` : 'No products match the selected filters.'}
                  <br />Try adjusting your search or filters.
                </div>
              </div>
            )
          ) : (
            <>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                    <span className="sp-section-title" style={{ margin: 0 }}>Recent Searches</span>
                    <button className="sp-clear-all" type="button" onClick={clearAll}>Clear all</button>
                  </div>
                  <div className="sp-recent">
                    {recentSearches.map(term => (
                      <div key={term} className="sp-recent-item" onClick={() => selectTag(term)}>
                        <span style={{ color: 'var(--text-3)', display: 'flex' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                        </span>
                        <span className="sp-recent-text">{term}</span>
                        <button className="sp-recent-remove" type="button" onClick={e => { e.stopPropagation(); removeRecent(term) }}>
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular searches */}
              <div className="sp-hints">
                <div className="sp-section-title">Popular searches</div>
                <div className="sp-tags">
                  {POPULAR_SEARCHES.map(tag => (
                    <div key={tag} className="sp-tag" onClick={() => selectTag(tag)}>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
