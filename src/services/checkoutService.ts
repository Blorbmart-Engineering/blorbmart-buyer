import { apiFetch, apiFetchAuth } from '../lib/api'

export type CheckoutPricing = {
  subtotal: number
  discountAmount: number
  deliveryFee: number
  serviceFee: number
  totalAmount: number
  promoCode?: string | null
  addressNotes?: string
}

export async function getWalletBalance(userId: string) {
  const response = await apiFetch(`/api/wallet/${userId}`)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to load wallet balance')
  }
  return Number(payload?.data?.balance || 0)
}

export async function calculateOrderPricing(orderId: string, promoCode?: string) {
  const response = await apiFetchAuth(`/api/orders/${encodeURIComponent(orderId)}/calculate`, {
    method: 'POST',
    body: JSON.stringify({ promoCode: promoCode || null }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to calculate order total')
  }
  return payload.data as CheckoutPricing
}

export async function payForOrderWithWallet(orderId: string, promoCode?: string) {
  const response = await apiFetchAuth('/api/orders/checkout/wallet', {
    method: 'POST',
    body: JSON.stringify({ orderId, promoCode: promoCode || null }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Wallet payment failed')
  }
  return payload.data
}

export async function initializePaystackCheckout(orderId: string, promoCode?: string) {
  const response = await apiFetchAuth('/api/orders/checkout/paystack', {
    method: 'POST',
    body: JSON.stringify({ orderId, promoCode: promoCode || null }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to initialize Paystack checkout')
  }
  return payload.data as {
    orderId: string
    paymentReference: string
    authorization_url: string
    reference: string
    pricing: CheckoutPricing
  }
}

export async function verifyPaystackCheckout(reference: string, orderId: string) {
  const response = await apiFetchAuth('/api/orders/checkout/paystack/verify', {
    method: 'POST',
    body: JSON.stringify({ reference, orderId }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || 'Failed to verify Paystack payment')
  }
  return payload.data
}
