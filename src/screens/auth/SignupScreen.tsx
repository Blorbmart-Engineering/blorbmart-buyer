import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import {
  css, Field, GoogleIcon, AppleIcon, MailIcon, LockIcon, UserIcon, PhoneIcon,
} from './AuthShared'

export default function SignupScreen() {
  const navigate = useNavigate()
  const [firstName, setFirstName]       = useState('')
  const [lastName, setLastName]         = useState('')
  const [phone, setPhone]               = useState('')
  const [referralCode, setReferralCode] = useState(
    () => new URLSearchParams(window.location.search).get('ref') || ''
  )
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const applyReferralCode = async (idToken: string, code: string) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'https://blorbmart.onrender.com'}/api/referrals/apply`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ code: code.trim() }),
      }
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || 'Failed to apply referral code')
    return data
  }

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(''); setSuccess('')
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields.'); return
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions'); return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }

    try {
      setLoading(true)
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const user = cred.user

      try { await sendEmailVerification(user) } catch { /* non-blocking */ }

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
        fcmToken: '',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'buyers', user.uid), {
        userId: user.uid,
        walletBalance: 0,
        loyaltyPoints: 0,
        defaultAddressId: '',
        totalOrders: 0,
        isBlocked: false,
        createdAt: serverTimestamp(),
      })

      let successMessage = 'Account created! Please verify your email.'
      if (referralCode.trim()) {
        try {
          const idToken = await user.getIdToken()
          await applyReferralCode(idToken, referralCode)
          successMessage = 'Account created! Referral bonus applied.'
        } catch { /* referral failure is non-blocking */ }
      }

      setSuccess(successMessage)
      setTimeout(() => navigate('/dashboard'), 2000)

    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      const msg =
        code === 'auth/email-already-in-use' ? 'This email is already registered.'
        : code === 'auth/invalid-email'       ? 'Invalid email address.'
        : code === 'auth/weak-password'       ? 'Password must be at least 6 characters.'
        : (err as { message?: string })?.message ?? 'An error occurred'
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
          <h2 className="auth-sheet-title">Create Account</h2>
          <p className="auth-sheet-sub">Start your shopping journey with us</p>

          <form onSubmit={handleSignup}>
            <div className="field-group">
              <div className="name-fields">
                <Field label="First name" placeholder="John" icon={<UserIcon />}
                  value={firstName} onChange={e => setFirstName(e.target.value)} />
                <Field label="Last name" placeholder="Doe" icon={<UserIcon />}
                  value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>

              <Field label="Phone number (optional)" type="tel" placeholder="+234 800 000 0000"
                icon={<PhoneIcon />} value={phone} onChange={e => setPhone(e.target.value)} />

              <Field label="Referral code (optional)" placeholder="BLB123ABC"
                icon={<UserIcon />} value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())} />

              <Field label="Email address" type="email" placeholder="name@example.com"
                icon={<MailIcon />} value={email} onChange={e => setEmail(e.target.value)} />

              <Field label="Password" type="password" placeholder="At least 6 characters"
                icon={<LockIcon />} value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <label className="terms-wrap" onClick={() => setTermsAccepted(v => !v)}>
              <div className={`check-box${termsAccepted ? ' checked' : ''}`} style={{ marginTop: 2 }} />
              <span>
                I agree to the <a href="/terms" onClick={e => e.stopPropagation()}>Terms of Service</a> and{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()}>Privacy Policy</a>
              </span>
            </label>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur=".7s" repeatCount="indefinite"/>
                  </path>
                </svg>
              ) : 'Create Account'}
            </button>

            {error && (
              <div className="auth-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{success}</span>
              </div>
            )}
          </form>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or sign up with</span>
            <div className="auth-divider-line" />
          </div>

          <div className="social-grid">
            <button className="social-btn" type="button"><GoogleIcon /><span>Google</span></button>
            <button className="social-btn apple" type="button"><AppleIcon /><span>Apple</span></button>
          </div>

          <div className="auth-nav-row">
            Already have an account?
            <button type="button" onClick={() => navigate('/login')}>Sign in</button>
          </div>

          <div className="auth-security">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
            </svg>
            <span>Your information is encrypted &amp; secure</span>
          </div>
        </div>

      </div>
    </>
  )
}
