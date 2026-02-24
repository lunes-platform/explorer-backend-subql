import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, Eye, DollarSign, ArrowRight, Shield,
  Zap, Target, BarChart3, CheckCircle, Users, Globe, TrendingUp,
  ChevronDown, ChevronUp, Layers, Wallet, MousePointerClick,
  Radio, LayoutDashboard, PanelTop,
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Pricing {
  costPer1000Impressions: number;
  minImpressions: number;
  maxImpressions: number;
  paymentWallet: string;
  autoApprove: boolean;
  allowedPlacements: string[];
}

const PLACEMENTS_INFO = [
  {
    value: 'home_stats',
    icon: <LayoutDashboard size={28} />,
    label: 'Homepage Stats Bar',
    badge: 'Most Popular',
    badgeColor: '#6c38ff',
    reach: 'Every homepage visit',
    ctr: 'Highest CTR',
    desc: 'Your brand sits directly inside the live network stats block — the first thing every visitor sees. Maximum exposure for launches, IDOs, and announcements.',
  },
  {
    value: 'sidebar',
    icon: <PanelTop size={28} />,
    label: 'Sidebar Banner',
    badge: 'Best for Awareness',
    badgeColor: '#26d07c',
    reach: 'All explorer pages',
    ctr: 'High Frequency',
    desc: 'Persistent visibility across all explorer pages — blocks, transactions, accounts, tokens. Your ad follows users throughout their entire session.',
  },
  {
    value: 'global',
    icon: <Radio size={28} />,
    label: 'Global Top Banner',
    badge: 'Maximum Reach',
    badgeColor: '#f5a623',
    reach: '100% page coverage',
    ctr: 'Broadest Reach',
    desc: 'A prominent banner at the top of every single page on the explorer. Impossible to miss. Perfect for time-sensitive campaigns and major announcements.',
  },
];

const STATS = [
  { icon: <Users size={22} />, value: '50K+', label: 'Monthly Active Users', color: '#6c38ff' },
  { icon: <Eye size={22} />, value: '2M+', label: 'Monthly Page Views', color: '#26d07c' },
  { icon: <Globe size={22} />, value: '80+', label: 'Countries Reached', color: '#f5a623' },
  { icon: <TrendingUp size={22} />, value: '3.2%', label: 'Average CTR', color: '#00c2ff' },
];

const WHY_US = [
  { icon: <Target size={20} />, title: 'Crypto-Native Audience', desc: 'Every visitor is already in the blockchain space — developers, traders, validators, and DeFi users actively exploring the Lunes network.' },
  { icon: <Wallet size={20} />, title: 'Pay with LUNES', desc: 'No credit cards, no fiat. Payments are made directly on-chain with LUNES tokens — transparent, instant, and fully decentralized.' },
  { icon: <BarChart3 size={20} />, title: 'Real-Time Analytics', desc: 'Track impressions and clicks in real time from your dashboard. Know exactly how your campaign is performing at every moment.' },
  { icon: <Shield size={20} />, title: 'Curated Environment', desc: 'Every ad is reviewed by our team before going live. We maintain a high-quality, spam-free environment that users trust.' },
  { icon: <Zap size={20} />, title: 'Fast Activation', desc: 'Submit your ad, pay on-chain, and go live within hours. No lengthy approval processes or complex onboarding required.' },
  { icon: <Layers size={20} />, title: 'Flexible Packages', desc: 'Choose exactly how many impressions you need — from 1,000 to 1,000,000. Scale your campaign to match your budget.' },
];

const FAQ_ITEMS = [
  { q: 'How do I pay for my ad campaign?', a: "Payment is made entirely on-chain using LUNES tokens. After submitting your ad details, you'll sign a transaction from your Polkadot-compatible wallet. No credit cards or fiat required." },
  { q: 'How long does approval take?', a: 'Most ads are reviewed and approved within 24 hours. If auto-approve is enabled, your campaign goes live immediately after payment confirmation on-chain.' },
  { q: 'What types of ads are allowed?', a: 'We accept ads for blockchain projects, DeFi protocols, NFT collections, developer tools, exchanges, wallets, and Web3 services. Scams, gambling, and adult content are not allowed.' },
  { q: 'Can I track my campaign performance?', a: 'Yes. Once live, monitor impressions, clicks, and CTR in real time from the "My Ads" section of your dashboard. Data is updated continuously.' },
  { q: 'What happens when my impressions run out?', a: 'Your ad is automatically paused when purchased impressions are fully delivered. You can then purchase a new package to continue the campaign.' },
  { q: 'Is there a minimum spend?', a: 'Yes, the minimum order is 1,000 impressions. The exact cost in LUNES is shown dynamically on the pricing calculator and updates in real time.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Ad', desc: 'Go to Dashboard → My Ads. Fill in your ad title, description, destination URL, and choose a placement.' },
  { step: '02', title: 'Set Your Budget', desc: 'Pick the number of impressions you want. The cost in LUNES is calculated instantly. No hidden fees.' },
  { step: '03', title: 'Pay On-Chain', desc: 'Sign a single transaction with your Polkadot wallet. Payment is confirmed on the Lunes blockchain in seconds.' },
  { step: '04', title: 'Go Live', desc: 'Your ad is reviewed and activated — usually within 24 hours. Track performance in real time from your dashboard.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'none', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left', gap: 12 }}
      >
        {q}
        {open
          ? <ChevronUp size={18} style={{ flexShrink: 0, color: '#6c38ff' }} />
          : <ChevronDown size={18} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />}
      </button>
      {open && <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{a}</p>}
    </div>
  );
}

function PricingCalc({ pricing }: { pricing: Pricing }) {
  const [imp, setImp] = useState(10000);
  const cost = Math.ceil((imp / 1000) * pricing.costPer1000Impressions);
  return (
    <div style={{ background: 'rgba(108,56,255,0.06)', border: '1px solid rgba(108,56,255,0.2)', borderRadius: 16, padding: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6c38ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Live Pricing Calculator</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Impressions</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{imp.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={pricing.minImpressions}
        max={pricing.maxImpressions}
        step={1000}
        value={imp}
        onChange={e => setImp(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#6c38ff', marginBottom: 6 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 24 }}>
        <span>{pricing.minImpressions.toLocaleString()} min</span>
        <span>{pricing.maxImpressions.toLocaleString()} max</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(0,0,0,0.3)', borderRadius: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total Cost</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#26d07c' }}>{cost.toLocaleString()} <span style={{ fontSize: 16 }}>LUNES</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>CPM Rate</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{pricing.costPer1000Impressions} LUNES</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        {[10000, 50000, 100000].map(pkg => (
          <button
            key={pkg}
            onClick={() => setImp(pkg)}
            style={{ padding: '10px 6px', borderRadius: 8, border: `1px solid ${imp === pkg ? '#6c38ff' : 'rgba(255,255,255,0.08)'}`, background: imp === pkg ? 'rgba(108,56,255,0.15)' : 'rgba(255,255,255,0.03)', color: imp === pkg ? 'white' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
          >
            <div>{pkg.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: imp === pkg ? '#26d07c' : 'var(--text-muted)' }}>
              {Math.ceil((pkg / 1000) * pricing.costPer1000Impressions).toLocaleString()} LUNES
            </div>
          </button>
        ))}
      </div>
      <Link
        to="/dashboard"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 10, background: 'linear-gradient(135deg, #6c38ff, #a78bfa)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
      >
        Start Your Campaign <ArrowRight size={16} />
      </Link>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
        Connect your wallet · Dashboard → My Ads tab
      </p>
    </div>
  );
}

export default function AdvertisePage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    document.title = 'Advertise on Lunes Explorer — Reach 50K+ Blockchain Users';
    fetch(`${API_BASE_URL}/ads/pricing`)
      .then(r => r.json())
      .then(d => setPricing(d))
      .catch(() => {});
    return () => { document.title = 'Lunes Explorer'; };
  }, []);

  return (
    <div style={{ color: 'white', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108,56,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(108,56,255,0.12)', border: '1px solid rgba(108,56,255,0.3)', fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 }}>
            <Megaphone size={13} /> Advertising on Lunes Explorer
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 60px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', background: 'linear-gradient(135deg, #fff 40%, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Put Your Project in Front of<br />50,000+ Blockchain Users
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 40px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            Lunes Explorer is the primary on-chain analytics tool for the Lunes blockchain. Advertise your token, DeFi protocol, NFT collection, or Web3 product to a highly engaged, crypto-native audience — and pay entirely with LUNES tokens.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #6c38ff, #a78bfa)', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              Start Advertising <ArrowRight size={18} />
            </Link>
            <a href="#pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
              <DollarSign size={18} /> View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {STATS.map((st, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: st.color }}>{st.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 4 }}>{st.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AD PLACEMENTS ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6c38ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Ad Placements</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px' }}>Choose Where Your Brand Appears</h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>Three premium placements, each designed to maximize visibility for a different campaign goal.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {PLACEMENTS_INFO.map((p, i) => (
            <div key={i} style={{ padding: 28, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 10px', borderRadius: 100, background: p.badgeColor + '22', border: `1px solid ${p.badgeColor}44`, fontSize: 11, fontWeight: 700, color: p.badgeColor }}>{p.badge}</div>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(108,56,255,0.12)', border: '1px solid rgba(108,56,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', marginBottom: 20 }}>{p.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>{p.label}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 20px' }}>{p.desc}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={11} />{p.reach}</span>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(38,208,124,0.08)', fontSize: 11, color: '#26d07c', display: 'inline-flex', alignItems: 'center', gap: 4 }}><MousePointerClick size={11} />{p.ctr}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'rgba(108,56,255,0.04)', borderTop: '1px solid rgba(108,56,255,0.1)', borderBottom: '1px solid rgba(108,56,255,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6c38ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px' }}>From Idea to Live in 4 Steps</h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>No agencies, no middlemen. Just your wallet and a few clicks.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} style={{ padding: 28, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(108,56,255,0.2)', lineHeight: 1, marginBottom: 16 }}>{h.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px' }}>{h.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ADVERTISE ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6c38ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Why Lunes Explorer</div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px' }}>The Smartest Place to Reach Web3 Users</h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>Unlike social media ads that reach a general audience, every person on Lunes Explorer is already in the blockchain ecosystem.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {WHY_US.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: 24, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(108,56,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>{w.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{w.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{w.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6c38ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, margin: '0 0 20px' }}>Simple, Transparent,<br />On-Chain Pricing</h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>You pay per impression — no subscriptions, no retainers, no surprises. The price is fixed in LUNES and calculated transparently on the blockchain.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['No setup fee', 'No monthly commitment', 'Pay only for impressions delivered', 'On-chain payment — fully transparent', 'Cancel anytime before campaign starts'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-muted)' }}>
                  <CheckCircle size={16} style={{ color: '#26d07c', flexShrink: 0 }} />{item}
                </div>
              ))}
            </div>
          </div>
          <div>
            {pricing
              ? <PricingCalc pricing={pricing} />
              : (
                <div style={{ background: 'rgba(108,56,255,0.06)', border: '1px solid rgba(108,56,255,0.2)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading pricing data...</div>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6c38ff', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, margin: '0 0 16px' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>Everything you need to know about advertising on Lunes Explorer.</p>
            <Link to="/advertise/policies" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'underline' }}>View full Ad Policies & Guidelines →</Link>
          </div>
          <div>
            {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(108,56,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #6c38ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Megaphone size={30} color="white" />
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px' }}>Ready to Grow Your Project?</h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36 }}>Join the projects already reaching thousands of blockchain users every day on Lunes Explorer. Your next campaign is just a few clicks away.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #6c38ff, #a78bfa)', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
              Start Advertising Now <ArrowRight size={18} />
            </Link>
            <Link to="/advertise/policies" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'white', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
              Ad Policies
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
