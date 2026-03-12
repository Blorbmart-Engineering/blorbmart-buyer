import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useFirebaseData'

// Wallet API Service (matching Flutter)
class WalletApiService {
  private static baseUrl = 'https://blorbmart.onrender.com/api/wallet'

  static async initiateFunding({
    userId,
    email,
    amount,
  }: {
    userId: string
    email: string
    amount: number
  }) {
    try {
      const response = await fetch(`${WalletApiService.baseUrl}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, amount }),
      })
      const data = await response.json()
      if (response.status !== 200 || data.status !== 'success') {
        throw new Error(data.message || 'Failed to initialize funding')
      }
      return data.data
    } catch (error) {
      console.warn('Payment API unavailable, showing demo:', error)
      // For development, show a demo message
      throw new Error('Payment processing is not available in development mode. This is a demo wallet interface.')
    }
  }

  static async fetchBalance(userId: string): Promise<number> {
    try {
      const response = await fetch(`${WalletApiService.baseUrl}/${userId}`)
      const data = await response.json()
      if (response.status !== 200 || data.status !== 'success') {
        throw new Error('Failed to fetch wallet balance')
      }
      return (data.data.balance as number) || 0
    } catch (error) {
      console.warn('Wallet API unavailable, using mock data:', error)
      // Return mock balance for development
      return 0
    }
  }

  static async fetchTransactions(
    userId: string,
    { page = 1, limit = 100 }: { page?: number; limit?: number } = {}
  ) {
    try {
      const response = await fetch(
        `${WalletApiService.baseUrl}/${userId}/transactions?page=${page}&limit=${limit}`
      )
      const data = await response.json()
      if (response.status !== 200 || data.status !== 'success') {
        throw new Error('Failed to fetch transactions')
      }
      const raw = (data.data.transactions as any[]) || []
      return raw.map((e) => ({
        id: e.id || '',
        userId: e.userId || '',
        type: e.type || '',
        amount: (e.amount as number) || 0,
        previousBalance: (e.previousBalance as number) || 0,
        newBalance: (e.newBalance as number) || 0,
        status: e.status || 'pending',
        paymentMethod: e.paymentMethod,
        reference: e.reference || '',
        description: e.description || '',
        timestamp: new Date(e.timestamp || Date.now()),
        completedAt: e.completedAt ? new Date(e.completedAt) : undefined,
      }))
    } catch (error) {
      console.warn('Transactions API unavailable, using mock data:', error)
      // Return mock transactions for development
      return [
        {
          id: 'mock_1',
          userId,
          type: 'deposit' as const,
          amount: 5000,
          previousBalance: 0,
          newBalance: 5000,
          status: 'completed' as const,
          paymentMethod: 'Paystack',
          reference: 'mock_ref_1',
          description: 'Wallet funding',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          completedAt: new Date(Date.now() - 86400000),
        },
        {
          id: 'mock_2',
          userId,
          type: 'withdrawal' as const,
          amount: 1500,
          previousBalance: 5000,
          newBalance: 3500,
          status: 'completed' as const,
          paymentMethod: 'Wallet',
          reference: 'mock_ref_2',
          description: 'Order payment',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          completedAt: new Date(Date.now() - 172800000),
        }
      ]
    }
  }

  static async verifyPayment(reference: string) {
    const response = await fetch(`${WalletApiService.baseUrl}/verify/${reference}`)
    const data = await response.json()
    if (response.status !== 200 || data.status !== 'success') {
      throw new Error('Payment verification failed')
    }
    return {
      ...data.data,
      timestamp: new Date(data.data.timestamp),
      completedAt: data.data.completedAt ? new Date(data.data.completedAt) : undefined,
    }
  }
}

interface WalletTransaction {
  id: string
  userId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  previousBalance: number
  newBalance: number
  status: 'completed' | 'pending' | 'failed'
  paymentMethod?: string
  reference: string
  description: string
  timestamp: Date
  completedAt?: Date
}

export default function WalletScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [walletBalance, setWalletBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const [amount, setAmount] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false)

  const [selectedFilter, setSelectedFilter] = useState('all')
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([])

  const quickAmounts = [500, 1000, 2000, 5000, 10000]

  const currencyFormat = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  })

  const compactCurrencyFormat = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    notation: 'compact',
  })

  useEffect(() => {
    if (user) {
      loadWalletData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const loadWalletData = async () => {
    if (!user) return

    setIsLoading(true)
    setHasError(false)
    setErrorMessage('')
    setRetryCount(0)

    try {
      await loadWalletBalance()
      await loadTransactions()
    } catch (error) {
      console.error('Wallet data load error:', error)
      
      // Don't show error for mock data - it's expected in development
      if (error instanceof Error && error.message.includes('development mode')) {
        setHasError(true)
        setErrorMessage('Demo Mode: Wallet features are simulated for development')
      } else {
        const newRetryCount = retryCount + 1
        setRetryCount(newRetryCount)
        
        if (newRetryCount < maxRetries) {
          setTimeout(() => loadWalletData(), 2000)
          return
        }
        
        setHasError(true)
        setErrorMessage('Unable to connect to wallet service. Please check your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadWalletBalance = async () => {
    if (!user) return
    const balance = await WalletApiService.fetchBalance(user.uid)
    setWalletBalance(balance)
  }

  const loadTransactions = async () => {
    if (!user) return
    const all = await WalletApiService.fetchTransactions(user.uid)
    all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    setAllTransactions(all)
    applyFiltersLocally()
  }

  const applyFiltersLocally = () => {
    let filtered = [...allTransactions]

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === selectedFilter)
    }

    setTransactions(filtered)
  }

  const handleRefresh = async () => {
    if (isRefreshing || !user) return
    setIsRefreshing(true)
    try {
      await loadWalletBalance()
      await loadTransactions()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const addFunds = async (fundAmount: number) => {
    if (fundAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    await processPayment(fundAmount)
  }

  const processPayment = async (fundAmount: number) => {
    if (!user) return

    setIsProcessingPayment(true)
    setPendingAmount(fundAmount)

    try {
      const fundData = await WalletApiService.initiateFunding({
        userId: user.uid,
        email: user.email || 'user@blorbmart.com',
        amount: fundAmount,
      })

      const authorizationUrl = fundData.authorization_url
      const reference = fundData.reference

      // Open payment URL in new tab
      window.open(authorizationUrl, '_blank')

      // Show payment confirmation dialog
      setTimeout(() => {
        if (window.confirm('Paystack checkout opened. Please complete the payment and click OK to verify.')) {
          verifyPayment(reference)
        }
      }, 2000)
    } catch (error) {
      console.error('Payment error:', error)
      alert(`Payment failed: ${error}`)
    } finally {
      setIsProcessingPayment(false)
      setPendingAmount(0)
      setAmount('')
      setShowAddFundsDialog(false)
    }
  }

  const verifyPayment = async (reference: string) => {
    setIsProcessingPayment(true)

    try {
      const txn = await WalletApiService.verifyPayment(reference)

      if (txn.status === 'completed') {
        await loadWalletBalance()
        await loadTransactions()
        alert(`${currencyFormat.format(txn.amount)} added to your wallet`)
      } else if (txn.status === 'pending') {
        alert('Payment is still processing. Please wait a moment and refresh.')
      } else {
        throw new Error(`Payment status: ${txn.status}`)
      }
    } catch (error) {
      console.error('Verification error:', error)
      alert('Payment verification failed. Please contact support.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return '#00B894'
      case 'withdrawal': return '#f55500'
      default: return '#5156f1'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00B894'
      case 'pending': return '#ffc200'
      case 'failed': return '#f55500'
      default: return '#5156f1'
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '↓'
      case 'withdrawal': return '↑'
      default: return '💳'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f6fa',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#f55500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px'
          }}>🔒</div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#000', marginBottom: '12px' }}>
            Please log in
          </h2>
          <p style={{ fontSize: '15px', color: '#666666', marginBottom: '32px' }}>
            Sign in to view your wallet balance and transactions
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              height: '56px',
              background: '#5156f1',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f6fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #1F77F1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontFamily: 'DM Sans, sans-serif' }}>Loading wallet...</p>
        </div>
      </div>
    )
  }

  if (hasError && transactions.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f6fa',
        fontFamily: 'DM Sans, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '24px'
          }}>⚠️</div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#000', marginBottom: '12px' }}>
            Connection Error
          </h2>
          <p style={{ fontSize: '15px', color: '#666666', marginBottom: '32px' }}>
            {errorMessage}
          </p>
          <button
            onClick={loadWalletData}
            style={{
              width: '100%',
              height: '56px',
              background: '#5156f1',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    )
  }

  const totalDeposited = allTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalSpent = allTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div style={{ background: 'white', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#192328', margin: 0 }}>
          Wallet
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Balance Card */}
        <div style={{
          margin: '0 0 20px',
          padding: '24px',
          background: 'linear-gradient(135deg, #5156f1, #1f77f1)',
          borderRadius: '24px',
          boxShadow: '0 10px 20px rgba(81, 86, 241, 0.3)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '16px', opacity: 0.9 }}>Current Balance</span>
            <span style={{ fontSize: '24px' }}>💳</span>
          </div>
          <div style={{ fontSize: '40px', fontWeight: '800', marginBottom: '8px' }}>
            {currencyFormat.format(walletBalance)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            Available for shopping
          </div>
          {pendingAmount > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Processing: {currencyFormat.format(pendingAmount)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <button
            onClick={() => setShowAddFundsDialog(true)}
            disabled={isProcessingPayment}
            style={{
              flex: 1,
              height: '56px',
              background: '#00B894',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isProcessingPayment ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </>
            ) : (
              <>
                + Add Funds
              </>
            )}
          </button>
          <button
            style={{
              flex: 1,
              height: '56px',
              background: '#192328',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🎁 Gift Cards
            <span style={{ fontSize: '10px', opacity: 0.8 }}>Coming Soon</span>
          </button>
        </div>

        {/* Statistics */}
        <div style={{
          margin: '0 0 32px',
          padding: '20px',
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000', marginBottom: '20px' }}>
            Wallet Statistics
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(0, 184, 148, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '24px'
              }}>↓</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#000' }}>
                {compactCurrencyFormat.format(totalDeposited)}
              </div>
              <div style={{ fontSize: '11px', color: '#666666' }}>Total Deposited</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(245, 85, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '24px'
              }}>↑</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#000' }}>
                {compactCurrencyFormat.format(totalSpent)}
              </div>
              <div style={{ fontSize: '11px', color: '#666666' }}>Total Spent</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(81, 86, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontSize: '24px'
              }}>📄</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#000' }}>
                {allTransactions.length}
              </div>
              <div style={{ fontSize: '11px', color: '#666666' }}>Transactions</div>
            </div>
          </div>
        </div>

        {/* Transactions Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#000', margin: 0 }}>
            Transactions ({transactions.length})
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '8px 16px',
              background: '#f8f9fa',
              color: '#5156f1',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isRefreshing ? (
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid #5156f1',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              '🔄'
            )}
            Refresh
          </button>
        </div>

        {/* Filter Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto'
        }}>
          {['all', 'deposit', 'withdrawal'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setSelectedFilter(filter)
                applyFiltersLocally()
              }}
              style={{
                padding: '8px 16px',
                background: selectedFilter === filter ? '#5156f1' : '#f8f9fa',
                color: selectedFilter === filter ? 'white' : '#666666',
                border: selectedFilter === filter ? '1px solid #5156f1' : '1px solid #dee2e6',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div style={{
            padding: '60px 0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontSize: '16px', color: '#666666', marginBottom: '8px' }}>
              No transactions yet
            </div>
            <div style={{ fontSize: '14px', color: '#888888' }}>
              Your transactions will appear here
            </div>
          </div>
        ) : (
          <div>
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  marginBottom: '12px',
                  padding: '16px',
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  alert(`Transaction Details:\n\nReference: ${transaction.reference}\nDescription: ${transaction.description}\nAmount: ${transaction.type === 'deposit' ? '+' : '-'}${currencyFormat.format(transaction.amount)}\nStatus: ${transaction.status}\nDate: ${formatDate(transaction.timestamp)}`)
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: `${getTransactionColor(transaction.type)}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: getTransactionColor(transaction.type)
                  }}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#000',
                        flex: 1,
                        marginRight: '8px'
                      }}>
                        {transaction.description}
                      </div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: getTransactionColor(transaction.type)
                      }}>
                        {transaction.type === 'deposit' ? '+' : '-'}{currencyFormat.format(transaction.amount)}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#666666'
                      }}>
                        {formatDate(transaction.timestamp)}
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        background: `${getStatusColor(transaction.status)}20`,
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: getStatusColor(transaction.status)
                      }}>
                        {transaction.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Funds Dialog */}
      {showAddFundsDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px 24px 0 0',
            padding: '24px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#000', margin: 0 }}>
                Add Funds
              </h2>
              <button
                onClick={() => setShowAddFundsDialog(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '16px', fontWeight: '600', color: '#000', display: 'block', marginBottom: '12px' }}>
                Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '18px',
                  fontWeight: '600',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  outline: 'none',
                }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#000', display: 'block', marginBottom: '12px' }}>
            Quick Add
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                style={{
                  padding: '12px 20px',
                  background: amount === quickAmount.toString() ? '#5156f1' : '#f8f9fa',
                  color: amount === quickAmount.toString() ? 'white' : '#5156f1',
                  border: amount === quickAmount.toString() ? '1px solid #5156f1' : '1px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {currencyFormat.format(quickAmount)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#000', display: 'block', marginBottom: '12px' }}>
            Payment Method
          </label>
          <div style={{
            padding: '16px',
            background: 'rgba(31, 119, 241, 0.1)',
            borderRadius: '16px',
            border: '2px solid #1f77f1',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(31, 119, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>💳</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#000' }}>
                Paystack
              </div>
              <div style={{ fontSize: '12px', color: '#666666' }}>
                Secure payment gateway
              </div>
            </div>
            <div style={{ fontSize: '20px', color: '#1f77f1' }}>✓</div>
          </div>
        </div>

        <button
          onClick={() => {
            const fundAmount = parseFloat(amount) || 0
            if (fundAmount > 0) {
              setShowAddFundsDialog(false)
              addFunds(fundAmount)
            }
          }}
          disabled={isProcessingPayment || !amount || parseFloat(amount) <= 0}
          style={{
            width: '100%',
            height: '56px',
            background: isProcessingPayment || !amount || parseFloat(amount) <= 0 ? '#ccc' : '#5156f1',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isProcessingPayment || !amount || parseFloat(amount) <= 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          {isProcessingPayment ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Processing...
            </>
          ) : (
            'Add Funds'
          )}
        </button>
      </div>
    </div>
  )}

  <style>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>
</div>
)
}
