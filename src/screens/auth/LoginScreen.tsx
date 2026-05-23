import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import {
  css, Field, GoogleIcon, AppleIcon, MailIcon, LockIcon,
} from './AuthShared'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [remember, setRemember] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      const msg =
        code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : code === 'auth/invalid-email' ? 'Please enter a valid email'
          : code === 'auth/user-disabled' ? 'This account has been disabled'
          : code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later'
          : (err as { message?: string })?.message ?? 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-root">

        {/* Blue section: logo + tagline */}
        <div className="auth-top">
          <div className="auth-logo">
            <img src="/bluefulllogowithname.png" alt="Blorbmart" />
          </div>
          <p className="auth-tagline">Prices that understand your budget</p>
        </div>

        {/* White curved sheet */}
        <div className="auth-sheet">
          <h2 className="auth-sheet-title">Welcome Back!</h2>
          <p className="auth-sheet-sub">Sign in to continue shopping</p>

          <form onSubmit={handleLogin}>
            <div className="field-group">
              <Field label="Email Address" type="email" placeholder="Enter your email"
                icon={<MailIcon />} value={email} onChange={e => setEmail(e.target.value)} />
              <Field label="Password" type="password" placeholder="Enter your password"
                icon={<LockIcon />} value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="auth-row">
              <label className="check-wrap" onClick={() => setRemember(v => !v)}>
                <div className={`check-box${remember ? ' checked' : ''}`} />
                <span>Remember me</span>
              </label>
              <button className="forgot-link" type="button" onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </button>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur=".7s" repeatCount="indefinite"/>
                  </path>
                </svg>
              ) : 'Sign In'}
            </button>

            {error && (
              <div className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or continue with</span>
            <div className="auth-divider-line" />
          </div>

          <div className="social-grid">
            <button className="social-btn" type="button"><GoogleIcon /><span>Google</span></button>
            <button className="social-btn apple" type="button"><AppleIcon /><span>Apple</span></button>
          </div>

          <div className="auth-nav-row">
            Don't have an account?
            <button type="button" onClick={() => navigate('/signup')}>Create account</button>
          </div>

          {/* Security badge — Flutter's shield_tick row */}
          <div className="auth-security">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
            </svg>
            <span>Your login info is encrypted &amp; secure</span>
          </div>

          <p className="auth-terms">
            By signing in, you agree to our{' '}
            <a href="/terms">Terms of Service</a> and{' '}
            <a href="/privacy">Privacy Policy</a>
          </p>
        </div>

      </div>
    </>
  )
}
