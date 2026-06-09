import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { StarIcon, UtensilsIcon, ChevronRightIcon } from '../icons'

type RestaurantItem = {
  id: string
  name: string
  logoUrl?: string
  rating: number
  isOpen: boolean
}

async function fetchTopRestaurants(): Promise<RestaurantItem[]> {
  const results: RestaurantItem[] = []
  const seen = new Set<string>()

  const parse = (d: Record<string, unknown>, id: string): RestaurantItem => {
    const logoUrl = (d['logo'] ?? d['logoUrl'] ?? d['logoImageUrl'] ?? d['imageUrl'] ?? d['coverImage']) as string | undefined
    let isOpen = true
    if (typeof d['isOpen'] === 'boolean') isOpen = d['isOpen']
    else if (typeof d['kitchenOpen'] === 'boolean') isOpen = d['kitchenOpen']
    else isOpen = d['vendorStatus'] === 'active' || d['status'] === 'active'
    return {
      id,
      name: (d['name'] as string) ?? (d['businessName'] as string) ?? 'Restaurant',
      logoUrl: logoUrl || undefined,
      rating: Number(d['rating'] ?? 4.0),
      isOpen,
    }
  }

  try {
    const snap = await getDocs(query(collection(db, 'vendors'), where('isRestaurant', '==', true)))
    snap.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); results.push(parse(d.data() as Record<string, unknown>, d.id)) } })
  } catch {}
  try {
    const snap = await getDocs(query(collection(db, 'stores'), where('isRestaurant', '==', true)))
    snap.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); results.push(parse(d.data() as Record<string, unknown>, d.id)) } })
  } catch {}

  if (results.length === 0) {
    try {
      const snap = await getDocs(collection(db, 'vendors'))
      snap.docs.slice(0, 8).forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); results.push(parse(d.data() as Record<string, unknown>, d.id)) } })
    } catch {}
  }

  return results
    .sort((a, b) => (b.isOpen ? 1 : 0) - (a.isOpen ? 1 : 0) || b.rating - a.rating)
    .slice(0, 8)
}

export function TopRestaurantsSection() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopRestaurants().then(list => { setRestaurants(list); setLoading(false) })
  }, [])

  if (!loading && restaurants.length === 0) return null

  return (
    <section className="bm-section bm-animate bm-animate-3">
      <div className="bm-section-head">
        <div>
          <div className="bm-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#FF5500', display: 'inline-flex' }}><UtensilsIcon size={20} /></span>
            Top Restaurants
          </div>
          <div className="bm-section-sub">Order from your favourite spots</div>
        </div>
        <button className="bm-see-all" type="button" onClick={() => navigate('/food')} style={{ color: '#FF5500' }}>
          See All <ChevronRightIcon />
        </button>
      </div>

      <div className="bm-restaurants-scroll">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="bm-restaurant-item">
                <div className="bm-restaurant-logo" style={{ background: '#f1f5f9' }}>
                  <div className="bm-skeleton" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                </div>
                <div className="bm-skeleton" style={{ height: 10, width: 60, marginTop: 8, borderRadius: 4 }} />
              </div>
            ))
          : restaurants.map(r => (
              <div key={r.id} className="bm-restaurant-item" onClick={() => navigate(`/store/${r.id}`)}>
                <div className="bm-restaurant-logo">
                  {r.logoUrl
                    ? <img src={r.logoUrl} alt={r.name} />
                    : <UtensilsIcon size={28} />
                  }
                </div>
                <div className="bm-restaurant-name">{r.name}</div>
                <div className="bm-restaurant-rating">
                  <StarIcon size={10} />
                  <span>{r.rating.toFixed(1)}</span>
                </div>
              </div>
            ))
        }
      </div>
    </section>
  )
}
