export interface User {
  uid: string
  email: string
  firstName: string
  lastName: string
  phone: string
  photoUrl: string
  role: 'buyer' | 'seller' | 'admin'
  accountStatus: 'active' | 'inactive' | 'suspended'
  isEmailVerified: boolean
  isPhoneVerified: boolean
  fcmToken: string
  createdAt: Date
  lastLoginAt: Date
  balance?: number
  currency?: string
}

export interface Wallet {
  userId: string
  balance: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface WalletTransaction {
  id: string
  userId: string
  amount: number
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  description: string
  paymentMethod?: string
  previousBalance: number
  newBalance: number
  metadata: {
    email: string
    transactionId?: string
    [key: string]: any
  }
  paystackData?: {
    amount: number
    authorization: {
      authorization_code: string
      bank: string
      bin: string
      brand: string
      card_type: string
      channel: string
      country_code: string
      exp_month: string
      exp_year: string
      last4: string
      reusable: boolean
      signature: string
    }
    channel: string
    customer: {
      customer_code: string
      email: string
      id: number
    }
    fees: number
    gateway_response: string
    id: number
    reference: string
    status: string
    [key: string]: any
  }
  timestamp: Date
  createdAt: Date
  completedAt?: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  currency: string
  comparePrice?: number
  weight?: number
  inventory: {
    quantity: number
    trackQuantity: boolean
    allowBackorder: boolean
  }
  options: {
    [key: string]: string
  }
  images: string[]
  status: 'active' | 'draft' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  title?: string
  description: string
  price: number
  discountPrice?: number
  currency: string
  vendor?: string
  storeName?: string
  productType?: string
  status: 'active' | 'draft' | 'archived'
  images: string[]
  variants: ProductVariant[]
  tags: string[]
  rating?: number
  totalReviews?: number
  totalSold?: number
  createdAt: Date
  updatedAt: Date
}
