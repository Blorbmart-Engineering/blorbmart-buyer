import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import {
  css,
  Field,
  GoogleIcon,
  AppleIcon,
  MailIcon,
  LockIcon,
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
            <img src="/bluefulllogowithname.png" alt="Blorbmart" />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your shopping experience</p>
        </div>

        <div className="auth-card">
          <div className="auth-form-box">
            <form onSubmit={handleLogin}>
              <div className="field-group">
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

              <div className="auth-row">
                <label className="check-wrap">
                  <input 
                    type="checkbox" 
                    checked={remember} 
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div className={`check-box ${remember ? 'checked' : ''}`} />
                  <span>Remember me</span>
                </label>
                <button className="forgot-link" type="button" onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </button>
              </div>

              <button 
                className="auth-btn" 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
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
            </form>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <div className="auth-divider-line" />
            </div>

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
          </div>

          <div className="auth-footer">
            <p className="auth-switch">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/signup')}>
                Create account
              </button>
            </p>
            
            <p className="auth-terms">
              By signing in, you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}