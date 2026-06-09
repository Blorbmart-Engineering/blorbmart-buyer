import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { css, Field, MailIcon } from './AuthShared'

export default function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^@]+@[^@]+\.[^@]+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    try {
      setLoading(true)
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch {
      setSent(true) // Always show success to avoid email enumeration
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <style>{`
        .fp-icon-box {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background: rgba(102, 126, 234, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .fp-back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.9);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
          font-family: 'Inter', sans-serif;
          transition: opacity 0.2s;
        }
        .fp-back-btn:hover { opacity: 0.7; }
        .fp-resend-btn {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          font-family: 'Inter', sans-serif;
        }
        .fp-resend-btn:hover { text-decoration: underline; }
        .fp-notice {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
          font-size: 13px;
          color: #92400e;
          line-height: 1.6;
        }
        .fp-notice-title {
          font-weight: 700;
          margin-bottom: 6px;
          color: #78350f;
        }
        .fp-success-icon {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .fp-email-highlight {
          color: #667eea;
          font-weight: 700;
          word-break: break-all;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-header">
          <button className="fp-back-btn" onClick={() => navigate('/login')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to login
          </button>

          <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/whitelogo.png" alt="Blorbmart" style={{ height: 52, objectFit: 'contain' }} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              Blorb<span style={{ color: 'rgba(255,255,255,0.75)' }}>mart</span>
            </span>
          </div>

          {!sent ? (
            <>
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Check Your Email</h1>
              <p className="auth-subtitle">We've sent a reset link to your inbox</p>
            </>
          )}
        </div>

        <div className="auth-card">
          <div className="auth-form-box">
            {!sent ? (
              <form onSubmit={handleSend}>
                <div className="fp-icon-box" style={{ margin: '0 auto 24px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>

                <div className="field-group">
                  <Field
                    label="Email address"
                    type="email"
                    placeholder="name@example.com"
                    icon={<MailIcon />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="fp-success-icon">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>

                <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '4px' }}>
                  We sent a reset link to
                </p>
                <p className="fp-email-highlight" style={{ fontSize: '15px', marginBottom: '0' }}>
                  {email}
                </p>

                <div className="fp-notice">
                  <p className="fp-notice-title">Didn't receive the email?</p>
                  • Check your spam or junk folder<br />
                  • Make sure the email address is correct<br />
                  • The link expires in 1 hour
                </div>

                <button className="auth-btn" onClick={() => navigate('/login')}>
                  Back to Login
                </button>

                <br />
                <button
                  className="fp-resend-btn"
                  style={{ marginTop: '12px' }}
                  onClick={() => setSent(false)}
                >
                  Resend email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
