import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #4F5BFF;
    --bg: #F7F8FC;
    --text: #1F2937;
    --muted: #7C8AA5;
    --card: #fff;
    --border: #EEF0F5;
  }

  .pf-root { min-height: 100dvh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
  .pf-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 18px 12px; background: #fff; position: sticky; top: 0; z-index: 10;
    box-shadow: 0 2px 16px rgba(0,0,0,.05);
  }
  .pf-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 18px; }
  .pf-icon-btn { width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--border); background: #fff; display: grid; place-items: center; }

  .pf-hero { display: grid; place-items: center; text-align: center; padding: 26px 20px 12px; }
  .pf-avatar {
    width: 110px; height: 110px; border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #EEF0FF, #E5E9FF 60%, #D9E0FF);
    display: grid; place-items: center; color: var(--blue);
    margin-bottom: 14px;
  }
  .pf-name { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; }
  .pf-email { font-size: 13px; color: var(--muted); margin-top: 6px; }
  .pf-chip {
    margin-top: 12px;
    display: inline-flex; align-items: center; gap: 6px;
    background: #E8F7ED; color: #22C55E; border: 1px solid #CDEED9;
    padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
  }

  .pf-wallet {
    margin: 18px 18px 0; padding: 18px; border-radius: 20px;
    background: linear-gradient(135deg, #4F5BFF, #3E4BFF);
    color: #fff; box-shadow: 0 12px 32px rgba(79,91,255,.3);
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .pf-wallet-label { font-size: 12px; opacity: .85; }
  .pf-wallet-amount { font-size: 22px; font-weight: 800; margin-top: 6px; }
  .pf-wallet-icon {
    width: 46px; height: 46px; border-radius: 14px;
    background: rgba(255,255,255,.18);
    display: grid; place-items: center;
  }

  .pf-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 18px 4px; }
  .pf-stat {
    background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 14px;
    display: grid; place-items: center; gap: 8px;
  }
  .pf-stat-icon {
    width: 44px; height: 44px; border-radius: 50%;
    background: #EEF0FF; color: var(--blue); display: grid; place-items: center;
  }
  .pf-stat-value { font-size: 18px; font-weight: 700; }
  .pf-stat-label { font-size: 12px; color: var(--muted); }

  .pf-section { padding: 10px 18px 0; }
  .pf-section h3 { font-family: 'Sora', sans-serif; font-size: 16px; margin: 16px 0 12px; }

  .pf-list { display: grid; gap: 12px; }
  .pf-item {
    background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 14px;
    display: flex; align-items: center; gap: 12px; cursor: pointer;
  }
  .pf-item-icon {
    width: 44px; height: 44px; border-radius: 50%;
    display: grid; place-items: center; font-size: 18px;
  }
  .pf-item-text { flex: 1; }
  .pf-item-title { font-weight: 600; }
  .pf-item-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .pf-item-arrow { color: #c2c8d4; }

  .pf-logout {
    margin: 22px 18px 36px;
    width: calc(100% - 36px);
    padding: 14px 18px;
    border-radius: 16px;
    border: 1.5px solid #F2B3B3;
    background: #fff;
    color: #E05050;
    font-weight: 700;
  }
`

const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-1" />
    <path d="M17 12a2 2 0 100-4h-2a2 2 0 000 4h2z" />
  </svg>
)

const StarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const PackageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" y1="22" x2="12" y2="12" />
  </svg>
)

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

type UserProfile = {
  displayName?: string
  walletBalance?: number
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('Customer')
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login')
        return
      }
      if (user.displayName) setName(user.displayName)
      if (user.email) setEmail(user.email)
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data() as UserProfile
          if (data.displayName) setName(data.displayName)
          if (typeof data.walletBalance === 'number') setWallet(data.walletBalance)
        }
      } catch {
        // ignore
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

  return (
    <>
      <style>{css}</style>
      <div className="pf-root">
        <header className="pf-top">
          <button className="pf-icon-btn" onClick={() => navigate('/dashboard')} type="button">
            <ArrowLeft />
          </button>
          <div className="pf-title">Profile</div>
          <div style={{ width: 38 }} />
        </header>

        <section className="pf-hero">
          <div className="pf-avatar">
            <UserIcon />
          </div>
          <div className="pf-name">{name}</div>
          <div className="pf-email">{email}</div>
          <div className="pf-chip">
            <CheckIcon /> Verified Account
          </div>
        </section>

        <section className="pf-wallet">
          <div>
            <div className="pf-wallet-label">Wallet Balance</div>
            <div className="pf-wallet-amount">{formatCurrency(wallet)}</div>
          </div>
          <div className="pf-wallet-icon">
            <WalletIcon />
          </div>
        </section>

        <section className="pf-stats">
          <div className="pf-stat">
            <div className="pf-stat-icon"><PackageIcon /></div>
            <div className="pf-stat-value">0</div>
            <div className="pf-stat-label">Orders</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat-icon"><StarIcon /></div>
            <div className="pf-stat-value">0</div>
            <div className="pf-stat-label">Points</div>
          </div>
        </section>

        <section className="pf-section">
          <h3>Settings</h3>
          <div className="pf-list">
            <div className="pf-item">
              <div className="pf-item-icon" style={{ background: '#EEF0FF', color: '#4F5BFF' }}><UserIcon /></div>
              <div className="pf-item-text">
                <div className="pf-item-title">Edit Profile</div>
                <div className="pf-item-sub">Update your personal information</div>
              </div>
              <div className="pf-item-arrow"><ChevronRight /></div>
            </div>
            <div className="pf-item">
              <div className="pf-item-icon" style={{ background: '#EEF8FF', color: '#3B82F6' }}><PinIcon /></div>
              <div className="pf-item-text">
                <div className="pf-item-title">Addresses</div>
                <div className="pf-item-sub">Manage delivery addresses</div>
              </div>
              <div className="pf-item-arrow"><ChevronRight /></div>
            </div>
            <div className="pf-item">
              <div className="pf-item-icon" style={{ background: '#FFF7ED', color: '#F97316' }}><PackageIcon /></div>
              <div className="pf-item-text">
                <div className="pf-item-title">Track Orders</div>
                <div className="pf-item-sub">View and track your orders</div>
              </div>
              <div className="pf-item-arrow"><ChevronRight /></div>
            </div>
            <div className="pf-item">
              <div className="pf-item-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}><HelpIcon /></div>
              <div className="pf-item-text">
                <div className="pf-item-title">Help & Support</div>
                <div className="pf-item-sub">FAQs and contact support</div>
              </div>
              <div className="pf-item-arrow"><ChevronRight /></div>
            </div>
            <div className="pf-item">
              <div className="pf-item-icon" style={{ background: '#ECFEFF', color: '#06B6D4' }}><ShieldIcon /></div>
              <div className="pf-item-text">
                <div className="pf-item-title">Legal</div>
                <div className="pf-item-sub">Terms, policies & agreements</div>
              </div>
              <div className="pf-item-arrow"><ChevronRight /></div>
            </div>
            <div className="pf-item">
              <div className="pf-item-icon" style={{ background: '#F3F4F6', color: '#6B7280' }}><InfoIcon /></div>
              <div className="pf-item-text">
                <div className="pf-item-title">About Blorbmart</div>
                <div className="pf-item-sub">App version 1.0.0</div>
              </div>
              <div className="pf-item-arrow"><ChevronRight /></div>
            </div>
          </div>
        </section>

        <button className="pf-logout" type="button">Logout</button>
      </div>
    </>
  )
}
