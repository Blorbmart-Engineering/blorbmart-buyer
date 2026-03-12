import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { 
  getUserById, 
  getWalletByUserId, 
  getTransactionsByUserId,
  getAllProducts,
  getProductById
} from '../services/firebaseService'
import type { User, Wallet, WalletTransaction, Product } from '../types/firebase'

// Auth hook
export const useAuth = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}

// User data hook
export const useUserData = (userId?: string) => {
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getUserById(userId)
        setUserData(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch user data')
        console.error('Error in useUserData:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  return { userData, loading, error }
}

// Wallet hook
export const useWallet = (userId?: string) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWallet = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getWalletByUserId(userId)
        setWallet(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch wallet data')
        console.error('Error in useWallet:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()
  }, [userId])

  return { wallet, loading, error }
}

// Transactions hook
export const useTransactions = (userId?: string, limitCount: number = 50) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getTransactionsByUserId(userId, limitCount)
        setTransactions(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch transactions')
        console.error('Error in useTransactions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [userId, limitCount])

  return { transactions, loading, error }
}

// Products hook
export const useProducts = (limitCount: number = 100) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await getAllProducts(limitCount)
        setProducts(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch products')
        console.error('Error in useProducts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [limitCount])

  return { products, loading, error }
}

// Single product hook
export const useProduct = (productId?: string) => {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getProductById(productId)
        setProduct(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch product')
        console.error('Error in useProduct:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  return { product, loading, error }
}

// Combined user data hook (user + wallet)
export const useUserProfile = (userId?: string) => {
  const { userData, loading: userLoading, error: userError } = useUserData(userId)
  const { wallet, loading: walletLoading, error: walletError } = useWallet(userId)

  const loading = userLoading || walletLoading
  const error = userError || walletError

  return {
    userData,
    wallet,
    loading,
    error
  }
}
