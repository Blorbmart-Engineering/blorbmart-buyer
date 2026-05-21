import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  collection, doc, getDocs, onSnapshot,
  orderBy, query, where, Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'

// ─── Types ─────────────────────────────────────────────────────────────────────
type FsTs = { toDate?: () => Date; seconds?: number }

type StepData = {
  title: string
  description: string
  completed: boolean
  timestamp?: FsTs | null
}

type StoreItem = {
  productName: string
  imageUrl?: string
  quantity: number
  price: number
  variantName?: string
}

type StoreOrder = {
  storeId?: string
  storeName: string
  status?: string
  total?: number
  items?: StoreItem[]
}

type OrderStatus = {
  status: string
  currentStep?: number
  steps?: StepData[]
  estimatedDelivery?: FsTs
}

type Order = {
  id: string
  orderId?: string
  userId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  totalAmount?: number
  subtotal?: number
  deliveryFee?: number
  serviceFee?: number
  discountAmount?: number
  orderStatus?: string
  paymentStatus?: string
  paymentMethod?: string
  address?: Record<string, string>
  totalItems?: number
  storeCount?: number
  createdAt?: FsTs
  storeOrders?: StoreOrder[]
  liveStatus?: OrderStatus
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const fmtDate = (ts?: FsTs | null, long = false) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : null
  if (!d) return '—'
  return long
    ? d.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) +
        ' • ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' • ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',     color: '#c2410c', bg: '#fff7ed' },
  processing: { label: 'Processing',  color: '#b45309', bg: '#fef3c7' },
  confirmed:  { label: 'Confirmed',   color: '#1d4ed8', bg: '#dbeafe' },
  preparing:  { label: 'Preparing',   color: '#7c3aed', bg: '#ede9fe' },
  shipped:    { label: 'Shipped',     color: '#0369a1', bg: '#e0f2fe' },
  delivered:  { label: 'Delivered',   color: '#065f46', bg: '#d1fae5' },
  cancelled:  { label: 'Cancelled',   color: '#991b1b', bg: '#fee2e2' },
}
const getStatusMeta = (s?: string) =>
  STATUS_META[s?.toLowerCase() ?? ''] ?? { label: s ?? 'Unknown', color: '#475569', bg: '#f1f5f9' }

const PAYMENT_META: Record<string, { label: string; icon: string }> = {
  wallet:      { label: 'Wallet Balance', icon: '💳' },
  card:        { label: 'Debit/Credit Card', icon: '💳' },
  paystack:    { label: 'Paystack', icon: '💳' },
  cash:        { label: 'Cash on Delivery', icon: '💵' },
  cod:         { label: 'Cash on Delivery', icon: '💵' },
  bank:        { label: 'Bank Transfer', icon: '🏦' },
}
const getPaymentLabel = (m?: string) =>
  PAYMENT_META[m?.toLowerCase() ?? '']?.label ?? (m ?? 'Unknown')

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()

// ─── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  .to-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }
  .to-header { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.95); backdrop-filter:blur(8px); border-bottom:1.5px solid var(--border); padding:14px 16px; display:flex; align-items:center; gap:12px; }
  .to-back { width:36px; height:36px; border-radius:50%; border:1.5px solid var(--border); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .to-header-title { font-size:18px; font-weight:800; font-family:'Bricolage Grotesque',sans-serif; flex:1; }

  .to-body { max-width:1200px; margin:0 auto; padding:24px 16px 80px; }

  /* List + Detail two-panel on desktop */
  .to-layout { display:flex; gap:24px; align-items:flex-start; }
  .to-list-col { flex:0 0 360px; display:flex; flex-direction:column; gap:12px; }
  .to-detail-col { flex:1; min-width:0; }

  @media (max-width:860px) {
    .to-layout { flex-direction:column; }
    .to-list-col { flex:none; width:100%; }
    .to-detail-col { width:100%; }
  }

  /* Order card in list */
  .to-order-card { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:16px; cursor:pointer; transition:box-shadow .15s, border-color .15s; }
  .to-order-card:hover { box-shadow:var(--shadow-md); }
  .to-order-card.active { border-color:var(--blue); box-shadow:0 0 0 3px rgba(37,99,235,.12); }

  /* Stat chips strip */
  .to-stats { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .to-stat { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius); padding:12px 16px; flex:1; min-width:100px; }
  .to-stat-val { font-size:22px; font-weight:800; color:var(--blue); font-family:'Bricolage Grotesque',sans-serif; }
  .to-stat-lbl { font-size:12px; color:var(--text-2); margin-top:2px; }

  /* Detail cards */
  .to-card { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:20px; margin-bottom:16px; box-shadow:var(--shadow); }
  .to-card-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:var(--text); margin-bottom:16px; }

  /* Status badge */
  .to-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700; }

  /* Timeline */
  .to-timeline { display:flex; flex-direction:column; gap:0; }
  .to-step { display:flex; gap:14px; }
  .to-step-left { display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
  .to-step-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
  .to-step-line { width:2px; flex:1; min-height:32px; margin:2px 0; }
  .to-step-content { padding-bottom:24px; flex:1; min-width:0; }
  .to-step-title { font-size:14px; font-weight:700; color:var(--text); }
  .to-step-desc { font-size:12px; color:var(--text-2); margin-top:2px; }
  .to-step-time { font-size:11px; color:var(--text-3); margin-top:3px; }

  /* Summary rows */
  .to-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); }
  .to-row:last-child { border-bottom:none; }
  .to-row-label { font-size:14px; color:var(--text-2); }
  .to-row-value { font-size:14px; font-weight:600; color:var(--text); }

  /* Store order card */
  .to-store-header { background:var(--bg); border-radius:var(--radius) var(--radius) 0 0; border-bottom:1.5px solid var(--border); padding:12px 16px; display:flex; align-items:center; gap:10px; }
  .to-store-avatar { width:32px; height:32px; border-radius:8px; background:var(--blue-light); color:var(--blue); font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .to-store-name { font-size:14px; font-weight:700; flex:1; }
  .to-item-row { display:flex; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border); }
  .to-item-row:last-child { border-bottom:none; }
  .to-item-img { width:54px; height:54px; border-radius:8px; object-fit:cover; background:var(--bg); flex-shrink:0; }
  .to-item-img-ph { width:54px; height:54px; border-radius:8px; background:var(--bg); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .to-item-name { font-size:13px; font-weight:600; color:var(--text); }
  .to-item-sub { font-size:12px; color:var(--text-2); margin-top:2px; }
  .to-item-price { font-size:13px; font-weight:700; color:var(--text); margin-top:4px; }
  .to-store-total { background:var(--bg); border-radius:0 0 var(--radius) var(--radius); padding:10px 16px; display:flex; justify-content:space-between; align-items:center; }

  /* Empty / loading */
  .to-empty { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:56px 20px; text-align:center; }
  .to-empty-icon { font-size:48px; margin-bottom:12px; }
  .to-empty-title { font-size:17px; font-weight:800; color:var(--text); margin-bottom:6px; }
  .to-empty-sub { font-size:14px; color:var(--text-2); }

  /* Print receipt button */
  .to-print-btn { display:inline-flex; align-items:center; gap:6px; border:1.5px solid var(--border); background:#fff; color:var(--text); border-radius:var(--radius); padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
  .to-print-btn:hover { background:var(--bg); }

  /* Estimated delivery box */
  .to-eta { background:var(--blue-light); border-radius:var(--radius); padding:14px 16px; display:flex; gap:12px; align-items:flex-start; margin-top:16px; }
  .to-eta-text { font-size:13px; color:var(--blue); font-weight:600; }
  .to-eta-sub { font-size:12px; color:var(--blue); opacity:.75; margin-top:2px; }

  /* Skeleton for list */
  .to-skel-card { background:#fff; border:1.5px solid var(--border); border-radius:var(--radius-lg); padding:16px; }

  @media print {
    .to-header, .to-list-col, .to-stats, .to-print-btn, .bm-bottom-nav { display:none !important; }
    .to-detail-col { width:100% !important; }
    .to-card { box-shadow:none !important; border:1px solid #ddd !important; }
  }
`

// ─── Status Timeline ────────────────────────────────────────────────────────────
const DEFAULT_STEPS: StepData[] = [
  { title: 'Order Placed',  description: 'Your order has been received',    completed: false },
  { title: 'Processing',    description: 'Vendor is preparing your order',  completed: false },
  { title: 'Out for Delivery', description: 'Your order is on the way',     completed: false },
  { title: 'Delivered',     description: 'Order has been delivered',        completed: false },
]

function StatusTimeline({ steps, currentStep }: { steps: StepData[]; currentStep: number }) {
  return (
    <div className="to-timeline">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const isCompleted = step.completed
        const isCurrent = i === currentStep - 1 && !isCompleted
        const dotBg = isCompleted ? '#10b981' : isCurrent ? 'var(--blue)' : '#e2e8f0'
        const dotColor = isCompleted || isCurrent ? '#fff' : '#94a3b8'
        const lineBg = isCompleted ? '#10b981' : '#e2e8f0'
        return (
          <div key={i} className="to-step">
            <div className="to-step-left">
              <div className="to-step-dot" style={{ background: dotBg, color: dotColor }}>
                {isCompleted ? '✓' : isCurrent ? '●' : '○'}
              </div>
              {!isLast && <div className="to-step-line" style={{ background: lineBg }} />}
            </div>
            <div className="to-step-content">
              <div className="to-step-title" style={{ color: isCompleted || isCurrent ? 'var(--text)' : 'var(--text-2)' }}>
                {step.title}
                {isCurrent && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: 'var(--blue-light)', color: 'var(--blue)', padding: '2px 8px', borderRadius: 99 }}>CURRENT</span>
                )}
              </div>
              <div className="to-step-desc">{step.description}</div>
              {step.timestamp && (
                <div className="to-step-time">{fmtDate(step.timestamp)}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Order Detail Panel ─────────────────────────────────────────────────────────
function OrderDetail({ order, onBack }: { order: Order; onBack?: () => void }) {
  const [status, setStatus] = useState<OrderStatus | null>(order.liveStatus ?? null)
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>(order.storeOrders ?? [])
  const [loadingStores, setLoadingStores] = useState(!order.storeOrders)

  useEffect(() => {
    // Real-time order status subscription
    const orderId = order.orderId ?? order.id
    const unsub: Unsubscribe = onSnapshot(
      doc(db, 'orderStatus', orderId),
      snap => {
        if (snap.exists()) setStatus(snap.data() as OrderStatus)
      },
      () => {}
    )
    return () => unsub()
  }, [order.id, order.orderId])

  useEffect(() => {
    if (order.storeOrders) { setStoreOrders(order.storeOrders); return }
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'orders', order.id, 'storeOrders'))
        setStoreOrders(snap.docs.map(d => d.data() as StoreOrder))
      } finally { setLoadingStores(false) }
    }
    load()
  }, [order.id, order.storeOrders])

  const handlePrint = () => window.print()

  const currentStatus = status?.status ?? order.orderStatus ?? 'pending'
  const sm = getStatusMeta(currentStatus)
  const steps = status?.steps ?? DEFAULT_STEPS
  const currentStep = status?.currentStep ?? 1
  const address = order.address as Record<string, string> | undefined

  return (
    <div className="to-detail-col">
      {/* Order header card */}
      <div className="to-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Order #{order.orderId ?? order.id.slice(0, 8).toUpperCase()}</span>
              <span className="to-badge" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Placed {fmtDate(order.createdAt)}</div>
            {order.totalItems !== undefined && (
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {order.totalItems} item{order.totalItems !== 1 ? 's' : ''} · {order.storeCount ?? 1} store{(order.storeCount ?? 1) !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', fontFamily: "'Bricolage Grotesque',sans-serif" }}>
              {fmt(order.totalAmount ?? 0)}
            </div>
            <button className="to-print-btn" type="button" onClick={handlePrint}>
              🖨 Print Receipt
            </button>
          </div>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            ← Back to orders
          </button>
        )}
      </div>

      {/* Status timeline */}
      <div className="to-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="to-card-title" style={{ margin: 0 }}>Order Status</div>
          <span className="to-badge" style={{ background: sm.bg, color: sm.color }}>{sm.label.toUpperCase()}</span>
        </div>
        <StatusTimeline steps={steps} currentStep={currentStep} />
        {status?.estimatedDelivery && (
          <div className="to-eta">
            <span style={{ fontSize: 18 }}>🕐</span>
            <div>
              <div className="to-eta-text">Estimated Delivery</div>
              <div className="to-eta-sub">{fmtDate(status.estimatedDelivery, true)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="to-card">
        <div className="to-card-title">Order Summary</div>
        {order.subtotal !== undefined && (
          <div className="to-row"><span className="to-row-label">Subtotal</span><span className="to-row-value">{fmt(order.subtotal)}</span></div>
        )}
        {order.deliveryFee !== undefined && (
          <div className="to-row"><span className="to-row-label">Delivery Fee</span><span className="to-row-value">{fmt(order.deliveryFee)}</span></div>
        )}
        {order.serviceFee !== undefined && order.serviceFee > 0 && (
          <div className="to-row"><span className="to-row-label">Service Fee</span><span className="to-row-value">{fmt(order.serviceFee)}</span></div>
        )}
        {order.discountAmount !== undefined && order.discountAmount > 0 && (
          <div className="to-row">
            <span className="to-row-label">Discount</span>
            <span className="to-row-value" style={{ color: '#10b981' }}>−{fmt(order.discountAmount)}</span>
          </div>
        )}
        <div className="to-row" style={{ borderTop: '1.5px solid var(--border)', marginTop: 4, paddingTop: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Total</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)', fontFamily: "'Bricolage Grotesque',sans-serif" }}>{fmt(order.totalAmount ?? 0)}</span>
        </div>
        {order.paymentMethod && (
          <div style={{ marginTop: 12, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>
            💳 Paid with {getPaymentLabel(order.paymentMethod)}
            {order.paymentStatus && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 99 }}>
                {order.paymentStatus.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delivery address */}
      {address && (
        <div className="to-card">
          <div className="to-card-title">Delivery Address</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>📍</div>
            <div>
              {address.name && <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{address.name}</div>}
              {address.addressLine1 && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{address.addressLine1}</div>}
              {address.addressLine2 && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{address.addressLine2}</div>}
              {(address.city || address.state) && (
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{[address.city, address.state].filter(Boolean).join(', ')}</div>
              )}
              {address.phone && <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{address.phone}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Store orders */}
      {loadingStores ? (
        <div className="to-card">
          <div className="bm-skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="bm-skeleton" style={{ width: 54, height: 54, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="bm-skeleton" style={{ height: 12, marginBottom: 6 }} />
                <div className="bm-skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : storeOrders.length > 0 ? (
        <div className="to-card">
          <div className="to-card-title">Items Ordered ({storeOrders.length} store{storeOrders.length !== 1 ? 's' : ''})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {storeOrders.map((so, si) => {
              const storeMeta = getStatusMeta(so.status)
              return (
                <div key={si} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div className="to-store-header">
                    <div className="to-store-avatar">{getInitials(so.storeName ?? 'S')}</div>
                    <span className="to-store-name">{so.storeName}</span>
                    {so.status && (
                      <span className="to-badge" style={{ background: storeMeta.bg, color: storeMeta.color, fontSize: 11 }}>
                        {storeMeta.label}
                      </span>
                    )}
                  </div>
                  {(so.items ?? []).map((item, ii) => (
                    <div key={ii} className="to-item-row">
                      {item.imageUrl
                        ? <img className="to-item-img" src={item.imageUrl} alt={item.productName} />
                        : <div className="to-item-img-ph">📦</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="to-item-name">{item.productName}</div>
                        {item.variantName && <div className="to-item-sub">Variant: {item.variantName}</div>}
                        <div className="to-item-sub">{item.quantity} × {fmt(item.price)}</div>
                        <div className="to-item-price">{fmt(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))}
                  {so.total !== undefined && (
                    <div className="to-store-total">
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Store Total</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue)' }}>{fmt(so.total)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export function TrackOrdersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)

  const urlOrderId = new URLSearchParams(location.search).get('orderId')

  const loadOrders = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      const snap = await getDocs(
        query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
      )
      const loaded = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
      setOrders(loaded)
      // Auto-select if URL param present
      const target = urlOrderId
        ? loaded.find(o => o.orderId === urlOrderId || o.id === urlOrderId)
        : null
      if (target) { setSelectedId(target.id); setMobileDetail(true) }
      else if (loaded.length > 0 && !selectedId) { setSelectedId(loaded[0].id) }
    } catch { setOrders([]) }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, urlOrderId])

  useEffect(() => { loadOrders() }, [loadOrders])

  const selectedOrder = orders.find(o => o.id === selectedId)

  const totalSpent = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0)

  const handleSelectOrder = (id: string) => {
    setSelectedId(id)
    setMobileDetail(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="to-root">
        <header className="to-header">
          <button className="to-back" type="button" onClick={() => navigate('/dashboard')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="to-header-title">
            {mobileDetail && selectedOrder ? `Order #${selectedOrder.orderId ?? selectedOrder.id.slice(0,8).toUpperCase()}` : 'My Orders'}
          </span>
          {loading && (
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', marginLeft: 'auto' }} />
          )}
        </header>

        <div className="to-body">

          {/* Stats strip */}
          {!loading && orders.length > 0 && (
            <div className="to-stats">
              <div className="to-stat">
                <div className="to-stat-val">{orders.length}</div>
                <div className="to-stat-lbl">Total Orders</div>
              </div>
              <div className="to-stat">
                <div className="to-stat-val">{orders.filter(o => (o.orderStatus ?? '').toLowerCase() === 'delivered').length}</div>
                <div className="to-stat-lbl">Delivered</div>
              </div>
              <div className="to-stat">
                <div className="to-stat-val">{orders.filter(o => !['delivered','cancelled'].includes((o.orderStatus ?? '').toLowerCase())).length}</div>
                <div className="to-stat-lbl">Active</div>
              </div>
              <div className="to-stat" style={{ flex: '2 1 160px' }}>
                <div className="to-stat-val">{fmt(totalSpent)}</div>
                <div className="to-stat-lbl">Total Spent</div>
              </div>
            </div>
          )}

          {/* Mobile: show detail if selected */}
          {mobileDetail && selectedOrder ? (
            <div className="to-detail-col" style={{ display: undefined }}>
              <OrderDetail order={selectedOrder} onBack={() => setMobileDetail(false)} />
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="to-skel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="bm-skeleton" style={{ height: 14, width: '45%' }} />
                    <div className="bm-skeleton" style={{ height: 14, width: '20%' }} />
                  </div>
                  <div className="bm-skeleton" style={{ height: 12, width: '30%', marginBottom: 8 }} />
                  <div className="bm-skeleton" style={{ height: 22, width: '35%', borderRadius: 99 }} />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="to-empty">
              <div className="to-empty-icon">📦</div>
              <div className="to-empty-title">No orders yet</div>
              <div className="to-empty-sub">Your orders will appear here after you make a purchase.</div>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                style={{ marginTop: 20, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            /* Desktop two-panel layout */
            <div className="to-layout">
              {/* Orders list */}
              <div className="to-list-col">
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </div>
                {orders.map(order => {
                  const sm = getStatusMeta(order.orderStatus)
                  const isActive = order.id === selectedId
                  return (
                    <div
                      key={order.id}
                      className={`to-order-card${isActive ? ' active' : ''}`}
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            #{order.orderId ?? order.id.slice(0, 10).toUpperCase()}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                            {fmtDate(order.createdAt)}
                          </div>
                        </div>
                        <span className="to-badge" style={{ background: sm.bg, color: sm.color, flexShrink: 0, fontSize: 11 }}>{sm.label}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          {order.totalItems ?? '?'} item{(order.totalItems ?? 1) !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--blue)', fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                          {fmt(order.totalAmount ?? 0)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Detail panel */}
              {selectedOrder
                ? <OrderDetail order={selectedOrder} />
                : (
                  <div className="to-detail-col">
                    <div className="to-empty">
                      <div className="to-empty-icon">📋</div>
                      <div className="to-empty-title">Select an order</div>
                      <div className="to-empty-sub">Click an order on the left to see its details.</div>
                    </div>
                  </div>
                )
              }
            </div>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
