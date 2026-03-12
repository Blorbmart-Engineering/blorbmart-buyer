import { useNavigate } from 'react-router-dom'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #4F5BFF;
    --blue-600: #4B5CF0;
    --bg: #F7F8FC;
    --text: #1F2937;
    --muted: #7C8AA5;
  }

  .wl-root {
    min-height: 100dvh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
  }
  .wl-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 18px 12px;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 16px rgba(0,0,0,.05);
  }
  .wl-title {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 18px;
  }
  .wl-icon-btn {
    width: 38px; height: 38px;
    border-radius: 12px;
    border: 1px solid #EEF0F5;
    background: #fff;
    display: grid; place-items: center;
    cursor: pointer;
  }
  .wl-body {
    display: grid;
    place-items: center;
    text-align: center;
    padding: 48px 24px 80px;
  }
  .wl-blob {
    width: 150px; height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #EEF0FF, #E9ECFF 60%, #DEE3FF);
    display: grid; place-items: center;
    margin-bottom: 22px;
  }
  .wl-blob svg { color: var(--blue); }
  .wl-headline {
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 20px;
    margin-bottom: 8px;
  }
  .wl-sub {
    max-width: 260px;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.6;
  }
  .wl-cta {
    margin-top: 26px;
    background: linear-gradient(135deg, #5E6CFF, #3E4BFF);
    border: none;
    color: #fff;
    border-radius: 14px;
    padding: 14px 28px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 10px 26px rgba(79,91,255,.3);
    cursor: pointer;
  }
`

const HeartIcon = () => (
  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
)

const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
    <rect x="13" y="13" width="8" height="8" rx="2" />
  </svg>
)

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
)

export function WishlistPage() {
  const navigate = useNavigate()

  return (
    <>
      <style>{css}</style>
      <div className="wl-root">
        <header className="wl-top">
          <button className="wl-icon-btn" type="button" onClick={() => navigate('/dashboard')}>
            <ArrowLeft />
          </button>
          <div className="wl-title">My Wishlist</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="wl-icon-btn" type="button">
              <GridIcon />
            </button>
            <button className="wl-icon-btn" type="button">
              <FilterIcon />
            </button>
          </div>
        </header>

        <main className="wl-body">
          <div className="wl-blob">
            <HeartIcon />
          </div>
          <div className="wl-headline">Your Wishlist is Empty</div>
          <p className="wl-sub">
            Save products you love to your wishlist. Review them anytime and easily move to cart.
          </p>
          <button className="wl-cta" type="button" onClick={() => navigate('/dashboard')}>
            Start Shopping
          </button>
        </main>
      </div>
    </>
  )
}
