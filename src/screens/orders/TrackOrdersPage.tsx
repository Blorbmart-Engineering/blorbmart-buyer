import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'

import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useFirebaseData'

type BuyerOrder = {
  id: string
  orderId?: string
  totalAmount?: number
  orderStatus?: string
  paymentStatus?: string
  createdAt?: { toDate?: () => Date; seconds?: number }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)

const formatDate = (value: BuyerOrder['createdAt']) => {
  if (value?.toDate) return value.toDate().toLocaleString()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toLocaleString()
  return 'Just now'
}

export function TrackOrdersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20),
          ),
        )

        setOrders(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<BuyerOrder, 'id'>) })))
      } catch (error) {
        console.error('Failed to load orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user])

  const focusedOrderId = new URLSearchParams(location.search).get('orderId')

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Track Orders</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              {focusedOrderId ? `Latest order: ${focusedOrderId}` : 'Monitor the orders you have placed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 12, padding: '10px 16px', cursor: 'pointer' }}
          >
            Back to home
          </button>
        </div>

        {loading ? (
          <div>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0' }}>
            No orders yet. Your new orders will appear here after checkout.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: focusedOrderId === order.orderId ? '#eff6ff' : '#fff',
                  borderRadius: 20,
                  padding: 20,
                  border: `1px solid ${focusedOrderId === order.orderId ? '#93c5fd' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18 }}>{order.orderId || order.id}</h2>
                    <p style={{ margin: '6px 0 0', color: '#64748b' }}>{formatDate(order.createdAt)}</p>
                  </div>
                  <strong>{formatCurrency(order.totalAmount || 0)}</strong>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 999, padding: '6px 10px', fontSize: 13 }}>
                    Status: {order.orderStatus || 'placed'}
                  </span>
                  <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 999, padding: '6px 10px', fontSize: 13 }}>
                    Payment: {order.paymentStatus || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
