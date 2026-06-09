import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'blorbmart.cart.v1'

export type CartItem = {
  id: string
  name: string
  price: number
  image?: string
  storeName?: string
  vendorId?: string
  categoryId?: string
  categoryName?: string
  quantity: number
}

export const isFoodItem = (item: { categoryId?: string }) => item.categoryId === 'food_drinks'

export type AddItemResult = 'ok' | 'different_restaurant' | 'mixed_cart'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  isFoodCart: boolean
  foodVendorId: string | null
  /** Returns 'ok' if added, or a conflict reason if the item couldn't be added
   * without clearing the cart first. Pass `force: true` to clear the cart and add anyway. */
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number, options?: { force?: boolean }) => AddItemResult
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as CartItem[]
      if (Array.isArray(parsed)) {
        setItems(parsed.filter((item) => item && typeof item.id === 'string'))
      }
    } catch (error) {
      console.error('Failed to restore cart:', error)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const isFoodCart = items.length > 0 && items.every(isFoodItem)
    const foodVendorId = isFoodCart ? (items[0]?.vendorId ?? null) : null

    return {
      items,
      itemCount,
      subtotal,
      isFoodCart,
      foodVendorId,
      addItem: (item, quantity = 1, options) => {
        const incomingIsFood = isFoodItem(item)
        let result: AddItemResult = 'ok'

        if (items.length > 0 && !options?.force) {
          const cartIsFood = isFoodItem(items[0])
          if (incomingIsFood !== cartIsFood) {
            return 'mixed_cart'
          }
          if (incomingIsFood && cartIsFood && items[0].vendorId && item.vendorId && items[0].vendorId !== item.vendorId) {
            return 'different_restaurant'
          }
        }

        setItems((prev) => {
          const base = options?.force ? [] : prev
          const existing = base.find((entry) => entry.id === item.id)
          if (existing) {
            return base.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: entry.quantity + Math.max(1, quantity) }
                : entry,
            )
          }

          return [...base, { ...item, quantity: Math.max(1, quantity) }]
        })

        return result
      },
      updateQuantity: (id, quantity) => {
        setItems((prev) =>
          prev
            .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
            .filter((item) => item.quantity > 0),
        )
      },
      removeItem: (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id))
      },
      clearCart: () => {
        setItems([])
      },
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
