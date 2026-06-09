import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// ─── Update Toast ─────────────────────────────────────────────────────────────
export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Check for updates every hour when the tab is open
      if (r) setInterval(() => r.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .pwa-update-toast {
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          z-index: 9999; width: calc(100% - 32px); max-width: 400px;
          background: #1e293b; color: #fff; border-radius: 16px;
          padding: 14px 16px; display: flex; align-items: center; gap: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,.35);
          animation: slideUp .3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pwa-update-icon { font-size: 22px; flex-shrink: 0; }
        .pwa-update-text { flex: 1; font-size: 13px; line-height: 1.4; }
        .pwa-update-text strong { display: block; font-size: 14px; margin-bottom: 2px; }
        .pwa-update-btn {
          height: 36px; padding: 0 14px; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pwa-update-btn.primary { background: #2563EB; color: #fff; }
        .pwa-update-btn.secondary { background: rgba(255,255,255,.12); color: rgba(255,255,255,.8); }
      `}</style>

      <div className="pwa-update-toast" role="alert">
        <span className="pwa-update-icon">🔄</span>
        <div className="pwa-update-text">
          <strong>Update available</strong>
          A new version of Blorbmart is ready.
        </div>
        <button className="pwa-update-btn secondary" onClick={() => setNeedRefresh(false)}>Later</button>
        <button className="pwa-update-btn primary" onClick={() => updateServiceWorker(true)}>Update</button>
      </div>
    </>
  )
}

// ─── Install Banner ───────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === '1'
  )
  const prompted = useRef(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      if (!prompted.current) setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  const install = async () => {
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      prompted.current = true
      setPrompt(null)
    }
  }

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .pwa-install-banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
          background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%);
          color: #fff; padding: 12px 16px;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 4px 20px rgba(37,99,235,.4);
          animation: slideDown .3s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pwa-install-logo { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .pwa-install-logo img { width: 100%; height: 100%; object-fit: cover; }
        .pwa-install-text { flex: 1; font-size: 13px; line-height: 1.35; }
        .pwa-install-text strong { display: block; font-size: 14px; margin-bottom: 1px; }
        .pwa-install-text span { opacity: .85; }
        .pwa-install-btn {
          height: 36px; padding: 0 16px; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer; flex-shrink: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pwa-install-btn.add { background: #fff; color: #2563EB; }
        .pwa-install-btn.close {
          background: rgba(255,255,255,.18); color: #fff;
          width: 36px; padding: 0; font-size: 18px;
        }
      `}</style>

      <div className="pwa-install-banner" role="complementary" aria-label="Install app">
        <div className="pwa-install-logo">
          <img src="/pwa-192x192.png" alt="Blorbmart" />
        </div>
        <div className="pwa-install-text">
          <strong>Add to Home Screen</strong>
          <span>Shop faster with the Blorbmart app</span>
        </div>
        <button className="pwa-install-btn add" onClick={install}>Add</button>
        <button className="pwa-install-btn close" onClick={dismiss} aria-label="Dismiss">×</button>
      </div>
    </>
  )
}
