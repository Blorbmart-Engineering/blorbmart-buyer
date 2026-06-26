import { collection, doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { db } from '../lib/firebase'
import { isFoodItem, type CartItem } from '../contexts/CartContext'

type CheckoutInput = {
  user: User
  items: CartItem[]
  customerName: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    landmark?: string
    note?: string
    deliveryZone?: 'campus' | 'off_campus'
  }
  paymentMethod: 'wallet' | 'paystack'
  fulfillmentType?: 'asap' | 'preorder'
  scheduledFor?: string
  preorderCutoffAt?: string
  scheduledLabel?: string
}

const resolveVendorAuthId = async (vendorOrStoreId: string) => {
  if (!vendorOrStoreId) return vendorOrStoreId
  try {
    const storeSnap = await getDoc(doc(db, 'stores', vendorOrStoreId))
    if (storeSnap.exists()) {
      const data = storeSnap.data() || {}
      return String(data.vendorId || data.userId || vendorOrStoreId)
    }
    const vendorSnap = await getDoc(doc(db, 'vendors', vendorOrStoreId))
    if (vendorSnap.exists()) {
      const data = vendorSnap.data() || {}
      return String(data.userId || vendorOrStoreId)
    }
  } catch {
    /* best-effort */
  }
  return vendorOrStoreId
}

const groupItemsByVendor = async (items: CartItem[]) => {
  const grouped = new Map<string, CartItem[]>()

  items.forEach((item) => {
    const key = item.vendorId || 'unknown_vendor'
    const existing = grouped.get(key) || []
    existing.push(item)
    grouped.set(key, existing)
  })

  const entries = await Promise.all(
    [...grouped.entries()].map(async ([vendorId, vendorItems]) => {
      const vendorAuthId = await resolveVendorAuthId(vendorId)
      const storeId = vendorItems[0]?.storeId || vendorId
      return {
        vendorId: vendorAuthId,
        storeId,
        storeName: vendorItems[0]?.storeName || 'Blorbmart Store',
        status: 'placed',
        subtotal: vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        total: vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        items: vendorItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          name: item.name,
          quantity: item.quantity,
          qty: item.quantity,
          price: item.price,
          image: item.image || '',
          storeName: item.storeName || 'Blorbmart Store',
        })),
      }
    }),
  )

  return entries
}

export async function createOrder(input: CheckoutInput) {
  const orderRef = doc(collection(db, 'orders'))
  const orderId = `BLB-${orderRef.id.slice(0, 8).toUpperCase()}`
  const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const storeOrders = await groupItemsByVendor(input.items)
  const vendorIds = [...new Set(
    storeOrders.flatMap((entry) => [entry.vendorId, entry.storeId].filter(Boolean)),
  )]
  const isFoodOrder = input.items.length > 0 && input.items.every(isFoodItem)
  const primaryStore = storeOrders[0]

  await setDoc(orderRef, {
    orderId,
    userId: input.user.uid,
    buyerId: input.user.uid,
    userEmail: input.user.email || '',
    userName: input.customerName || input.user.email || 'Buyer',
    userPhone: input.phone,
    phone: input.phone,
    orderType: isFoodOrder ? 'food' : 'retail',
    storeId: primaryStore?.storeId || null,
    storeName: primaryStore?.storeName || null,
    storeCount: storeOrders.length,
    items: input.items.map((item) => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || '',
      vendorId: item.vendorId || null,
      storeName: item.storeName || 'Blorbmart Store',
    })),
    storeOrders,
    vendorIds,
    subtotal: totalAmount,
    total: totalAmount,
    totalAmount,
    currency: 'NGN',
    paymentMethod: input.paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    status: 'placed',
    fulfillmentType: input.fulfillmentType || 'asap',
    ...(input.fulfillmentType === 'preorder' && input.scheduledFor
      ? {
          scheduledFor: Timestamp.fromDate(new Date(input.scheduledFor)),
          preorderCutoffAt: input.preorderCutoffAt
            ? Timestamp.fromDate(new Date(input.preorderCutoffAt))
            : null,
          scheduledLabel: input.scheduledLabel || null,
        }
      : {}),
    address: {
      street: input.address.street,
      city: input.address.city,
      state: input.address.state,
      landmark: input.address.landmark || input.address.note || '',
      addressLine2: input.address.note || '',
      deliveryZone: input.address.deliveryZone || 'off_campus',
    },
    deliveryAddress: {
      street: input.address.street,
      city: input.address.city,
      state: input.address.state,
      landmark: input.address.landmark || input.address.note || '',
      note: input.address.note || '',
      deliveryZone: input.address.deliveryZone || 'off_campus',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { id: orderRef.id, orderId, totalAmount }
}
