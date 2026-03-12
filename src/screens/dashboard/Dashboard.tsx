import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUserData, useProducts } from '../../hooks/useFirebaseData'

// ????????? Icons ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
)
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)
const ReceiptIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
)
const UserIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const FilterIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
)
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>
)
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
)
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
)

// ????????? Data ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
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
  subCategoryName?: string
  storeName?: string
  status?: string
}

const CATEGORIES = [
  { id: 1, label: 'Electronics', img: '/categories/electronics.jpg' },
  { id: 2, label: 'Food & Drinks', img: '/categories/food.jpg' },
  { id: 3, label: 'Accessories', img: '/categories/accessories.jpg' },
  { id: 4, label: 'Beauty', img: '/categories/beauty.jpg' },
  { id: 5, label: 'Fashion', img: '/categories/fashion.jpg' },
  { id: 6, label: 'Books', img: '/categories/books.jpg' },
]
const BANNERS = [
  {
    id: 1,
    title: 'Free Delivery',
    sub: 'On all orders above ???10,000',
    cta: 'Shop Now',
    img: '/categories/food.jpg',
    tone: 'orange',
  },
  {
    id: 2,
    title: '50% Off Today',
    sub: 'Flash deals on electronics & more',
    cta: 'Grab Deal',
    img: '/categories/electronics.jpg',
    tone: 'blue',
  },
  {
    id: 3,
    title: 'Bundle & Save',
    sub: 'Buy 2, get the 3rd free on fashion',
    cta: 'Explore',
    img: '/categories/fashion.jpg',
    tone: 'green',
  },
]
// ????????? Styles ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #2979FF;
    --orange: #f97316;
    --bg: #F5F7FB;
    --white: #fff;
    --text: #111827;
    --muted: #6B7280;
    --border: #E5E7EB;
    --card-shadow: 0 2px 16px rgba(0,0,0,.07);
  }

  .db-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100dvh;
    max-width: 430px;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ?????? Scroll area ?????? */
  .db-scroll {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 90px;
    scroll-behavior: smooth;
  }
  .db-scroll::-webkit-scrollbar { display: none; }

  /* ?????? Header ?????? */
  .db-header {
    background: var(--white);
    padding: 16px 20px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 30;
    border-bottom: 1px solid var(--border);
    animation: fadeDown .4s ease both;
  }
  .db-greeting { flex: 1; display: flex; align-items: center; gap: 12px; }
  .db-avatar {
    width: 46px; height: 46px;
    border-radius: 50%;
    border: 2.5px solid var(--blue);
    display: flex; align-items: center; justify-content: center;
    background: #EEF5FF;
    flex-shrink: 0;
    overflow: hidden;
  }
  .db-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .db-hello { font-size: 12px; color: var(--muted); }
  .db-name {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.2;
  }
  .db-tagline { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
  .db-actions { display: flex; gap: 10px; }
  .db-icon-btn {
    width: 42px; height: 42px;
    border-radius: 50%;
    border: 1.5px solid var(--border);
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text);
    position: relative;
    transition: border-color .2s, background .2s;
  }
  .db-icon-btn:hover { background: var(--bg); }
  .db-badge {
    position: absolute;
    top: -2px; right: -2px;
    width: 10px; height: 10px;
    background: var(--orange);
    border-radius: 50%;
    border: 2px solid var(--white);
  }

  /* ?????? Search ?????? */
  .db-search-wrap { padding: 14px 20px 0; animation: fadeUp .35s .08s ease both; }
  .db-search {
    display: flex; align-items: center;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: 50px;
    padding: 0 16px;
    gap: 10px;
    height: 50px;
    transition: border-color .2s, box-shadow .2s;
  }
  .db-search:focus-within {
    border-color: var(--blue);
    box-shadow: 0 0 0 4px rgba(41,121,255,.1);
  }
  .db-search-icon { color: var(--muted); flex-shrink: 0; }
  .db-search input {
    flex: 1;
    border: none; background: transparent; outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--text);
  }
  .db-search input::placeholder { color: #bbb; }
  .db-search-divider { width: 1px; height: 22px; background: var(--border); }
  .db-filter-btn {
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; padding: 0;
  }

  /* ?????? Location ?????? */
  .db-location {
    margin: 14px 20px 0;
    display: flex; align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--white);
    border-radius: 14px;
    border: 1.5px solid var(--border);
    animation: fadeUp .35s .12s ease both;
  }
  .db-loc-text { flex: 1; min-width: 0; }
  .db-loc-label { font-size: 11px; color: var(--muted); }
  .db-loc-value {
    font-size: 13px; font-weight: 600; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .db-loc-change {
    background: none; border: none; cursor: pointer;
    font-size: 13px; font-weight: 700; color: var(--blue);
    font-family: 'DM Sans', sans-serif; flex-shrink: 0;
  }

  /* ?????? Section ?????? */
  .db-section { padding: 20px 20px 0; animation: fadeUp .35s .16s ease both; }
  .db-section-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }
  .db-section-title {
    font-family: 'Sora', sans-serif;
    font-size: 17px; font-weight: 700; color: var(--text);
  }
  .db-see-all {
    font-size: 13px; font-weight: 600; color: var(--blue);
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
  }

  /* ?????? Categories ?????? */
  .db-cats {
    display: flex; gap: 14px;
    overflow-x: auto; padding-bottom: 4px;
    scrollbar-width: none;
  }
  .db-cats::-webkit-scrollbar { display: none; }
  .db-cat {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    flex-shrink: 0; cursor: pointer;
  }
  .db-cat-icon {
    width: 68px; height: 68px;
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    transition: transform .18s, box-shadow .18s;
    border: 1.5px solid #E5E7EB;
    background: #fff;
    overflow: hidden;
  }
  .db-cat-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .db-cat:hover .db-cat-icon {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,.1);
  }
  .db-cat-label { font-size: 12px; font-weight: 500; color: var(--text); text-align: center; line-height: 1.3; }

  /* ?????? Banner carousel ?????? */
  .db-banner-section { padding: 20px 0 0; animation: fadeUp .35s .2s ease both; }
  .db-banner-scroll {
    display: flex; overflow-x: auto; gap: 14px;
    padding: 0 20px 6px; scrollbar-width: none;
    scroll-snap-type: x mandatory;
  }
  .db-banner-scroll::-webkit-scrollbar { display: none; }
  .db-banner {
    flex-shrink: 0; width: calc(100% - 40px);
    border-radius: 24px;
    padding: 28px 24px;
    position: relative; overflow: hidden;
    scroll-snap-align: start;
    cursor: pointer;
    min-height: 180px;
    display: flex; flex-direction: column; justify-content: flex-end;
    transition: transform .2s;
    background-size: cover;
    background-position: center;
  }
  .db-banner:hover { transform: scale(1.01); }
  .db-banner-tag {
    font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
    color: rgba(255,255,255,.75); font-weight: 500; margin-bottom: 6px;
  }
  .db-banner-title {
    font-family: 'Sora', sans-serif;
    font-size: 24px; font-weight: 800; color: #fff; line-height: 1.2;
    margin-bottom: 4px;
  }
  .db-banner-sub { font-size: 13px; color: rgba(255,255,255,.8); margin-bottom: 16px; }
  .db-banner-cta {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.95);
    border: none; border-radius: 50px;
    padding: 10px 20px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 700; color: #111;
    cursor: pointer;
    transition: background .18s, transform .15s;
    width: fit-content;
  }
  .db-banner-cta:hover { background: #fff; transform: translateX(2px); }

  /* Dots */
  .db-dots {
    display: flex; justify-content: center; gap: 6px; padding: 10px 0 0;
  }
  .db-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #D1D5DB; transition: all .3s;
  }
  .db-dot.active { background: var(--blue); width: 20px; border-radius: 4px; }

  /* ?????? Flash Sales ?????? */
  .db-flash-head {
    display: flex; align-items: center; gap: 8px;
  }
  .db-flash-title {
    font-family: 'Sora', sans-serif;
    font-size: 17px; font-weight: 700; color: var(--text);
  }
  .db-timer {
    display: flex; align-items: center; gap: 5px;
    background: #FFF7ED;
    border: 1px solid #FED7AA;
    border-radius: 50px; padding: 4px 10px;
    font-size: 12px; font-weight: 600; color: var(--orange);
    margin-left: auto;
  }
  .db-flash-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

  .db-flash-scroll {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .db-flash-scroll::-webkit-scrollbar { display: none; }
  .db-flash-empty {
    color: var(--muted);
    font-size: 13px;
    padding: 8px 2px;
  }
  .db-product-card {
    background: var(--white);
    border-radius: 20px;
    overflow: hidden;
    border: 1.5px solid var(--border);
    cursor: pointer;
    transition: transform .2s, box-shadow .2s;
    position: relative;
    min-width: 190px;
  }
  .db-product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0,0,0,.1);
  }
  .db-product-img {
    height: 110px;
    background: #EEF2F7;
    display: flex; align-items: center; justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .db-product-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .db-product-badge {
    position: absolute; top: 8px; left: 8px;
    background: var(--orange);
    color: #fff; font-size: 9px; font-weight: 700;
    letter-spacing: .08em;
    padding: 3px 8px; border-radius: 50px;
  }
  .db-wishlist-btn {
    position: absolute; top: 8px; right: 8px;
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(255,255,255,.9);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #ccc; transition: color .2s;
  }
  .db-wishlist-btn:hover { color: #ef4444; }
  .db-product-info { padding: 10px 12px 12px; }
  .db-product-name {
    font-size: 13px; font-weight: 600; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-bottom: 5px;
  }
  .db-product-prices { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
  .db-product-price { font-size: 14px; font-weight: 700; color: var(--blue); }
  .db-product-original { font-size: 11px; color: #9CA3AF; text-decoration: line-through; }
  .db-product-off {
    font-size: 10px; font-weight: 700; color: #fff;
    background: #ef4444; padding: 1px 5px; border-radius: 4px;
  }
  .db-product-meta { display: flex; align-items: center; gap: 6px; }
  .db-product-rating { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--muted); }
  .db-product-sold { font-size: 10px; color: #9CA3AF; margin-left: auto; }

  /* ?????? Trending ?????? */
  .db-trending-list { display: flex; flex-direction: column; gap: 14px; }
  .db-trending-card {
    background: var(--white);
    border-radius: 18px;
    border: 1.5px solid var(--border);
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: transform .15s, box-shadow .15s;
  }
  .db-trending-card:hover {
    transform: translateX(3px);
    box-shadow: var(--card-shadow);
  }
  .db-trending-img {
    width: 72px; height: 72px; flex-shrink: 0;
    border-radius: 16px;
    background: #EEF2F7;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .db-trending-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .db-trending-info { flex: 1; min-width: 0; }
  .db-trending-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .db-trending-cat { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .db-trending-right { text-align: right; flex-shrink: 0; }
  .db-trending-price { font-size: 14px; font-weight: 800; color: var(--blue); }
  .db-trending-rating { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--muted); justify-content: flex-end; margin-top: 4px; }
  .db-trending-origin { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .db-trending-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
  .db-heart-btn {
    width: 34px; height: 34px;
    border-radius: 50%;
    border: 1.5px solid var(--border);
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #c4c4c4;
    transition: color .2s, border-color .2s;
  }
  .db-heart-btn:hover { color: #ef4444; border-color: #f3c5c5; }
  .db-heart-btn.filled { color: #ef4444; border-color: #f3c5c5; }

  /* ?????? Bottom nav ?????? */
  .db-nav {
    position: fixed;
    bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px;
    background: var(--white);
    border-top: 1px solid var(--border);
    display: flex;
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
    z-index: 50;
    box-shadow: 0 -4px 24px rgba(0,0,0,.08);
  }
  .db-nav-item {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    cursor: pointer; border: none; background: none;
    padding: 6px 0;
    transition: transform .15s;
    position: relative;
  }
  .db-nav-item:hover { transform: translateY(-2px); }
  .db-nav-icon { transition: color .2s; }
  .db-nav-label { font-size: 11px; font-weight: 500; transition: color .2s; }
  .db-nav-item.active .db-nav-icon,
  .db-nav-item.active .db-nav-label { color: var(--blue); }
  .db-nav-item:not(.active) .db-nav-icon,
  .db-nav-item:not(.active) .db-nav-label { color: #9CA3AF; }
  .db-nav-dot {
    position: absolute; bottom: 2px;
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--blue);
  }

  /* ?????? Animations ?????? */
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

// ????????? Timer hook ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
function useCountdown(init: number) {
  const [secs, setSecs] = useState(init)
  useEffect(() => {
    const t = setInterval(() => setSecs((s: number) => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// ????????? Banner carousel ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
function BannerCarousel() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)

  const onScroll = () => {
    if (!ref.current) return
    const idx = Math.round(ref.current.scrollLeft / ref.current.clientWidth)
    setActive(idx)
  }

  return (
          <div className="db-banner-section">
            <div className="db-banner-scroll" ref={ref} onScroll={onScroll}>
              {BANNERS.map(b => (
                <div
                  key={b.id}
                  className="db-banner"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${
                      b.tone === 'orange'
                        ? 'rgba(249,115,22,.9), rgba(239,68,68,.85)'
                        : b.tone === 'green'
                        ? 'rgba(16,185,129,.85), rgba(14,165,233,.75)'
                        : 'rgba(41,121,255,.85), rgba(99,102,241,.75)'
                    }), url(${b.img})`,
                  }}
                >
                  <span className="db-banner-tag">Limited Offer</span>
                  <div className="db-banner-title">{b.title}</div>
                  <div className="db-banner-sub">{b.sub}</div>
                  <button className="db-banner-cta" type="button">{b.cta} ???</button>
                </div>
              ))}
      </div>
      <div className="db-dots">
        {BANNERS.map((_, i) => (
          <div key={i} className={`db-dot ${i === active ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  )
}

// ????????? Bottom Nav ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
const NAV_ITEMS = [
  { id: 'home', label: 'Home', Icon: HomeIcon, path: '/dashboard' },
  { id: 'wishlist', label: 'Wishlist', Icon: HeartIcon, path: '/wishlist' },
  { id: 'orders', label: 'Transactions', Icon: ReceiptIcon, path: '/transactions' },
  { id: 'profile', label: 'Profile', Icon: UserIcon, path: '/profile' },
]

// ????????? Main Component ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [userName, setUserName] = useState('Friend')
  const [walletBalance, setWalletBalance] = useState(0)
  const [flashItems, setFlashItems] = useState<Product[]>([])
  const [topSelling, setTopSelling] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const countdown = useCountdown(9910)

  // Use Firebase hooks for data fetching
  const { user, loading: authLoading } = useAuth()
  const { userData } = useUserData(user?.uid)
  const { products } = useProducts(8)

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login')
      return
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (userData?.firstName) {
      setUserName(userData.firstName)
    }
  }, [userData])

  useEffect(() => {
    if (userData?.balance !== undefined) {
      setWalletBalance(userData.balance)
    }
  }, [userData])

  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      setTopSelling(products)
      setFlashItems(products.slice(0, 4))
      setLoadingProducts(false)
    }
  }, [products])

  // Show loading spinner while auth state is loading
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f6fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #1F77F1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontFamily: 'DM Sans, sans-serif' }}>Loading...</p>
        </div>
      </div>
    )
  }

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const n = new Set(prev)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

  const getDiscountPercent = (price?: number, discount?: number) => {
    if (!price || !discount || price <= discount) return null
    return Math.round(((price - discount) / price) * 100)
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <>
      <style>{css}</style>
      <div className="db-root">
        <div className="db-scroll">

          {/* ?????? Header ?????? */}
          <div className="db-header">
            <div className="db-greeting">
              <div className="db-avatar">
                <img src="/bluelogo.png" alt="Blorbmart" />
              </div>
              <div>
                <div className="db-hello">{getGreeting()},</div>
                <div className="db-name">{userName}!</div>
                <div 
                  className="db-tagline" 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate('/wallet')}
                >
                  Wallet: {formatCurrency(walletBalance)}
                </div>
              </div>
            </div>
            <div className="db-actions">
              <button className="db-icon-btn" type="button">
                <CartIcon />
                <div className="db-badge" />
              </button>
              <button className="db-icon-btn" type="button">
                <BellIcon />
                <div className="db-badge" />
              </button>
            </div>
          </div>

          {/* ?????? Search ?????? */}
          <div className="db-search-wrap">
            <div className="db-search">
              <span className="db-search-icon"><SearchIcon /></span>
              <input placeholder="???? Hot student deals now!" />
              <div className="db-search-divider" />
              <button className="db-filter-btn" type="button"><FilterIcon /></button>
            </div>
          </div>

          {/* ?????? Location ?????? */}
          <div className="db-location">
            <PinIcon />
            <div className="db-loc-text">
              <div className="db-loc-label">Delivering to:</div>
              <div className="db-loc-value">Osun State University Campus, Osogbo</div>
            </div>
            <button className="db-loc-change" type="button">Change</button>
          </div>

          {/* ?????? Categories ?????? */}
          <div className="db-section">
            <div className="db-section-head">
              <div className="db-section-title">Categories</div>
              <button className="db-see-all" type="button">See all</button>
            </div>
            <div className="db-cats">
              {CATEGORIES.map(c => (
                <div key={c.id} className="db-cat">
                  <div className="db-cat-icon">
                    <img src={c.img} alt={c.label} />
                  </div>
                  <span className="db-cat-label">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ?????? Banners ?????? */}
          <BannerCarousel />

          {/* ?????? Flash Sales ?????? */}
          <div className="db-section" style={{ marginTop: 6 }}>
            <div className="db-section-head" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
              <div>
                <div className="db-flash-head">
                  <span style={{ fontSize: 20 }}>????</span>
                  <span className="db-flash-title">Flash Sales</span>
                </div>
                <div className="db-flash-sub">Limited time offers</div>
              </div>
              <div className="db-timer">
                <ClockIcon />
                Ends in {countdown}
              </div>
            </div>

            <div className="db-flash-scroll">
              {loadingProducts && <div className="db-flash-empty">Loading deals...</div>}
              {!loadingProducts && flashItems.length === 0 && (
                <div className="db-flash-empty">No flash deals yet.</div>
              )}
              {flashItems.map((item) => {
                const percent = getDiscountPercent(item.price, item.discountPrice)
                return (
                <div
                  key={item.id}
                  className="db-product-card"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <div className="db-product-img">
                    <span className="db-product-badge">FLASH</span>
                    <button
                      className="db-wishlist-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(item.id)
                      }}
                      style={{ color: wishlist.has(item.id) ? '#ef4444' : '#ccc' }}
                    >
                      <HeartIcon filled={wishlist.has(item.id)} />
                    </button>
                    <img src={item.images?.[0] ?? '/second.jpg'} alt={item.name} />
                  </div>
                  <div className="db-product-info">
                    <div className="db-product-name">{item.name}</div>
                    <div className="db-product-prices">
                      <span className="db-product-price">
                        {formatCurrency(item.discountPrice ?? item.price)}
                      </span>
                      {item.discountPrice ? (
                        <span className="db-product-original">{formatCurrency(item.price)}</span>
                      ) : null}
                      {item.discountPrice && percent !== null ? (
                        <span className="db-product-off">-{percent}%</span>
                      ) : null}
                    </div>
                    <div className="db-product-meta">
                      <div className="db-product-rating">
                        <StarIcon />
                        {(item.rating ?? 0).toFixed(1)}
                      </div>
                      <div className="db-product-sold">{item.totalSold ?? 0} sold</div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* ?????? Top Selling ?????? */}
          <div className="db-section" style={{ paddingBottom: 8 }}>
            <div className="db-section-head">
              <div>
                <div className="db-section-title">Top Selling</div>
                <div className="db-flash-sub">Products loved by thousands</div>
              </div>
              <button className="db-see-all" type="button">See more</button>
            </div>
            <div className="db-trending-list">
              {loadingProducts && <div className="db-flash-empty">Loading top selling...</div>}
              {!loadingProducts && topSelling.length === 0 && (
                <div className="db-flash-empty">No top selling products yet.</div>
              )}
              {topSelling.map((item) => (
                <div
                  key={item.id}
                  className="db-trending-card"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <div className="db-trending-img">
                    <img src={item.images?.[0] ?? '/second.jpg'} alt={item.name} />
                  </div>
                  <div className="db-trending-info">
                    <div className="db-trending-name">{item.name}</div>
                    <div className="db-trending-cat">{item.storeName ?? 'Store'}</div>
                    <div className="db-trending-rating">
                      <StarIcon /> {(item.rating ?? 0).toFixed(1)} ({item.totalReviews ?? 0})
                    </div>
                  </div>
                  <div className="db-trending-actions">
                    <div className="db-trending-right">
                      <div className="db-trending-price">
                        {formatCurrency(item.discountPrice ?? item.price)}
                      </div>
                      {item.discountPrice ? (
                        <div className="db-trending-origin" style={{ textDecoration: 'line-through' }}>
                          {formatCurrency(item.price)}
                        </div>
                      ) : null}
                    </div>
                    <button
                      className={`db-heart-btn ${wishlist.has(item.id) ? 'filled' : ''}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(item.id)
                      }}
                    >
                      <HeartIcon filled={wishlist.has(item.id)} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ?????? Bottom Nav ?????? */}
        <nav className="db-nav">
          {NAV_ITEMS.map(({ id, label, Icon, path }) => (
            <button
              key={id}
              className={`db-nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(id)
                navigate(path)
              }}
              type="button"
            >
              <span className="db-nav-icon"><Icon filled={activeTab === id} /></span>
              <span className="db-nav-label">{label}</span>
              {activeTab === id && <div className="db-nav-dot" />}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}



