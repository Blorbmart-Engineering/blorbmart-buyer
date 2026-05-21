import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProducts } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { ProductCard } from '../../components/ProductCard'
import { SearchIcon } from '../../components/icons'

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  const timerRef = { current: 0 as ReturnType<typeof setTimeout> }
  const update = useCallback((v: T) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebounced(v), delay)
  }, [delay])
  // update when value changes (simplified — good enough for this use case)
  if (debounced !== value) update(value)
  return debounced
}

const css = `
  .sp-root { min-height: 100vh; background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; }
  .sp-header { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid var(--border); padding: 12px 16px; }
  .sp-header-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
  .sp-back { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .sp-search-bar { flex: 1; display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1.5px solid var(--border); border-radius: 999px; padding: 10px 16px; transition: border-color .2s; }
  .sp-search-bar:focus-within { border-color: var(--blue); background: #fff; }
  .sp-search-bar input { flex: 1; border: none; outline: none; background: transparent; font-size: 15px; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); }
  .sp-cancel { background: none; border: none; font-size: 14px; font-weight: 600; color: var(--blue); cursor: pointer; white-space: nowrap; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }

  .sp-body { max-width: 900px; margin: 0 auto; padding: 20px 16px 80px; }
  .sp-meta { font-size: 13px; color: var(--text-3); margin-bottom: 18px; font-weight: 600; }

  .sp-empty { text-align: center; padding: 80px 20px; }
  .sp-empty-icon { font-size: 56px; margin-bottom: 16px; }
  .sp-empty-title { font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px; font-family: 'Bricolage Grotesque', sans-serif; }
  .sp-empty-sub { font-size: 14px; color: var(--text-3); }

  .sp-hints { margin-top: 32px; }
  .sp-hints-title { font-size: 13px; font-weight: 700; color: var(--text-2); margin-bottom: 12px; }
  .sp-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .sp-tag { padding: 7px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; transition: all .15s; }
  .sp-tag:hover { border-color: var(--blue); color: var(--blue); }
`

const POPULAR_SEARCHES = ['Electronics', 'Food', 'Fashion', 'Beauty', 'Books', 'Accessories', 'Health', 'Stationery']

export function SearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialQ = new URLSearchParams(location.search).get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const debouncedQuery = useDebounce(query, 350)
  const { products, loading } = useProducts(200)

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return []
    return products.filter(p => {
      const hay = [p.name, p.categoryName, p.subCategoryName, p.storeName].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [debouncedQuery, products])

  const showResults = debouncedQuery.trim().length > 0

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
                autoFocus
              />
            </div>
            <button className="sp-cancel" type="button" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </header>

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
                <div className="sp-meta">{results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"</div>
                <div className="bm-products-grid">
                  {results.map(item => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="sp-empty">
                <div className="sp-empty-icon">🔍</div>
                <div className="sp-empty-title">No results found</div>
                <div className="sp-empty-sub">No products match "{debouncedQuery}".<br />Try a different search term.</div>
              </div>
            )
          ) : (
            <div className="sp-hints">
              <div className="sp-hints-title">Popular searches</div>
              <div className="sp-tags">
                {POPULAR_SEARCHES.map(tag => (
                  <div key={tag} className="sp-tag" onClick={() => setQuery(tag)}>
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
