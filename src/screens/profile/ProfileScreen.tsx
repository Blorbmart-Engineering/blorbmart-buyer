import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { useUserData } from '../../hooks/useFirebaseData'
import { apiFetchAuth } from '../../lib/api'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import {
  UserIcon, LockIcon, TrashIcon, MapPinIcon, PackageIcon, MessageIcon, DocumentIcon,
  CreditCardIcon, BagIcon, StarIcon, SunIcon, SmartphoneIcon, MoonIcon, LogoutIcon,
} from '../../components/icons'

// ─── Types ──────────────────────────────────────────────────────────────────────
type BuyerData = {
  walletBalance?: number
  loyaltyPoints?: number
  totalOrders?: number
}

type ReferralData = {
  referralCode: string
  referralCount: number
  referralEarnings: number
  buyerReferralEnabled: boolean
  buyerReferralRewardNaira: number
}

type ThemeMode = 'light' | 'system' | 'dark'

// ─── Theme helpers ──────────────────────────────────────────────────────────────
function getStoredTheme(): ThemeMode {
  return (localStorage.getItem('bm-theme') as ThemeMode) ?? 'light'
}
function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  localStorage.setItem('bm-theme', mode)
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const getInitials = (first?: string, last?: string) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?'

// ─── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  .pr-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }
  .pr-header { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.95); backdrop-filter:blur(8px); border-bottom:1.5px solid var(--border); padding:14px 20px; display:flex; align-items:center; gap:12px; }
  .pr-back { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .pr-header-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; flex:1; text-align:center; }

  .pr-body { max-width:560px; margin:0 auto; padding:28px 20px 80px; }

  /* Avatar */
  .pr-avatar-wrap { display:flex; flex-direction:column; align-items:center; margin-bottom:28px; }
  .pr-avatar { width:96px; height:96px; border-radius:50%; border:3px solid var(--blue); box-shadow:0 0 0 6px rgba(37,99,235,.12); background:var(--blue-light); display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:800; color:var(--blue); font-family:'Bricolage Grotesque',sans-serif; }
  .pr-name { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; margin-top:14px; }
  .pr-email { font-size:13px; color:var(--text-2); margin-top:4px; }
  .pr-verified { display:inline-flex; align-items:center; gap:6px; margin-top:10px; padding:6px 14px; border-radius:999px; border:1px solid #10b981; background:#d1fae5; color:#065f46; font-size:12px; font-weight:700; }

  /* Wallet card */
  .pr-wallet { border-radius:20px; background:linear-gradient(135deg,#2563EB 0%,#1d4ed8 100%); padding:20px; display:flex; align-items:center; gap:16px; cursor:pointer; box-shadow:0 8px 24px rgba(37,99,235,.35); margin-bottom:14px; }
  .pr-wallet-icon { width:54px; height:54px; border-radius:50%; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
  .pr-wallet-label { font-size:12px; color:rgba(255,255,255,.85); margin-bottom:2px; }
  .pr-wallet-balance { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; color:#fff; }

  /* Stat cards */
  .pr-stats { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; }
  .pr-stat { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:18px; text-align:center; }
  .pr-stat-icon { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; margin:0 auto 10px; }
  .pr-stat-val { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:var(--text); }
  .pr-stat-lbl { font-size:12px; color:var(--text-2); margin-top:2px; }

  /* Theme toggle */
  .pr-section-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:var(--text); margin-bottom:14px; }
  .pr-theme-wrap { background:var(--bg); border:1.5px solid var(--border); border-radius:16px; padding:5px; display:flex; gap:4px; margin-bottom:24px; }
  .pr-theme-opt { flex:1; border:none; background:transparent; border-radius:11px; padding:11px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:12px; font-weight:600; color:var(--text-2); font-family:'Plus Jakarta Sans',sans-serif; transition:all .2s; }
  .pr-theme-opt.active { background:#ff5500; color:#fff; box-shadow:0 4px 12px rgba(255,85,0,.35); }

  /* Referral card */
  .pr-referral { border-radius:20px; background:linear-gradient(135deg,#0f172a,#1e293b); color:#fff; padding:20px; margin-bottom:24px; }
  .pr-ref-label { font-size:12px; opacity:.7; margin-bottom:4px; }
  .pr-ref-code { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; letter-spacing:2px; margin-bottom:8px; }
  .pr-ref-desc { font-size:13px; opacity:.85; line-height:1.5; margin-bottom:14px; }
  .pr-ref-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
  .pr-ref-stat { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:12px; }
  .pr-ref-stat-lbl { font-size:11px; opacity:.7; margin-bottom:4px; }
  .pr-ref-stat-val { font-size:20px; font-weight:700; }
  .pr-copy-btn { width:100%; height:46px; border-radius:13px; border:1px solid rgba(255,255,255,.2); background:#fff; color:#0f172a; font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
  .pr-copied { background:#10b981 !important; color:#fff !important; }

  /* Settings list */
  .pr-setting-item { display:flex; align-items:center; gap:14px; background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:14px 16px; margin-bottom:10px; cursor:pointer; transition:box-shadow .15s; }
  .pr-setting-item:hover { box-shadow:var(--shadow-md); }
  .pr-setting-icon { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .pr-setting-text { flex:1; }
  .pr-setting-title { font-size:14px; font-weight:700; color:var(--text); }
  .pr-setting-sub { font-size:12px; color:var(--text-2); margin-top:1px; }
  .pr-setting-arrow { color:var(--text-3); font-size:16px; }

  /* Logout */
  .pr-logout { width:100%; height:52px; border:1.5px solid #fca5a5; background:rgba(239,68,68,.06); color:#dc2626; border-radius:var(--radius-lg); font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-family:'Plus Jakarta Sans',sans-serif; margin-top:8px; }
  .pr-logout:hover { background:rgba(239,68,68,.12); }

  /* Modal backdrop */
  .pr-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  @media(min-width:600px) { .pr-modal-bg { align-items:center; } }
  .pr-modal { background:#fff; border-radius:24px 24px 0 0; width:100%; max-width:520px; padding:0 0 env(safe-area-inset-bottom,0); animation:fadeUp .25s ease; }
  @media(min-width:600px) { .pr-modal { border-radius:24px; } }
  .pr-modal-handle { width:40px; height:4px; background:var(--border); border-radius:2px; margin:12px auto 20px; }
  .pr-modal-body { padding:0 24px 28px; }
  .pr-modal-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; margin-bottom:20px; }
  .pr-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .pr-field label { font-size:13px; font-weight:600; color:var(--text-2); }
  .pr-field input, .pr-field select { border:1.5px solid var(--border); border-radius:10px; padding:11px 14px; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif; outline:none; background:#fff; color:var(--text); }
  .pr-field input:focus { border-color:var(--blue); }
  .pr-save-btn { width:100%; height:50px; background:var(--blue); color:#fff; border:none; border-radius:var(--radius); font-size:15px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; margin-top:8px; }
  .pr-save-btn:disabled { opacity:.6; cursor:not-allowed; }

  /* Confirm dialog */
  .pr-confirm-bg { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; }
  .pr-confirm { background:#fff; border-radius:20px; padding:28px 24px; max-width:360px; width:100%; animation:fadeUp .2s ease; }
  .pr-confirm-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; margin-bottom:10px; }
  .pr-confirm-text { font-size:14px; color:var(--text-2); margin-bottom:24px; line-height:1.5; }
  .pr-confirm-btns { display:flex; gap:10px; }
  .pr-confirm-cancel { flex:1; height:44px; border:1.5px solid var(--border); background:#fff; border-radius:var(--radius); font-size:14px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; color:var(--text-2); }
  .pr-confirm-ok { flex:1; height:44px; border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

  /* Skeleton */
  .pr-skel-circle { border-radius:50% !important; }
`

// ─── Edit Profile Modal ─────────────────────────────────────────────────────────
function EditProfileModal({
  initial,
  userId,
  onClose,
  onSaved,
}: {
  initial: { firstName?: string; lastName?: string; phone?: string }
  userId: string
  onClose: () => void
  onSaved: (data: { firstName: string; lastName: string; phone: string }) => void
}) {
  const [firstName, setFirstName] = useState(initial.firstName ?? '')
  const [lastName, setLastName] = useState(initial.lastName ?? '')
  const [phone, setPhone] = useState(initial.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError('First and last name are required.'); return }
    setSaving(true); setError('')
    try {
      await updateDoc(doc(db, 'users', userId), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      })
      onSaved({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() })
      onClose()
    } catch { setError('Failed to save. Please try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="pr-modal-bg" onClick={onClose}>
      <div className="pr-modal" onClick={e => e.stopPropagation()}>
        <div className="pr-modal-handle" />
        <div className="pr-modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}><UserIcon /></div>
            <div className="pr-modal-title" style={{ margin: 0 }}>Edit Profile</div>
          </div>
          <div className="pr-field">
            <label>First Name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
          </div>
          <div className="pr-field">
            <label>Last Name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
          </div>
          <div className="pr-field">
            <label>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." type="tel" />
          </div>
          {error && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>{error}</div>}
          <button className="pr-save-btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Legal Modal ────────────────────────────────────────────────────────────────
function LegalModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const items = [
    { icon: DocumentIcon, label: 'Terms of Service', path: '/terms' },
    { icon: LockIcon, label: 'Privacy Policy', path: '/privacy' },
    { icon: TrashIcon, label: 'Account Deletion', href: 'https://www.blorbmart.com.ng/account-deletion', danger: true },
  ]
  return (
    <div className="pr-modal-bg" onClick={onClose}>
      <div className="pr-modal" onClick={e => e.stopPropagation()}>
        <div className="pr-modal-handle" />
        <div className="pr-modal-body">
          <div className="pr-modal-title">Legal</div>
          {items.map(item => (
            <div
              key={item.label}
              className="pr-setting-item"
              style={{ color: item.danger ? '#dc2626' : undefined }}
              onClick={() => {
                onClose()
                if ('href' in item && item.href) { window.open(item.href, '_blank') }
                else { navigate(item.path!) }
              }}
            >
              <div className="pr-setting-icon" style={{ background: item.danger ? '#fee2e2' : 'var(--bg)', fontSize: 18 }}><item.icon /></div>
              <div className="pr-setting-text">
                <div className="pr-setting-title" style={{ color: item.danger ? '#dc2626' : undefined }}>{item.label}</div>
              </div>
              <span className="pr-setting-arrow">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({
  title, text, confirmLabel, confirmColor, onConfirm, onCancel,
}: {
  title: string; text: string; confirmLabel: string; confirmColor: string
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="pr-confirm-bg" onClick={onCancel}>
      <div className="pr-confirm" onClick={e => e.stopPropagation()}>
        <div className="pr-confirm-title">{title}</div>
        <div className="pr-confirm-text">{text}</div>
        <div className="pr-confirm-btns">
          <button className="pr-confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="pr-confirm-ok" style={{ background: confirmColor, color: '#fff' }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { userData } = useUserData(user?.uid)

  const [buyerData, setBuyerData] = useState<BuyerData | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredTheme)

  const [showEdit, setShowEdit] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  // Local override for userData after edit
  const [localUserData, setLocalUserData] = useState<Record<string, string>>({})
  const mergedUser = { ...(userData ?? {}), ...localUserData } as Record<string, string>

  const hasMounted = useRef(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'buyers', user.uid))
        if (snap.exists()) setBuyerData(snap.data() as BuyerData)
      } catch { /* non-fatal */ }
      try {
        const res = await apiFetchAuth('/api/referrals/me')
        if (res.ok) {
          const json = await res.json().catch(() => ({}))
          if (json?.data) setReferralData({
            referralCode: json.data.referralCode ?? '',
            referralCount: Number(json.data.referralCount ?? 0),
            referralEarnings: Number(json.data.referralEarnings ?? 0),
            buyerReferralEnabled: Boolean(json.data.buyerReferralEnabled),
            buyerReferralRewardNaira: Number(json.data.buyerReferralRewardNaira ?? 0),
          })
        }
      } catch { /* referral optional */ }
      setLoading(false)
    }
    load()
  }, [user])

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(themeMode)
    if (hasMounted.current) localStorage.setItem('bm-theme', themeMode)
    hasMounted.current = true
  }, [themeMode])

  const handleTheme = (mode: ThemeMode) => { setThemeMode(mode); applyTheme(mode) }

  const handleLogout = async () => {
    const { auth } = await import('../../lib/firebase')
    await auth.signOut()
    navigate('/login', { replace: true })
  }

  const handleCopy = async () => {
    if (!referralData?.referralCode) return
    await navigator.clipboard.writeText(referralData.referralCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayName = [mergedUser.firstName, mergedUser.lastName].filter(Boolean).join(' ') || 'User'
  const initials = getInitials(mergedUser.firstName, mergedUser.lastName)
  const isVerified = mergedUser.isEmailVerified === 'true' || (userData as Record<string, unknown>)?.isEmailVerified === true
  const walletBalance = buyerData?.walletBalance ?? (userData as Record<string, unknown>)?.balance as number ?? 0
  const totalOrders = buyerData?.totalOrders ?? 0
  const loyaltyPoints = buyerData?.loyaltyPoints ?? 0

  const settingsItems = [
    { icon: UserIcon, bg: 'var(--blue-light)', title: 'Edit Profile', sub: 'Update your personal information', action: () => setShowEdit(true) },
    { icon: MapPinIcon, bg: '#dbeafe', title: 'Addresses', sub: 'Manage delivery addresses', action: () => navigate('/checkout') },
    { icon: PackageIcon, bg: '#fff7ed', title: 'Track Orders', sub: 'View and track your orders', action: () => navigate('/track') },
    { icon: MessageIcon, bg: '#fef3c7', title: 'Help & Support', sub: 'FAQs and contact support', action: () => navigate('/faq') },
    { icon: DocumentIcon, bg: '#d1fae5', title: 'Legal', sub: 'Terms, policies & agreements', action: () => setShowLegal(true) },
    { icon: DocumentIcon, bg: 'var(--bg)', title: 'About Blorbmart', sub: 'Version 1.0.0 · Built for campus life', action: () => {} },
  ]

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="pr-root">
        <header className="pr-header">
          <button className="pr-back" type="button" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="pr-header-title">Profile</span>
          <div style={{ width: 36 }} />
        </header>

        <div className="pr-body">

          {/* Profile header */}
          <div className="pr-avatar-wrap">
            {loading ? (
              <div className="bm-skeleton pr-skel-circle" style={{ width: 96, height: 96 }} />
            ) : (
              <div className="pr-avatar">{initials}</div>
            )}
            {loading ? (
              <>
                <div className="bm-skeleton" style={{ width: 160, height: 22, borderRadius: 11, marginTop: 14 }} />
                <div className="bm-skeleton" style={{ width: 120, height: 14, borderRadius: 7, marginTop: 8 }} />
              </>
            ) : (
              <>
                <div className="pr-name">{displayName}</div>
                <div className="pr-email">{mergedUser.email ?? user?.email ?? ''}</div>
                {isVerified && (
                  <div className="pr-verified">✓ Verified Account</div>
                )}
              </>
            )}
          </div>

          {/* Wallet card */}
          <div className="pr-wallet" onClick={() => navigate('/wallet')}>
            <div className="pr-wallet-icon"><CreditCardIcon /></div>
            <div style={{ flex: 1 }}>
              <div className="pr-wallet-label">Wallet Balance</div>
              {loading ? (
                <div style={{ width: 120, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.3)' }} />
              ) : (
                <div className="pr-wallet-balance">{fmt(walletBalance)}</div>
              )}
            </div>
            <span style={{ color: '#fff', fontSize: 20, opacity: .85 }}>›</span>
          </div>

          {/* Stats row */}
          <div className="pr-stats" style={{ marginBottom: 28 }}>
            <div className="pr-stat">
              <div className="pr-stat-icon" style={{ background: 'var(--blue-light)' }}><BagIcon /></div>
              {loading
                ? <div className="bm-skeleton" style={{ height: 24, width: 40, borderRadius: 8, margin: '0 auto' }} />
                : <div className="pr-stat-val">{totalOrders}</div>
              }
              <div className="pr-stat-lbl">Orders</div>
            </div>
            <div className="pr-stat">
              <div className="pr-stat-icon" style={{ background: '#fef3c7' }}><StarIcon size={18} /></div>
              {loading
                ? <div className="bm-skeleton" style={{ height: 24, width: 40, borderRadius: 8, margin: '0 auto' }} />
                : <div className="pr-stat-val">{loyaltyPoints}</div>
              }
              <div className="pr-stat-lbl">Points</div>
            </div>
          </div>

          {/* Referral card */}
          {referralData?.buyerReferralEnabled && (
            <div className="pr-referral" style={{ marginBottom: 28 }}>
              <div className="pr-ref-label">Referral Programme</div>
              <div className="pr-ref-code">{referralData.referralCode}</div>
              <div className="pr-ref-desc">
                Invite friends and earn ₦{referralData.buyerReferralRewardNaira.toLocaleString()} in your wallet for each successful referral.
              </div>
              <div className="pr-ref-stats">
                <div className="pr-ref-stat">
                  <div className="pr-ref-stat-lbl">Referrals</div>
                  <div className="pr-ref-stat-val">{referralData.referralCount}</div>
                </div>
                <div className="pr-ref-stat">
                  <div className="pr-ref-stat-lbl">Earned</div>
                  <div className="pr-ref-stat-val">₦{referralData.referralEarnings.toLocaleString()}</div>
                </div>
              </div>
              <button className={`pr-copy-btn${copied ? ' pr-copied' : ''}`} onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy Referral Code'}
              </button>
            </div>
          )}

          {/* Appearance / Theme toggle */}
          <div style={{ marginBottom: 28 }}>
            <div className="pr-section-title">Appearance</div>
            <div className="pr-theme-wrap">
              {([
                { mode: 'light' as ThemeMode, icon: SunIcon, label: 'Light' },
                { mode: 'system' as ThemeMode, icon: SmartphoneIcon, label: 'System' },
                { mode: 'dark' as ThemeMode, icon: MoonIcon, label: 'Dark' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  className={`pr-theme-opt${themeMode === mode ? ' active' : ''}`}
                  onClick={() => handleTheme(mode)}
                >
                  <span style={{ fontSize: 16 }}><Icon /></span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="pr-section-title">Settings</div>
            {settingsItems.map(item => (
              <div key={item.title} className="pr-setting-item" onClick={item.action}>
                <div className="pr-setting-icon" style={{ background: item.bg }}><item.icon /></div>
                <div className="pr-setting-text">
                  <div className="pr-setting-title">{item.title}</div>
                  <div className="pr-setting-sub">{item.sub}</div>
                </div>
                <span className="pr-setting-arrow">›</span>
              </div>
            ))}
          </div>

          {/* Logout */}
          <button className="pr-logout" type="button" onClick={() => setShowLogoutConfirm(true)}>
            <LogoutIcon size={16} /> Logout
          </button>

        </div>
      </div>

      {/* Modals */}
      {showEdit && user && (
        <EditProfileModal
          initial={{ firstName: mergedUser.firstName, lastName: mergedUser.lastName, phone: mergedUser.phone }}
          userId={user.uid}
          onClose={() => setShowEdit(false)}
          onSaved={data => setLocalUserData(prev => ({ ...prev, ...data }))}
        />
      )}

      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Logout"
          text="Are you sure you want to log out of your Blorbmart account?"
          confirmLabel="Logout"
          confirmColor="#dc2626"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  )
}
