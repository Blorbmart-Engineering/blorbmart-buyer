import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TagIcon } from '../icons'
import { apiFetch } from '../../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiSlide = {
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  actionType?: string
  actionTarget?: string
}

type Banner = {
  id: string
  title: string
  headline: string
  cta: string
  from: string
  to: string
  img: string
  actionType?: string
  actionTarget?: string
}

// ─── Fallback data (shown when API returns no slides) ─────────────────────────
const FALLBACK_BANNERS: Banner[] = [
  {
    id: 'f1', title: 'Free Delivery', headline: 'On all orders above ₦10,000',
    cta: 'Shop Now', from: '#FF6B35', to: '#FF8C69', img: '/categories/food.jpg',
  },
  {
    id: 'f2', title: '50% Off Today', headline: 'Flash deals on electronics & more',
    cta: 'Grab Deal', from: '#2563EB', to: '#7C3AED', img: '/categories/electronics.jpg',
  },
  {
    id: 'f3', title: 'Bundle & Save', headline: 'Buy 2, get the 3rd free on fashion',
    cta: 'Explore', from: '#059669', to: '#0891B2', img: '/categories/fashion.jpg',
  },
]

// Default gradient pairs cycled for API slides that have no colors
const GRADIENTS: [string, string][] = [
  ['#2563EB', '#7C3AED'],
  ['#FF6B35', '#FF8C69'],
  ['#059669', '#0891B2'],
  ['#EA580C', '#F59E0B'],
]

function apiSlideTobanner(s: ApiSlide, idx: number): Banner {
  const [from, to] = GRADIENTS[idx % GRADIENTS.length]
  return {
    id: s.id,
    title: s.title,
    headline: s.subtitle || '',
    cta: 'Shop Now',
    from,
    to,
    img: s.imageUrl || '',
    actionType: s.actionType,
    actionTarget: s.actionTarget,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function HeroBanner() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS)
  const [active, setActive]   = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch live carousel from backend (public endpoint — no auth needed)
  useEffect(() => {
    apiFetch('/api/carousel/active')
      .then(r => r.json())
      .then(payload => {
        const slides: ApiSlide[] = payload?.data ?? []
        if (slides.length > 0) setBanners(slides.map(apiSlideTobanner))
      })
      .catch(() => { /* keep fallback */ })
  }, [])

  // Auto-scroll every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % banners.length
        if (ref.current) ref.current.scrollTo({ left: next * ref.current.clientWidth, behavior: 'smooth' })
        return next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [banners.length])

  const onScroll = () => {
    if (!ref.current) return
    setActive(Math.round(ref.current.scrollLeft / ref.current.clientWidth))
  }

  const handleBannerClick = (b: Banner) => {
    if (!b.actionType || !b.actionTarget) return
    switch (b.actionType) {
      case 'category': navigate(`/category/${b.actionTarget}`); break
      case 'product':  navigate(`/product/${b.actionTarget}`); break
      case 'store':    navigate(`/store/${b.actionTarget}`); break
      case 'url':      window.open(b.actionTarget, '_blank', 'noopener,noreferrer'); break
      default: break
    }
  }

  const main  = banners[active] ?? banners[0]
  const sides = banners.filter((_, i) => i !== active)

  return (
    <>
      {/* Desktop layout */}
      <div className="bm-hero bm-animate bm-desktop-only">
        <div
          className="bm-hero-main"
          style={{
            backgroundImage: `linear-gradient(145deg, ${main.from}E6, ${main.to}CC)${main.img ? `, url(${main.img})` : ''}`,
            cursor: main.actionType ? 'pointer' : 'default',
          }}
          onClick={() => handleBannerClick(main)}
        >
          <div className="bm-hero-eyebrow"><TagIcon /> Limited Offer</div>
          <div className="bm-hero-title">{main.title}</div>
          <div className="bm-hero-sub">{main.headline}</div>
          <button className="bm-hero-cta" type="button">{main.cta} →</button>
          <div className="bm-dots">
            {banners.map((_, i) => (
              <div
                key={i}
                className={`bm-dot ${i === active ? 'active' : ''}`}
                onClick={e => {
                  e.stopPropagation()
                  setActive(i)
                  if (ref.current) ref.current.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' })
                }}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>
        <div className="bm-hero-side">
          {sides.slice(0, 2).map(b => (
            <div
              key={b.id}
              className="bm-mini-banner"
              style={{
                backgroundImage: `linear-gradient(135deg, ${b.from}E6, ${b.to}CC)${b.img ? `, url(${b.img})` : ''}`,
                cursor: b.actionType ? 'pointer' : 'default',
              }}
              onClick={() => handleBannerClick(b)}
            >
              <div className="bm-mini-title">{b.title}</div>
              <div className="bm-mini-sub">{b.headline}</div>
              <button className="bm-mini-cta" type="button">{b.cta} →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile carousel */}
      <div className="bm-hero-carousel-wrap bm-animate bm-mobile-only">
        <div className="bm-hero-carousel" ref={ref} onScroll={onScroll}>
          {banners.map(b => (
            <div
              key={b.id}
              className="bm-hero-card"
              style={{
                backgroundImage: `linear-gradient(145deg, ${b.from}E6, ${b.to}CC)${b.img ? `, url(${b.img})` : ''}`,
                cursor: b.actionType ? 'pointer' : 'default',
              }}
              onClick={() => handleBannerClick(b)}
            >
              <div className="bm-hero-eyebrow"><TagIcon /> Limited Offer</div>
              <div className="bm-hero-title">{b.title}</div>
              <div className="bm-hero-sub">{b.headline}</div>
              <button className="bm-hero-cta" type="button" onClick={e => { e.stopPropagation(); handleBannerClick(b) }}>
                {b.cta} →
              </button>
            </div>
          ))}
        </div>
        <div className="bm-dots bm-mobile-dots">
          {banners.map((_, i) => (
            <div key={i} className={`bm-dot ${i === active ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </>
  )
}
