import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'

// ─── CSS matching Flutter's login_screen.dart design ──────────────────────────
export const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    font-family: 'Raleway', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, #1055C8 0%, #1F77F1 55%, #1A6ADE 100%);
    position: relative;
    overflow: hidden;
  }

  /* Decorative circles (Flutter's Positioned white circles) */
  .auth-root::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 240px; height: 240px;
    border-radius: 50%;
    background: rgba(255,255,255,.06);
    pointer-events: none;
  }
  .auth-root::after {
    content: '';
    position: absolute;
    top: 120px; left: -50px;
    width: 150px; height: 150px;
    border-radius: 50%;
    background: rgba(255,255,255,.04);
    pointer-events: none;
  }

  /* Top blue area: logo + tagline */
  .auth-top {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 28px 28px;
    position: relative;
    z-index: 1;
    animation: fadeSlideDown .5s both;
  }
  .auth-logo {
    height: 72px;
    margin-bottom: 18px;
  }
  .auth-logo img {
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,.15));
  }
  .auth-tagline {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,.9);
    letter-spacing: .2px;
    text-align: center;
  }

  /* White curved sheet — anchored bottom on mobile, centered card on desktop */
  .auth-sheet {
    background: #fff;
    border-radius: 36px 36px 0 0;
    padding: 32px 28px 40px;
    position: relative;
    z-index: 2;
    overflow-y: auto;
    animation: slideUp .45s .1s both;
  }
  @media (min-width: 560px) {
    .auth-root {
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .auth-top {
      flex: none;
      padding: 0 0 20px;
    }
    .auth-sheet {
      border-radius: 28px;
      width: 440px;
      overflow-y: visible;
    }
  }

  /* Title + subtitle inside white sheet */
  .auth-sheet-title {
    font-family: 'Raleway', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #1C1C1E;
    margin-bottom: 4px;
  }
  .auth-sheet-sub {
    font-size: 14px;
    color: #9ca3af;
    margin-bottom: 28px;
  }

  /* Field group */
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: #1C1C1E;
    margin-bottom: 8px;
    display: block;
  }

  /* Flutter-style filled input */
  .field-wrap {
    position: relative;
    display: flex;
    align-items: center;
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    background: #f9fafb;
    transition: border-color .2s, border-width .1s;
  }
  .field-wrap:focus-within {
    border-color: #1F77F1;
    border-width: 2px;
  }
  .field-icon {
    padding: 0 0 0 16px;
    display: flex;
    align-items: center;
    color: #9ca3af;
    transition: color .2s;
  }
  .field-wrap:focus-within .field-icon svg { stroke: #1F77F1; }
  .field-wrap input {
    flex: 1;
    padding: 16px 14px 16px 12px;
    border: none;
    background: transparent;
    font-size: 15px;
    font-family: 'Raleway', sans-serif;
    font-weight: 500;
    color: #1C1C1E;
    outline: none;
  }
  .field-wrap input::placeholder { color: #9ca3af; font-weight: 400; }
  .field-eye {
    padding: 0 14px;
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
    transition: color .2s;
  }
  .field-eye:hover { color: #4b5563; }

  /* Name fields grid */
  .name-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 400px) { .name-fields { grid-template-columns: 1fr; } }

  /* Remember me row + forgot password */
  .auth-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 20px 0 24px;
  }
  .check-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #4b5563;
    font-weight: 500;
    user-select: none;
  }
  .check-box {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #d1d5db;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s;
  }
  .check-box.checked { background: #1F77F1; border-color: #1F77F1; }
  .check-box.checked::after {
    content: '';
    width: 5px;
    height: 9px;
    border-right: 2px solid white;
    border-bottom: 2px solid white;
    transform: rotate(45deg) translateY(-1px);
    display: block;
  }
  .forgot-link {
    font-size: 13px;
    font-weight: 600;
    color: #1F77F1;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: 'Raleway', sans-serif;
    transition: opacity .2s;
  }
  .forgot-link:hover { opacity: .75; }

  /* Terms checkbox (signup) */
  .terms-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 24px 0 20px;
    font-size: 13px;
    color: #4b5563;
    line-height: 1.55;
    cursor: pointer;
    user-select: none;
  }
  .terms-wrap a { color: #1F77F1; text-decoration: none; font-weight: 600; }
  .terms-wrap a:hover { text-decoration: underline; }

  /* Sign In / Create account button — solid blue like Flutter */
  .auth-btn {
    width: 100%;
    height: 54px;
    margin-top: 4px;
    border-radius: 16px;
    border: none;
    background: #1F77F1;
    color: white;
    font-family: 'Raleway', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: .3px;
    cursor: pointer;
    transition: opacity .2s, transform .1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .auth-btn:hover { opacity: .9; }
  .auth-btn:active { transform: scale(.99); }
  .auth-btn:disabled { background: rgba(31,119,241,.6); cursor: not-allowed; transform: none; }

  /* Error / Success */
  .auth-error {
    margin-top: 14px;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    color: #E53935;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: shake .4s ease;
  }
  .auth-success {
    margin-top: 14px;
    background: #def7ec;
    border: 1px solid #bcf0da;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    color: #03543f;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideUp .3s ease;
  }

  /* Divider */
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 24px 0;
  }
  .auth-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
  .auth-divider-text {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .5px;
    white-space: nowrap;
  }

  /* Social buttons */
  .social-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .social-btn {
    height: 48px;
    border-radius: 12px;
    border: 1.5px solid #e5e7eb;
    background: white;
    font-family: 'Raleway', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: border-color .2s, background .2s;
  }
  .social-btn:hover { border-color: #1F77F1; background: #f0f8ff; }
  .social-btn.apple { background: #1f2937; border-color: #1f2937; color: white; }
  .social-btn.apple:hover { background: #111827; border-color: #111827; }

  /* Nav link (Don't have account?) */
  .auth-nav-row {
    margin-top: 28px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
  }
  .auth-nav-row button {
    background: none;
    border: none;
    color: #1F77F1;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    padding: 0 0 0 4px;
    font-family: 'Raleway', sans-serif;
    transition: opacity .2s;
  }
  .auth-nav-row button:hover { opacity: .75; }

  /* Security badge (Flutter's shield_tick container) */
  .auth-security {
    margin-top: 20px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #6b7280;
  }

  /* Footer terms */
  .auth-terms {
    margin-top: 14px;
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.5;
  }
  .auth-terms a { color: #1F77F1; text-decoration: none; font-weight: 600; }
  .auth-terms a:hover { text-decoration: underline; }

  /* Animations */
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-3px); }
    40%, 80% { transform: translateX(3px); }
  }
`

// ─── Icons ────────────────────────────────────────────────────────────────────
export const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

export const EyeIcon = ({ open }: { open: boolean }) => (
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

export const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

export const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

export const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

export const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.97a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
)

// ─── Field Component ──────────────────────────────────────────────────────────
export function Field({
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
          <button className="field-eye" onClick={() => setShow(v => !v)} type="button" tabIndex={-1}>
            <EyeIcon open={show} />
          </button>
        )}
      </div>
    </div>
  )
}
