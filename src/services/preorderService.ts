import { apiFetch } from '../lib/api'

export type PreorderOption = {
  date: string
  scheduledFor: string
  cutoffAt: string
  label: string
  cutoffLabel: string
  ordersRemaining: number | null
  isAvailable: boolean
}

export type PreorderOptions = {
  preorderEnabled: boolean
  allowAsapWhenOpen: boolean
  fulfillmentDays: string[]
  fulfillmentTime: string
  cutoffHoursBefore: number
  options: PreorderOption[]
  statusMessage: string | null
}

export async function getPreorderOptions(storeId: string): Promise<PreorderOptions | null> {
  if (!storeId) return null
  const response = await apiFetch(`/api/stores/${encodeURIComponent(storeId)}/preorder-options`)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) return null
  return (payload.data ?? null) as PreorderOptions | null
}
