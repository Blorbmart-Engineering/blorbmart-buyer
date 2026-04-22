import { useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

import { useProducts } from '../../hooks/useFirebaseData'

const CATEGORY_MAP: Record<string, string> = {
  '1': 'electronics',
  '2': 'food',
  '3': 'accessories',
  '4': 'beauty',
  '5': 'fashion',
  '6': 'books',
  '7': 'stationery',
  '8': 'health',
}

const pageTitle = (pathname: string, categoryId?: string) => {
  if (pathname === '/deals') return 'Today\'s Deals'
  if (pathname === '/categories') return 'Shop by Category'
  if (pathname === '/shop') return 'All Products'
  if (categoryId) return `Category: ${CATEGORY_MAP[categoryId] || 'Products'}`
  return 'Products'
}

export function CatalogPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { products, loading } = useProducts(60)

  const filtered = useMemo(() => {
    const all = [...products]

    if (location.pathname === '/deals') {
      return all.filter((item) => typeof item.discountPrice === 'number' && item.discountPrice < item.price)
    }

    if (id) {
      const keyword = CATEGORY_MAP[id] || ''
      return all.filter((item) => {
        const haystack = [item.categoryName, item.subCategoryName, item.name].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(keyword)
      })
    }

    return all
  }, [id, location.pathname, products])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>{pageTitle(location.pathname, id)}</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>{loading ? 'Loading...' : `${filtered.length} product(s)`}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 12, padding: '10px 16px', cursor: 'pointer' }}
          >
            Back to home
          </button>
        </div>

        {loading ? (
          <div>Loading products...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0' }}>
            No products found in this section yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/product/${item.id}`)}
                style={{ textAlign: 'left', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 20, padding: 14, cursor: 'pointer' }}
              >
                <img
                  src={item.images?.[0] || '/second.jpg'}
                  alt={item.name}
                  style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 16, background: '#e2e8f0', marginBottom: 12 }}
                />
                <div style={{ color: '#64748b', fontSize: 13 }}>{item.storeName || 'Blorbmart Store'}</div>
                <h3 style={{ margin: '6px 0', fontSize: 16 }}>{item.name}</h3>
                <strong>{formatCurrency(item.discountPrice ?? item.price)}</strong>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
