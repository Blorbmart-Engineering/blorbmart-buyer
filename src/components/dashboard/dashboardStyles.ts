export const dashboardCss = `
  @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue: #1F77F1;
    --blue-dark: #1055C8;
    --blue-light: #EFF6FF;
    --purple: #5156F1;
    --orange: #FF5500;
    --orange-light: #FFF7ED;
    --text: #192328;
    --text-2: #475569;
    --text-3: #94A3B8;
    --bg: #F5F5F5;
    --white: #FFFFFF;
    --border: #E2E8F0;
    --card: #FFFFFF;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --shadow: 0 6px 20px rgba(0,0,0,.08);
    --shadow-lg: 0 14px 40px rgba(0,0,0,.12);
    --radius: 14px;
    --radius-sm: 10px;
    --radius-lg: 20px;
  }

  body { background: var(--bg); overflow-x: hidden; width: 100%; }

  .bm-root {
    font-family: 'Raleway', 'Plus Jakarta Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    position: relative;
  }

  /* Announcement */
  .bm-announce {
    display: flex; align-items: center; justify-content: center;
    gap: clamp(4px, 2vw, 10px);
    padding: 10px 16px;
    font-size: clamp(11px, 2.5vw, 13px);
    background: #0F172A;
    color: #E2E8F0;
    flex-wrap: wrap;
    text-align: center;
    width: 100%;
  }
  .bm-announce strong { color: #fff; font-weight: 700; }

  /* Header */
  .bm-header {
    position: sticky; top: 0; z-index: 40;
    background: rgba(255,255,255,.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    width: 100%;
  }
  .bm-header-inner {
    max-width: 1280px; margin: 0 auto;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 12px;
    width: 100%;
  }
  .bm-logo { display: flex; align-items: center; gap: 6px; cursor: pointer; flex-shrink: 0; }
  .bm-logo-mark {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--blue);
    display: flex; align-items: center; justify-content: center; overflow: hidden;
  }
  .bm-logo-mark img { width: 100%; height: 100%; object-fit: cover; }
  .bm-logo-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: -.02em; white-space: nowrap; }
  .bm-logo-name span { color: var(--blue); }

  .bm-nav { list-style: none; display: flex; align-items: center; gap: 8px; margin-left: 4px; flex-shrink: 0; }
  .bm-nav a { text-decoration: none; font-size: 13px; font-weight: 600; color: var(--text-2); padding: 6px 8px; border-radius: 8px; transition: background .15s, color .15s; white-space: nowrap; }
  .bm-nav a:hover { background: var(--blue-light); color: var(--blue); }
  .bm-nav a.active { color: var(--blue); background: var(--blue-light); }

  .bm-header-search {
    flex: 1; min-width: 140px; max-width: 360px;
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid var(--border);
    border-radius: 999px; padding: 8px 12px;
    cursor: text;
    transition: border-color .2s, box-shadow .2s;
  }
  .bm-header-search:focus-within { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
  .bm-header-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; min-width: 80px; }
  .bm-search-ico { color: var(--text-3); display: flex; }

  .bm-header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

  .bm-wallet-chip {
    display: inline-flex; align-items: center; gap: 6px;
    height: 36px; padding: 0 10px; border-radius: 999px;
    background: var(--orange-light); border: 1.5px solid #FED7AA;
    cursor: pointer; font-size: 12px; font-weight: 700; color: var(--orange);
    transition: background .15s; white-space: nowrap;
  }
  .bm-wallet-chip:hover { background: #FEE9D3; }
  .bm-wallet-chip span { display: inline-block; max-width: 90px; overflow: hidden; text-overflow: ellipsis; }

  .bm-hbtn {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 10px; border: 1.5px solid var(--border);
    background: #fff; padding: 6px 10px;
    cursor: pointer; font-weight: 600; font-size: 12px; color: var(--text);
    white-space: nowrap; transition: border-color .15s, background .15s;
  }
  .bm-hbtn:hover { border-color: var(--blue); color: var(--blue); }
  .bm-hbtn-icon { width: 36px; height: 36px; padding: 0; justify-content: center; flex-shrink: 0; }
  .bm-hbtn-primary { background: var(--blue); border-color: var(--blue); color: #fff; padding: 6px 12px; }
  .bm-hbtn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; color: #fff; }

  .bm-menu-btn {
    display: none;
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid var(--border); background: var(--white);
    cursor: pointer; align-items: center; justify-content: center;
    color: var(--text); flex-shrink: 0;
  }

  /* Page Layout */
  .bm-page { max-width: 1280px; margin: 0 auto; padding: 24px 16px 60px; width: 100%; }

  /* Hero */
  .bm-hero { display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-bottom: 40px; }
  .bm-hero-main {
    border-radius: var(--radius-lg); padding: 40px 36px;
    position: relative; overflow: hidden; min-height: 300px;
    display: flex; flex-direction: column; justify-content: flex-end;
    cursor: pointer; transition: transform .2s; background-size: cover; background-position: center;
  }
  .bm-hero-main:hover { transform: scale(1.01); }
  .bm-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.2); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.3); border-radius: 50px;
    padding: 4px 10px; font-size: 11px; font-weight: 600;
    color: rgba(255,255,255,.95); letter-spacing: .06em; text-transform: uppercase;
    margin-bottom: 12px; width: fit-content;
  }
  .bm-hero-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(24px, 4vw, 38px); font-weight: 800; color: #fff; line-height: 1.15; letter-spacing: -.02em; margin-bottom: 8px; }
  .bm-hero-sub { font-size: 14px; color: rgba(255,255,255,.85); margin-bottom: 20px; }
  .bm-hero-cta {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff; border: none; border-radius: 50px; padding: 10px 20px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; color: #0F172A;
    cursor: pointer; width: fit-content; transition: transform .15s, box-shadow .15s;
  }
  .bm-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }

  .bm-hero-side { display: flex; flex-direction: column; gap: 20px; }
  .bm-mini-banner {
    flex: 1; border-radius: var(--radius-lg); padding: 20px;
    position: relative; overflow: hidden; cursor: pointer;
    transition: transform .18s; display: flex; flex-direction: column; justify-content: flex-end;
  }
  .bm-mini-banner:hover { transform: translateX(3px); }
  .bm-mini-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 4px; }
  .bm-mini-sub { font-size: 12px; color: rgba(255,255,255,.8); margin-bottom: 10px; }
  .bm-mini-cta {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.2); backdrop-filter: blur(8px);
    border-radius: 50px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #fff;
    cursor: pointer; border: none; width: fit-content; transition: background .15s;
  }
  .bm-mini-cta:hover { background: rgba(255,255,255,.3); }

  .bm-dots { display: flex; gap: 6px; margin-top: 16px; }
  .bm-dot { width: 7px; height: 7px; border-radius: 99px; background: rgba(255,255,255,.55); transition: all .3s; }
  .bm-dot.active { width: 20px; background: #fff; }

  .bm-hero-carousel-wrap { display: none; }
  .bm-hero-carousel {
    display: grid; grid-auto-flow: column; grid-auto-columns: 100%; gap: 12px;
    overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
  }
  .bm-hero-carousel::-webkit-scrollbar { display: none; }
  .bm-hero-card {
    scroll-snap-align: start; border-radius: var(--radius-lg);
    padding: 24px 20px; min-height: 200px;
    display: flex; flex-direction: column; justify-content: flex-end;
    background-size: cover; background-position: center;
  }
  .bm-mobile-dots { justify-content: center; margin-top: 12px; }
  .bm-mobile-only { display: none; }
  .bm-desktop-only { display: block; }

  /* Section */
  .bm-section { margin-bottom: 40px; }
  .bm-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .bm-section-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: var(--text); letter-spacing: -.02em; }
  .bm-section-sub { font-size: 13px; color: var(--text-3); margin-top: 2px; }
  .bm-see-all {
    display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: var(--blue);
    background: none; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    padding: 0; transition: gap .15s;
  }
  .bm-see-all:hover { gap: 7px; }

  /* Categories */
  .bm-cats-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; }
  .bm-cat {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 16px 8px 14px; background: var(--card); border-radius: var(--radius);
    border: 1.5px solid var(--border); cursor: pointer;
    transition: transform .18s, border-color .18s, box-shadow .18s; text-align: center;
  }
  .bm-cat:hover { transform: translateY(-4px); border-color: transparent; box-shadow: var(--shadow); }
  .bm-cat-icon { width: 48px; height: 48px; border-radius: 12px; overflow: hidden; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; transition: transform .18s; }
  .bm-cat-icon img { width: 100%; height: 100%; object-fit: cover; }
  .bm-cat:hover .bm-cat-icon { transform: scale(1.08); }
  .bm-cat-label { font-size: 11px; font-weight: 600; color: var(--text); line-height: 1.3; }

  /* Flash Bar */
  .bm-flash-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, #FF4500 0%, #FF6B35 40%, #FF8C69 100%);
    border-radius: var(--radius); padding: 12px 18px; margin-bottom: 20px;
    flex-wrap: wrap; gap: 12px;
  }
  .bm-flash-left { display: flex; align-items: center; gap: 10px; }
  .bm-flash-zap { width: 32px; height: 32px; background: rgba(255,255,255,.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; }
  .bm-flash-label { font-family: 'Bricolage Grotesque', sans-serif; font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -.01em; }
  .bm-flash-desc { font-size: 12px; color: rgba(255,255,255,.8); margin-top: 1px; }
  .bm-flash-right { display: flex; align-items: center; gap: 10px; }
  .bm-timer-blocks { display: flex; align-items: center; gap: 4px; }
  .bm-timer-block { background: rgba(0,0,0,.2); color: #fff; font-weight: 700; font-size: 12px; padding: 5px 8px; border-radius: 8px; min-width: 30px; text-align: center; }
  .bm-timer-sep { color: rgba(255,255,255,.8); font-weight: 700; }

  /* Products toolbar */
  .bm-products-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
  .bm-products-count { font-size: 13px; color: var(--text-3); font-weight: 600; }
  .bm-toolbar-right { display: flex; align-items: center; gap: 8px; }
  .bm-filter-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; font-weight: 600; font-size: 12px; color: var(--text); }
  .bm-view-toggle { display: flex; gap: 4px; }
  .bm-view-btn { width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; cursor: pointer; color: var(--text-2); display: flex; align-items: center; justify-content: center; }
  .bm-view-btn.active { color: var(--blue); border-color: var(--blue); background: var(--blue-light); }

  /* Products grid */
  .bm-products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .bm-products-grid.list { grid-template-columns: 1fr; }

  .bm-product-card { background: var(--card); border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: transform .18s, box-shadow .18s; display: flex; flex-direction: column; }
  .bm-product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
  .bm-product-img-wrap { position: relative; height: 200px; background: #EEF2FF; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .bm-product-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
  .bm-badge-wrap { position: absolute; top: 8px; left: 8px; display: flex; flex-wrap: wrap; gap: 4px; }
  .bm-badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 3px 6px; font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
  .bm-badge-flash { background: #FEF3C7; color: #92400E; }
  .bm-badge-new { background: #DBEAFE; color: #1D4ED8; }
  .bm-badge-sale { background: #FEE2E2; color: #B91C1C; }
  .bm-badge-low { background: #EDE9FE; color: #6D28D9; }
  .bm-product-wishlist { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .15s; }
  .bm-product-wishlist:hover { transform: scale(1.1); }
  .bm-product-wishlist.active { border-color: #FCA5A5; background: #FFF1F2; }

  .bm-product-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .bm-product-store { font-size: 11px; color: var(--text-3); font-weight: 600; }
  .bm-product-name { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.3; }
  .bm-product-meta-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-3); flex-wrap: wrap; }
  .bm-product-stars { display: inline-flex; align-items: center; gap: 3px; }
  .bm-product-rating-val { font-weight: 700; color: var(--text); }
  .bm-product-reviews { color: var(--text-3); }
  .bm-product-sold { margin-left: auto; font-weight: 600; }
  .bm-product-prices { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-top: auto; }
  .bm-product-price { font-size: 15px; font-weight: 800; color: var(--blue); }
  .bm-product-original { font-size: 11px; color: #94A3B8; text-decoration: line-through; }
  .bm-product-discount-tag { background: #FEE2E2; color: #B91C1C; font-size: 10px; font-weight: 700; padding: 2px 5px; border-radius: 5px; }
  .bm-product-sep { width: 1px; height: 10px; background: #E2E8F0; }
  .bm-product-actions { display: flex; gap: 6px; margin-top: 8px; }
  .bm-add-cart { flex: 1; background: var(--blue); color: #fff; border: 1.5px solid var(--blue); border-radius: 8px; padding: 8px 10px; font-weight: 700; font-size: 11px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: background .15s; }
  .bm-add-cart:hover { background: #1d4ed8; }
  .bm-quick-view { background: #fff; color: var(--text-2); border: 1.5px solid var(--border); border-radius: 8px; padding: 8px 10px; font-weight: 700; font-size: 11px; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: border-color .15s; }
  .bm-quick-view:hover { border-color: var(--blue); color: var(--blue); }

  /* Top selling */
  .bm-top-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .bm-top-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radius); border: 1.5px solid var(--border); background: #fff; cursor: pointer; transition: transform .15s, box-shadow .15s; }
  .bm-top-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }
  .bm-top-rank { width: 36px; height: 36px; border-radius: 8px; background: var(--blue-light); color: var(--blue); font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
  .bm-top-rank.top { background: #FEF3C7; color: #92400E; }
  .bm-top-img { width: 60px; height: 60px; border-radius: 10px; overflow: hidden; background: #EEF2FF; flex-shrink: 0; }
  .bm-top-img img { width: 100%; height: 100%; object-fit: cover; }
  .bm-top-info { flex: 1; min-width: 0; }
  .bm-top-name { font-size: 13px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bm-top-store { font-size: 11px; color: var(--text-3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bm-top-price { font-size: 13px; font-weight: 800; color: var(--blue); margin-top: 4px; }
  .bm-top-right { text-align: right; flex-shrink: 0; }
  .bm-top-sold { font-size: 10px; color: var(--text-3); font-weight: 600; }
  .bm-top-stars { display: inline-flex; align-items: center; gap: 3px; margin-top: 4px; }

  /* Featured stores */
  .bm-stores-scroll {
    display: flex; gap: 14px; overflow-x: auto; padding-bottom: 8px;
    scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
  }
  .bm-stores-scroll::-webkit-scrollbar { height: 0; }
  .bm-store-card {
    scroll-snap-align: start; flex-shrink: 0; width: 180px;
    background: var(--card); border: 1.5px solid var(--border); border-radius: var(--radius);
    overflow: hidden; cursor: pointer; transition: transform .18s, box-shadow .18s;
  }
  .bm-store-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  .bm-store-img { width: 100%; height: 100px; background: #EEF2FF; object-fit: cover; }
  .bm-store-body { padding: 10px 12px 12px; }
  .bm-store-name { font-size: 13px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bm-store-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px; color: var(--text-3); }
  .bm-store-rating { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; color: var(--text); }
  .bm-store-delivery { display: inline-flex; align-items: center; gap: 3px; }
  .bm-store-badge { display: inline-block; background: var(--blue-light); color: var(--blue); font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-top: 6px; }

  /* Footer */
  .bm-footer { background: var(--text); color: #fff; width: 100%; }
  .bm-footer-inner { max-width: 1280px; margin: 0 auto; padding: 40px 16px 24px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 30px; }
  .bm-footer-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .bm-footer-logo-mark { width: 32px; height: 32px; border-radius: 8px; background: var(--blue); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .bm-footer-logo-mark img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
  .bm-footer-logo-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 16px; font-weight: 800; letter-spacing: -.02em; }
  .bm-footer-logo-name span { color: #60A5FA; }
  .bm-footer-desc { font-size: 12px; color: #94A3B8; line-height: 1.6; max-width: 260px; }
  .bm-footer-col-title { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #CBD5E1; margin-bottom: 12px; }
  .bm-footer-links { display: flex; flex-direction: column; gap: 6px; }
  .bm-footer-links a { font-size: 12px; color: #94A3B8; text-decoration: none; transition: color .15s; }
  .bm-footer-links a:hover { color: #fff; }
  .bm-footer-bottom { max-width: 1280px; margin: 0 auto; padding: 16px; border-top: 1px solid #1E293B; display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #64748B; flex-wrap: wrap; gap: 10px; }

  /* Bottom nav */
  .bm-bottom-nav {
    position: fixed; left: 0; right: 0; bottom: 0; display: none;
    background: #fff; border-top: 1px solid var(--border);
    padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
    z-index: 50; box-shadow: 0 -8px 24px rgba(15,23,42,.08); width: 100%;
  }
  .bm-bottom-nav-inner { max-width: 720px; margin: 0 auto; display: flex; gap: 4px; justify-content: space-around; }
  .bm-bottom-item { flex: 1; background: none; border: none; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px; color: #94A3B8; font-size: 10px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  .bm-bottom-item svg { width: 18px; height: 18px; }
  .bm-bottom-item.active { color: var(--blue); }
  .bm-bottom-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--blue); }

  /* Loading skeleton */
  @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
  .bm-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 600px 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }

  /* Responsive */
  @media (max-width: 1200px) { .bm-header-inner { padding: 12px; } .bm-nav { gap: 4px; } .bm-nav a { padding: 6px; font-size: 12px; } }
  @media (max-width: 1100px) { .bm-cats-grid { grid-template-columns: repeat(4, 1fr); } .bm-products-grid { grid-template-columns: repeat(3, 1fr); } .bm-footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; } }
  @media (max-width: 900px) { .bm-hero { grid-template-columns: 1fr; } .bm-hero-side { flex-direction: row; } .bm-nav { display: none; } .bm-menu-btn { display: flex; } .bm-header-search { max-width: 240px; } .bm-top-grid { grid-template-columns: 1fr; } .bm-wallet-chip span { max-width: 70px; } }
  @media (max-width: 820px) { .bm-bottom-nav { display: block; } .bm-page { padding-bottom: 90px; } .bm-hero-carousel-wrap { display: block; } .bm-mobile-only { display: block; } .bm-desktop-only { display: none; } .bm-header-search { max-width: 180px; } }
  @media (max-width: 680px) { .bm-header-inner { padding: 10px 8px; gap: 8px; } .bm-header-search { min-width: 120px; padding: 6px 10px; } .bm-header-search input { font-size: 12px; } .bm-products-grid { grid-template-columns: repeat(2, 1fr); } .bm-cats-grid { grid-template-columns: repeat(4, 1fr); gap: 8px; } .bm-hbtn:not(.bm-hbtn-icon):not(.bm-wallet-chip) span { display: none; } .bm-footer-inner { grid-template-columns: 1fr; } .bm-wallet-chip span { display: none; } .bm-hbtn-primary { padding: 6px 8px; } .bm-header-actions { gap: 4px; } }
  @media (max-width: 480px) { .bm-header-search { min-width: 100px; } .bm-products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } .bm-product-img-wrap { height: 150px; } .bm-hero-side { flex-direction: column; } .bm-cats-grid { grid-template-columns: repeat(4, 1fr); gap: 6px; } .bm-cat { padding: 10px 6px 8px; } .bm-cat-icon { width: 40px; height: 40px; } .bm-cat-label { font-size: 10px; } .bm-flash-bar { padding: 10px 12px; } .bm-flash-label { font-size: 14px; } .bm-timer-block { padding: 4px 6px; min-width: 26px; font-size: 11px; } }

  /* Animations */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .bm-animate { animation: fadeUp .4s ease both; }
  .bm-animate-1 { animation-delay: .05s; }
  .bm-animate-2 { animation-delay: .1s; }
  .bm-animate-3 { animation-delay: .15s; }
  .bm-animate-4 { animation-delay: .2s; }
  .bm-animate-5 { animation-delay: .25s; }

  /* ── Mobile Home Header ────────────────────────────── */
  .bm-mobile-home { display: none; padding: 16px 16px 0; }
  .bm-mh-row1 { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .bm-mh-greet { font-family:'Bricolage Grotesque',sans-serif; font-size: 19px; font-weight: 800; color: var(--text); line-height: 1.2; }
  .bm-mh-sub { font-size: 12px; color: var(--text-2); margin-top: 3px; }
  .bm-mh-icons { display: flex; gap: 8px; }
  .bm-mh-icon-btn { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--border); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; box-shadow: 0 1px 4px rgba(0,0,0,.06); flex-shrink: 0; }
  .bm-mh-badge { position: absolute; top: -2px; right: -2px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: var(--orange); color: #fff; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

  .bm-mobile-search-bar { display: flex; align-items: center; gap: 10px; border: 1.5px solid var(--border); border-radius: 14px; padding: 13px 14px; background: #fff; cursor: pointer; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
  .bm-mobile-search-bar span { flex: 1; font-size: 13px; color: var(--text-3); font-family:'Plus Jakarta Sans',sans-serif; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .bm-mobile-search-div { width: 1px; height: 18px; background: var(--border); flex-shrink: 0; }
  .bm-mobile-search-filter { color: var(--purple); display: flex; flex-shrink: 0; }

  .bm-mobile-location { display: flex; align-items: center; gap: 9px; padding: 11px 14px; background: #F4F4FF; border: 1.5px solid rgba(81,86,241,.22); border-radius: 14px; cursor: pointer; margin-bottom: 0; }
  .bm-mobile-location-text { flex: 1; font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bm-mobile-location-text strong { color: var(--text); font-weight: 700; }
  .bm-mobile-location-change { font-size: 12px; font-weight: 700; color: var(--purple); background: rgba(81,86,241,.1); border: none; border-radius: 8px; padding: 5px 10px; cursor: pointer; font-family:'Plus Jakarta Sans',sans-serif; flex-shrink: 0; }

  /* ── Mobile Category Scroll ─────────────────────── */
  .bm-cats-scroll { display: none; gap: 14px; overflow-x: auto; padding: 4px 0 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .bm-cats-scroll::-webkit-scrollbar { display: none; }
  .bm-cat-scroll-item { flex-shrink: 0; width: 80px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
  .bm-cat-scroll-icon { width: 70px; height: 70px; border-radius: 18px; border: 1px solid rgba(0,0,0,.07); display: flex; align-items: center; justify-content: center; font-size: 28px; transition: transform .15s; }
  .bm-cat-scroll-item:hover .bm-cat-scroll-icon { transform: translateY(-3px); }
  .bm-cat-scroll-label { font-size: 11px; font-weight: 600; color: var(--text); text-align: center; line-height: 1.25; }

  /* ── Top Restaurants Strip ─────────────────────── */
  .bm-restaurants-scroll { display: flex; gap: 14px; overflow-x: auto; padding: 4px 0 8px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .bm-restaurants-scroll::-webkit-scrollbar { display: none; }
  .bm-restaurant-item { flex-shrink: 0; width: 90px; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .bm-restaurant-logo { width: 72px; height: 72px; border-radius: 50%; border: 1.5px solid var(--border); overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,.1); transition: transform .15s; }
  .bm-restaurant-logo img { width: 100%; height: 100%; object-fit: cover; }
  .bm-restaurant-item:hover .bm-restaurant-logo { transform: translateY(-2px); }
  .bm-restaurant-name { font-size: 11px; font-weight: 600; color: var(--text); text-align: center; margin-top: 8px; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bm-restaurant-rating { display: flex; align-items: center; gap: 2px; font-size: 10px; color: var(--text-2); margin-top: 2px; justify-content: center; }

  @media (max-width: 820px) {
    .bm-announce { display: none; }
    .bm-header { display: none; }
    .bm-page { padding-top: 0; }
    .bm-mobile-home { display: block; }
    .bm-cats-grid { display: none; }
    .bm-cats-scroll { display: flex; }
  }
`
