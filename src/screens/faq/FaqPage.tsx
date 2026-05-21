import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardCss } from '../../components/dashboard/dashboardStyles'

// ─── Data ────────────────────────────────────────────────────────────────────────
type FaqItem = {
  question: string
  answer: string
  icon: string
  tag: 'General' | 'Students' | 'Sellers' | 'Riders'
  tagColor: string
}

const FAQS: FaqItem[] = [
  {
    question: 'What is Blorbmart?',
    answer: 'Blorbmart is a campus marketplace where students can buy and sell items, order from student sellers, and arrange deliveries inside their university.',
    icon: '🏪',
    tag: 'General',
    tagColor: '#1f77f1',
  },
  {
    question: 'How does Blorbmart work?',
    answer: 'Students sign up, browse campus listings or post products, place orders, and track delivery or pickup directly from the platform.',
    icon: '📱',
    tag: 'General',
    tagColor: '#1f77f1',
  },
  {
    question: 'Who can sell on Blorbmart?',
    answer: 'Students, campus creators, and university-based small businesses can open a seller account and reach buyers within their campus community.',
    icon: '👥',
    tag: 'Sellers',
    tagColor: '#5156f1',
  },
  {
    question: 'Is Blorbmart free for students?',
    answer: 'Yes. Students can join, browse listings, and use the marketplace without paying to create an account.',
    icon: '💸',
    tag: 'Students',
    tagColor: '#1baa6e',
  },
  {
    question: 'Can riders earn money on Blorbmart?',
    answer: 'Yes. Campus riders can accept delivery requests, work around their class schedule, and earn from short on-campus trips.',
    icon: '🛵',
    tag: 'Riders',
    tagColor: '#ff5500',
  },
  {
    question: 'How do I track my order?',
    answer: 'After placing an order, go to "Track Orders" from your profile or the bottom navigation. You\'ll see real-time status updates from Pending through to Delivered.',
    icon: '📦',
    tag: 'Students',
    tagColor: '#1baa6e',
  },
  {
    question: 'How does the wallet work?',
    answer: 'Your Blorbmart wallet lets you fund your account via card (powered by Paystack) and use your balance to pay for orders instantly at checkout.',
    icon: '💳',
    tag: 'Students',
    tagColor: '#1baa6e',
  },
  {
    question: 'How do I become a seller?',
    answer: 'Download the Blorbmart Vendor app or visit the vendor portal. Create a store, list your products, and start receiving orders from buyers on campus.',
    icon: '🏬',
    tag: 'Sellers',
    tagColor: '#5156f1',
  },
]

const CATEGORIES = ['All', 'General', 'Students', 'Sellers', 'Riders'] as const
type Category = typeof CATEGORIES[number]

// ─── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  .fq-root { min-height:100vh; background:var(--bg); font-family:'Plus Jakarta Sans',sans-serif; }

  /* Gradient header */
  .fq-hero { background:linear-gradient(135deg,#1055c8 0%,#1f77f1 100%); border-radius:0 0 32px 32px;
    padding:20px 20px 36px; color:#fff; position:relative; overflow:hidden; }
  .fq-hero-top { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
  .fq-back { width:36px; height:36px; border-radius:12px; border:none; background:rgba(255,255,255,.18);
    display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
  .fq-hero-body { display:flex; align-items:flex-end; justify-content:space-between; }
  .fq-hero-title { font-family:'Bricolage Grotesque',sans-serif; font-size:34px; font-weight:800;
    letter-spacing:-0.5px; margin-bottom:6px; }
  .fq-hero-sub { font-size:14px; font-weight:500; opacity:.8; }
  .fq-q-bubble { width:72px; height:72px; border-radius:50%; border:1.5px solid rgba(255,255,255,.3);
    background:rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center;
    font-family:'Bricolage Grotesque',sans-serif; font-size:36px; font-weight:900; flex-shrink:0; }

  /* Category chips */
  .fq-cats { display:flex; gap:8px; padding:20px 20px 4px; overflow-x:auto; }
  .fq-cat { border:1.5px solid var(--border); background:#fff; border-radius:999px; padding:8px 18px;
    font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; color:var(--text-2);
    font-family:'Plus Jakarta Sans',sans-serif; transition:all .2s; }
  .fq-cat.active { background:#1f77f1; border-color:#1f77f1; color:#fff;
    box-shadow:0 4px 10px rgba(31,119,241,.3); }

  /* FAQ list */
  .fq-list { padding:16px 20px 0; max-width:600px; margin:0 auto; }

  /* FAQ card */
  .fq-card { background:#fff; border:1.5px solid var(--border); border-radius:18px; margin-bottom:12px;
    overflow:hidden; cursor:pointer; transition:border-color .2s, box-shadow .2s; }
  .fq-card.open { border-color:rgba(31,119,241,.6); box-shadow:0 6px 18px rgba(31,119,241,.1); }
  .fq-card-head { display:flex; align-items:flex-start; gap:12px; padding:16px; }
  .fq-card-icon { width:44px; height:44px; border-radius:13px; display:flex; align-items:center;
    justify-content:center; font-size:20px; flex-shrink:0; transition:background .2s; }
  .fq-card-meta { flex:1; min-width:0; }
  .fq-tag { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
    border-radius:99px; margin-bottom:5px; }
  .fq-q-text { font-size:14px; font-weight:700; color:var(--text); line-height:1.35; }
  .fq-arrow { width:28px; height:28px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; flex-shrink:0; transition:background .2s, transform .28s; font-size:18px;
    color:var(--text-2); background:var(--bg); margin-top:2px; }
  .fq-card.open .fq-arrow { transform:rotate(180deg); background:rgba(31,119,241,.12); color:#1f77f1; }
  .fq-divider { height:1px; background:rgba(31,119,241,.2); margin:0 16px; }
  .fq-answer { display:flex; gap:12px; padding:12px 16px 18px; }
  .fq-bar { width:3px; flex-shrink:0; border-radius:2px; background:linear-gradient(to bottom,#1055c8,#1f77f1); align-self:stretch; min-height:40px; }
  .fq-answer-text { font-size:13px; color:var(--text-2); line-height:1.6; }

  /* Contact card */
  .fq-contact { margin:8px 20px 32px; padding:20px; background:rgba(31,119,241,.07);
    border:1.2px solid rgba(31,119,241,.25); border-radius:20px; display:flex; align-items:center; gap:14px;
    max-width:560px; }
  .fq-contact-icon { width:48px; height:48px; border-radius:50%; background:rgba(31,119,241,.15);
    display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
  .fq-contact-title { font-size:14px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .fq-contact-email { font-size:12px; font-weight:500; color:#1f77f1; }
`

// ─── Main Component ─────────────────────────────────────────────────────────────
export function FaqPage() {
  const navigate = useNavigate()
  const [expandedIndex, setExpandedIndex] = useState(-1)
  const [selectedCat, setSelectedCat]     = useState<Category>('All')

  const visible = selectedCat === 'All' ? FAQS : FAQS.filter(f => f.tag === selectedCat)

  const toggle = (i: number) => setExpandedIndex(prev => (prev === i ? -1 : i))

  const selectCat = (cat: Category) => {
    setSelectedCat(cat)
    setExpandedIndex(-1)
  }

  return (
    <>
      <style>{dashboardCss}</style>
      <style>{css}</style>

      <div className="fq-root">
        {/* Hero */}
        <div className="fq-hero">
          <div className="fq-hero-top">
            <button className="fq-back" type="button" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          </div>
          <div className="fq-hero-body">
            <div>
              <div className="fq-hero-title">FAQs</div>
              <div className="fq-hero-sub">Everything you need to know</div>
            </div>
            <div className="fq-q-bubble">?</div>
          </div>
        </div>

        {/* Category chips */}
        <div className="fq-cats">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`fq-cat${selectedCat === cat ? ' active' : ''}`}
              onClick={() => selectCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="fq-list">
          {visible.map((faq, i) => {
            const open = expandedIndex === i
            return (
              <div key={i} className={`fq-card${open ? ' open' : ''}`} onClick={() => toggle(i)}>
                <div className="fq-card-head">
                  <div
                    className="fq-card-icon"
                    style={{ background: open ? 'rgba(31,119,241,.12)' : faq.tagColor + '1a' }}
                  >
                    {faq.icon}
                  </div>
                  <div className="fq-card-meta">
                    <span className="fq-tag" style={{ background: faq.tagColor + '1a', color: faq.tagColor }}>
                      {faq.tag}
                    </span>
                    <div className="fq-q-text">{faq.question}</div>
                  </div>
                  <div className="fq-arrow">▾</div>
                </div>
                {open && (
                  <>
                    <div className="fq-divider" />
                    <div className="fq-answer">
                      <div className="fq-bar" />
                      <div className="fq-answer-text">{faq.answer}</div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Contact card */}
        <div className="fq-contact">
          <div className="fq-contact-icon">💬</div>
          <div>
            <div className="fq-contact-title">Still have questions?</div>
            <div className="fq-contact-email">Contact us at support@blorbmart.com.ng</div>
          </div>
        </div>
      </div>
    </>
  )
}
