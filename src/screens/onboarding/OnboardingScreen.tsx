import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Slide data ───────────────────────────────────────────────────────────────
type Slide = {
  title: string
  subtitle: string
  gradient: [string, string]
  emoji: string
}

const SLIDES: Slide[] = [
  {
    title: 'Where Student\nBudget Wins',
    subtitle: 'Unlock exclusive deals and discounts tailored for students. Save more on everything you need.',
    gradient: ['#6b46c1', '#9333ea'],
    emoji: '🎓',
  },
  {
    title: 'Built for Students,\nPriced for Survival',
    subtitle: 'We understand student life. Get premium quality without the premium price tag.',
    gradient: ['#2563eb', '#3b82f6'],
    emoji: '🛒',
  },
  {
    title: 'Study Hard.\nShop Smart',
    subtitle: 'Balance your academic goals with smart shopping. More savings, less stress.',
    gradient: ['#ea580c', '#f59e0b'],
    emoji: '⚡',
  },
]

// ─── CSS ─────────────────────────────────────────────────────────────────────────
const css = `
  .ob-root {
    position: fixed; inset: 0; overflow: hidden; touch-action: pan-y;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Slides strip */
  .ob-strip {
    display: flex; height: 100%; will-change: transform;
    transition: transform .45s cubic-bezier(.25,.46,.45,.94);
  }
  .ob-slide {
    min-width: 100vw; height: 100%; position: relative;
    display: flex; flex-direction: column;
  }
  .ob-slide-bg {
    position: absolute; inset: 0;
  }

  /* Dark overlay */
  .ob-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,.12) 0%, rgba(0,0,0,.28) 45%, rgba(0,0,0,.72) 100%);
  }

  /* Emoji decoration */
  .ob-emoji-wrap {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -60%);
    font-size: 120px; opacity: .15; user-select: none; pointer-events: none;
  }

  /* Skip button */
  .ob-skip {
    position: absolute; top: 56px; right: 24px; z-index: 10;
    background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.3);
    border-radius: 20px; padding: 8px 18px; color: #fff; font-size: 14px;
    font-weight: 600; cursor: pointer; backdrop-filter: blur(10px);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Bottom content */
  .ob-content {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 0 28px 40px; z-index: 5;
  }

  /* Indicators */
  .ob-indicators {
    display: flex; gap: 6px; margin-bottom: 24px;
  }
  .ob-dot {
    height: 4px; border-radius: 2px;
    background: rgba(255,255,255,.35); transition: width .35s cubic-bezier(.25,.46,.45,.94), background .35s;
  }
  .ob-dot.active { background: #fff; }

  /* Title */
  .ob-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(28px, 8vw, 34px); font-weight: 800;
    color: #fff; line-height: 1.15; letter-spacing: -0.5px;
    margin-bottom: 14px; white-space: pre-line;
  }
  .ob-subtitle {
    font-size: 15px; color: rgba(255,255,255,.85); line-height: 1.55;
    font-weight: 400; margin-bottom: 40px;
  }

  /* Buttons row */
  .ob-actions { display: flex; gap: 12px; }
  .ob-btn-skip {
    flex: 1; height: 56px; background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.3); border-radius: 16px;
    color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ob-btn-next {
    flex: 2; height: 56px; background: #fff; border: none; border-radius: 16px;
    color: #192328; font-size: 16px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 16px rgba(0,0,0,.15); font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ob-btn-get {
    flex: 1; height: 56px; background: #fff; border: none; border-radius: 16px;
    color: #192328; font-size: 16px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 16px rgba(0,0,0,.15); font-family: 'Plus Jakarta Sans', sans-serif;
  }
`

// ─── Main Component ───────────────────────────────────────────────────────────
export function OnboardingScreen() {
  const navigate       = useNavigate()
  const [page, setPage]   = useState(0)
  const dragStart      = useRef<number | null>(null)
  const isDragging     = useRef(false)

  const finish = () => {
    localStorage.setItem('bm-onboarded', '1')
    navigate('/login', { replace: true })
  }

  const next = () => {
    if (page < SLIDES.length - 1) setPage(p => p + 1)
    else finish()
  }

  // Touch/pointer swipe
  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX
    isDragging.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current !== null && Math.abs(e.clientX - dragStart.current) > 5) {
      isDragging.current = true
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return
    const delta = dragStart.current - e.clientX
    dragStart.current = null
    if (!isDragging.current) return
    if (delta > 50 && page < SLIDES.length - 1) setPage(p => p + 1)
    if (delta < -50 && page > 0) setPage(p => p - 1)
    isDragging.current = false
  }

  const isLast = page === SLIDES.length - 1

  return (
    <>
      <style>{css}</style>

      <div
        className="ob-root"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Slides strip */}
        <div className="ob-strip" style={{ transform: `translateX(${-page * 100}vw)` }}>
          {SLIDES.map((slide, i) => (
            <div key={i} className="ob-slide">
              <div
                className="ob-slide-bg"
                style={{ background: `linear-gradient(135deg, ${slide.gradient[0]} 0%, ${slide.gradient[1]} 100%)` }}
              />
              <div className="ob-overlay" />
              <div className="ob-emoji-wrap">{slide.emoji}</div>
            </div>
          ))}
        </div>

        {/* Skip button (top right, hidden on last page) */}
        {!isLast && (
          <button className="ob-skip" type="button" onClick={finish}>
            Skip
          </button>
        )}

        {/* Bottom content — always shows current slide text */}
        <div className="ob-content">
          {/* Page indicators */}
          <div className="ob-indicators">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`ob-dot${page === i ? ' active' : ''}`}
                style={{ width: page === i ? 28 : 10 }}
              />
            ))}
          </div>

          {/* Text */}
          <div className="ob-title">{SLIDES[page].title}</div>
          <div className="ob-subtitle">{SLIDES[page].subtitle}</div>

          {/* Action buttons */}
          <div className="ob-actions">
            {!isLast && (
              <button className="ob-btn-skip" type="button" onClick={finish}>
                Skip
              </button>
            )}
            {isLast ? (
              <button className="ob-btn-get" type="button" onClick={finish}>
                Get Started →
              </button>
            ) : (
              <button className="ob-btn-next" type="button" onClick={next}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
