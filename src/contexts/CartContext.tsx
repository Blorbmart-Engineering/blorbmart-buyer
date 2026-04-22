import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'blorbmart.cart.v1'

export type CartItem = {
  id: string
  name: string
  price: number
  image?: string
  storeName?: string
  vendorId?: string
  categoryName?: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
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

    return {
      items,
      itemCount,
      subtotal,
      addItem: (item, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((entry) => entry.id === item.id)
          if (existing) {
            return prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, quantity: entry.quantity + Math.max(1, quantity) }
                : entry,
            )
          }

          return [...prev, { ...item, quantity: Math.max(1, quantity) }]
        })
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
