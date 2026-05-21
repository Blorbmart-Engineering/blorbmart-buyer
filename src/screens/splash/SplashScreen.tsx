import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useFirebaseData'

const css = `
  .sp-root {
    position: fixed; inset: 0; background: #1f77f1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: 'Bricolage Grotesque', sans-serif;
  }
  .sp-logo-ring {
    width: 120px; height: 120px; border-radius: 28px;
    background: rgba(255,255,255,.15); border: 2px solid rgba(255,255,255,.3);
    display: flex; align-items: center; justify-content: center;
    animation: sp-pop .5s cubic-bezier(.34,1.56,.64,1) both;
  }
  .sp-logo-letter {
    font-size: 64px; font-weight: 900; color: #fff; line-height: 1;
    text-shadow: 0 4px 16px rgba(0,0,0,.2);
  }
  .sp-wordmark {
    margin-top: 20px; font-size: 26px; font-weight: 800; color: #fff;
    letter-spacing: -0.5px; opacity: 0;
    animation: sp-fade .5s .3s ease forwards;
  }
  .sp-tagline {
    margin-top: 8px; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,.7); font-family: 'Plus Jakarta Sans', sans-serif;
    opacity: 0; animation: sp-fade .5s .5s ease forwards;
  }
  .sp-dots {
    position: absolute; bottom: 48px; display: flex; gap: 6px;
    opacity: 0; animation: sp-fade .4s .7s ease forwards;
  }
  .sp-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,.4); animation: sp-pulse 1.2s ease-in-out infinite;
  }
  .sp-dot:nth-child(2) { animation-delay: .2s; }
  .sp-dot:nth-child(3) { animation-delay: .4s; }

  @keyframes sp-pop {
    from { transform: scale(.6); opacity: 0; }
    to   { transform: scale(1);  opacity: 1; }
  }
  @keyframes sp-fade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-pulse {
    0%, 100% { opacity: .3; transform: scale(1); }
    50%       { opacity: 1;  transform: scale(1.3); }
  }
`

export function SplashScreen() {
  const navigate    = useNavigate()
  const { user, loading } = useAuth()
  const timerDone   = useRef(false)
  const authDone    = useRef(false)
  const navigated   = useRef(false)

  const tryNavigate = () => {
    if (!timerDone.current || !authDone.current || navigated.current) return
    navigated.current = true

    const onboarded = localStorage.getItem('bm-onboarded')
    if (!onboarded) {
      navigate('/onboarding', { replace: true })
    } else if (user) {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  // 2-second minimum display
  useEffect(() => {
    const id = setTimeout(() => {
      timerDone.current = true
      tryNavigate()
    }, 2000)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wait for auth to resolve
  useEffect(() => {
    if (!loading) {
      authDone.current = true
      tryNavigate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  return (
    <>
      <style>{css}</style>
      <div className="sp-root">
        <div className="sp-logo-ring">
          <span className="sp-logo-letter">B</span>
        </div>
        <div className="sp-wordmark">Blorbmart</div>
        <div className="sp-tagline">Campus marketplace</div>
        <div className="sp-dots">
          <div className="sp-dot" />
          <div className="sp-dot" />
          <div className="sp-dot" />
        </div>
      </div>
    </>
  )
}
