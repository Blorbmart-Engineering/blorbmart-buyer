import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100dvh;
    background: #f5f6fa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 0 0 40px;
    overflow-y: auto;
  }

  .auth-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 24px 20px;
    background: #fff;
    border-radius: 0 0 32px 32px;
    box-shadow: 0 2px 24px rgba(0,0,0,.07);
  }
  .auth-logo {
    width: 130px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    animation: logoIn .5s cubic-bezier(.22,1,.36,1) both;
  }
  .auth-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .auth-title {
    font-family: 'Playfair Display', serif;
    font-size: 30px;
    font-weight: 800;
    color: #111;
    text-align: center;
    letter-spacing: -.5px;
    animation: fadeUp .45s .08s cubic-bezier(.22,1,.36,1) both;
  }
  .auth-subtitle {
    margin-top: 6px;
    font-size: 14px;
    color: #888;
    text-align: center;
    font-weight: 400;
    animation: fadeUp .45s .14s cubic-bezier(.22,1,.36,1) both;
  }

  .auth-card {
    width: min(440px, 100%);
    margin-top: 24px;
    padding: 0 20px;
    animation: fadeUp .45s .2s cubic-bezier(.22,1,.36,1) both;
  }
  .auth-form-box {
    background: #fff;
    border-radius: 24px;
    padding: 24px 20px;
    box-shadow: 0 2px 20px rgba(0,0,0,.07);
    border: 1px solid rgba(0,0,0,.06);
  }

  .field-group { display: flex; flex-direction: column; gap: 16px; }
  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    display: block;
    letter-spacing: .01em;
  }
  .field-wrap {
    position: relative;
    display: flex;
    align-items: center;
    border: 1.5px solid #e8e8e8;
    border-radius: 16px;
    background: #fafafa;
    transition: border-color .2s, background .2s, box-shadow .2s;
    overflow: hidden;
  }
  .field-wrap:focus-within {
    border-color: #2979FF;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(41,121,255,.1);
  }
  .field-icon {
    padding: 0 12px 0 16px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .field-wrap input {
    flex: 1;
    padding: 15px 12px 15px 0;
    border: none;
    background: transparent;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    outline: none;
  }
  .field-wrap input::placeholder { color: #bbb; }
  .field-eye {
    padding: 0 16px 0 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #aaa;
    display: flex;
    align-items: center;
    transition: color .2s;
  }
  .field-eye:hover { color: #555; }

  .auth-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
  }
  .check-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #555;
    font-weight: 400;
    user-select: none;
  }
  .check-box {
    width: 20px; height: 20px;
    border-radius: 6px;
    border: 1.5px solid #ddd;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .15s;
    flex-shrink: 0;
  }
  .check-box.checked {
    background: #2979FF;
    border-color: #2979FF;
  }
  .check-box.checked::after {
    content: '';
    width: 5px; height: 9px;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(45deg) translateY(-1px);
    display: block;
  }
  .forgot-link {
    font-size: 13px;
    font-weight: 600;
    color: #2979FF;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    letter-spacing: .01em;
  }
  .forgot-link:hover { text-decoration: underline; }

  .auth-btn {
    width: 100%;
    margin-top: 20px;
    padding: 17px 20px;
    border-radius: 16px;
    border: none;
    background: linear-gradient(135deg, #3a7bd5, #2979FF);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: .01em;
    transition: transform .18s, box-shadow .18s, filter .18s;
    box-shadow: 0 6px 20px rgba(41,121,255,.38);
    position: relative;
    overflow: hidden;
  }
  .auth-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,.12), transparent);
    pointer-events: none;
  }
  .auth-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(41,121,255,.45);
    filter: brightness(1.06);
  }
  .auth-btn:active { transform: scale(.98); }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }
  .auth-divider-line {
    flex: 1;
    height: 1px;
    background: #eee;
  }
  .auth-divider-text {
    font-size: 12px;
    color: #aaa;
    font-weight: 500;
    letter-spacing: .08em;
    white-space: nowrap;
  }

  .social-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .social-btn {
    width: 100%;
    padding: 15px 18px;
    border-radius: 16px;
    border: 1.5px solid #e8e8e8;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: #1a1a1a;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: border-color .2s, background .2s, transform .15s, box-shadow .15s;
    letter-spacing: .01em;
  }
  .social-btn:hover {
    border-color: #ccc;
    background: #fafafa;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.07);
  }
  .social-btn.apple {
    background: #111;
    border-color: #111;
    color: #fff;
  }
  .social-btn.apple:hover {
    background: #222;
    border-color: #222;
  }

  .auth-switch {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: #888;
  }
  .auth-switch button {
    background: none;
    border: none;
    color: #2979FF;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    cursor: pointer;
    margin-left: 5px;
    padding: 0;
  }
  .auth-switch button:hover { text-decoration: underline; }

  .auth-error {
    margin-top: 14px;
    background: #FFF1F2;
    border: 1px solid #FECACA;
    color: #B91C1C;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 13px;
  }
  .auth-success {
    margin-top: 14px;
    background: #ECFDF3;
    border: 1px solid #BBF7D0;
    color: #15803D;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 13px;
  }
  .auth-btn[disabled] {
    opacity: .7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .auth-terms {
    margin-top: 24px;
    text-align: center;
    font-size: 13px;
    color: #6b7280;
  }
  .auth-terms a {
    color: #1F77F1;
    text-decoration: none;
    font-weight: 500;
  }
  .auth-terms a:hover { text-decoration: underline; }

  .terms-checkbox {
    display: flex;
    align-items: flex-start;
    font-size: 13px;
    color: #6b7280;
    cursor: pointer;
    margin-top: 16px;
    line-height: 1.4;
  }
  .terms-checkbox input[type="checkbox"] {
    margin-top: 2px;
    margin-right: 8px;
  }

  @keyframes logoIn {
    from { opacity: 0; transform: scale(.8) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
)

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

function Field({
  label,
  type = 'text',
  placeholder,
  icon,
  value,
  onChange,
}: {
  label: string
  type?: string
  placeholder: string
  icon?: ReactNode
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="field-wrap">
        {icon && <div className="field-icon">{icon}</div>}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={isPassword ? 'current-password' : 'on'}
        />
        {isPassword && (
          <button className="field-eye" onClick={() => setShow((v) => !v)} type="button" tabIndex={-1}>
            <EyeIcon open={show} />
          </button>
        )}
      </div>
    </div>
  )
}

export function LoginScreen() {
  const navigate = useNavigate()
  const [remember, setRemember] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Login failed. Please try again.'
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
            <img src="/bluefulllogowithname.png" alt="Blorbmart logo" />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Prices that understand your budget</p>
        </div>

        <div className="auth-card">
          <form className="auth-form-box" onSubmit={handleLogin}>
            <div className="field-group">
              <Field
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<MailIcon />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={<LockIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-row">
              <div className="check-wrap" onClick={() => setRemember((v) => !v)}>
                <div className={`check-box ${remember ? 'checked' : ''}`} />
                Remember me
              </div>
              <button className="forgot-link" type="button">Forgot password?</button>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">OR CONTINUE WITH</span>
              <div className="auth-divider-line" />
            </div>

            <div className="social-grid">
              <button className="social-btn" type="button">
                <GoogleIcon />
                Continue with Google
              </button>
              <button className="social-btn apple" type="button">
                <AppleIcon />
                Continue with Apple
              </button>
            </div>
          </form>

          <p className="auth-switch">
            New here?
            <button type="button" onClick={() => navigate('/signup')}>Create an account</button>
          </p>

          <p className="auth-terms">
            By continuing, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  )
}

export function SignupScreen() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

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

      setSuccess('Account created successfully! Please verify your email.')
      setTimeout(() => navigate('/dashboard'), 2000)
      
    } catch (err: unknown) {
      console.error('Signup error:', err)
      
      let message = 'An error occurred'
      
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code?: string; message?: string }
        
        switch (firebaseError.code) {
          case 'email-already-in-use':
            message = 'This email is already registered.'
            break
          case 'invalid-email':
            message = 'Invalid email address.'
            break
          case 'weak-password':
            message = 'Password must be at least 6 characters.'
            break
          case 'operation-not-allowed':
            message = 'Email/password accounts are not enabled.'
            break
          case 'network-request-failed':
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
            <img src="/bluefulllogowithname.png" alt="Blorbmart logo" />
          </div>
          <h1 className="auth-title">Join Blorbmart</h1>
          <p className="auth-subtitle">Exclusive deals built for student life</p>
        </div>

        <div className="auth-card">
          <form className="auth-form-box" onSubmit={handleSignup}>
            <div className="social-grid" style={{ marginBottom: 0 }}>
              <button className="social-btn" type="button">
                <GoogleIcon />
                Sign up with Google
              </button>
              <button className="social-btn apple" type="button">
                <AppleIcon />
                Sign up with Apple
              </button>
            </div>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">OR WITH EMAIL</span>
              <div className="auth-divider-line" />
            </div>

            <div className="field-group">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field
                  label="First Name"
                  placeholder="John"
                  icon={<UserIcon />}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Field
                  label="Last Name"
                  placeholder="Doe"
                  icon={<UserIcon />}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <Field
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+234 800 000 0000"
                icon={<PhoneIcon />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Field
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<MailIcon />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                icon={<LockIcon />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="field-group" style={{ marginTop: '16px' }}>
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                I agree to the <a href="#" style={{ color: '#1F77F1' }}>Terms & Conditions</a> and <a href="#" style={{ color: '#1F77F1' }}>Privacy Policy</a>
              </label>
            </div>

            <button className="auth-btn" style={{ marginTop: 24 }} type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}
          </form>

          <p className="auth-switch">
            Already have an account?
            <button type="button" onClick={() => navigate('/login')}>Log in</button>
          </p>

          <p className="auth-terms">
            By signing up, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  )
}
