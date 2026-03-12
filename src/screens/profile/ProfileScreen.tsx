import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useFirebaseData'
import { useUserData } from '../../hooks/useFirebaseData'

interface BuyerData {
  userId: string
  walletBalance: number
  loyaltyPoints: number
  defaultAddressId: string
  totalOrders: number
  isBlocked: boolean
  createdAt: Date
}

export default function ProfileScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { userData } = useUserData(user?.uid)

  const [buyerData, setBuyerData] = useState<BuyerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadBuyerData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const loadBuyerData = async () => {
    try {
      // For now, we'll simulate buyer data since we don't have the exact API
      // In a real app, you would fetch this from Firestore buyers collection
      setBuyerData({
        userId: user?.uid || '',
        walletBalance: 3500, // Mock balance matching wallet screen
        loyaltyPoints: 150,
        defaultAddressId: '',
        totalOrders: 3,
        isBlocked: false,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error loading buyer data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Import auth dynamically to avoid circular dependencies
      const { auth } = await import('../../lib/firebase')
      await auth.signOut()
      navigate('/login')
    }
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
        <div style={{ textAlign: 'center' }}>
          <p>Please log in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 24px',
              background: '#5156f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        background: 'white',
        zIndex: 100
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
          Profile
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px solid #5156f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 10px 20px rgba(81, 86, 241, 0.2)',
            fontSize: '60px',
            background: 'rgba(81, 86, 241, 0.1)'
          }}>
            👤
          </div>
          
          {isLoading ? (
            <div style={{
              width: '180px',
              height: '24px',
              background: '#f0f0f0',
              borderRadius: '12px',
              margin: '0 auto 8px'
            }}></div>
          ) : (
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#192328', margin: '0 0 8px' }}>
              {userData?.firstName && userData?.lastName 
                ? `${userData.firstName} ${userData.lastName}` 
                : 'User'
              }
            </h2>
          )}
          
          <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 12px' }}>
            {userData?.email || 'user@blorbmart.com'}
          </p>
          
          {userData?.isEmailVerified && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(0, 184, 148, 0.1)',
              borderRadius: '20px',
              border: '1px solid #00B894',
              color: '#00B894',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              ✓ Verified Account
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ marginBottom: '32px' }}>
          {/* Wallet Card */}
          <div
            onClick={() => navigate('/wallet')}
            style={{
              padding: '20px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #5156f1, #1f77f1)',
              boxShadow: '0 10px 20px rgba(81, 86, 241, 0.3)',
              marginBottom: '16px',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                💳
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px' }}>
                  Wallet Balance
                </div>
                {isLoading || !buyerData ? (
                  <div style={{
                    width: '120px',
                    height: '28px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px'
                  }}></div>
                ) : (
                  <div style={{ fontSize: '26px', fontWeight: '800' }}>
                    ₦{buyerData.walletBalance.toFixed(2)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '20px' }}>→</div>
            </div>
          </div>
          
          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Orders Card */}
            <div style={{
              flex: 1,
              padding: '20px',
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(81, 86, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '24px'
              }}>
                🛍️
              </div>
              {isLoading || !buyerData ? (
                <div style={{
                  width: '40px',
                  height: '24px',
                  background: '#f0f0f0',
                  borderRadius: '8px',
                  margin: '0 auto 4px'
                }}></div>
              ) : (
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#192328', textAlign: 'center' }}>
                  {buyerData.totalOrders}
                </div>
              )}
              <div style={{ fontSize: '13px', color: '#666666', textAlign: 'center' }}>
                Orders
              </div>
            </div>
            
            {/* Points Card */}
            <div style={{
              flex: 1,
              padding: '20px',
              borderRadius: '16px',
              background: 'white',
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 193, 7, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '24px'
              }}>
                ⭐
              </div>
              {isLoading || !buyerData ? (
                <div style={{
                  width: '40px',
                  height: '24px',
                  background: '#f0f0f0',
                  borderRadius: '8px',
                  margin: '0 auto 4px'
                }}></div>
              ) : (
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#192328', textAlign: 'center' }}>
                  {buyerData.loyaltyPoints}
                </div>
              )}
              <div style={{ fontSize: '13px', color: '#666666', textAlign: 'center' }}>
                Points
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#192328', marginBottom: '16px' }}>
            Settings
          </h3>
          
          {[
            {
              icon: '👤',
              color: '#5156f1',
              title: 'Edit Profile',
              subtitle: 'Update your personal information',
              action: () => {}
            },
            {
              icon: '📍',
              color: '#1f77f1',
              title: 'Addresses',
              subtitle: 'Manage delivery addresses',
              action: () => {}
            },
            {
              icon: '📦',
              color: '#ff5500',
              title: 'Track Orders',
              subtitle: 'View and track your orders',
              action: () => {}
            },
            {
              icon: '❓',
              color: '#ffc200',
              title: 'Help & Support',
              subtitle: 'FAQs and contact support',
              action: () => {}
            },
            {
              icon: '📄',
              color: '#afff00',
              title: 'Legal',
              subtitle: 'Terms, policies & agreements',
              action: () => {}
            },
            {
              icon: 'ℹ️',
              color: '#192328',
              title: 'About Blorbmart',
              subtitle: 'App version 1.0.0',
              action: () => {}
            }
          ].map((item, index) => (
            <div
              key={index}
              onClick={item.action}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'white',
                border: '1px solid #f0f0f0',
                marginBottom: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `${item.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#192328', marginBottom: '2px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: '#666666' }}>
                  {item.subtitle}
                </div>
              </div>
              <div style={{ fontSize: '18px', color: '#888888' }}>→</div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            height: '56px',
            background: 'white',
            color: '#dc3545',
            border: '1px solid #f8d7da',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  )
}
