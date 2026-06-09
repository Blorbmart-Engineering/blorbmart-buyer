import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { CreditCardIcon, DocumentIcon, GiftIcon, PrinterIcon } from '../../components/icons'
import { printWalletReceipt } from '../../lib/receiptPrinter'

// ─── API Service ────────────────────────────────────────────────────────────────
const BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'https://blorbmart.onrender.com'}/api/wallet`

async function fetchBalance(userId: string, idToken: string): Promise<number> {
  try {
    const res = await fetch(`${BASE}/${userId}`, {
      headers: { 'Authorization': `Bearer ${idToken}` },
    })
    const d = await res.json()
    if (!res.ok || d.status !== 'success') throw new Error()
    return Number(d.data?.balance ?? 0)
  } catch { return 0 }
}

async function fetchTransactions(userId: string, idToken: string): Promise<WalletTx[]> {
  try {
    const res = await fetch(`${BASE}/${userId}/transactions?page=1&limit=100`, {
      headers: { 'Authorization': `Bearer ${idToken}` },
    })
    const d = await res.json()
    if (!res.ok || d.status !== 'success') throw new Error()
    return ((d.data?.transactions ?? []) as Record<string, unknown>[]).map(e => ({
      id: String(e.id ?? ''),
      type: String(e.type ?? 'deposit') as 'deposit' | 'withdrawal',
      amount: Number(e.amount ?? 0),
      description: String(e.description ?? ''),
      status: String(e.status ?? 'completed') as 'completed' | 'pending' | 'failed',
      reference: String(e.reference ?? ''),
      paymentMethod: e.paymentMethod ? String(e.paymentMethod) : undefined,
      newBalance: Number(e.newBalance ?? 0),
      timestamp: new Date(String(e.timestamp ?? Date.now())),
    }))
  } catch { return [] }
}

async function initiateFunding(userId: string, email: string, amount: number, idToken: string) {
  const res = await fetch(`${BASE}/fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ userId, email, amount }),
  })
  const d = await res.json()
  if (!res.ok || d.status !== 'success') throw new Error(d.message ?? 'Failed to initialize funding')
  return d.data as { authorization_url: string; reference: string; access_code: string }
}

async function verifyPayment(reference: string, idToken: string) {
  const res = await fetch(`${BASE}/verify/${reference}`, {
    headers: { 'Authorization': `Bearer ${idToken}` },
  })
  const d = await res.json()
  if (!res.ok || d.status !== 'success') throw new Error('Payment verification failed')
  return d.data as { status: string; amount: number }
}

// ─── Types ──────────────────────────────────────────────────────────────────────
type WalletTx = {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
  reference: string
  paymentMethod?: string
  newBalance?: number
  timestamp: Date
}

type Filter = 'all' | 'deposit' | 'withdrawal'

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0, notation: 'compact' }).format(v)

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) +
  ' · ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

const groupByDate = (txns: WalletTx[]) => {
  const groups: Record<string, WalletTx[]> = {}
  txns.forEach(tx => {
    const key = tx.timestamp.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    ;(groups[key] ??= []).push(tx)
  })
  return groups
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  completed: { color: '#065f46', bg: '#d1fae5' },
  pending:   { color: '#b45309', bg: '#fef3c7' },
  failed:    { color: '#991b1b', bg: '#fee2e2' },
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000]

// ─── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  .wl-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }
  .wl-header { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.95); backdrop-filter:blur(8px); border-bottom:1.5px solid var(--border); padding:14px 20px; display:flex; align-items:center; gap:12px; }
  .wl-back { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .wl-header-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; flex:1; text-align:center; }

  .wl-body { max-width:600px; margin:0 auto; padding:24px 20px 80px; }

  /* Balance card */
  .wl-balance-card { border-radius:24px; background:linear-gradient(135deg,#2563EB 0%,#1d4ed8 100%); padding:24px; color:#fff; box-shadow:0 12px 32px rgba(37,99,235,.4); margin-bottom:20px; }
  .wl-balance-label { font-size:13px; opacity:.85; margin-bottom:6px; }
  .wl-balance-amount { font-family:'Bricolage Grotesque',sans-serif; font-size:42px; font-weight:800; margin-bottom:4px; line-height:1.1; }
  .wl-balance-sub { font-size:12px; opacity:.75; }
  .wl-balance-pending { margin-top:14px; background:rgba(255,255,255,.18); border-radius:10px; padding:10px 14px; font-size:13px; display:flex; align-items:center; gap:8px; }

  /* Action buttons */
  .wl-actions { display:flex; gap:12px; margin-bottom:24px; }
  .wl-action-btn { flex:1; height:52px; border:none; border-radius:var(--radius-lg); font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; font-family:'Plus Jakarta Sans',sans-serif; }

  /* Stats strip */
  .wl-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:24px; }
  .wl-stat { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:14px; text-align:center; }
  .wl-stat-icon { font-size:22px; margin-bottom:6px; }
  .wl-stat-val { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:var(--text); }
  .wl-stat-lbl { font-size:11px; color:var(--text-2); margin-top:2px; }

  /* Filter tabs */
  .wl-filters { display:flex; gap:8px; margin-bottom:16px; overflow-x:auto; padding-bottom:2px; }
  .wl-filter { border:1.5px solid var(--border); background:#fff; border-radius:999px; padding:7px 16px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; color:var(--text-2); font-family:'Plus Jakarta Sans',sans-serif; }
  .wl-filter.active { background:var(--blue); border-color:var(--blue); color:#fff; }

  /* Date group */
  .wl-date-label { font-size:12px; font-weight:700; color:var(--text-2); text-transform:uppercase; letter-spacing:.5px; margin:20px 0 8px; }

  /* Transaction row */
  .wl-tx { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:14px 16px; display:flex; align-items:center; gap:14px; margin-bottom:10px; box-shadow:var(--shadow); }
  .wl-tx-icon { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; flex-shrink:0; }
  .wl-tx-desc { font-size:13px; font-weight:700; color:var(--text); }
  .wl-tx-meta { font-size:11px; color:var(--text-2); margin-top:2px; }
  .wl-tx-amount { font-size:15px; font-weight:800; }
  .wl-tx-status { font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; margin-top:3px; text-align:right; }

  /* Empty state */
  .wl-empty { text-align:center; padding:56px 20px; background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); }
  .wl-empty-icon { font-size:48px; margin-bottom:12px; }
  .wl-empty-title { font-size:16px; font-weight:800; color:var(--text); margin-bottom:6px; }
  .wl-empty-sub { font-size:13px; color:var(--text-2); }

  /* Add funds modal */
  .wl-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
  @media(min-width:600px){ .wl-modal-bg { align-items:center; } }
  .wl-modal { background:#fff; border-radius:24px 24px 0 0; width:100%; max-width:520px; padding:0 0 env(safe-area-inset-bottom,0); animation:fadeUp .25s ease; max-height:90vh; overflow-y:auto; }
  @media(min-width:600px){ .wl-modal { border-radius:24px; } }
  .wl-modal-handle { width:40px; height:4px; background:var(--border); border-radius:2px; margin:12px auto 20px; }
  .wl-modal-body { padding:0 24px 28px; }
  .wl-modal-title { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; margin-bottom:20px; }
  .wl-amount-input { width:100%; padding:14px 16px; border:1.5px solid var(--border); border-radius:var(--radius); font-size:22px; font-weight:700; outline:none; font-family:'Bricolage Grotesque',sans-serif; color:var(--text); }
  .wl-amount-input:focus { border-color:var(--blue); }
  .wl-quick-grid { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0 20px; }
  .wl-quick-btn { padding:10px 16px; border-radius:var(--radius); border:1.5px solid var(--border); background:#fff; font-size:13px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; color:var(--text-2); }
  .wl-quick-btn.selected { border-color:var(--blue); color:var(--blue); background:var(--blue-light); }
  .wl-paystack-chip { background:var(--blue-light); border:1.5px solid rgba(37,99,235,.2); border-radius:var(--radius); padding:12px 16px; display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .wl-submit-btn { width:100%; height:52px; background:var(--blue); color:#fff; border:none; border-radius:var(--radius); font-size:15px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
  .wl-submit-btn:disabled { opacity:.5; cursor:not-allowed; }

  /* Paystack confirm modal */
  .wl-confirm { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; }
  .wl-confirm-box { background:#fff; border-radius:20px; padding:28px 24px; max-width:380px; width:100%; animation:fadeUp .2s ease; }
  .wl-confirm-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; margin-bottom:10px; }
  .wl-confirm-desc { font-size:14px; color:var(--text-2); line-height:1.55; margin-bottom:20px; }
  .wl-confirm-btns { display:flex; flex-direction:column; gap:10px; }
  .wl-confirm-primary { height:48px; background:var(--blue); color:#fff; border:none; border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
  .wl-confirm-secondary { height:44px; background:none; border:1.5px solid var(--border); border-radius:var(--radius); font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; color:var(--text-2); }
  .wl-confirm-link { font-size:12px; color:var(--blue); text-decoration:underline; background:none; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; text-align:center; margin-top:4px; }

  @keyframes spin { to { transform:rotate(360deg); } }
  .wl-spinner { width:18px; height:18px; border-radius:50%; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; animation:spin .7s linear infinite; }
`

declare global {
  interface Window {
    PaystackPop: new () => {
      newTransaction(opts: {
        access_code: string
        onSuccess: (transaction: { reference: string }) => void
        onCancel: () => void
      }): void
    }
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function WalletScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [balance, setBalance] = useState(0)
  const [txns, setTxns] = useState<WalletTx[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [verifying, setVerifying]   = useState(false)
  const [paystackUrl, setPaystackUrl] = useState('')
  const [paystackRef, setPaystackRef] = useState('')
  const [showPaystackModal, setShowPaystackModal] = useState(false)

  const load = async (quiet = false) => {
    if (!user) return
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const idToken = await user.getIdToken()
      const [bal, all] = await Promise.all([fetchBalance(user.uid, idToken), fetchTransactions(user.uid, idToken)])
      setBalance(bal)
      setTxns(all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line

  const filtered = useMemo(() =>
    filter === 'all' ? txns : txns.filter(t => t.type === filter),
  [txns, filter])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const totalDeposited = txns.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0)
  const totalSpent    = txns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0)

  const handleFund = async () => {
    const amount = parseFloat(fundAmount)
    if (!amount || amount <= 0 || !user) return
    if (!window.PaystackPop) {
      alert('Payment gateway is still loading. Please try again in a moment.')
      return
    }
    setProcessingPayment(true)
    setShowFundModal(false)
    setFundAmount('')

    // Step 1: create transaction on backend — surface any errors here
    let accessCode: string
    try {
      const idToken = await user.getIdToken()
      const data = await initiateFunding(user.uid, user.email ?? '', amount, idToken)
      accessCode = data.access_code
    } catch (e) {
      setProcessingPayment(false)
      alert(`Could not start payment: ${e instanceof Error ? e.message : 'Unknown error'}`)
      return
    }

    // Step 2: open Paystack popup
    // newTransaction may throw internally even when the popup opens successfully,
    // because Paystack v2's JS registers callbacks first then does internal setup.
    // So: catch silently — onSuccess/onCancel will still fire correctly.
    try {
      new window.PaystackPop().newTransaction({
        access_code: accessCode,
        onSuccess: async (transaction) => {
          setVerifying(true)
          try {
            const freshToken = await user.getIdToken()
            const result = await verifyPayment(transaction.reference, freshToken)
            await load(true)
            if (result.status === 'completed') {
              alert(`${fmt(result.amount)} added to your wallet!`)
            } else {
              alert('Payment received — your balance will update shortly.')
            }
          } catch {
            await load(true)
            alert('Payment received but verification is pending. Check your balance in a moment.')
          } finally {
            setVerifying(false)
            setProcessingPayment(false)
          }
        },
        onCancel: () => {
          setProcessingPayment(false)
        },
      })
    } catch {
      // Paystack threw internally after the popup opened — callbacks are still live.
      // Silently reset UI; onSuccess/onCancel will clean up if payment completes.
      setProcessingPayment(false)
      load(true)
    }
  }

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="wl-root">
        <header className="wl-header">
          <button className="wl-back" type="button" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="wl-header-title">My Wallet</span>
          <button
            type="button"
            onClick={() => load(true)}
            style={{ width: 36, height: 36, border: '1.5px solid var(--border)', background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {refreshing
              ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
              : <span style={{ fontSize: 14 }}>↻</span>
            }
          </button>
        </header>

        <div className="wl-body">

          {/* Balance card */}
          <div className="wl-balance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="wl-balance-label">Current Balance</div>
                {loading
                  ? <div style={{ width: 180, height: 44, borderRadius: 10, background: 'rgba(255,255,255,.3)', marginBottom: 4 }} />
                  : <div className="wl-balance-amount">{fmt(balance)}</div>
                }
                <div className="wl-balance-sub">Available for shopping</div>
              </div>
              <span style={{ display: 'inline-flex' }}><CreditCardIcon size={32} /></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="wl-actions">
            <button
              className="wl-action-btn"
              style={{ background: '#10b981', color: '#fff' }}
              onClick={() => setShowFundModal(true)}
              disabled={processingPayment}
            >
              {processingPayment ? <div className="wl-spinner" /> : '＋'} Add Funds
            </button>
            <button
              className="wl-action-btn"
              style={{ background: '#0f172a', color: '#fff', opacity: .7, cursor: 'not-allowed' }}
              disabled
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><GiftIcon size={16} /> Gift Cards</span> <span style={{ fontSize: 10, opacity: .7 }}>Soon</span>
            </button>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="wl-stats">
              <div className="wl-stat">
                <div className="wl-stat-icon" style={{ color: '#10b981' }}>↓</div>
                <div className="wl-stat-val">{fmtCompact(totalDeposited)}</div>
                <div className="wl-stat-lbl">Deposited</div>
              </div>
              <div className="wl-stat">
                <div className="wl-stat-icon" style={{ color: '#ef4444' }}>↑</div>
                <div className="wl-stat-val">{fmtCompact(totalSpent)}</div>
                <div className="wl-stat-lbl">Spent</div>
              </div>
              <div className="wl-stat">
                <div className="wl-stat-icon"><DocumentIcon /></div>
                <div className="wl-stat-val">{txns.length}</div>
                <div className="wl-stat-lbl">Transactions</div>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, fontWeight: 800 }}>
              Transactions ({filtered.length})
            </div>
          </div>
          <div className="wl-filters">
            {([
              { key: 'all', label: 'All' },
              { key: 'deposit', label: 'Credits' },
              { key: 'withdrawal', label: 'Debits' },
            ] as { key: Filter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                className={`wl-filter${filter === key ? ' active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Transactions */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 14 }}>
                  <div className="bm-skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="bm-skeleton" style={{ height: 13, marginBottom: 8, width: '60%' }} />
                    <div className="bm-skeleton" style={{ height: 11, width: '40%' }} />
                  </div>
                  <div className="bm-skeleton" style={{ width: 60, height: 18, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon"><DocumentIcon /></div>
              <div className="wl-empty-title">No transactions yet</div>
              <div className="wl-empty-sub">Add funds or make a purchase to see history here.</div>
            </div>
          ) : (
            Object.entries(grouped).map(([date, dateTxns]) => (
              <div key={date}>
                <div className="wl-date-label">{date}</div>
                {dateTxns.map(tx => {
                  const isCredit = tx.type === 'deposit'
                  const amtColor = isCredit ? '#10b981' : '#ef4444'
                  const iconBg = isCredit ? '#d1fae5' : '#fee2e2'
                  const statusStyle = STATUS_STYLE[tx.status] ?? STATUS_STYLE.completed
                  return (
                    <div key={tx.id} className="wl-tx">
                      <div className="wl-tx-icon" style={{ background: iconBg, color: amtColor }}>
                        {isCredit ? '↓' : '↑'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="wl-tx-desc">{tx.description || (isCredit ? 'Wallet funding' : 'Payment')}</div>
                        <div className="wl-tx-meta">{fmtDate(tx.timestamp)}{tx.paymentMethod ? ` · ${tx.paymentMethod}` : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div className="wl-tx-amount" style={{ color: amtColor }}>
                          {isCredit ? '+' : '−'}{fmt(tx.amount)}
                        </div>
                        <div className="wl-tx-status" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {tx.status.toUpperCase()}
                        </div>
                        <button
                          type="button"
                          title="View Receipt"
                          onClick={() => printWalletReceipt({ type: tx.type, amount: tx.amount, description: tx.description, status: tx.status, reference: tx.reference, paymentMethod: tx.paymentMethod, newBalance: tx.newBalance, timestamp: tx.timestamp })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, display: 'flex', alignItems: 'center' }}
                        >
                          <PrinterIcon size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}

        </div>
      </div>

      {/* Add Funds Modal */}
      {showFundModal && (
        <div className="wl-modal-bg" onClick={() => setShowFundModal(false)}>
          <div className="wl-modal" onClick={e => e.stopPropagation()}>
            <div className="wl-modal-handle" />
            <div className="wl-modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="wl-modal-title" style={{ margin: 0 }}>Add Funds</div>
                <button onClick={() => setShowFundModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Amount (₦)</div>
              <input
                className="wl-amount-input"
                type="number"
                min="100"
                value={fundAmount}
                onChange={e => setFundAmount(e.target.value)}
                placeholder="0"
              />

              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '14px 0 8px' }}>Quick amounts</div>
              <div className="wl-quick-grid">
                {QUICK_AMOUNTS.map(qa => (
                  <button
                    key={qa}
                    className={`wl-quick-btn${fundAmount === String(qa) ? ' selected' : ''}`}
                    onClick={() => setFundAmount(String(qa))}
                  >
                    {fmt(qa)}
                  </button>
                ))}
              </div>

              <div className="wl-paystack-chip">
                <span style={{ display: 'inline-flex' }}><CreditCardIcon size={22} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>Paystack</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Secure payment gateway</div>
                </div>
                <span style={{ color: 'var(--blue)', fontWeight: 800 }}>✓</span>
              </div>

              <button
                className="wl-submit-btn"
                onClick={handleFund}
                disabled={processingPayment || !fundAmount || parseFloat(fundAmount) <= 0}
              >
                {processingPayment
                  ? <span style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}><div className="wl-spinner" /> Processing…</span>
                  : `Fund Wallet${fundAmount && parseFloat(fundAmount) > 0 ? ` — ${fmt(parseFloat(fundAmount))}` : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verifying overlay */}
      {verifying && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', textAlign: 'center', minWidth: 200 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 700 }}>Verifying payment…</div>
          </div>
        </div>
      )}
    </>
  )
}
