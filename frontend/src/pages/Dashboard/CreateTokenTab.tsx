import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Zap, Shield, Globe, Users, TrendingUp, CheckCircle,
  ArrowRight, Loader2, AlertCircle, ExternalLink, Copy,
  ChevronRight, Sparkles, Lock, BarChart3, Info,
} from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import {
  useTokenEmissionConfig, useTokenEmission, useMyTokens,
  getNextAssetId, type TokenCreateParams,
} from '../../hooks/useTokenEmission';
import ImageUpload from '../../components/common/ImageUpload';
import styles from './Dashboard.module.css';

interface Props { address: string; }

// ─── Landing section data ───
const BENEFITS = [
  {
    icon: <Zap size={22} />, color: '#6C38FF',
    title: 'Fast & Low-Cost',
    desc: 'Launch your token in minutes with ultra-low transaction fees on the Lunes network.',
  },
  {
    icon: <Shield size={22} />, color: '#26d07c',
    title: 'Secure by Design',
    desc: 'Built on Substrate with pallet-assets — battle-tested, audited infrastructure.',
  },
  {
    icon: <Globe size={22} />, color: '#00b4d8',
    title: 'Instant Explorer Listing',
    desc: 'Your token appears on the Lunes Explorer automatically after creation.',
  },
  {
    icon: <Users size={22} />, color: '#fe9f00',
    title: 'Full Ownership',
    desc: 'You own the admin key. Mint, freeze, or burn at any time from your wallet.',
  },
  {
    icon: <BarChart3 size={22} />, color: '#f72585',
    title: 'Dashboard Management',
    desc: 'Manage your tokens from the dashboard — update metadata, track holders.',
  },
  {
    icon: <TrendingUp size={22} />, color: '#4cc9f0',
    title: 'DeFi Ready',
    desc: 'Compatible with all Lunes DeFi protocols, wallets and cross-chain bridges.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Configure your token', desc: 'Set name, symbol, decimals, supply and logo.' },
  { step: '02', title: 'Pay emission fee', desc: 'A one-time fee in LUNES — sent directly from your wallet.' },
  { step: '03', title: 'Sign 3 transactions', desc: 'create → setMetadata → mint. All signed from your Polkadot wallet.' },
  { step: '04', title: 'Done! Token is live', desc: 'Listed on Explorer, visible in all wallets, ready to use.' },
];

const DECIMALS_OPTIONS = [0, 2, 6, 8, 10, 12, 18];

type WizardStep = 'landing' | 'configure' | 'review' | 'creating' | 'success';

interface FormData {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  description: string;
  website: string;
  logoUrl: string;
}

const EMPTY_FORM: FormData = {
  name: '', symbol: '', decimals: 8, totalSupply: '1000000',
  description: '', website: '', logoUrl: '',
};

export default function CreateTokenTab({ address }: Props) {
  const { wallet } = useWalletAuth();
  const { config, loading: configLoading } = useTokenEmissionConfig();
  const { state: emissionState, createToken, resetState } = useTokenEmission();
  const { tokens, refetch: refetchTokens } = useMyTokens(address);

  const [wizardStep, setWizardStep] = useState<WizardStep>('landing');
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [assetId, setAssetId] = useState<number | null>(null);
  const [loadingAssetId, setLoadingAssetId] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load next available asset ID when entering configure step
  useEffect(() => {
    if (wizardStep === 'configure' && assetId === null) {
      setLoadingAssetId(true);
      getNextAssetId().then(id => { setAssetId(id); setLoadingAssetId(false); });
    }
  }, [wizardStep, assetId]);

  // Watch emission state changes
  useEffect(() => {
    if (emissionState.step === 'done') {
      setWizardStep('success');
      refetchTokens();
    }
    if (emissionState.step === 'error') {
      setWizardStep('creating');
    }
  }, [emissionState.step]);

  const handleCreate = async () => {
    if (!config || !wallet || !assetId) return;
    const injector = await getInjector();
    if (!injector) return;

    const params: TokenCreateParams = {
      assetId,
      name: form.name,
      symbol: form.symbol,
      decimals: form.decimals,
      totalSupply: form.totalSupply,
      logoUrl: form.logoUrl,
      description: form.description,
      website: form.website,
    };

    setWizardStep('creating');
    await createToken(params, address, injector, config);
  };

  const getInjector = async () => {
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      return await web3FromAddress(address);
    } catch (e: any) {
      alert('Wallet extension not found: ' + e.message);
      return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const restart = () => {
    resetState();
    setForm({ ...EMPTY_FORM });
    setAssetId(null);
    setWizardStep('landing');
  };

  if (configLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading token emission info...</p>
      </div>
    );
  }

  // ── Landing Page ──
  if (wizardStep === 'landing') {
    return (
      <div>
        {/* Hero */}
        <div style={{
          position: 'relative', borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(108,56,255,0.15) 0%, rgba(76,201,240,0.08) 50%, rgba(247,37,133,0.08) 100%)',
          border: '1px solid rgba(108,56,255,0.2)', padding: '48px 40px', marginBottom: 32,
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(108,56,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(76,201,240,0.06)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#6C38FF,#4cc9f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(108,56,255,0.4)' }}>
              <Coins size={32} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(90deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Create Your Token on Lunes
                </h1>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(108,56,255,0.2)', color: 'var(--color-brand-400)', fontSize: 11, fontWeight: 700, border: '1px solid rgba(108,56,255,0.3)' }}>
                  POWERED BY LUNES
                </span>
              </div>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
                Launch your own fungible token on the Lunes blockchain in minutes.
                No coding required — just fill the form, sign 3 transactions, and your token is live.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setWizardStep('configure')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(90deg,#6C38FF,#5228DB)',
                color: 'white', fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(108,56,255,0.4)',
                transition: 'all 0.2s',
              }}
            >
              <Sparkles size={18} /> Create My Token
              <ArrowRight size={16} />
            </button>
            {config && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13 }}>
                <Coins size={14} color="var(--color-brand-400)" />
                <span style={{ color: 'var(--text-muted)' }}>Emission fee:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{config.emissionFee.toLocaleString()} LUNES</strong>
              </div>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="var(--color-brand-400)" /> Why Launch on Lunes?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 36 }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{
              padding: '20px 22px', borderRadius: 14,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${b.color}44`; (e.currentTarget as HTMLDivElement).style.background = `${b.color}08`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${b.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.color, marginBottom: 14 }}>
                {b.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>{b.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={18} color="var(--color-brand-400)" /> How it Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 36 }}>
          {HOW_IT_WORKS.map((h, i) => (
            <div key={h.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(108,56,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--color-brand-400)', flexShrink: 0 }}>
                {h.step}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{h.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{h.desc}</div>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <ChevronRight size={16} color="var(--text-muted)" style={{ marginTop: 10, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>

        {/* Fee info box */}
        {config && (
          <div style={{ padding: '20px 24px', borderRadius: 14, background: 'rgba(108,56,255,0.06)', border: '1px solid rgba(108,56,255,0.15)', marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={16} color="var(--color-brand-400)" /> Token Emission Fee
            </h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>EMISSION FEE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-brand-400)' }}>{config.emissionFee.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>LUNES</span></div>
              </div>
              {config.receiverAddress && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>RECEIVER</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {config.receiverAddress.slice(0, 12)}...{config.receiverAddress.slice(-6)}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>MIN SUPPLY</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{config.minSupply.toLocaleString()}</div>
              </div>
              {config.maxSupply > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>MAX SUPPLY</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{config.maxSupply.toLocaleString()}</div>
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '12px 0 0', lineHeight: 1.5 }}>
              <Lock size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
              The emission fee is paid directly from your wallet to the Lunes team via blockchain transaction. This covers infrastructure costs, explorer listing, and ongoing network support.
            </p>
          </div>
        )}

        {/* My tokens table */}
        {tokens.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={16} /> My Created Tokens
            </h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Symbol</th>
                  <th>Asset ID</th>
                  <th>Supply</th>
                  <th>Status</th>
                  <th>Explorer</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(108,56,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-brand-400)' }}>
                            {t.symbol?.charAt(0)}
                          </div>
                        )}
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 12 }}>{t.symbol}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{t.assetId}</td>
                    <td style={{ fontSize: 12 }}>{Number(t.totalSupply).toLocaleString()}</td>
                    <td>
                      {t.onChainConfirmed
                        ? <span className={styles.badgeVerified}>Live</span>
                        : <span className={styles.badgePending}>Pending</span>}
                    </td>
                    <td>
                      <Link to={`/tokens/${t.assetId}`} style={{ color: 'var(--color-brand-400)', textDecoration: 'none', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        View <ExternalLink size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => setWizardStep('configure')}
            style={{ padding: '14px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg,#6C38FF,#5228DB)', color: 'white', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 20px rgba(108,56,255,0.3)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Sparkles size={18} /> Launch Your Token Now
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── Configure Step ──
  if (wizardStep === 'configure') {
    const isValid = form.name.trim().length >= 2 && form.symbol.trim().length >= 2
      && Number(form.totalSupply) > 0 && assetId !== null;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setWizardStep('landing')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Configure Your Token</h2>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Step 1 of 2</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Asset ID */}
            <div>
              <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Asset ID (auto-assigned)
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>— next available on-chain</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className={styles.formInput}
                  value={loadingAssetId ? 'Checking chain...' : (assetId ?? '')}
                  readOnly
                  style={{ opacity: 0.7, cursor: 'not-allowed', flex: 1 }}
                />
                {loadingAssetId && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)', flexShrink: 0 }} />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
                Asset IDs are assigned by the chain. You can override if needed.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token Name *</label>
                <input className={styles.formInput} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Awesome Token" maxLength={32} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Symbol *</label>
                <input className={styles.formInput} value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} placeholder="MAT" maxLength={8} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Decimals</label>
                <select className={styles.formSelect} value={form.decimals} onChange={e => setForm({ ...form, decimals: Number(e.target.value) })}>
                  {DECIMALS_OPTIONS.map(d => <option key={d} value={d}>{d} {d === 8 ? '(recommended, like LUNES)' : ''}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Total Supply *</label>
                <input className={styles.formInput} type="number" value={form.totalSupply} onChange={e => setForm({ ...form, totalSupply: e.target.value })} placeholder="1000000" min={config?.minSupply || 1} />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Logo</label>
                <ImageUpload
                  label="Token logo (PNG, SVG, 200x200)"
                  value={form.logoUrl}
                  onChange={url => setForm({ ...form, logoUrl: url })}
                  placeholder="https://..."
                />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is your token for?" rows={2} />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Website</label>
                <input className={styles.formInput} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://myproject.io" />
              </div>
            </div>

            <button
              onClick={() => setWizardStep('review')}
              disabled={!isValid}
              style={{
                padding: '14px 0', borderRadius: 12, border: 'none', cursor: isValid ? 'pointer' : 'not-allowed',
                background: isValid ? 'linear-gradient(90deg,#6C38FF,#5228DB)' : 'rgba(255,255,255,0.06)',
                color: isValid ? 'white' : 'var(--text-muted)', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Review & Confirm <ArrowRight size={16} />
            </button>
          </div>

          {/* Preview */}
          <div style={{ position: 'sticky', top: 100 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Preview</h3>
            <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#6C38FF,#4cc9f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white' }}>
                    {form.symbol.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{form.name || 'Token Name'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{form.symbol || 'SYM'} · Asset #{assetId ?? '?'}</div>
                </div>
              </div>
              {[
                ['Total Supply', Number(form.totalSupply || 0).toLocaleString() + ' ' + (form.symbol || 'TKN')],
                ['Decimals', form.decimals],
                ['Owner', `${address.slice(0, 8)}...${address.slice(-4)}`],
                ['Emission Fee', config ? `${config.emissionFee.toLocaleString()} LUNES` : '...'],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value as string}</span>
                </div>
              ))}
              {form.description && (
                <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '14px 0 0' }}>
                  {form.description}
                </p>
              )}
            </div>

            <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: 'rgba(254,159,0,0.06)', border: '1px solid rgba(254,159,0,0.15)', fontSize: 12, color: '#fe9f00', display: 'flex', gap: 8 }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>You will sign <strong>3–4 transactions</strong>: fee payment, asset.create, setMetadata, and mint. Make sure you have enough LUNES for fees + emission cost.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Review Step ──
  if (wizardStep === 'review') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setWizardStep('configure')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>← Edit</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Review & Confirm</h2>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Step 2 of 2</span>
        </div>

        <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand-400)', margin: '0 0 16px' }}>Token Details</h3>
          {[
            ['Asset ID', `#${assetId}`],
            ['Name', form.name],
            ['Symbol', form.symbol],
            ['Decimals', form.decimals],
            ['Total Supply', `${Number(form.totalSupply).toLocaleString()} ${form.symbol}`],
            ['Owner / Admin', `${address.slice(0, 16)}...${address.slice(-6)}`],
            ['Website', form.website || '—'],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value as string}</span>
            </div>
          ))}
        </div>

        {config && config.emissionFee > 0 && (
          <div style={{ padding: 20, borderRadius: 14, background: 'rgba(108,56,255,0.06)', border: '1px solid rgba(108,56,255,0.2)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand-400)', margin: '0 0 12px' }}>Emission Fee</h3>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              {config.emissionFee.toLocaleString()} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>LUNES</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Sent to: <code style={{ fontSize: 11 }}>{config.receiverAddress?.slice(0, 20)}...</code>
            </div>
          </div>
        )}

        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(38,208,124,0.06)', border: '1px solid rgba(38,208,124,0.15)', marginBottom: 24, fontSize: 13, color: '#26d07c', display: 'flex', gap: 8 }}>
          <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>By confirming, you'll sign {config?.emissionFee ? '4' : '3'} transactions with your wallet. Each tx needs a few seconds to be included in a block.</div>
        </div>

        <button
          onClick={handleCreate}
          style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(90deg,#6C38FF,#5228DB)', color: 'white', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(108,56,255,0.3)' }}
        >
          <Sparkles size={18} /> Confirm & Create Token
        </button>
      </div>
    );
  }

  // ── Creating Step ──
  if (wizardStep === 'creating') {
    const STEP_LABELS: Record<string, string> = {
      idle: 'Preparing...',
      fee_payment: 'Step 1/4 — Paying emission fee...',
      creating_asset: 'Step 2/4 — Creating asset on-chain...',
      setting_metadata: 'Step 3/4 — Setting token metadata...',
      minting: 'Step 4/4 — Minting initial supply...',
      registering: 'Registering on explorer...',
      done: 'Done!',
      error: 'Error',
    };

    return (
      <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
        {emissionState.step !== 'error' ? (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(108,56,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Loader2 size={36} color="var(--color-brand-400)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Creating Your Token</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{STEP_LABELS[emissionState.step] || 'Processing...'}</p>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#6C38FF,#4cc9f0)', width: `${emissionState.progress}%`, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Please sign wallet prompts as they appear. Do not close this tab.</p>
          </>
        ) : (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,77,106,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertCircle size={36} color="#ff4d6a" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#ff4d6a' }}>Creation Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>{emissionState.error}</p>
            <button onClick={restart} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(108,56,255,0.15)', color: 'var(--color-brand-400)', fontSize: 14, fontWeight: 600 }}>
              Try Again
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Success Step ──
  if (wizardStep === 'success') {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(38,208,124,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'pulse 2s infinite' }}>
          <CheckCircle size={40} color="#26d07c" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>🎉 Token Created!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{form.name} ({form.symbol})</strong> is now live on the Lunes blockchain.
        </p>

        <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', marginBottom: 24 }}>
          {[
            ['Asset ID', `#${assetId}`],
            ['Name', form.name],
            ['Symbol', form.symbol],
            ['Total Supply', `${Number(form.totalSupply).toLocaleString()} ${form.symbol}`],
            ['Decimals', form.decimals],
          ].map(([label, value]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 700 }}>{value as string}</span>
            </div>
          ))}
          {emissionState.txHash && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Fee Tx Hash</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontSize: 11 }}>{emissionState.txHash.slice(0, 16)}...</code>
                <button onClick={() => copyToClipboard(emissionState.txHash!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brand-400)', padding: 0 }}>
                  {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`/tokens/${assetId}`}
            style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(90deg,#6C38FF,#5228DB)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ExternalLink size={15} /> View on Explorer
          </Link>
          <button
            onClick={restart}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}
          >
            Create Another Token
          </button>
        </div>
      </div>
    );
  }

  return null;
}
