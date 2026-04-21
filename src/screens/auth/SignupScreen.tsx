import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import {
  css,
  Field,
  GoogleIcon,
  AppleIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
} from './AuthShared'

export default function SignupScreen() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const applyReferralCode = async (idToken: string, code: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://blorbmart.onrender.com'}/api/referrals/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ code: code.trim() }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to apply referral code')
    }

    return data
  }

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields.')
      return
    }
    
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)

      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const user = cred.user
      
      if (!user) {
        throw new Error('User creation failed')
      }

      // 2. Send email verification (non-blocking)
      try {
        await sendEmailVerification(user)
      } catch (e) {
        console.log('Email verification error:', e)
        // Continue even if email verification fails
      }

      // 3. Get FCM token for notifications (web version)
      let fcmToken = ''
      try {
        // For web, FCM token handling is different
        // We'll use a placeholder for now since web FCM requires service worker setup
        fcmToken = 'web_fcm_placeholder'
      } catch (e) {
        console.log('FCM token error:', e)
        fcmToken = ''
      }

      // 4. Save to `users` collection (matching Flutter structure)
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || '',
        role: 'buyer',
        photoUrl: '',
        isEmailVerified: false,
        isPhoneVerified: false,
        accountStatus: 'active',
        fcmToken: fcmToken,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      })

      // 5. Create buyer profile (matching Flutter structure)
      await setDoc(doc(db, 'buyers', user.uid), {
        userId: user.uid,
        walletBalance: 0,
        loyaltyPoints: 0,
        defaultAddressId: '',
        totalOrders: 0,
        isBlocked: false,
        createdAt: serverTimestamp(),
      })

      let successMessage = 'Account created successfully! Please verify your email.'
      if (referralCode.trim()) {
        try {
          const idToken = await user.getIdToken()
          await applyReferralCode(idToken, referralCode)
          successMessage = 'Account created successfully! Referral applied and your inviter will receive their wallet reward.'
        } catch (referralError) {
          console.error('Referral apply error:', referralError)
          const referralMessage =
            referralError instanceof Error ? referralError.message : 'Referral code could not be applied.'
          successMessage = `Account created successfully, but referral could not be applied: ${referralMessage}`
        }
      }

      setSuccess(successMessage)
      setTimeout(() => navigate('/dashboard'), 2000)
      
    } catch (err: unknown) {
      console.error('Signup error:', err)
      
      let message = 'An error occurred'
      
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code?: string; message?: string }
        
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            message = 'This email is already registered.'
            break
          case 'auth/invalid-email':
            message = 'Invalid email address.'
            break
          case 'auth/weak-password':
            message = 'Password must be at least 6 characters.'
            break
          case 'auth/operation-not-allowed':
            message = 'Email/password accounts are not enabled.'
            break
          case 'auth/network-request-failed':
            message = 'Network error. Please check your connection.'
            break
          default:
            message = firebaseError.message || 'Authentication error'
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        message = String((err as { message?: string }).message)
      }
      
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-root">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/bluefulllogowithname.png" alt="Blorbmart" />
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start your shopping journey with us</p>
        </div>

        <div className="auth-card">
          <div className="auth-form-box">
            <form onSubmit={handleSignup}>
              <div className="social-grid">
                <button className="social-btn" type="button">
                  <GoogleIcon />
                  <span>Google</span>
                </button>
                <button className="social-btn apple" type="button">
                  <AppleIcon />
                  <span>Apple</span>
                </button>
              </div>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or sign up with email</span>
                <div className="auth-divider-line" />
              </div>

              <div className="field-group">
                <div className="name-fields">
                  <Field
                    label="First name"
                    placeholder="John"
                    icon={<UserIcon />}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Field
                    label="Last name"
                    placeholder="Doe"
                    icon={<UserIcon />}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                
                <Field
                  label="Phone number (optional)"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  icon={<PhoneIcon />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <Field
                  label="Referral code (optional)"
                  placeholder="BLB123ABC"
                  icon={<UserIcon />}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                />
                
                <Field
                  label="Email address"
                  type="email"
                  placeholder="name@example.com"
                  icon={<MailIcon />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                
                <Field
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<LockIcon />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span>
                  I agree to the <a href="/terms">Terms of Service</a> and{' '}
                  <a href="/privacy">Privacy Policy</a>
                </span>
              </label>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              {error && (
                <div className="auth-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="auth-success">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>{success}</span>
                </div>
              )}
            </form>
          </div>

          <div className="auth-footer">
            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')}>
                Sign in
              </button>
            </p>
            
            <p className="auth-terms">
              By creating an account, you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
