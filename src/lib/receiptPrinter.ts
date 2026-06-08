const fmt = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v)

const fmtDate = (d?: Date) =>
  d ? d.toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', 'Segoe UI', sans-serif; background: #fff; color: #0F172A; }
  .receipt { max-width: 400px; margin: 32px auto; padding: 32px; border: 1px solid #E2E8F0; border-radius: 16px; }
  .brand { text-align: center; font-size: 22px; font-weight: 800; letter-spacing: -.5px; color: #1D4ED8; margin-bottom: 4px; }
  .brand-sub { text-align: center; font-size: 12px; color: #64748B; margin-bottom: 20px; }
  hr { border: none; border-top: 1px dashed #CBD5E1; margin: 16px 0; }
  .amount { text-align: center; font-size: 36px; font-weight: 800; margin: 16px 0 4px; }
  .amount.credit { color: #059669; }
  .amount.debit  { color: #DC2626; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #DCFCE7; color: #065F46; }
  .badge.pending { background: #FEF3C7; color: #92400E; }
  .badge.failed  { background: #FEE2E2; color: #991B1B; }
  .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 10px; gap: 16px; }
  .row .lbl { color: #64748B; }
  .row .val { font-weight: 600; text-align: right; word-break: break-all; }
  .footer { text-align: center; font-size: 11.5px; color: #94A3B8; margin-top: 20px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .receipt { border: none; max-width: 100%; } }
`

function printWindow(html: string) {
  const w = window.open('', '_blank', 'width=520,height=720')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt — Blorbmart</title><style>${styles}</style></head><body>${html}</body></html>`)
  w.document.close()
  setTimeout(() => { w.focus(); w.print() }, 300)
}

export interface WalletTxReceiptData {
  type: string
  amount: number
  description: string
  status: string
  reference: string
  paymentMethod?: string
  newBalance?: number
  timestamp?: Date
  userName?: string
}

export function printWalletReceipt(tx: WalletTxReceiptData) {
  const isCredit = ['deposit', 'credit', 'wallet', 'refund', 'cashback', 'referral'].includes(tx.type.toLowerCase())
  const badgeClass = tx.status === 'completed' ? '' : tx.status === 'pending' ? 'pending' : 'failed'
  printWindow(`
    <div class="receipt">
      <div class="brand">Blorbmart</div>
      <div class="brand-sub">Wallet Receipt</div>
      <hr/>
      <div class="amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '−'}${fmt(tx.amount)}</div>
      <div style="text-align:center;margin-bottom:16px;"><span class="badge ${badgeClass}">${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span></div>
      <hr/>
      ${tx.userName ? `<div class="row"><span class="lbl">Account</span><span class="val">${tx.userName}</span></div>` : ''}
      <div class="row"><span class="lbl">Type</span><span class="val">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span></div>
      <div class="row"><span class="lbl">Description</span><span class="val">${tx.description || '—'}</span></div>
      ${tx.paymentMethod ? `<div class="row"><span class="lbl">Method</span><span class="val">${tx.paymentMethod}</span></div>` : ''}
      ${tx.newBalance !== undefined ? `<div class="row"><span class="lbl">Balance After</span><span class="val">${fmt(tx.newBalance)}</span></div>` : ''}
      <div class="row"><span class="lbl">Reference</span><span class="val">${tx.reference || '—'}</span></div>
      <div class="row"><span class="lbl">Date</span><span class="val">${fmtDate(tx.timestamp)}</span></div>
      <hr/>
      <div class="footer">Thank you for using Blorbmart Wallet<br/>Keep this receipt for your records</div>
    </div>
  `)
}

export interface OrderReceiptData {
  orderId?: string
  items?: Array<{ name?: string; qty?: number; price?: number }>
  subtotal?: number
  deliveryFee?: number
  discount?: number
  total?: number
  paymentMethod?: string
  address?: string
  status?: string
  createdAt?: Date
  storeName?: string
  customerName?: string
}

export function printOrderReceipt(order: OrderReceiptData) {
  const itemsHtml = (order.items ?? []).map(it =>
    `<div class="row"><span class="lbl">${it.name ?? 'Item'} × ${it.qty ?? 1}</span><span class="val">${fmt((it.price ?? 0) * (it.qty ?? 1))}</span></div>`
  ).join('')

  printWindow(`
    <div class="receipt">
      <div class="brand">Blorbmart</div>
      <div class="brand-sub">Order Receipt</div>
      <hr/>
      ${order.orderId ? `<div class="row"><span class="lbl">Order ID</span><span class="val">#${order.orderId.slice(-8).toUpperCase()}</span></div>` : ''}
      ${order.status ? `<div class="row"><span class="lbl">Status</span><span class="val">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></div>` : ''}
      ${order.createdAt ? `<div class="row"><span class="lbl">Date</span><span class="val">${fmtDate(order.createdAt)}</span></div>` : ''}
      ${order.customerName ? `<div class="row"><span class="lbl">Customer</span><span class="val">${order.customerName}</span></div>` : ''}
      ${order.storeName ? `<div class="row"><span class="lbl">Store</span><span class="val">${order.storeName}</span></div>` : ''}
      <hr/>
      ${itemsHtml}
      <hr/>
      ${order.subtotal !== undefined ? `<div class="row"><span class="lbl">Subtotal</span><span class="val">${fmt(order.subtotal)}</span></div>` : ''}
      ${order.deliveryFee !== undefined ? `<div class="row"><span class="lbl">Delivery</span><span class="val">${order.deliveryFee === 0 ? 'Free' : fmt(order.deliveryFee)}</span></div>` : ''}
      ${order.discount ? `<div class="row"><span class="lbl">Discount</span><span class="val" style="color:#059669">−${fmt(order.discount)}</span></div>` : ''}
      <div class="row" style="font-size:15px;font-weight:800;border-top:1px solid #E2E8F0;padding-top:10px;margin-top:4px;">
        <span class="lbl" style="color:#0F172A;font-weight:800;">Total</span>
        <span class="val" style="color:#1D4ED8">${fmt(order.total ?? 0)}</span>
      </div>
      ${order.paymentMethod ? `<div class="row" style="margin-top:10px;"><span class="lbl">Payment</span><span class="val">${order.paymentMethod}</span></div>` : ''}
      ${order.address ? `<div class="row"><span class="lbl">Delivered to</span><span class="val">${order.address}</span></div>` : ''}
      <hr/>
      <div class="footer">Thank you for shopping with Blorbmart!</div>
    </div>
  `)
}
