import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUserData, useProducts } from '../../hooks/useFirebaseData'

// ─── Icons ───────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const CartIcon = ({ count }: { count?: number }) => (
  <span style={{ position: 'relative', display: 'inline-flex' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
    </svg>
    {count ? (
      <span style={{
        position: 'absolute', top: -6, right: -6,
        background: '#ef4444', color: '#fff',
        fontSize: 10, fontWeight: 700, lineHeight: 1,
        padding: '2px 5px', borderRadius: 99,
        border: '2px solid #fff',
        minWidth: 18, textAlign: 'center',
      }}>{count}</span>
    ) : null}
  </span>
)
const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
)
const ReceiptIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
)
const UserIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24"
    fill={filled ? '#ef4444' : 'none'}
    stroke={filled ? '#ef4444' : 'currentColor'}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
)
const StarIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
)
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
)
const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const UserCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M16 12h2"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
  </svg>
)
const TagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)
const TruckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Static Data ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, label: 'Electronics', img: '/categories/electronics.jpg' },
  { id: 2, label: 'Food & Drinks', img: '/categories/food.jpg' },
  { id: 3, label: 'Accessories', img: '/categories/accessories.jpg' },
  { id: 4, label: 'Beauty', img: '/categories/beauty.jpg' },
  { id: 5, label: 'Fashion', img: '/categories/fashion.jpg' },
  { id: 6, label: 'Books', img: '/categories/books.jpg' },
  { id: 7, label: 'Stationery', img: '/categories/books.jpg' },
  { id: 8, label: 'Health', img: '/categories/beauty.jpg' },
]

const BANNERS = [
  {
    id: 1, title: 'Free Delivery', headline: 'On all orders above ₦10,000',
    cta: 'Shop Now', tone: 'orange',
    from: '#FF6B35', to: '#FF8C69', img: '/categories/food.jpg',
  },
  {
    id: 2, title: '50% Off Today', headline: 'Flash deals on electronics & more',
    cta: 'Grab Deal', tone: 'blue',
    from: '#2563EB', to: '#7C3AED', img: '/categories/electronics.jpg',
  },
  {
    id: 3, title: 'Bundle & Save', headline: 'Buy 2, get the 3rd free on fashion',
    cta: 'Explore', tone: 'green',
    from: '#059669', to: '#0891B2', img: '/categories/fashion.jpg',
  },
]

const NAV_LINKS = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Shop', path: '/shop' },
  { label: 'Categories', path: '/categories' },
  { label: 'Deals', path: '/deals' },
  { label: 'Track Order', path: '/track' },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #2563EB;
    --blue-light: #EFF6FF;
    --orange: #F97316;
    --orange-light: #FFF7ED;
    --text: #0F172A;
    --text-2: #475569;
    --text-3: #94A3B8;
    --bg: #F8FAFC;
    --white: #FFFFFF;
    --border: #E2E8F0;
    --card: #FFFFFF;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --shadow: 0 6px 20px rgba(0,0,0,.08);
    --shadow-lg: 0 14px 40px rgba(0,0,0,.12);
    --radius: 14px;
    --radius-sm: 10px;
    --radius-lg: 20px;
  }

  body { 
    background: var(--bg);
    overflow-x: hidden;
    width: 100%;
  }

  .bm-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    position: relative;
  }

  /* Announcement */
  .bm-announce {
    display: flex; align-items: center; justify-content: center;
    gap: clamp(4px, 2vw, 10px);
    padding: 10px 16px;
    font-size: clamp(11px, 2.5vw, 13px);
    background: #0F172A;
    color: #E2E8F0;
    flex-wrap: wrap;
    text-align: center;
    width: 100%;
  }
  .bm-announce strong { color: #fff; font-weight: 700; }

  /* Header */
  .bm-header {
    position: sticky; top: 0; z-index: 40;
    background: rgba(255,255,255,.9);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    width: 100%;
  }
  .bm-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 12px;
    width: 100%;
  }
  .bm-logo {
    display: flex; align-items: center; gap: 6px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .bm-logo-mark {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: var(--blue);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .bm-logo-mark img { width: 100%; height: 100%; object-fit: cover; }
  .bm-logo-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800;
    letter-spacing: -.02em;
    white-space: nowrap;
  }
  .bm-logo-name span { color: var(--blue); }

  .bm-nav {
    list-style: none;
    display: flex; align-items: center; gap: 8px;
    margin-left: 4px;
    flex-shrink: 0;
  }
  .bm-nav a {
    text-decoration: none;
    font-size: 13px; font-weight: 600;
    color: var(--text-2);
    padding: 6px 8px;
    border-radius: 8px;
    transition: background .15s, color .15s;
    white-space: nowrap;
  }
  .bm-nav a:hover { background: var(--blue-light); color: var(--blue); }
  .bm-nav a.active { color: var(--blue); background: var(--blue-light); }

  .bm-header-search {
    flex: 1;
    min-width: 140px;
    max-width: 360px;
    display: flex; align-items: center; gap: 8px;
    background: #fff;
    border: 1.5px solid var(--border);
    border-radius: 999px;
    padding: 8px 12px;
  }
  .bm-header-search input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--text);
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-width: 80px;
  }
  .bm-search-ico { color: var(--text-3); display: flex; }

  .bm-header-actions {
    display: flex; align-items: center; gap: 6px;
    flex-shrink: 0;
  }

  .bm-wallet-chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 36px; padding: 0 10px;
    border-radius: 999px;
    background: var(--orange-light);
    border: 1.5px solid #FED7AA;
    cursor: pointer;
    font-size: 12px; font-weight: 700;
    color: var(--orange);
    transition: background .15s;
    white-space: nowrap;
  }
  .bm-wallet-chip:hover { background: #FEE9D3; }
  .bm-wallet-chip span { 
    display: inline-block;
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bm-hbtn {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 10px; border: 1.5px solid var(--border);
    background: #fff; padding: 6px 10px;
    cursor: pointer; font-weight: 600; font-size: 12px;
    color: var(--text);
    white-space: nowrap;
  }
  .bm-hbtn-icon { 
    width: 36px; height: 36px; 
    padding: 0; 
    justify-content: center; 
    flex-shrink: 0;
  }
  .bm-hbtn-primary {
    background: var(--blue); border-color: var(--blue); color: #fff;
    padding: 6px 12px;
  }

  .bm-menu-btn {
    display: none;
    width: 36px; height: 36px;
    border-radius: 50%; border: 1.5px solid var(--border);
    background: var(--white); cursor: pointer;
    align-items: center; justify-content: center;
    color: var(--text);
    flex-shrink: 0;
  }

  /* Page Layout */
  .bm-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px 16px 60px;
    width: 100%;
  }

  /* Hero */
  .bm-hero {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 20px;
    margin-bottom: 40px;
  }
  .bm-hero-main {
    border-radius: var(--radius-lg);
    padding: 40px 36px;
    position: relative; overflow: hidden;
    min-height: 300px;
    display: flex; flex-direction: column; justify-content: flex-end;
    cursor: pointer;
    transition: transform .2s;
    background-size: cover; background-position: center;
  }
  .bm-hero-main:hover { transform: scale(1.01); }
  .bm-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.2);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.3);
    border-radius: 50px; padding: 4px 10px;
    font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,.95);
    letter-spacing: .06em; text-transform: uppercase;
    margin-bottom: 12px; width: fit-content;
  }
  .bm-hero-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(24px, 4vw, 38px); font-weight: 800; color: #fff;
    line-height: 1.15; letter-spacing: -.02em;
    margin-bottom: 8px;
  }
  .bm-hero-sub { font-size: 14px; color: rgba(255,255,255,.85); margin-bottom: 20px; }
  .bm-hero-cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff; border: none; border-radius: 50px;
    padding: 10px 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; color: #0F172A;
    cursor: pointer;
    width: fit-content;
    transition: transform .15s, box-shadow .15s;
  }
  .bm-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }

  .bm-hero-side { display: flex; flex-direction: column; gap: 20px; }
  .bm-mini-banner {
    flex: 1;
    border-radius: var(--radius-lg);
    padding: 20px 20px;
    position: relative; overflow: hidden;
    cursor: pointer;
    transition: transform .18s;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  .bm-mini-banner:hover { transform: translateX(3px); }
  .bm-mini-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 18px; font-weight: 700; color: #fff;
    line-height: 1.2; margin-bottom: 4px;
  }
  .bm-mini-sub { font-size: 12px; color: rgba(255,255,255,.8); margin-bottom: 10px; }
  .bm-mini-cta {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.2); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.35);
    border-radius: 50px; padding: 6px 14px;
    font-size: 12px; font-weight: 700; color: #fff;
    cursor: pointer; border: none; width: fit-content;
    transition: background .15s;
  }
  .bm-mini-cta:hover { background: rgba(255,255,255,.3); }

  .bm-dots { display: flex; gap: 6px; margin-top: 16px; }
  .bm-dot { width: 7px; height: 7px; border-radius: 99px; background: rgba(255,255,255,.55); }
  .bm-dot.active { width: 20px; background: #fff; }

  /* Mobile carousel + bottom nav */
  .bm-hero-carousel-wrap { display: none; }
  .bm-hero-carousel {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 100%;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .bm-hero-carousel::-webkit-scrollbar { display: none; }
  .bm-hero-card {
    scroll-snap-align: start;
    border-radius: var(--radius-lg);
    padding: 24px 20px;
    min-height: 200px;
    display: flex; flex-direction: column; justify-content: flex-end;
    background-size: cover; background-position: center;
  }
  .bm-mobile-dots { justify-content: center; margin-top: 12px; }
  .bm-mobile-only { display: none; }
  .bm-desktop-only { display: block; }

  /* Section */
  .bm-section { margin-bottom: 40px; }
  .bm-section-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .bm-section-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 20px; font-weight: 800; color: var(--text);
    letter-spacing: -.02em;
  }
  .bm-section-sub { font-size: 13px; color: var(--text-3); margin-top: 2px; }
  .bm-see-all {
    display: flex; align-items: center; gap: 4px;
    font-size: 13px; font-weight: 700; color: var(--blue);
    background: none; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 0;
    transition: gap .15s;
  }
  .bm-see-all:hover { gap: 7px; }

  /* Categories */
  .bm-cats-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 12px;
  }
  .bm-cat {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 16px 8px 14px;
    background: var(--card);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    cursor: pointer;
    transition: transform .18s, border-color .18s, box-shadow .18s;
    text-align: center;
  }
  .bm-cat:hover {
    transform: translateY(-4px);
    border-color: transparent;
    box-shadow: var(--shadow);
  }
  .bm-cat-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid var(--border);
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    transition: transform .18s;
  }
  .bm-cat-icon img { width: 100%; height: 100%; object-fit: cover; }
  .bm-cat:hover .bm-cat-icon { transform: scale(1.08); }
  .bm-cat-label { font-size: 11px; font-weight: 600; color: var(--text); line-height: 1.3; }

  /* Flash Bar */
  .bm-flash-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, #FF4500 0%, #FF6B35 40%, #FF8C69 100%);
    border-radius: var(--radius);
    padding: 12px 18px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .bm-flash-left { display: flex; align-items: center; gap: 10px; }
  .bm-flash-zap {
    width: 32px; height: 32px;
    background: rgba(255,255,255,.2);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .bm-flash-label {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800; color: #fff;
    letter-spacing: -.01em;
  }
  .bm-flash-desc { font-size: 12px; color: rgba(255,255,255,.8); margin-top: 1px; }
  .bm-flash-right { display: flex; align-items: center; gap: 10px; }
  .bm-timer-blocks {
    display: flex; align-items: center; gap: 4px;
  }
  .bm-timer-block {
    background: rgba(0,0,0,.2);
    color: #fff; font-weight: 700; font-size: 12px;
    padding: 5px 8px; border-radius: 8px;
    min-width: 30px; text-align: center;
  }
  .bm-timer-sep { color: rgba(255,255,255,.8); font-weight: 700; }

  /* Products toolbar */
  .bm-products-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .bm-products-count { font-size: 13px; color: var(--text-3); font-weight: 600; }
  .bm-toolbar-right { display: flex; align-items: center; gap: 8px; }
  .bm-filter-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 10px; border-radius: 8px;
    border: 1.5px solid var(--border); background: #fff;
    cursor: pointer; font-weight: 600; font-size: 12px; color: var(--text);
  }
  .bm-view-toggle { display: flex; gap: 4px; }
  .bm-view-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1.5px solid var(--border); background: #fff;
    cursor: pointer; color: var(--text-2);
  }
  .bm-view-btn.active { color: var(--blue); border-color: var(--blue); background: var(--blue-light); }

  /* Products grid */
  .bm-products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .bm-products-grid.list { grid-template-columns: 1fr; }

  .bm-product-card {
    background: var(--card);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    transition: transform .18s, box-shadow .18s;
    display: flex; flex-direction: column;
  }
  .bm-product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
  .bm-product-img-wrap {
    position: relative; height: 200px;
    background: #EEF2FF;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .bm-product-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .bm-badge-wrap {
    position: absolute; top: 8px; left: 8px;
    display: flex; flex-wrap: wrap; gap: 4px;
  }
  .bm-badge {
    display: inline-flex; align-items: center; gap: 4px;
    border-radius: 999px; padding: 3px 6px;
    font-size: 9px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase;
  }
  .bm-badge-flash { background: #FEF3C7; color: #92400E; }
  .bm-badge-new { background: #DBEAFE; color: #1D4ED8; }
  .bm-badge-sale { background: #FEE2E2; color: #B91C1C; }
  .bm-badge-low { background: #EDE9FE; color: #6D28D9; }

  .bm-product-wishlist {
    position: absolute; top: 8px; right: 8px;
    width: 32px; height: 32px; border-radius: 50%;
    border: 1.5px solid var(--border);
    background: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .bm-product-wishlist.active { border-color: #FCA5A5; background: #FFF1F2; }

  .bm-product-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; }
  .bm-product-store { font-size: 11px; color: var(--text-3); font-weight: 600; }
  .bm-product-name { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.3; }
  .bm-product-meta-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-3); flex-wrap: wrap; }
  .bm-product-stars { display: inline-flex; align-items: center; gap: 3px; }
  .bm-product-rating-val { font-weight: 700; color: var(--text); }
  .bm-product-reviews { color: var(--text-3); }
  .bm-product-sold { margin-left: auto; font-weight: 600; }

  .bm-product-price-row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .bm-product-price { font-size: 15px; font-weight: 800; color: var(--blue); }
  .bm-product-old { font-size: 11px; color: #94A3B8; text-decoration: line-through; }
  .bm-product-off {
    background: #FEE2E2; color: #B91C1C;
    font-size: 10px; font-weight: 700; padding: 2px 5px;
    border-radius: 5px;
  }

  .bm-product-cta {
    margin-top: 6px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 8px 10px; border-radius: 8px;
    border: 1.5px solid var(--border);
    background: #fff; font-weight: 700; font-size: 11px; color: var(--text-2);
  }

  .bm-product-prices { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .bm-product-original { font-size: 11px; color: #94A3B8; text-decoration: line-through; }
  .bm-product-discount-tag {
    background: #FEE2E2; color: #B91C1C;
    font-size: 10px; font-weight: 700; padding: 2px 5px;
    border-radius: 5px;
  }
  .bm-product-sep { width: 1px; height: 10px; background: #E2E8F0; }
  .bm-product-actions { display: flex; gap: 6px; margin-top: 8px; }
  .bm-add-cart {
    flex: 1;
    background: var(--blue); color: #fff;
    border: 1.5px solid var(--blue);
    border-radius: 8px;
    padding: 8px 10px;
    font-weight: 700; font-size: 11px;
    cursor: pointer;
  }
  .bm-quick-view {
    background: #fff; color: var(--text-2);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
    font-weight: 700; font-size: 11px;
    cursor: pointer;
  }

  /* Top selling */
  .bm-top-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  .bm-top-card {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    background: #fff; cursor: pointer;
    transition: transform .15s, box-shadow .15s;
  }
  .bm-top-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
  .bm-top-rank {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--blue-light); color: var(--blue); font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0;
  }
  .bm-top-rank.top { background: #FEF3C7; color: #92400E; }
  .bm-top-img { width: 60px; height: 60px; border-radius: 10px; overflow: hidden; background: #EEF2FF; flex-shrink: 0; }
  .bm-top-img img { width: 100%; height: 100%; object-fit: cover; }
  .bm-top-info { flex: 1; min-width: 0; }
  .bm-top-name { font-size: 13px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bm-top-store { font-size: 11px; color: var(--text-3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bm-top-price { font-size: 13px; font-weight: 800; color: var(--blue); margin-top: 4px; }
  .bm-top-right { text-align: right; flex-shrink: 0; }
  .bm-top-sold { font-size: 10px; color: var(--text-3); font-weight: 600; }
  .bm-top-stars { display: inline-flex; align-items: center; gap: 3px; margin-top: 4px; }

  /* Footer */
  .bm-footer { background: var(--text); color: #fff; width: 100%; }
  .bm-footer-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 40px 16px 24px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 30px;
  }
  .bm-footer-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .bm-footer-logo-mark {
    width: 32px; height: 32px;
    border-radius: 8px; background: var(--blue);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .bm-footer-logo-mark img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
  .bm-footer-logo-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800;
    letter-spacing: -.02em;
  }
  .bm-footer-logo-name span { color: #60A5FA; }
  .bm-footer-desc { font-size: 12px; color: #94A3B8; line-height: 1.6; max-width: 260px; }
  .bm-footer-col-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #CBD5E1; margin-bottom: 12px; }
  .bm-footer-links { display: flex; flex-direction: column; gap: 6px; }
  .bm-footer-links a { font-size: 12px; color: #94A3B8; text-decoration: none; transition: color .15s; }
  .bm-footer-links a:hover { color: #fff; }
  .bm-footer-bottom {
    max-width: 1280px; margin: 0 auto;
    padding: 16px 16px;
    border-top: 1px solid #1E293B;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; color: #64748B;
    flex-wrap: wrap;
    gap: 10px;
  }

  /* Bottom nav */
  .bm-bottom-nav {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    display: none;
    background: #fff;
    border-top: 1px solid var(--border);
    padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
    z-index: 50;
    box-shadow: 0 -8px 24px rgba(15,23,42,.08);
    width: 100%;
  }
  .bm-bottom-nav-inner {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    gap: 4px;
    justify-content: space-around;
  }
  .bm-bottom-item {
    flex: 1;
    background: none;
    border: none;
    padding: 6px 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    color: #94A3B8;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
  }
  .bm-bottom-item svg { width: 18px; height: 18px; }
  .bm-bottom-item.active { color: var(--blue); }
  .bm-bottom-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--blue); }

  /* Loading skeleton */
  @keyframes shimmer {
    0% { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .bm-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 600px 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .bm-header-inner { padding: 12px; }
    .bm-nav { gap: 4px; }
    .bm-nav a { padding: 6px; font-size: 12px; }
  }

  @media (max-width: 1100px) {
    .bm-cats-grid { grid-template-columns: repeat(4, 1fr); }
    .bm-products-grid { grid-template-columns: repeat(3, 1fr); }
    .bm-footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
    .bm-header-actions .bm-hbtn-primary span { 
      display: inline-block;
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (max-width: 900px) {
    .bm-hero { grid-template-columns: 1fr; }
    .bm-hero-side { flex-direction: row; }
    .bm-nav { display: none; }
    .bm-menu-btn { display: flex; }
    .bm-header-search { max-width: 240px; }
    .bm-top-grid { grid-template-columns: 1fr; }
    .bm-wallet-chip span { max-width: 70px; }
  }

  @media (max-width: 820px) {
    .bm-bottom-nav { display: block; }
    .bm-page { padding-bottom: 90px; }
    .bm-hero-carousel-wrap { display: block; }
    .bm-mobile-only { display: block; }
    .bm-desktop-only { display: none; }
    .bm-header-search { max-width: 180px; }
  }

  @media (max-width: 680px) {
    .bm-header-inner { padding: 10px 8px; gap: 8px; }
    .bm-header-search { 
      min-width: 120px; 
      padding: 6px 10px;
    }
    .bm-header-search input { font-size: 12px; }
    .bm-products-grid { grid-template-columns: repeat(2, 1fr); }
    .bm-cats-grid { grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .bm-hero-title { font-size: 24px; }
    .bm-hbtn:not(.bm-hbtn-icon):not(.bm-wallet-chip) span { display: none; }
    .bm-footer-inner { grid-template-columns: 1fr; }
    .bm-wallet-chip span { display: none; }
    .bm-hbtn-primary { padding: 6px 8px; }
    .bm-header-actions { gap: 4px; }
  }

  @media (max-width: 480px) {
    .bm-header-search { min-width: 100px; }
    .bm-products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .bm-product-img-wrap { height: 150px; }
    .bm-hero-side { flex-direction: column; }
    .bm-cats-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .bm-cat { padding: 10px 6px 8px; }
    .bm-cat-icon { width: 40px; height: 40px; }
    .bm-cat-label { font-size: 10px; }
    .bm-flash-bar { padding: 10px 12px; }
    .bm-flash-label { font-size: 14px; }
    .bm-timer-block { padding: 4px 6px; min-width: 26px; font-size: 11px; }
  }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .bm-animate { animation: fadeUp .4s ease both; }
  .bm-animate-1 { animation-delay: .05s; }
  .bm-animate-2 { animation-delay: .1s; }
  .bm-animate-3 { animation-delay: .15s; }
  .bm-animate-4 { animation-delay: .2s; }`

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useCountdown(init: number) {
  const [secs, setSecs] = useState(init)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return { h, m, s }
}

// ─── Banner Carousel ──────────────────────────────────────────────────────────
function HeroBanner() {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % BANNERS.length
        if (ref.current) {
          ref.current.scrollTo({ left: next * ref.current.clientWidth, behavior: 'smooth' })
        }
        return next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const onScroll = () => {
    if (!ref.current) return
    setActive(Math.round(ref.current.scrollLeft / ref.current.clientWidth))
  }

  const mainBanner = BANNERS[0]
  const sideBanners = BANNERS.slice(1)

  return (
    <>
      <div className="bm-hero bm-animate bm-desktop-only">
        {/* Main banner */}
        <div
          className="bm-hero-main"
          style={{
            backgroundImage: `linear-gradient(145deg, ${mainBanner.from}E6, ${mainBanner.to}CC), url(${mainBanner.img})`,
          }}
        >
          <div className="bm-hero-eyebrow"><TagIcon /> Limited Offer</div>
          <div className="bm-hero-title">{mainBanner.title}</div>
          <div className="bm-hero-sub">{mainBanner.headline}</div>
          <button className="bm-hero-cta" type="button">{mainBanner.cta} →</button>
          <div className="bm-dots">
            {BANNERS.map((_, i) => (
              <div key={i} className={`bm-dot ${i === active ? 'active' : ''}`} />
            ))}
          </div>
        </div>
        {/* Side banners */}
        <div className="bm-hero-side">
          {sideBanners.map(b => (
            <div
              key={b.id}
              className="bm-mini-banner"
              style={{
                backgroundImage: `linear-gradient(135deg, ${b.from}E6, ${b.to}CC), url(${b.img})`,
              }}
            >
              <div className="bm-mini-title">{b.title}</div>
              <div className="bm-mini-sub">{b.headline}</div>
              <button className="bm-mini-cta" type="button">{b.cta} →</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bm-hero-carousel-wrap bm-animate bm-mobile-only">
        <div className="bm-hero-carousel" ref={ref} onScroll={onScroll}>
          {BANNERS.map(b => (
            <div
              key={b.id}
              className="bm-hero-card"
              style={{
                backgroundImage: `linear-gradient(145deg, ${b.from}E6, ${b.to}CC), url(${b.img})`,
              }}
            >
              <div className="bm-hero-eyebrow"><TagIcon /> Limited Offer</div>
              <div className="bm-hero-title">{b.title}</div>
              <div className="bm-hero-sub">{b.headline}</div>
              <button className="bm-hero-cta" type="button">{b.cta} →</button>
            </div>
          ))}
        </div>
        <div className="bm-dots bm-mobile-dots">
          {BANNERS.map((_, i) => (
            <div key={i} className={`bm-dot ${i === active ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </>
  )
}

function ProductCard({
  item,
  wishlisted,
  onWishlist,
  onNavigate,
  badge,
}: {
  item: Product
  wishlisted: boolean
  onWishlist: (id: string) => void
  onNavigate: (id: string) => void
  badge?: 'flash' | 'new' | 'sale'
}) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

  const discountPct =
    item.price && item.discountPrice && item.price > item.discountPrice
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : null

  return (
    <div className="bm-product-card" onClick={() => onNavigate(item.id)}>
      <div className="bm-product-img-wrap">
        <img src={item.images?.[0] ?? '/second.jpg'} alt={item.name} loading="lazy" />
        <div className="bm-badge-wrap">
          {badge === 'flash' && <span className="bm-badge bm-badge-flash"><ZapIcon /> Flash</span>}
          {badge === 'new' && <span className="bm-badge bm-badge-new">New</span>}
          {badge === 'sale' && discountPct && (
            <span className="bm-badge bm-badge-sale">-{discountPct}%</span>
          )}
          {item.stockQuantity !== undefined && item.stockQuantity <= 5 && item.stockQuantity > 0 && (
            <span className="bm-badge bm-badge-low">Low Stock</span>
          )}
        </div>
        <button
          className={`bm-product-wishlist ${wishlisted ? 'active' : ''}`}
          type="button"
          onClick={e => { e.stopPropagation(); onWishlist(item.id) }}
        >
          <HeartIcon filled={wishlisted} />
        </button>
      </div>
      <div className="bm-product-body">
        {item.storeName && <div className="bm-product-store">{item.storeName}</div>}
        <div className="bm-product-name">{item.name}</div>
        {(item.rating !== undefined || item.totalReviews !== undefined) && (
          <div className="bm-product-meta-row">
            <div className="bm-product-stars">
              {[1,2,3,4,5].map(s => (
                <StarIcon key={s} size={10} />
              ))}
            </div>
            <span className="bm-product-rating-val">{(item.rating ?? 0).toFixed(1)}</span>
            <span className="bm-product-reviews">({item.totalReviews ?? 0})</span>
            {item.totalSold ? (
              <>
                <div className="bm-product-sep" />
                <span className="bm-product-sold">{item.totalSold} sold</span>
              </>
            ) : null}
          </div>
        )}
        <div className="bm-product-prices">
          <span className="bm-product-price">
            {formatCurrency(item.discountPrice ?? item.price)}
          </span>
          {item.discountPrice && item.price > item.discountPrice && (
            <span className="bm-product-original">{formatCurrency(item.price)}</span>
          )}
          {discountPct && <span className="bm-product-discount-tag">-{discountPct}%</span>}
        </div>
        <div className="bm-product-actions">
          <button
            className="bm-quick-view"
            type="button"
            onClick={e => { e.stopPropagation(); onNavigate(item.id) }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Menu Modal ─────────────────────────────────────────────────────────
function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '280px',
        height: '100%',
        background: '#fff',
        padding: '24px 20px',
        overflowY: 'auto',
        animation: 'slideIn 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {NAV_LINKS.map(l => (
            <a
              key={l.label}
              href={l.path}
              style={{
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text)',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
              }}
              onClick={e => {
                e.preventDefault()
                navigate(l.path)
                onClose()
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [userName, setUserName] = useState('Guest')
  const [walletBalance, setWalletBalance] = useState(0)
  const [flashItems, setFlashItems] = useState<Product[]>([])
  const [topSelling, setTopSelling] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const countdown = useCountdown(9910)

  const { user } = useAuth()
  const { userData } = useUserData(user?.uid)
  const { products } = useProducts(8)

  useEffect(() => {
    if (userData?.firstName) setUserName(userData.firstName)
  }, [userData])

  useEffect(() => {
    if (userData?.balance !== undefined) setWalletBalance(userData.balance)
  }, [userData])

  useEffect(() => {
    if (products.length > 0) {
      setTopSelling(products)
      setFlashItems(products.slice(0, 8))
      setLoadingProducts(false)
    }
  }, [products])

  const toggleWishlist = (id: string) =>
    setWishlist(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getShortName = (name: string) => {
    if (name.length > 8) return name.substring(0, 6) + '...'
    return name
  }

  return (
    <>
      <style>{css}</style>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      <div className="bm-root">

        {/* Announcement Bar */}
        <div className="bm-announce">
          <TruckIcon />
          <span>Free delivery on all orders above</span>
          <strong>₦10,000</strong>
          <span>·</span>
          <strong>Student deals every day on Blorbmart</strong>
        </div>

        {/* Header */}
        <header className="bm-header">
          <div className="bm-header-inner">
            {/* Logo */}
            <div className="bm-logo" onClick={() => navigate('/dashboard')}>
              <div className="bm-logo-mark">
                <img src="/bluelogo.png" alt="Blorbmart" />
              </div>
              <span className="bm-logo-name">Blorb<span>mart</span></span>
            </div>

            {/* Nav links - hidden on mobile */}
            <ul className="bm-nav">
              {NAV_LINKS.map(l => (
                <li key={l.label}>
                  <a
                    href={l.path}
                    className={l.path === '/dashboard' ? 'active' : ''}
                    onClick={e => { e.preventDefault(); navigate(l.path) }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Search */}
            <div className="bm-header-search">
              <span className="bm-search-ico"><SearchIcon /></span>
              <input placeholder="Search..." />
            </div>

            {/* Actions */}
            <div className="bm-header-actions">
              {/* Wallet */}
              <button
                className="bm-wallet-chip"
                type="button"
                onClick={() => navigate('/wallet')}
              >
                <WalletIcon />
                <span>{formatCurrency(walletBalance)}</span>
              </button>

              {/* Wishlist - hide text on mobile */}
              <button
                className="bm-hbtn bm-hbtn-icon"
                type="button"
                onClick={() => navigate('/wishlist')}
                title="Wishlist"
              >
                <HeartIcon filled={false} />
              </button>

              {/* Cart */}
              <button
                className="bm-hbtn bm-hbtn-icon"
                type="button"
                onClick={() => navigate('/cart')}
                title="Cart"
              >
                <CartIcon count={2} />
              </button>

              {/* Notifications - hide on very small screens */}
              <button
                className="bm-hbtn bm-hbtn-icon bm-desktop-only"
                type="button"
                title="Notifications"
              >
                <BellIcon />
              </button>

              {/* Account */}
              <button
                className="bm-hbtn bm-hbtn-primary"
                type="button"
                onClick={() => navigate('/profile')}
              >
                <UserCircleIcon />
                <span title={userName}>{getShortName(getGreeting().split(' ')[1])}, {getShortName(userName)}</span>
              </button>

              {/* Mobile menu */}
              <button 
                className="bm-menu-btn" 
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu Modal */}
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        {/* Page Content */}
        <main className="bm-page">

          {/* Hero */}
          <HeroBanner />

          {/* Categories */}
          <section className="bm-section bm-animate bm-animate-2">
            <div className="bm-section-head">
              <div>
                <div className="bm-section-title">Shop by Category</div>
                <div className="bm-section-sub">Find exactly what you need</div>
              </div>
              <button className="bm-see-all" type="button">
                All <ChevronRightIcon />
              </button>
            </div>
            <div className="bm-cats-grid">
              {CATEGORIES.map(c => (
                <div key={c.id} className="bm-cat" onClick={() => navigate(`/category/${c.id}`)}>
                  <div className="bm-cat-icon"><img src={c.img} alt={c.label} loading="lazy" /></div>
                  <span className="bm-cat-label">{c.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Flash Sale */}
          <section className="bm-section bm-animate bm-animate-3">
            <div className="bm-flash-bar">
              <div className="bm-flash-left">
                <div className="bm-flash-zap"><ZapIcon /></div>
                <div className="bm-flash-text">
                  <div className="bm-flash-label">Flash Sales</div>
                  <div className="bm-flash-desc">Limited time offers</div>
                </div>
              </div>
              <div className="bm-flash-right">
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', textAlign: 'right', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                  <ClockIcon /> Ends in
                </div>
                <div className="bm-timer-blocks">
                  <div className="bm-timer-block">{countdown.h}</div>
                  <span className="bm-timer-sep">:</span>
                  <div className="bm-timer-block">{countdown.m}</div>
                  <span className="bm-timer-sep">:</span>
                  <div className="bm-timer-block">{countdown.s}</div>
                </div>
              </div>
            </div>

            {/* Products grid toolbar */}
            <div className="bm-products-toolbar">
              <div className="bm-products-count">
                {loadingProducts ? 'Loading...' : `${flashItems.length} deals`}
              </div>
              <div className="bm-toolbar-right">
                <button className="bm-filter-btn" type="button">
                  <FilterIcon /> Filter
                </button>
                <div className="bm-view-toggle">
                  <button
                    className={`bm-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setViewMode('grid')}
                  >
                    <GridIcon />
                  </button>
                  <button
                    className={`bm-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    type="button"
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon />
                  </button>
                </div>
              </div>
            </div>

            {loadingProducts ? (
              <div className={`bm-products-grid ${viewMode === 'list' ? 'list' : ''}`}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1.5px solid #E2E8F0' }}>
                    <div className="bm-skeleton" style={{ height: 180 }} />
                    <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="bm-skeleton" style={{ height: 12, width: '60%' }} />
                      <div className="bm-skeleton" style={{ height: 10, width: '40%' }} />
                      <div className="bm-skeleton" style={{ height: 18, width: '50%' }} />
                      <div className="bm-skeleton" style={{ height: 34 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : flashItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-3)', fontSize: 13 }}>
                No flash deals right now — check back soon!
              </div>
            ) : (
              <div className={`bm-products-grid ${viewMode === 'list' ? 'list' : ''}`}>
                {flashItems.map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    badge="flash"
                    wishlisted={wishlist.has(item.id)}
                    onWishlist={toggleWishlist}
                    onNavigate={id => navigate(`/product/${id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Top Selling */}
          <section className="bm-section bm-animate bm-animate-4">
            <div className="bm-section-head">
              <div>
                <div className="bm-section-title">Top Selling</div>
                <div className="bm-section-sub">Products loved by students</div>
              </div>
              <button className="bm-see-all" type="button">
                See more <ChevronRightIcon />
              </button>
            </div>
            {loadingProducts ? (
              <div className="bm-top-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E2E8F0', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="bm-skeleton" style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0 }} />
                    <div className="bm-skeleton" style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="bm-skeleton" style={{ height: 12, width: '80%' }} />
                      <div className="bm-skeleton" style={{ height: 10, width: '50%' }} />
                      <div className="bm-skeleton" style={{ height: 14, width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bm-top-grid">
                {topSelling.map((item, i) => (
                  <div
                    key={item.id}
                    className="bm-top-card"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <div className={`bm-top-rank ${i < 3 ? 'top' : ''}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>
                    <div className="bm-top-img">
                      <img src={item.images?.[0] ?? '/second.jpg'} alt={item.name} loading="lazy" />
                    </div>
                    <div className="bm-top-info">
                      <div className="bm-top-name">{item.name}</div>
                      <div className="bm-top-store">{item.storeName ?? 'Store'}</div>
                      <div className="bm-top-price">
                        {formatCurrency(item.discountPrice ?? item.price)}
                      </div>
                    </div>
                    <div className="bm-top-right">
                      <div className="bm-top-sold">{item.totalSold ?? 0} sold</div>
                      <div className="bm-top-stars">
                        <StarIcon size={10} />
                        <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>
                          {(item.rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <button
                        style={{
                          marginTop: 6, background: 'none',
                          border: '1.5px solid var(--border)',
                          borderRadius: 6, padding: '4px 8px',
                          fontSize: 10, fontWeight: 700,
                          color: 'var(--text-2)', cursor: 'pointer',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          transition: 'border-color .15s, color .15s',
                        }}
                        type="button"
                        onClick={e => { e.stopPropagation(); toggleWishlist(item.id) }}
                      >
                        {wishlist.has(item.id) ? '♥ Saved' : '♡ Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>

        {/* Footer */}
        <footer className="bm-footer">
          <div className="bm-footer-inner">
            <div className="bm-footer-brand">
              <div className="bm-footer-logo">
                <div className="bm-footer-logo-mark">
                  <img src="/bluelogo.png" alt="" />
                </div>
                <span className="bm-footer-logo-name">Blorb<span>mart</span></span>
              </div>
              <p className="bm-footer-desc">
                The campus marketplace built for students — buy, sell, and get fast delivery right on your doorstep.
              </p>
            </div>
            <div>
              <div className="bm-footer-col-title">Shop</div>
              <div className="bm-footer-links">
                {['All Products', 'Flash Deals', 'Top Selling', 'New Arrivals', 'Categories'].map(l => (
                  <a key={l} href="#">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="bm-footer-col-title">Account</div>
              <div className="bm-footer-links">
                {['My Orders', 'Wishlist', 'Wallet', 'Profile Settings', 'Track Order'].map(l => (
                  <a key={l} href="#">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="bm-footer-col-title">Support</div>
              <div className="bm-footer-links">
                {['Help Center', 'Become a Seller', 'Become a Rider', 'Contact Us', 'Privacy Policy'].map(l => (
                  <a key={l} href="#">{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="bm-footer-bottom">
            <span>© 2025 Blorbmart. Built for campus life.</span>
            <span>Made with ❤️ in Nigeria</span>
          </div>
        </footer>

        {/* Bottom Navigation */}
        <nav className="bm-bottom-nav">
          <div className="bm-bottom-nav-inner">
            <button
              className={`bm-bottom-item ${activeTab === 'home' ? 'active' : ''}`}
              type="button"
              onClick={() => { setActiveTab('home'); navigate('/dashboard') }}
            >
              <HomeIcon filled={activeTab === 'home'} />
              Home
              {activeTab === 'home' && <span className="bm-bottom-dot" />}
            </button>
            <button
              className={`bm-bottom-item ${activeTab === 'wishlist' ? 'active' : ''}`}
              type="button"
              onClick={() => { setActiveTab('wishlist'); navigate('/wishlist') }}
            >
              <HeartIcon filled={activeTab === 'wishlist'} />
              Wishlist
              {activeTab === 'wishlist' && <span className="bm-bottom-dot" />}
            </button>
            <button
              className={`bm-bottom-item ${activeTab === 'orders' ? 'active' : ''}`}
              type="button"
              onClick={() => { setActiveTab('orders'); navigate('/transactions') }}
            >
              <ReceiptIcon filled={activeTab === 'orders'} />
              Orders
              {activeTab === 'orders' && <span className="bm-bottom-dot" />}
            </button>
            <button
              className={`bm-bottom-item ${activeTab === 'account' ? 'active' : ''}`}
              type="button"
              onClick={() => { setActiveTab('account'); navigate('/profile') }}
            >
              <UserIcon filled={activeTab === 'account'} />
              Account
              {activeTab === 'account' && <span className="bm-bottom-dot" />}
            </button>
          </div>
        </nav>

      </div>
    </>
  )
}
