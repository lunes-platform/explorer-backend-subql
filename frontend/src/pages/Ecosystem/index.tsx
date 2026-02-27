import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, Coins, Shield, Globe, Zap, Users, BarChart3,
  CheckCircle, ArrowRight, ExternalLink, Star, TrendingUp,
  Code2, Lock, Layers, ChevronRight, Sparkles, MessageCircle,
} from 'lucide-react';

// ─── SEO: inject meta tags dynamically ───
function useSEOMeta() {
  useEffect(() => {
    const prev = {
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      keys: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
      og: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDesc: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
    };

    document.title = 'Build on Lunes | Launch Your Blockchain Project on the Lunes Network';

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (attr === 'name') el.name = selector.replace('meta[name="', '').replace('"]', '');
        if (attr === 'property') el.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', 'name',
      'Launch your project on the Lunes blockchain. Create tokens, register your project on the Lunes Explorer, access DeFi infrastructure, and grow your community in one of the most innovative ecosystems in Latin America.');
    setMeta('meta[name="keywords"]', 'name',
      'Lunes blockchain, criar token blockchain, Lunes Network, blockchain latinoamérica, DeFi Lunes, pallet-assets, criar projeto blockchain, ecossistema Lunes, Lunes Explorer, token Lunes, blockchain brasil, Web3 brasil, launch token blockchain');
    setMeta('meta[name="robots"]', 'name', 'index, follow');
    setMeta('meta[property="og:title"]', 'property', 'Build on Lunes — Launch Your Web3 Project on the Lunes Network');
    setMeta('meta[property="og:description"]', 'property',
      'The fastest-growing blockchain ecosystem in Latin America. Create your token, register your project, and connect with thousands of users on the Lunes Network.');
    setMeta('meta[property="og:type"]', 'property', 'website');
    setMeta('meta[property="og:url"]', 'property', 'https://explorer.lunes.io/ecosystem');
    setMeta('meta[name="twitter:card"]', 'name', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'Build on Lunes — Launch Your Web3 Project');
    setMeta('meta[name="twitter:description"]', 'name',
      'Create tokens, launch DeFi products, and grow your community on the Lunes blockchain. Low fees. Fast finality. Full ownership.');

    return () => {
      document.title = prev.title;
    };
  }, []);
}

// ─── Data ───
const STATS = [
  { value: '1,645+', label: 'Active Wallets', icon: <Users size={20} />, color: '#6C38FF' },
  { value: '< 0.001', label: 'Avg Tx Fee (LUNES)', icon: <Zap size={20} />, color: '#26d07c' },
  { value: '6s', label: 'Block Time', icon: <TrendingUp size={20} />, color: '#4cc9f0' },
  { value: '100%', label: 'Uptime', icon: <Shield size={20} />, color: '#fe9f00' },
];

const WHY_LUNES = [
  {
    icon: <Zap size={24} />, color: '#6C38FF',
    title: 'Ultra-Low Fees',
    body: 'Launch and operate your project with transaction fees that are a fraction of what Ethereum or BNB Chain charge. More money stays in your users\' hands.',
  },
  {
    icon: <Shield size={24} />, color: '#26d07c',
    title: 'Battle-Tested Security',
    body: 'Built on Substrate — the same technology powering Polkadot. Your project inherits years of cryptographic research and security audits.',
  },
  {
    icon: <Coins size={24} />, color: '#4cc9f0',
    title: 'Native Token Standard',
    body: 'The pallet-assets standard gives your token instant compatibility with all Lunes wallets, DEXs, and DeFi protocols — no smart contract needed.',
  },
  {
    icon: <Globe size={24} />, color: '#fe9f00',
    title: 'Latin America\'s Web3 Hub',
    body: 'Access the fastest-growing crypto community in Latin America. Lunes has thousands of active users ready to engage with innovative projects.',
  },
  {
    icon: <BarChart3 size={24} />, color: '#f72585',
    title: 'Instant Explorer Visibility',
    body: 'Every registered project appears on the Lunes Explorer — seen by every developer, validator, and trader interacting with the network.',
  },
  {
    icon: <Code2 size={24} />, color: '#7209b7',
    title: 'Developer-First Infrastructure',
    body: 'Full SubQuery indexing, GraphQL API, WebSocket RPC endpoints, and open-source tooling. Everything you need to build, from day one.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Register Your Project',
    desc: 'Create your project profile on the Lunes Explorer. Add logo, description, team, roadmap, social links — everything investors and users need.',
    cta: 'Register Now',
    href: '/project/register',
  },
  {
    step: '02',
    title: 'Launch Your Token',
    desc: 'Create your fungible token directly on-chain using the pallet-assets standard. No smart contracts, no audits needed. Just sign 3 transactions.',
    cta: 'Create Token',
    href: '/dashboard',
  },
  {
    step: '03',
    title: 'Get Verified',
    desc: 'Submit for ecosystem verification via KYC. A verified badge gives your community confidence and unlocks promotional tools on the Explorer.',
    cta: 'Verify Project',
    href: '/project/verify',
  },
  {
    step: '04',
    title: 'Grow Your Community',
    desc: 'Advertise to targeted Lunes users, appear in the rewards leaderboard, and connect with active DeFi participants across the network.',
    cta: 'Explore Ads',
    href: '/advertise',
  },
];

const WHAT_YOU_GET = [
  'Project profile page on the Lunes Explorer',
  'Your token listed in the Tokens directory',
  'Automatic on-chain analytics and holder tracking',
  'Access to Lunes DeFi ecosystem (swaps, liquidity)',
  'Promotional tools: banners, ads, rewards integration',
  'Verified badge after KYC submission',
  'Open-source API for custom integrations',
  'Direct channel to 1,645+ active Lunes wallets',
];

const TESTIMONIALS = [
  {
    quote: 'Lunes gave us the infrastructure to launch our token in hours, not months. The fees are negligible and the community engagement is real.',
    author: 'LUSDT Team',
    role: 'Stablecoin on Lunes Network',
    avatar: 'L',
    color: '#26d07c',
    slug: 'lusdt',
  },
  {
    quote: 'Building on Lunes was the right call. We have full control of our token, instant Explorer listing, and a growing holder base.',
    author: 'PidChat',
    role: 'Messaging & Payments dApp',
    avatar: 'P',
    color: '#6C38FF',
    slug: 'pidchat',
  },
];

function useProjectLogos(slugs: string[]) {
  const [logos, setLogos] = useState<Record<string, string>>({});
  useEffect(() => {
    Promise.all(
      slugs.map(slug =>
        fetch(`/api/projects/${slug}`)
          .then(r => r.ok ? r.json() : null)
          .then(p => p ? [slug, p.logo || ''] : [slug, ''])
          .catch(() => [slug, ''])
      )
    ).then(entries => {
      setLogos(Object.fromEntries(entries));
    });
  }, [slugs.join(',')]);
  return logos;
}

const FAQS = [
  {
    q: 'Do I need coding skills to launch a token on Lunes?',
    a: 'No. The token creation wizard in your dashboard guides you through the entire process — just fill the form and sign 3 wallet transactions. No Solidity, no Rust, no audits.',
  },
  {
    q: 'What is the cost to launch a project on Lunes?',
    a: 'Registering a project is free. Token creation has a one-time emission fee in LUNES, which covers infrastructure and network listing. Blockchain transaction fees are minimal (< 0.001 LUNES).',
  },
  {
    q: 'Will my token be compatible with Lunes wallets and DEXs?',
    a: 'Yes. Any token created via pallet-assets on the Lunes Network is immediately compatible with all Lunes-compatible wallets (like Talisman, SubWallet, Polkadot.js) and DEX protocols.',
  },
  {
    q: 'Can I verify my project to get a trusted badge?',
    a: 'Yes. After registering your project and connecting your owner wallet, you can submit for ecosystem verification. Verified projects receive a badge on their profile and increased visibility.',
  },
  {
    q: 'Is the Lunes blockchain open-source?',
    a: 'Yes. Lunes is built on Substrate (open-source by Parity Technologies). The indexer, explorer, and API are also open-source. Full transparency for builders and communities.',
  },
];

// ─── Component ───
export default function EcosystemPage() {
  useSEOMeta();
  const testimonialLogos = useProjectLogos(TESTIMONIALS.map(t => t.slug));

  return (
    <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden', padding: '80px 24px 100px',
        background: 'linear-gradient(160deg, rgba(108,56,255,0.12) 0%, rgba(76,201,240,0.06) 50%, rgba(0,0,0,0) 100%)',
        borderBottom: '1px solid rgba(108,56,255,0.12)',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,56,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,201,240,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(108,56,255,0.12)', border: '1px solid rgba(108,56,255,0.25)', fontSize: 12, fontWeight: 700, color: 'var(--color-brand-400)', marginBottom: 24, letterSpacing: '0.06em' }}>
              <Sparkles size={13} /> LUNES ECOSYSTEM — BUILD THE FUTURE
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 62px)', fontWeight: 900, margin: '0 0 24px',
              lineHeight: 1.1, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa 70%, #4cc9f0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Launch Your Project<br />on the Lunes Blockchain
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.7 }}>
              The most accessible blockchain for builders, founders, and creators in Latin America.
              Create tokens, register projects, and connect with a growing Web3 community —
              <strong style={{ color: 'var(--text-primary)' }}> all in minutes, not months.</strong>
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '15px 32px', borderRadius: 14, textDecoration: 'none',
                background: 'linear-gradient(90deg,#6C38FF,#5228DB)',
                color: 'white', fontSize: 16, fontWeight: 700,
                boxShadow: '0 4px 24px rgba(108,56,255,0.4)',
              }}>
                <Coins size={18} /> Create a Token <ArrowRight size={16} />
              </Link>
              <Link to="/project/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '15px 32px', borderRadius: 14, textDecoration: 'none',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-primary)', fontSize: 16, fontWeight: 600,
              }}>
                <Rocket size={18} /> Register Project
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '48px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              style={{ textAlign: 'center', padding: '28px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, margin: '0 auto 14px' }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WHY LUNES ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Why Build on Lunes?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto' }}>
            We give builders everything they need to launch, grow, and succeed — without the complexity or cost of other blockchains.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {WHY_LUNES.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              style={{ padding: '28px 26px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${item.color}44`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: `${item.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, marginBottom: 18 }}>{item.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65 }}>{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(108,56,255,0.03)', borderTop: '1px solid rgba(108,56,255,0.1)', borderBottom: '1px solid rgba(108,56,255,0.1)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              From Idea to Launch in 4 Steps
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
              No technical expertise required. Just your idea and a Polkadot-compatible wallet.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                style={{ padding: '28px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(108,56,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--color-brand-400)', flexShrink: 0 }}>{step.step}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{step.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65, flex: 1 }}>{step.desc}</p>
                <Link to={step.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-brand-400)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                  {step.cta} <ChevronRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Everything Your Project Needs to Succeed
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.7 }}>
              When you register on the Lunes Ecosystem, you're not just creating a wallet address.
              You're joining a full-stack Web3 infrastructure designed for real traction.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {WHAT_YOU_GET.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <CheckCircle size={16} color="#26d07c" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <Link to="/project/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', background: 'linear-gradient(90deg,#6C38FF,#5228DB)', color: 'white', fontSize: 14, fontWeight: 700 }}>
                <Rocket size={15} /> Get Started Free
              </Link>
              <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>
                <Globe size={15} /> See Projects
              </Link>
            </div>
          </motion.div>

          {/* Visual card stack */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ position: 'relative' }}>
            <div style={{ padding: 28, borderRadius: 20, background: 'linear-gradient(135deg, rgba(108,56,255,0.1), rgba(76,201,240,0.06))', border: '1px solid rgba(108,56,255,0.2)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#6C38FF,#4cc9f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white' }}>L</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>My Lunes Project</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#26d07c', display: 'inline-block' }} /> Verified · DeFi
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(38,208,124,0.1)', color: '#26d07c', fontSize: 11, fontWeight: 700 }}>
                  <Star size={11} /> 4.9
                </div>
              </div>
              {[['Token Symbol', 'MYTKN'], ['Total Supply', '10,000,000'], ['Holders', '1,234'], ['Market Cap', '$2.4M']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: <Lock size={16} />, label: 'KYC Verified', color: '#26d07c' },
                { icon: <Layers size={16} />, label: 'On Explorer', color: '#6C38FF' },
                { icon: <BarChart3 size={16} />, label: 'Live Analytics', color: '#4cc9f0' },
                { icon: <Zap size={16} />, label: '< 6s Finality', color: '#fe9f00' },
              ].map(b => (
                <div key={b.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ color: b.color }}>{b.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 800, marginBottom: 40, letterSpacing: '-0.02em' }}>
            Projects Already Building on Lunes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.author} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                style={{ padding: '28px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 32, color: `${t.color}60`, marginBottom: 12, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.7, fontStyle: 'italic' }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {testimonialLogos[t.slug] ? (
                    <img
                      src={testimonialLogos[t.slug]}
                      alt={t.author}
                      style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', background: `${t.color}22` }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; }}
                    />
                  ) : null}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.color}22`, alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: t.color, display: testimonialLogos[t.slug] ? 'none' : 'flex', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.author}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, marginBottom: 44 }}>
            Everything you need to know before building on Lunes.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FAQS.map((faq, i) => (
              <motion.div key={faq.q} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                style={{ padding: '22px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ color: 'var(--color-brand-400)', flexShrink: 0, marginTop: 1 }}>Q</span> {faq.q}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65, paddingLeft: 22 }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        padding: '80px 24px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(108,56,255,0.12) 0%, rgba(76,201,240,0.06) 100%)',
        borderTop: '1px solid rgba(108,56,255,0.15)',
      }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 'clamp(26px,5vw,48px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ready to Build the Future?
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Join the projects already building on the Lunes Network. Your token. Your community. Your rules.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 14, textDecoration: 'none', background: 'linear-gradient(90deg,#6C38FF,#5228DB)', color: 'white', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 24px rgba(108,56,255,0.4)' }}>
              <Coins size={18} /> Create a Token <ArrowRight size={16} />
            </Link>
            <a href="https://t.me/c/LunesGlobal/80" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 14, textDecoration: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>
              <MessageCircle size={18} /> Talk to the Team
              <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── SEO Text Block (hidden visually, visible to crawlers) ── */}
      <section aria-label="SEO content" style={{ padding: '40px 24px', maxWidth: 860, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          About the Lunes Blockchain Ecosystem
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 10 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Lunes Network</strong> is a Layer-1 blockchain built on{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>Substrate</strong>, the same framework powering Polkadot and Kusama.
          Designed for speed, low fees, and developer-friendliness, Lunes is the premier destination for{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>Web3 projects in Latin America</strong>, particularly in Brazil.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 10 }}>
          Projects on the Lunes ecosystem can <strong style={{ color: 'var(--text-secondary)' }}>create fungible tokens</strong> using
          the native <strong style={{ color: 'var(--text-secondary)' }}>pallet-assets</strong> standard — no smart contracts, no Solidity,
          no audits required. Tokens are instantly compatible with all Lunes-compatible wallets (Talisman, SubWallet, Polkadot.js extension)
          and available in the <strong style={{ color: 'var(--text-secondary)' }}>Lunes Explorer token directory</strong>.
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          The <strong style={{ color: 'var(--text-secondary)' }}>Lunes Explorer</strong> at <code>explorer.lunes.io</code> is the
          official block explorer, project registry, and DeFi analytics hub for the Lunes Network. Builders can register their projects,
          apply for ecosystem verification, launch token-based advertising campaigns, and access real-time on-chain analytics.
          Keywords: <em>blockchain brasil, criar token blockchain, lunes network, defi latinoamérica, substrate blockchain,
          token launch blockchain, ecossistema web3 brasil, criar projeto blockchain, lunes explorer, pallet assets token</em>.
        </p>
      </section>

    </div>
  );
}
