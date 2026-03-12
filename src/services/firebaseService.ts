import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { User, Wallet, WalletTransaction, Product, ProductVariant } from '../types/firebase'

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  return timestamp?.toDate?.() || new Date(timestamp)
}

// User Services
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        ...userData,
        createdAt: convertTimestamp(userData.createdAt),
        lastLoginAt: convertTimestamp(userData.lastLoginAt)
      } as User
    }
    return null
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email),
      limit(1)
    )
    const querySnapshot = await getDocs(usersQuery)
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      return {
        ...userData,
        createdAt: convertTimestamp(userData.createdAt),
        lastLoginAt: convertTimestamp(userData.lastLoginAt)
      } as User
    }
    return null
  } catch (error) {
    console.error('Error fetching user by email:', error)
    throw error
  }
}

// Wallet Services
export const getWalletByUserId = async (userId: string): Promise<Wallet | null> => {
  try {
    const walletQuery = query(
      collection(db, 'wallets'),
      where('userId', '==', userId),
      limit(1)
    )
    const querySnapshot = await getDocs(walletQuery)
    
    if (!querySnapshot.empty) {
      const walletDoc = querySnapshot.docs[0]
      const walletData = walletDoc.data()
      return {
        ...walletData,
        createdAt: convertTimestamp(walletData.createdAt),
        updatedAt: convertTimestamp(walletData.updatedAt)
      } as Wallet
    }
    return null
  } catch (error) {
    console.error('Error fetching wallet:', error)
    throw error
  }
}

// Transaction Services
export const getTransactionsByUserId = async (
  userId: string, 
  limitCount: number = 50
): Promise<WalletTransaction[]> => {
  try {
    const transactionsQuery = query(
      collection(db, 'walletTransactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(transactionsQuery)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        timestamp: convertTimestamp(data.timestamp),
        createdAt: convertTimestamp(data.createdAt),
        completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
        updatedAt: convertTimestamp(data.updatedAt)
      } as WalletTransaction
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    throw error
  }
}

export const getTransactionById = async (transactionId: string): Promise<WalletTransaction | null> => {
  try {
    const transactionDoc = await getDoc(doc(db, 'walletTransactions', transactionId))
    if (transactionDoc.exists()) {
      const data = transactionDoc.data()
      return {
        ...data,
        id: transactionDoc.id,
        timestamp: convertTimestamp(data.timestamp),
        createdAt: convertTimestamp(data.createdAt),
        completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
        updatedAt: convertTimestamp(data.updatedAt)
      } as WalletTransaction
    }
    return null
  } catch (error) {
    console.error('Error fetching transaction:', error)
    throw error
  }
}

// Product Services
export const getAllProducts = async (limitCount: number = 100): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(productsQuery)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        variants: data.variants?.map((variant: any) => ({
          ...variant,
          createdAt: convertTimestamp(variant.createdAt),
          updatedAt: convertTimestamp(variant.updatedAt)
        })) || []
      } as Product
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId))
    if (productDoc.exists()) {
      const data = productDoc.data()
      return {
        ...data,
        id: productDoc.id,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        variants: data.variants?.map((variant: any) => ({
          ...variant,
          createdAt: convertTimestamp(variant.createdAt),
          updatedAt: convertTimestamp(variant.updatedAt)
        })) || []
      } as Product
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

export const getProductVariantsByProductId = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const variantsQuery = query(
      collection(db, 'productVariants'),
      where('productId', '==', productId),
      where('status', '==', 'active')
    )
    const querySnapshot = await getDocs(variantsQuery)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      } as ProductVariant
    })
  } catch (error) {
    console.error('Error fetching product variants:', error)
    throw error
  }
}
