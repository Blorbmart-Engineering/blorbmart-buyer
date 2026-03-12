import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #4F5BFF;
    --bg: #F7F8FC;
    --text: #1F2937;
    --muted: #7C8AA5;
    --card: #fff;
    --border: #EEF0F5;
  }

  .tx-root { min-height: 100dvh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }
  .tx-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 18px 12px;
    background: #fff; position: sticky; top: 0; z-index: 10;
    box-shadow: 0 2px 16px rgba(0,0,0,.05);
  }
  .tx-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 18px; }
  .tx-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .tx-icon-btn { width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--border); background: #fff; display: grid; place-items: center; }

  .tx-card {
    margin: 18px;
    background: linear-gradient(135deg, #4F5BFF, #3E4BFF);
    color: #fff;
    border-radius: 22px;
    padding: 18px;
    box-shadow: 0 12px 32px rgba(79,91,255,.35);
  }
  .tx-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; }
  .tx-tile { background: rgba(255,255,255,.14); border-radius: 16px; padding: 14px; }
  .tx-tile-label { font-size: 12px; opacity: .8; }
  .tx-tile-value { font-size: 18px; font-weight: 700; margin-top: 6px; }

  .tx-tabs { display: flex; gap: 10px; padding: 0 18px; margin-top: 6px; }
  .tx-tab {
    padding: 10px 16px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }
  .tx-tab.active {
    background: var(--blue);
    border-color: var(--blue);
    color: #fff;
  }

  .tx-list { display: grid; gap: 12px; padding: 16px 18px 80px; }
  .tx-item {
    background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 12px 14px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .tx-item-title { font-weight: 600; }
  .tx-item-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .tx-item-amount { font-weight: 700; color: var(--blue); }
  .tx-item-status { font-size: 11px; color: #10B981; margin-top: 4px; text-align: right; }

  .tx-empty {
    display: grid; place-items: center; text-align: center;
    padding: 60px 24px 80px;
  }
  .tx-empty svg { color: #D1D5DB; }
  .tx-empty h3 { font-family: 'Sora', sans-serif; font-size: 20px; margin: 14px 0 8px; }
  .tx-empty p { max-width: 260px; color: var(--muted); font-size: 14px; line-height: 1.6; }
  .tx-cta {
    margin-top: 22px;
    background: var(--blue);
    border: none; color: #fff;
    border-radius: 14px;
    padding: 14px 26px;
    font-weight: 600;
    box-shadow: 0 10px 26px rgba(79,91,255,.28);
  }
`

type Transaction = {
  id: string
  amount: number
  type?: 'debit' | 'credit' | string
  status?: string
  createdAt?: { toDate: () => Date }
}

const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
  </svg>
)

const ReceiptIcon = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

export function TransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login')
        return
      }
      try {
        setLoading(true)
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        )
        const snap = await getDocs(q)
        const rows = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Transaction, 'id'>),
        }))
        setTransactions(rows)
      } catch {
        setTransactions([])
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

  const totals = useMemo(() => {
    const spent = transactions
      .filter((t) => t.type === 'debit' || t.type === 'shopping')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const received = transactions
      .filter((t) => t.type === 'credit' || t.type === 'wallet')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const highest = Math.max(0, ...transactions.map((t) => t.amount || 0))
    return { spent, received, highest }
  }, [transactions])

  return (
    <>
      <style>{css}</style>
      <div className="tx-root">
        <header className="tx-top">
          <button className="tx-icon-btn" onClick={() => navigate('/dashboard')} type="button">
            <ArrowLeft />
          </button>
          <div>
            <div className="tx-title">Transactions</div>
            <div className="tx-sub">{transactions.length} transactions</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tx-icon-btn" type="button"><ChartIcon /></button>
            <button className="tx-icon-btn" type="button"><RefreshIcon /></button>
          </div>
        </header>

        <section className="tx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div className="tx-tile-label">Total Spent</div>
              <div className="tx-tile-value">{formatCurrency(totals.spent)}</div>
            </div>
            <div>
              <div className="tx-tile-label">Total Received</div>
              <div className="tx-tile-value">{formatCurrency(totals.received)}</div>
            </div>
          </div>
          <div className="tx-grid">
            <div className="tx-tile">
              <div className="tx-tile-label">Transactions</div>
              <div className="tx-tile-value">{transactions.length}</div>
            </div>
            <div className="tx-tile">
              <div className="tx-tile-label">Highest</div>
              <div className="tx-tile-value">{formatCurrency(totals.highest)}</div>
            </div>
          </div>
        </section>

        <div className="tx-tabs">
          <button className="tx-tab active" type="button">All</button>
          <button className="tx-tab" type="button">Shopping</button>
          <button className="tx-tab" type="button">Wallet</button>
          <button className="tx-tab" type="button">Refunds</button>
        </div>

        {loading ? (
          <div className="tx-empty">
            <ReceiptIcon />
            <h3>Loading transactions...</h3>
            <p>Please wait a moment.</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="tx-empty">
            <ReceiptIcon />
            <h3>No Transactions Yet</h3>
            <p>Start shopping or add funds to see your transaction history here.</p>
            <button className="tx-cta" type="button" onClick={() => navigate('/dashboard')}>
              Explore Marketplace
            </button>
          </div>
        ) : (
          <div className="tx-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="tx-item">
                <div>
                  <div className="tx-item-title">{tx.type ?? 'Transaction'}</div>
                  <div className="tx-item-sub">
                    {tx.createdAt ? tx.createdAt.toDate().toLocaleString() : 'Just now'}
                  </div>
                </div>
                <div>
                  <div className="tx-item-amount">{formatCurrency(tx.amount || 0)}</div>
                  <div className="tx-item-status">{tx.status ?? 'Completed'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
