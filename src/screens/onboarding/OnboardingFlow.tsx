import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const IMAGES = {
  1: '/first.jpg',
  2: '/second.jpg',
  3: '/third.jpg',
}

const steps = [
  {
    img: IMAGES[1],
    eyebrow: 'Campus Commerce',
    title: 'Built for Students,\nPriced for Survival',
    body: 'We understand student life. Get premium quality without the premium price tag.',
  },
  {
    img: IMAGES[2],
    eyebrow: 'Exclusive Deals',
    title: 'Where Student\nBudget Wins',
    body: 'Unlock exclusive deals and discounts tailored for students. Save more on everything you need.',
  },
  {
    img: IMAGES[3],
    eyebrow: 'Smart Shopping',
    title: 'Study Hard.\nShop Smart',
    body: 'Balance your academic goals with smart shopping. More savings, less stress.',
  },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .le-root {
    font-family: 'DM Sans', sans-serif;
    background: #111;
    width: 100%;
    min-height: 100dvh;
    overflow: hidden;
    position: relative;
  }

  /* SPLASH */
  .splash {
    width: 100%;
    height: 100dvh;
    background: #2979FF;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    animation: splashIn .55s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes splashIn {
    from { opacity: 0; transform: scale(.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  .splash-logo {
    width: 72px;
    height: 72px;
    border-radius: 24px;
    background: rgba(255,255,255,.18);
    backdrop-filter: blur(8px);
    border: 1.5px solid rgba(255,255,255,.35);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: #fff;
    letter-spacing: -1px;
    animation: logoFloat 2s ease-in-out infinite;
  }
  @keyframes logoFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
  .splash-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: .38em;
    text-transform: uppercase;
    color: rgba(255,255,255,.75);
  }
  .splash-version {
    font-size: 12px;
    color: rgba(255,255,255,.45);
    letter-spacing: .15em;
    position: absolute;
    bottom: 40px;
  }
  .splash-pulse {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(255,255,255,.6);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: .3; transform: scale(.8); }
    50%      { opacity: 1;  transform: scale(1.3); }
  }

  /* ONBOARDING */
  .ob-wrap {
    width: 100%;
    height: 100dvh;
    position: relative;
    overflow: hidden;
  }
  .ob-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1);
    transform: scale(1.04);
  }
  .ob-slide.active {
    opacity: 1;
    transform: scale(1);
    z-index: 1;
  }
  .ob-slide.prev {
    opacity: 0;
    transform: scale(.97);
  }
  .ob-img {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: top center;
  }
  .ob-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,.08) 0%,
      rgba(0,0,0,.1) 45%,
      rgba(0,0,0,.72) 68%,
      rgba(0,0,0,.88) 100%
    );
  }

  /* skip */
  .ob-skip {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 20;
    background: rgba(255,255,255,.18);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,.25);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 9px 22px;
    border-radius: 50px;
    cursor: pointer;
    letter-spacing: .02em;
    transition: background .2s;
  }
  .ob-skip:hover { background: rgba(255,255,255,.28); }

  /* bottom content */
  .ob-bottom {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    z-index: 10;
    padding: 0 28px 40px;
  }
  .ob-dots {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .ob-dot {
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,.35);
    transition: width .4s cubic-bezier(.22,1,.36,1), background .4s;
  }
  .ob-dot.active { background: #fff; width: 28px !important; }
  .ob-eyebrow {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: .3em;
    text-transform: uppercase;
    color: rgba(255,255,255,.6);
    margin-bottom: 10px;
  }
  .ob-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 7vw, 38px);
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    white-space: pre-line;
    margin-bottom: 14px;
  }
  .ob-body {
    font-size: 14px;
    font-weight: 300;
    color: rgba(255,255,255,.72);
    line-height: 1.65;
    margin-bottom: 32px;
    max-width: 340px;
  }
  .ob-btn {
    width: 100%;
    padding: 18px 24px;
    border-radius: 50px;
    background: #fff;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #111;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    letter-spacing: -.01em;
    transition: transform .18s, box-shadow .18s, background .18s;
    box-shadow: 0 4px 24px rgba(0,0,0,.22);
  }
  .ob-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,.3);
  }
  .ob-btn:active { transform: scale(.98); }
  .ob-btn .arrow {
    font-size: 18px;
    transition: transform .2s;
  }
  .ob-btn:hover .arrow { transform: translateX(4px); }
`

export function OnboardingFlow() {
  const [screen, setScreen] = useState<'splash' | 'onboarding'>('splash')
  const [stepIndex, setStepIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setScreen('onboarding'), 1800)
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const isLast = stepIndex === steps.length - 1

  function goNext() {
    if (isLast) {
      navigate('/login')
      return
    }
    setPrevIndex(stepIndex)
    setStepIndex((v) => v + 1)
  }

  function skip() {
    setPrevIndex(stepIndex)
    setStepIndex(steps.length - 1)
  }

  if (screen === 'splash') {
    return (
      <>
        <style>{css}</style>
        <div className="le-root">
          <div className="splash">
            <div className="splash-logo">B</div>
            <p className="splash-name">Blorbmart</p>
            <div className="splash-pulse" />
            <span className="splash-version">version 1.0.0</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{css}</style>
      <div className="le-root">
        <div className="ob-wrap">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`ob-slide ${i === stepIndex ? 'active' : i === prevIndex ? 'prev' : ''}`}
            >
              <img className="ob-img" src={s.img} alt="" />
              <div className="ob-gradient" />
            </div>
          ))}

          <button className="ob-skip" onClick={skip} type="button">
            Skip
          </button>

          <div className="ob-bottom">
            <div className="ob-dots">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`ob-dot ${i === stepIndex ? 'active' : ''}`}
                  style={{ width: i === stepIndex ? 28 : 16 }}
                />
              ))}
            </div>

            <p className="ob-eyebrow">{steps[stepIndex].eyebrow}</p>
            <h2 className="ob-title">{steps[stepIndex].title}</h2>
            <p className="ob-body">{steps[stepIndex].body}</p>

            <button className="ob-btn" onClick={goNext} type="button">
              {isLast ? 'Get Started' : 'Next'}
              <span className="arrow">-&gt;</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

