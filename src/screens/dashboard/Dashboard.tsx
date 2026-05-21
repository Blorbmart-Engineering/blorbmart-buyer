import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth, useUserData, useProducts } from '../../hooks/useFirebaseData'
import { useCart } from '../../contexts/CartContext'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { HeroBanner } from '../../components/dashboard/HeroBanner'
import { CategoryGrid } from '../../components/dashboard/CategoryGrid'
import { FlashSaleSection } from '../../components/dashboard/FlashSaleSection'
import { TopSellingSection } from '../../components/dashboard/TopSellingSection'
import { FeaturedStores } from '../../components/dashboard/FeaturedStores'
import { NewArrivals } from '../../components/dashboard/NewArrivals'
import {
  SearchIcon, CartIcon, BellIcon, HeartIcon, WalletIcon,
  UserCircleIcon, MenuIcon, CloseIcon, TruckIcon,
  HomeIcon, ReceiptIcon, UserIcon,
} from '../../components/icons'

// ─── Static data ──────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Shop', path: '/shop' },
  { label: 'Categories', path: '/categories' },
  { label: 'Deals', path: '/deals' },
  { label: 'Track Order', path: '/track' },
]

const SEARCH_PLACEHOLDERS = [
  'Search for groceries…',
  'Search electronics…',
  'Search fashion items…',
  'Search beauty products…',
  'Search books & stationery…',
]

// ─── Mobile menu ───────────────────────────────────────────────────────────────
function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  if (!isOpen) return null
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{ width: 280, height: '100%', background: '#fff', padding: '24px 20px', overflowY: 'auto', animation: 'slideIn 0.3s ease' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_LINKS.map(l => (
            <button
              key={l.label}
              style={{ textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #E2E8F0', fontSize: 16, fontWeight: 600, color: '#0F172A', padding: '14px 0', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              onClick={() => { navigate(l.path); onClose() }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { itemCount } = useCart()
  const { user } = useAuth()
  const { userData } = useUserData(user?.uid)
  const { products, loading: loadingProducts } = useProducts(8)

  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [walletBalance, setWalletBalance] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  // Derive user display info
  const userName = userData?.firstName ?? 'Guest'
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Morning'
    if (h < 17) return 'Afternoon'
    return 'Evening'
  }

  // Rotate search placeholder
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % SEARCH_PLACEHOLDERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  // Wallet balance from userData/buyers doc
  useEffect(() => {
    if (userData?.balance !== undefined) setWalletBalance(userData.balance)
  }, [userData])

  // Real-time notification badge — count docs where read !== true
  useEffect(() => {
    if (!user?.uid) return
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'notifications'),
      snap => setNotifCount(snap.docs.filter(d => d.data().read !== true).length),
      () => {}
    )
    return () => unsub()
  }, [user?.uid])

  const toggleWishlist = (id: string) =>
    setWishlist(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  // Bottom nav active tab from current route
  const currentPath = location.pathname
  const activeTab =
    currentPath === '/dashboard' ? 'home'
    : currentPath === '/wishlist' ? 'wishlist'
    : currentPath === '/track' || currentPath === '/transactions' ? 'orders'
    : currentPath === '/profile' ? 'account'
    : 'home'

  const shortName = userName.length > 8 ? userName.slice(0, 6) + '…' : userName

  return (
    <>
      <style>{dashboardCss}</style>
      <div className="bm-root">

        {/* Announcement bar */}
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
            <div className="bm-logo" onClick={() => navigate('/dashboard')}>
              <div className="bm-logo-mark">
                <img src="/bluelogo.png" alt="Blorbmart" />
              </div>
              <span className="bm-logo-name">Blorb<span>mart</span></span>
            </div>

            <ul className="bm-nav">
              {NAV_LINKS.map(l => (
                <li key={l.label}>
                  <a
                    href={l.path}
                    className={currentPath === l.path ? 'active' : ''}
                    onClick={e => { e.preventDefault(); navigate(l.path) }}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <form className="bm-header-search" onSubmit={handleSearch}>
              <span className="bm-search-ico"><SearchIcon /></span>
              <input
                placeholder={SEARCH_PLACEHOLDERS[placeholderIdx]}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => navigate('/search')}
                readOnly
                style={{ cursor: 'pointer' }}
              />
            </form>

            <div className="bm-header-actions">
              <button className="bm-wallet-chip" type="button" onClick={() => navigate('/wallet')}>
                <WalletIcon />
                <span>{fmt(walletBalance)}</span>
              </button>

              <button className="bm-hbtn bm-hbtn-icon" type="button" onClick={() => navigate('/wishlist')} title="Wishlist">
                <HeartIcon filled={false} />
              </button>

              <button className="bm-hbtn bm-hbtn-icon" type="button" onClick={() => navigate('/cart')} title="Cart">
                <CartIcon count={itemCount} />
              </button>

              <button className="bm-hbtn bm-hbtn-icon bm-desktop-only" type="button" onClick={() => navigate('/notifications')} title="Notifications">
                <BellIcon count={notifCount} />
              </button>

              <button className="bm-hbtn bm-hbtn-primary" type="button" onClick={() => navigate('/profile')}>
                <UserCircleIcon />
                <span>{getGreeting()}, {shortName}</span>
              </button>

              <button className="bm-menu-btn" type="button" onClick={() => setIsMobileMenuOpen(true)}>
                <MenuIcon />
              </button>
            </div>
          </div>
        </header>

        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        <main className="bm-page">
          <HeroBanner />
          <CategoryGrid />
          <FlashSaleSection products={products} loading={loadingProducts} wishlist={wishlist} onWishlist={toggleWishlist} />
          <FeaturedStores />
          <TopSellingSection products={products} loading={loadingProducts} wishlist={wishlist} onWishlist={toggleWishlist} />
          <NewArrivals />
        </main>

        {/* Footer */}
        <footer className="bm-footer">
          <div className="bm-footer-inner">
            <div>
              <div className="bm-footer-logo">
                <div className="bm-footer-logo-mark"><img src="/bluelogo.png" alt="" /></div>
                <span className="bm-footer-logo-name">Blorb<span>mart</span></span>
              </div>
              <p className="bm-footer-desc">The campus marketplace built for students — buy, sell, and get fast delivery right on your doorstep.</p>
            </div>
            <div>
              <div className="bm-footer-col-title">Shop</div>
              <div className="bm-footer-links">
                {[['All Products', '/shop'], ['Flash Deals', '/deals'], ['Top Selling', '/shop'], ['New Arrivals', '/shop'], ['Categories', '/categories']].map(([l, p]) => (
                  <a key={l} href={p} onClick={e => { e.preventDefault(); navigate(p) }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="bm-footer-col-title">Account</div>
              <div className="bm-footer-links">
                {[['My Orders', '/track'], ['Wishlist', '/wishlist'], ['Wallet', '/wallet'], ['Profile', '/profile'], ['Track Order', '/track']].map(([l, p]) => (
                  <a key={l} href={p} onClick={e => { e.preventDefault(); navigate(p) }}>{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="bm-footer-col-title">Support</div>
              <div className="bm-footer-links">
                {[['Help Center', '/faq'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Contact Us', '#']].map(([l, p]) => (
                  <a key={l} href={p} onClick={e => { if (p !== '#') { e.preventDefault(); navigate(p) } }}>{l}</a>
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
            {[
              { tab: 'home', label: 'Home', path: '/dashboard', icon: <HomeIcon filled={activeTab === 'home'} /> },
              { tab: 'wishlist', label: 'Wishlist', path: '/wishlist', icon: <HeartIcon filled={activeTab === 'wishlist'} /> },
              { tab: 'orders', label: 'Orders', path: '/track', icon: <ReceiptIcon filled={activeTab === 'orders'} /> },
              { tab: 'account', label: 'Account', path: '/profile', icon: <UserIcon filled={activeTab === 'account'} /> },
            ].map(({ tab, label, path, icon }) => (
              <button
                key={tab}
                className={`bm-bottom-item ${activeTab === tab ? 'active' : ''}`}
                type="button"
                onClick={() => navigate(path)}
              >
                {icon}
                {label}
                {activeTab === tab && <span className="bm-bottom-dot" />}
              </button>
            ))}
          </div>
        </nav>

      </div>
    </>
  )
}
