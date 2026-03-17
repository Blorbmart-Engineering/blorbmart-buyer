import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'

export const css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { 
  box-sizing: border-box; 
  margin: 0; 
  padding: 0; 
}

.auth-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow-y: auto;
}

.auth-root::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.1"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="1"/><circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="1"/><circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="1"/><circle cx="50" cy="50" r="10" fill="none" stroke="white" stroke-width="1"/></svg>') repeat;
  background-size: 100px 100px;
  pointer-events: none;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.auth-logo {
  width: 180px;
  height: 60px;
  margin: 0 auto 24px;
  animation: floatIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
}

.auth-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.auth-title {
  font-size: 36px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s 0.1s both;
}

.auth-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  animation: slideUp 0.5s 0.2s both;
}

.auth-card {
  width: min(440px, 100%);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s 0.3s both;
}

.auth-form-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 16px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  display: block;
}

.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
}

.field-wrap:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.field-icon {
  padding: 0 0 0 16px;
  display: flex;
  align-items: center;
  color: #9ca3af;
}

.field-wrap input {
  flex: 1;
  padding: 14px 16px 14px 12px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-family: 'Inter', sans-serif;
  color: #1f2937;
  outline: none;
}

.field-wrap input::placeholder { 
  color: #9ca3af; 
  font-weight: 400;
}

.field-eye {
  padding: 0 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.field-eye:hover { 
  color: #4b5563; 
}

.auth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24px 0;
}

.check-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
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
  transition: all 0.15s ease;
}

.check-box.checked {
  background: #667eea;
  border-color: #667eea;
}

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
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.forgot-link:hover { 
  color: #5a67d8;
  text-decoration: underline; 
}

.auth-btn {
  width: 100%;
  padding: 16px 24px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.auth-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.auth-btn:hover::before {
  left: 100%;
}

.auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.auth-btn:active { 
  transform: translateY(0); 
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.auth-error {
  margin-top: 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: shake 0.5s ease;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
}

.auth-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
}

.auth-divider-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.social-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.social-btn {
  padding: 14px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.social-btn:hover {
  border-color: #667eea;
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-btn.apple {
  background: #1f2937;
  border-color: #1f2937;
  color: white;
}

.social-btn.apple:hover {
  background: #111827;
  border-color: #111827;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
}

.auth-switch {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.auth-switch button {
  background: none;
  border: none;
  color: white;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  margin-left: 4px;
  padding: 0;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.auth-switch button:hover { 
  opacity: 0.8; 
}

.auth-terms {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.auth-terms a {
  color: white;
  text-decoration: underline;
  font-weight: 500;
  transition: opacity 0.2s;
}

.auth-terms a:hover { 
  opacity: 0.8; 
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .auth-header {
    margin-bottom: 24px;
  }
  
  .auth-logo {
    width: 150px;
    height: 50px;
    margin-bottom: 16px;
  }
  
  .auth-title {
    font-size: 28px;
  }
  
  .auth-subtitle {
    font-size: 14px;
    padding: 0 16px;
  }
  
  .auth-form-box {
    padding: 24px;
  }
  
  .social-grid {
    grid-template-columns: 1fr;
  }
  
  .field-wrap input {
    padding: 12px 16px 12px 12px;
  }
  
  .auth-btn {
    padding: 14px 24px;
  }


  /* Add these styles to the existing AuthShared CSS */

.name-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 24px 0 16px;
  font-size: 14px;
  color: #4b5563;
  cursor: pointer;
  line-height: 1.5;
}

.terms-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #667eea;
  cursor: pointer;
}

.terms-checkbox a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.terms-checkbox a:hover {
  color: #5a67d8;
  text-decoration: underline;
}

.auth-success {
  margin-top: 16px;
  background: #def7ec;
  border: 1px solid #bcf0da;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: #03543f;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideUp 0.3s ease;
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .name-fields {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .terms-checkbox {
    font-size: 13px;
    margin: 20px 0 12px;
  }
}
}`

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

export const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)

export const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

export const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2979FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)

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
          <button className="field-eye" onClick={() => setShow((v) => !v)} type="button" tabIndex={-1}>
            <EyeIcon open={show} />
          </button>
        )}
      </div>
    </div>
  )
}
