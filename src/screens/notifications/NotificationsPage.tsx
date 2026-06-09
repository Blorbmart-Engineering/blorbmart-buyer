import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, deleteDoc, doc, getDocs, orderBy, query, writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'
import {
  PackageIcon, CashIcon, TruckIcon, TagIcon, StarIcon, BellIcon, type IconType,
} from '../../components/icons'

// ─── Types ──────────────────────────────────────────────────────────────────────
type FsTs = { toDate?: () => Date; seconds?: number }

type Notification = {
  id: string
  title?: string
  body?: string
  type?: string
  read?: boolean
  createdAt?: FsTs
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
const toDate = (ts?: FsTs): Date => {
  if (!ts) return new Date()
  if (ts.toDate) return ts.toDate()
  if (ts.seconds) return new Date(ts.seconds * 1000)
  return new Date()
}

const fmtRelative = (d: Date): string => {
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

const TYPE_META: Record<string, { icon: IconType; color: string }> = {
  order:    { icon: PackageIcon, color: '#5156f1' },
  wallet:   { icon: CashIcon, color: '#00b894' },
  delivery: { icon: TruckIcon, color: '#1f77f1' },
  promo:    { icon: TagIcon, color: '#ff5500' },
  review:   { icon: StarIcon, color: '#ffc200' },
}

const getMeta = (type?: string) =>
  TYPE_META[(type ?? '').toLowerCase()] ?? { icon: BellIcon, color: '#94a3b8' }

// ─── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  .nt-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }

  .nt-header { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.95); backdrop-filter:blur(8px);
    border-bottom:1.5px solid var(--border); padding:14px 20px; display:flex; align-items:center; gap:12px; }
  .nt-back { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border); background:#fff;
    display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .nt-header-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; flex:1; text-align:center; }
  .nt-clear { font-size:13px; font-weight:700; color:#ef4444; background:none; border:none; cursor:pointer;
    padding:4px 8px; font-family:'Plus Jakarta Sans',sans-serif; }

  .nt-body { max-width:600px; margin:0 auto; padding:0 0 80px; }

  /* Notification row */
  .nt-item { display:flex; align-items:flex-start; gap:14px; padding:16px 20px;
    border-bottom:1px solid var(--border); cursor:default; transition:background .15s; }
  .nt-item.unread { background:rgba(81,86,241,.04); }
  .nt-item:last-child { border-bottom:none; }
  .nt-icon { width:44px; height:44px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:20px; flex-shrink:0; }
  .nt-content { flex:1; min-width:0; }
  .nt-title-row { display:flex; align-items:flex-start; gap:8px; margin-bottom:3px; }
  .nt-title { font-size:14px; font-weight:700; color:var(--text); flex:1; min-width:0; }
  .nt-title.unread { font-weight:800; }
  .nt-time { font-size:11px; color:var(--text-2); white-space:nowrap; margin-top:1px; }
  .nt-body-text { font-size:13px; color:var(--text-2); line-height:1.45; }
  .nt-tag { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
    border-radius:99px; margin-top:6px; }
  .nt-dot { width:8px; height:8px; border-radius:50%; background:#5156f1; flex-shrink:0; margin-top:5px; }
  .nt-del { width:32px; height:32px; border-radius:50%; border:none; background:none; cursor:pointer;
    font-size:16px; display:flex; align-items:center; justify-content:center; color:var(--text-2);
    flex-shrink:0; margin-top:-4px; transition:background .15s; }
  .nt-del:hover { background:#fee2e2; color:#ef4444; }

  /* Skeleton */
  .nt-skel-item { display:flex; gap:14px; padding:16px 20px; border-bottom:1px solid var(--border); }

  /* Empty */
  .nt-empty { display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:80px 24px; text-align:center; }
  .nt-empty-bubble { width:100px; height:100px; border-radius:50%; background:rgba(81,86,241,.08);
    display:flex; align-items:center; justify-content:center; font-size:44px; margin-bottom:24px; }
  .nt-empty-title { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800;
    color:var(--text); margin-bottom:10px; }
  .nt-empty-sub { font-size:14px; color:var(--text-2); line-height:1.55; max-width:280px; }

  /* Confirm overlay */
  .nt-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100;
    display:flex; align-items:flex-end; justify-content:center; }
  @media(min-width:600px){ .nt-overlay { align-items:center; } }
  .nt-dialog { background:#fff; border-radius:24px 24px 0 0; padding:28px 24px; width:100%; max-width:440px; }
  @media(min-width:600px){ .nt-dialog { border-radius:24px; } }
  .nt-dialog-title { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800;
    color:var(--text); margin-bottom:8px; }
  .nt-dialog-sub { font-size:14px; color:var(--text-2); margin-bottom:24px; }
  .nt-dialog-actions { display:flex; gap:10px; }
  .nt-dialog-cancel { flex:1; padding:13px; border:1.5px solid var(--border); background:#fff;
    border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; color:var(--text); }
  .nt-dialog-confirm { flex:1; padding:13px; border:none; background:#ef4444; color:#fff;
    border-radius:var(--radius); font-size:14px; font-weight:700; cursor:pointer;
    font-family:'Plus Jakarta Sans',sans-serif; }
`

// ─── Main Component ─────────────────────────────────────────────────────────────
export function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [items, setItems]         = useState<Notification[]>([])
  const [loading, setLoading]     = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [clearing, setClearing]   = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'users', user.uid, 'notifications'),
            orderBy('createdAt', 'desc'),
          )
        )
        const notifs: Notification[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Notification, 'id'>) }))
        setItems(notifs)

        // Mark all unread as read (batch)
        const batch = writeBatch(db)
        let dirty = false
        snap.docs.forEach(d => {
          if (d.data().read !== true) {
            batch.update(d.ref, { read: true })
            dirty = true
          }
        })
        if (dirty) await batch.commit()
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  const deleteOne = async (id: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id))
      setItems(prev => prev.filter(n => n.id !== id))
    } catch { /* silent */ }
  }

  const clearAll = async () => {
    if (!user) return
    setClearing(true)
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'notifications'))
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      setItems([])
    } catch { /* silent */ }
    finally { setClearing(false); setShowConfirm(false) }
  }

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="nt-root">
        <header className="nt-header">
          <button className="nt-back" type="button" onClick={() => navigate(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="nt-header-title">Notifications</span>
          {items.length > 0 && (
            <button className="nt-clear" type="button" onClick={() => setShowConfirm(true)}>
              Clear all
            </button>
          )}
          {items.length === 0 && <div style={{ width: 64 }} />}
        </header>

        <div className="nt-body">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="nt-skel-item">
                <div className="bm-skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="bm-skeleton" style={{ height: 13, width: '60%', marginBottom: 8 }} />
                  <div className="bm-skeleton" style={{ height: 11, width: '85%', marginBottom: 6 }} />
                  <div className="bm-skeleton" style={{ height: 11, width: '40%' }} />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="nt-empty">
              <div className="nt-empty-bubble"><BellIcon /></div>
              <div className="nt-empty-title">No Notifications Yet</div>
              <div className="nt-empty-sub">
                You're all caught up! Notifications about your orders, wallet, and deals will appear here.
              </div>
            </div>
          ) : (
            items.map(n => {
              const { icon: Icon, color } = getMeta(n.type)
              const isUnread = !n.read
              const d = toDate(n.createdAt)
              const tag = n.type && n.type !== 'general'
                ? n.type.charAt(0).toUpperCase() + n.type.slice(1)
                : null
              return (
                <div key={n.id} className={`nt-item${isUnread ? ' unread' : ''}`}>
                  <div className="nt-icon" style={{ background: color + '1a', color }}><Icon /></div>
                  <div className="nt-content">
                    <div className="nt-title-row">
                      <div className={`nt-title${isUnread ? ' unread' : ''}`}>
                        {n.title ?? 'Notification'}
                      </div>
                      <div className="nt-time">{fmtRelative(d)}</div>
                    </div>
                    {n.body && <div className="nt-body-text">{n.body}</div>}
                    {tag && (
                      <span className="nt-tag" style={{ background: color + '1a', color }}>
                        {tag}
                      </span>
                    )}
                  </div>
                  {isUnread && <div className="nt-dot" />}
                  <button
                    className="nt-del"
                    type="button"
                    title="Delete"
                    onClick={() => deleteOne(n.id)}
                  >
                    ✕
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Clear all confirm dialog */}
      {showConfirm && (
        <div className="nt-overlay" onClick={() => !clearing && setShowConfirm(false)}>
          <div className="nt-dialog" onClick={e => e.stopPropagation()}>
            <div className="nt-dialog-title">Clear All Notifications</div>
            <div className="nt-dialog-sub">This will permanently remove all your notifications. This cannot be undone.</div>
            <div className="nt-dialog-actions">
              <button className="nt-dialog-cancel" type="button" onClick={() => setShowConfirm(false)} disabled={clearing}>
                Cancel
              </button>
              <button className="nt-dialog-confirm" type="button" onClick={clearAll} disabled={clearing}>
                {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
