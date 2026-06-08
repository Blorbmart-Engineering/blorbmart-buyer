import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import { GiftIcon, ReceiptIcon } from '../../components/icons'

// ─── Types ──────────────────────────────────────────────────────────────────────
type FsTs = { toDate?: () => Date; seconds?: number }

type Transaction = {
  id: string
  amount: number
  type?: string
  status?: string
  description?: string
  reference?: string
  createdAt?: FsTs
}

type FilterTab = 'all' | 'credit' | 'debit' | 'refund'

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const fmtCompact = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0, notation: 'compact' }).format(v)

const toDate = (ts?: FsTs): Date => {
  if (!ts) return new Date()
  if (ts.toDate) return ts.toDate()
  if (ts.seconds) return new Date(ts.seconds * 1000)
  return new Date()
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) +
  ' · ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

const groupByDate = (txns: Transaction[]) => {
  const groups: Record<string, Transaction[]> = {}
  txns.forEach(tx => {
    const key = toDate(tx.createdAt).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    ;(groups[key] ??= []).push(tx)
  })
  return groups
}

const isCredit = (t: Transaction) => ['credit', 'wallet', 'deposit', 'refund', 'cashback', 'referral'].includes((t.type ?? '').toLowerCase())
const isDebit  = (t: Transaction) => ['debit', 'shopping', 'withdrawal', 'payment', 'order'].includes((t.type ?? '').toLowerCase())
const isRefund = (t: Transaction) => ['refund', 'cashback'].includes((t.type ?? '').toLowerCase())

const typeLabel = (type?: string) => {
  switch ((type ?? '').toLowerCase()) {
    case 'credit': case 'deposit': return 'Wallet Funding'
    case 'wallet': return 'Wallet Top-Up'
    case 'debit': case 'payment': return 'Payment'
    case 'shopping': case 'order': return 'Order Payment'
    case 'withdrawal': return 'Withdrawal'
    case 'refund': return 'Refund'
    case 'cashback': return 'Cashback'
    case 'referral': return 'Referral Bonus'
    default: return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Transaction'
  }
}

const typeIcon = (type?: string) => {
  const t = (type ?? '').toLowerCase()
  if (['referral'].includes(t)) return <GiftIcon size={16} />
  if (['credit', 'wallet', 'deposit'].includes(t)) return '↓'
  if (['refund', 'cashback'].includes(t)) return '↺'
  return '↑'
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  completed: { color: '#065f46', bg: '#d1fae5' },
  success:   { color: '#065f46', bg: '#d1fae5' },
  pending:   { color: '#b45309', bg: '#fef3c7' },
  failed:    { color: '#991b1b', bg: '#fee2e2' },
}

// ─── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  .xt-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }
  .xt-header { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.95); backdrop-filter:blur(8px); border-bottom:1.5px solid var(--border); padding:14px 20px; display:flex; align-items:center; gap:12px; }
  .xt-back { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .xt-header-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; flex:1; text-align:center; }

  .xt-body { max-width:600px; margin:0 auto; padding:24px 20px 80px; }

  /* Summary card */
  .xt-summary { border-radius:20px; background:linear-gradient(135deg,#2563EB 0%,#1d4ed8 100%); padding:20px 20px 16px; color:#fff; box-shadow:0 10px 28px rgba(37,99,235,.35); margin-bottom:20px; }
  .xt-summary-top { display:flex; justify-content:space-between; margin-bottom:14px; }
  .xt-summary-item { flex:1; }
  .xt-summary-lbl { font-size:12px; opacity:.8; margin-bottom:4px; }
  .xt-summary-val { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; }
  .xt-summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .xt-summary-tile { background:rgba(255,255,255,.14); border-radius:12px; padding:12px; }
  .xt-summary-tile-lbl { font-size:11px; opacity:.8; }
  .xt-summary-tile-val { font-size:18px; font-weight:700; margin-top:4px; }

  /* Filters */
  .xt-filters { display:flex; gap:8px; margin-bottom:16px; overflow-x:auto; padding-bottom:2px; }
  .xt-filter { border:1.5px solid var(--border); background:#fff; border-radius:999px; padding:7px 16px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; color:var(--text-2); font-family:'Plus Jakarta Sans',sans-serif; }
  .xt-filter.active { background:var(--blue); border-color:var(--blue); color:#fff; }

  /* Date group */
  .xt-date-lbl { font-size:11px; font-weight:700; color:var(--text-2); text-transform:uppercase; letter-spacing:.5px; margin:20px 0 8px; }

  /* Transaction row */
  .xt-tx { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:14px 16px; display:flex; align-items:center; gap:14px; margin-bottom:10px; box-shadow:var(--shadow); }
  .xt-tx-icon { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:800; flex-shrink:0; }
  .xt-tx-title { font-size:13px; font-weight:700; color:var(--text); }
  .xt-tx-meta { font-size:11px; color:var(--text-2); margin-top:2px; }
  .xt-tx-amount { font-size:14px; font-weight:800; }
  .xt-tx-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; margin-top:3px; text-align:right; }

  /* Empty */
  .xt-empty { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:56px 20px; text-align:center; }
  .xt-empty-icon { font-size:48px; margin-bottom:12px; }
  .xt-empty-title { font-size:16px; font-weight:800; color:var(--text); margin-bottom:6px; }
  .xt-empty-sub { font-size:13px; color:var(--text-2); }
`

// ─── Main Component ─────────────────────────────────────────────────────────────
export function TransactionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
        )
        setAllTxns(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) })))
      } catch { setAllTxns([]) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allTxns
    if (activeFilter === 'credit') return allTxns.filter(t => isCredit(t) && !isRefund(t))
    if (activeFilter === 'debit')  return allTxns.filter(isDebit)
    if (activeFilter === 'refund') return allTxns.filter(isRefund)
    return allTxns
  }, [allTxns, activeFilter])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const totalSpent    = allTxns.filter(isDebit).reduce((s, t) => s + t.amount, 0)
  const totalReceived = allTxns.filter(t => isCredit(t) && !isRefund(t)).reduce((s, t) => s + t.amount, 0)
  const highest = Math.max(0, ...allTxns.map(t => t.amount))

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'credit', label: 'Credits' },
    { key: 'debit',  label: 'Debits' },
    { key: 'refund', label: 'Refunds' },
  ]

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="xt-root">
        <header className="xt-header">
          <button className="xt-back" type="button" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="xt-header-title">Transactions</span>
          <div style={{ width: 36, fontSize: 12, color: 'var(--text-2)', textAlign: 'right' }}>{allTxns.length}</div>
        </header>

        <div className="xt-body">

          {/* Summary card */}
          {!loading && (
            <div className="xt-summary">
              <div className="xt-summary-top">
                <div className="xt-summary-item">
                  <div className="xt-summary-lbl">Total Spent</div>
                  <div className="xt-summary-val">{fmtCompact(totalSpent)}</div>
                </div>
                <div className="xt-summary-item" style={{ textAlign: 'right' }}>
                  <div className="xt-summary-lbl">Total Received</div>
                  <div className="xt-summary-val">{fmtCompact(totalReceived)}</div>
                </div>
              </div>
              <div className="xt-summary-grid">
                <div className="xt-summary-tile">
                  <div className="xt-summary-tile-lbl">Transactions</div>
                  <div className="xt-summary-tile-val">{allTxns.length}</div>
                </div>
                <div className="xt-summary-tile">
                  <div className="xt-summary-tile-lbl">Highest</div>
                  <div className="xt-summary-tile-val">{fmtCompact(highest)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="xt-filters">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                className={`xt-filter${activeFilter === key ? ' active' : ''}`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Transactions */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 14 }}>
                  <div className="bm-skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="bm-skeleton" style={{ height: 13, width: '55%', marginBottom: 8 }} />
                    <div className="bm-skeleton" style={{ height: 11, width: '35%' }} />
                  </div>
                  <div className="bm-skeleton" style={{ width: 64, height: 18, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="xt-empty">
              <div className="xt-empty-icon"><ReceiptIcon filled={false} /></div>
              <div className="xt-empty-title">No transactions</div>
              <div className="xt-empty-sub">
                {activeFilter === 'all'
                  ? 'Start shopping to see your transactions here.'
                  : `No ${activeFilter} transactions found.`
                }
              </div>
              {activeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  style={{ marginTop: 16, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                >
                  View all
                </button>
              )}
            </div>
          ) : (
            Object.entries(grouped).map(([date, dateTxns]) => (
              <div key={date}>
                <div className="xt-date-lbl">{date}</div>
                {dateTxns.map(tx => {
                  const credit = isCredit(tx)
                  const amtColor = credit ? '#10b981' : '#ef4444'
                  const iconBg   = credit ? '#d1fae5' : '#fee2e2'
                  const statusStyle = STATUS_STYLE[(tx.status ?? '').toLowerCase()] ?? STATUS_STYLE.completed
                  const d = toDate(tx.createdAt)
                  return (
                    <div key={tx.id} className="xt-tx">
                      <div className="xt-tx-icon" style={{ background: iconBg, color: amtColor }}>
                        {typeIcon(tx.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="xt-tx-title">{tx.description || typeLabel(tx.type)}</div>
                        <div className="xt-tx-meta">{fmtDate(d)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="xt-tx-amount" style={{ color: amtColor }}>
                          {credit ? '+' : '−'}{fmt(tx.amount)}
                        </div>
                        {tx.status && (
                          <div className="xt-tx-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {tx.status.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}

        </div>
      </div>
    </>
  )
}
