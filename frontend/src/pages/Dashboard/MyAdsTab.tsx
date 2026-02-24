import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Plus, Eye, MousePointerClick, DollarSign, Clock,
  CheckCircle, XCircle, Loader2, ArrowLeft, Send,
  RefreshCw, ExternalLink, Target, BarChart3,
} from 'lucide-react';
import { API_BASE_URL, WS_ENDPOINTS } from '../../config';

interface Ad {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  placement: string;
  status: 'active' | 'pending_payment' | 'pending_review' | 'approved' | 'rejected' | 'expired';
  impressions: number;
  clicks: number;
  purchasedImpressions?: number;
  paidAmount?: number;
  paymentTxHash?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

interface Pricing {
  costPer1000Impressions: number;
  minImpressions: number;
  maxImpressions: number;
  paymentWallet: string;
  autoApprove: boolean;
  allowedPlacements: string[];
}

interface AdForm {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  placement: string;
  impressions: number;
  advertiserName: string;
  advertiserEmail: string;
}

const PLACEMENTS = [
  { value: 'home_stats', label: 'Home Page Stats', desc: 'Premium spot on the homepage' },
  { value: 'sidebar', label: 'Sidebar', desc: 'Visible on all explorer pages' },
  { value: 'global', label: 'Global Banner', desc: 'Top banner on every page' },
];

const INITIAL_FORM: AdForm = {
  title: '',
  description: '',
  ctaText: 'Learn More →',
  ctaUrl: '',
  placement: 'home_stats',
  impressions: 10000,
  advertiserName: '',
  advertiserEmail: '',
};

const IS: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
  color: 'white', boxSizing: 'border-box', outline: 'none',
};

const STATUS_META: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  active:          { color: '#26d07c', icon: <CheckCircle size={13} />, label: 'Active' },
  approved:        { color: '#26d07c', icon: <CheckCircle size={13} />, label: 'Approved' },
  pending_payment: { color: '#f5a623', icon: <Clock size={13} />,       label: 'Awaiting Payment' },
  pending_review:  { color: '#6c38ff', icon: <Clock size={13} />,       label: 'Under Review' },
  rejected:        { color: '#ff284c', icon: <XCircle size={13} />,     label: 'Rejected' },
  expired:         { color: '#666',    icon: <Clock size={13} />,        label: 'Expired' },
};

type View = 'list' | 'create' | 'payment' | 'success';

interface Props { address: string }

export default function MyAdsTab({ address }: Props) {
  const [view, setView] = useState<View>('list');
  const [ads, setAds] = useState<Ad[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [form, setForm] = useState<AdForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [createdAdId, setCreatedAdId] = useState('');
  const [txHash, setTxHash] = useState('');
  // pendingAdCost: the exact LUNES amount to pay (from ad.paidAmount when resuming, or calculated when new)
  const [pendingAdCost, setPendingAdCost] = useState(0);
  // pendingAdImpressions: purchasedImpressions of the existing ad being resumed
  const [pendingAdImpressions, setPendingAdImpressions] = useState(0);
  // pendingFromList: true when user clicked "Complete Payment" on an existing ad (back → list)
  const [pendingFromList, setPendingFromList] = useState(false);

  const loadAds = useCallback(async () => {
    if (!address) return;
    setLoadingAds(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ads/my/${address}`);
      if (res.ok) setAds(await res.json());
    } catch { /* silent */ } finally { setLoadingAds(false); }
  }, [address]);

  const loadPricing = useCallback(async () => {
    setLoadingPricing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ads/pricing`);
      if (res.ok) setPricing(await res.json());
    } catch { /* silent */ } finally { setLoadingPricing(false); }
  }, []);

  useEffect(() => { loadAds(); loadPricing(); }, [loadAds, loadPricing]);

  // Reload pricing whenever user enters create view to pick up admin changes
  useEffect(() => { if (view === 'create') loadPricing(); }, [view, loadPricing]);

  // cost for NEW campaigns (from form); pendingAdCost is used when resuming an existing ad
  const newCampaignCost = pricing ? Math.ceil((form.impressions / 1000) * pricing.costPer1000Impressions) : 0;
  // The actual amount to send in the payment view
  const cost = pendingFromList ? pendingAdCost : newCampaignCost;

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.ctaUrl.trim()) return setError('CTA URL is required.');
    if (!form.advertiserName.trim()) return setError('Your name is required.');
    if (!form.advertiserEmail.trim()) return setError('Your email is required.');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ads/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchasedImpressions: form.impressions,
          advertiserAddress: address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setCreatedAdId(data.id);
      setPendingAdCost(Math.ceil((form.impressions / 1000) * (pricing?.costPer1000Impressions ?? 50)));
      setPendingFromList(false);
      setView('payment');
    } catch (e: any) {
      setError(e.message);
    } finally { setSubmitting(false); }
  };

  const handlePay = async () => {
    if (!pricing) return;
    setError('');
    setPaying(true);
    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const provider = new WsProvider(WS_ENDPOINTS);
      const api = await ApiPromise.create({ provider });
      const injector = await web3FromAddress(address);
      const amountRaw = BigInt(Math.round(cost * 1e8));
      const tx = api.tx.balances.transferKeepAlive(pricing.paymentWallet, amountRaw);
      const hash = await new Promise<string>((resolve, reject) => {
        let settled = false;
        tx.signAndSend(address, { signer: injector.signer }, ({ status, dispatchError }) => {
          if (settled) return;
          if (dispatchError) {
            settled = true;
            reject(new Error(dispatchError.isModule
              ? api.registry.findMetaError(dispatchError.asModule).docs.join(' ')
              : dispatchError.toString()));
            return;
          }
          if (status.isInBlock) {
            settled = true;
            resolve(status.asInBlock.toString());
          }
        }).catch((e: Error) => { if (!settled) { settled = true; reject(e); } });
      });
      await provider.disconnect();
      const confirmRes = await fetch(`${API_BASE_URL}/ads/${createdAdId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: hash }),
      });
      if (!confirmRes.ok) throw new Error('Payment confirmation failed');
      setTxHash(hash);
      setView('success');
      loadAds();
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  const resetToList = () => {
    setView('list'); setForm(INITIAL_FORM);
    setCreatedAdId(''); setTxHash(''); setError('');
    setPendingAdCost(0); setPendingAdImpressions(0); setPendingFromList(false);
  };

  // ─────────────────────── VIEWS ───────────────────────

  if (view === 'success') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(38,208,124,0.15)', border: '2px solid #26d07c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={36} color="#26d07c" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Payment Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
          Your ad campaign is now under review. You'll see it listed below once approved.
        </p>
        {txHash && (
          <p style={{ fontSize: 11, color: '#26d07c', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(38,208,124,0.08)', padding: '8px 12px', borderRadius: 8, marginBottom: 20 }}>
            Tx: {txHash}
          </p>
        )}
        <button onClick={resetToList} style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--color-brand-400, #6c38ff)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          View My Campaigns
        </button>
      </div>
    );
  }

  if (view === 'payment') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <button onClick={() => pendingFromList ? resetToList() : setView('create')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13 }}>
          <ArrowLeft size={14} /> {pendingFromList ? 'Back to My Ads' : 'Back'}
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Complete Payment</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Send exactly <strong style={{ color: 'white' }}>{cost.toLocaleString()} LUNES</strong> to activate your campaign.
        </p>
        <div style={{ background: 'rgba(108,56,255,0.08)', border: '1px solid rgba(108,56,255,0.2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Payment destination</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'white', wordBreak: 'break-all' }}>{pricing?.paymentWallet}</div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount</span>
            <span style={{ fontWeight: 700, color: '#f5a623' }}>{cost.toLocaleString()} LUNES</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Impressions</span>
            <span style={{ fontWeight: 600, color: 'white' }}>{(pendingFromList ? pendingAdImpressions : form.impressions).toLocaleString()}</span>
          </div>
        </div>
        {error && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,40,76,0.1)', color: '#ff284c', fontSize: 13 }}>{error}</div>}
        <button onClick={handlePay} disabled={paying} style={{ width: '100%', padding: '12px', borderRadius: 10, background: paying ? '#333' : 'var(--color-brand-400, #6c38ff)', border: 'none', color: 'white', fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {paying ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : <><Send size={16} /> Pay {cost.toLocaleString()} LUNES</>}
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>Your wallet extension will prompt you to sign the transaction.</p>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <button onClick={resetToList} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to My Ads
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create Campaign</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Fill in the details below. After submission you'll pay with LUNES from your wallet.</p>
        {loadingPricing ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : (
          <>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-brand-400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Your Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Name *</label>
                  <input style={IS} value={form.advertiserName} onChange={e => setForm(p => ({ ...p, advertiserName: e.target.value }))} placeholder="Your name or company" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Email *</label>
                  <input style={IS} type="email" value={form.advertiserEmail} onChange={e => setForm(p => ({ ...p, advertiserEmail: e.target.value }))} placeholder="contact@example.com" />
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-brand-400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Ad Content</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
                  <input style={IS} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Catchy headline (max 60 chars)" maxLength={60} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Description</label>
                    <span style={{ fontSize: 11, color: form.description.length >= 110 ? '#ff284c' : 'var(--text-muted)' }}>
                      {form.description.length}/120
                    </span>
                  </div>
                  <textarea style={{ ...IS, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description of your project or offer" rows={2} maxLength={120} />
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    By submitting, you agree to our{' '}
                    <a href="/advertise/policies" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
                      Ad Policies
                    </a>
                    . We do not accept pornography, scams, or illegal content.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CTA Button Text</label>
                    <input style={IS} value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} placeholder="Learn More →" maxLength={30} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CTA URL *</label>
                    <input style={IS} type="url" value={form.ctaUrl} onChange={e => setForm(p => ({ ...p, ctaUrl: e.target.value }))} placeholder="https://yourproject.io" />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-brand-400)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Placement & Budget</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Placement</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {PLACEMENTS.filter(p => !pricing || pricing.allowedPlacements.includes(p.value)).map(p => (
                      <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `1px solid ${form.placement === p.value ? 'rgba(108,56,255,0.5)' : 'rgba(255,255,255,0.06)'}`, background: form.placement === p.value ? 'rgba(108,56,255,0.1)' : 'transparent', cursor: 'pointer' }}>
                        <input type="radio" name="placement" value={p.value} checked={form.placement === p.value} onChange={() => setForm(prev => ({ ...prev, placement: p.value }))} style={{ accentColor: '#6c38ff' }} />
                        <div>
                          <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{p.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Impressions: <strong style={{ color: 'white' }}>{form.impressions.toLocaleString()}</strong></label>
                  <input type="range" min={pricing?.minImpressions ?? 1000} max={pricing?.maxImpressions ?? 1000000} step={1000} value={form.impressions} onChange={e => setForm(p => ({ ...p, impressions: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#6c38ff' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span>{(pricing?.minImpressions ?? 1000).toLocaleString()}</span>
                    <span>{(pricing?.maxImpressions ?? 1000000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 12, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Cost</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f5a623' }}>{cost.toLocaleString()} <span style={{ fontSize: 14 }}>LUNES</span></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pricing?.costPer1000Impressions} LUNES / 1,000 impressions</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Impressions</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{form.impressions.toLocaleString()}</div>
              </div>
            </div>
            {error && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,40,76,0.1)', color: '#ff284c', fontSize: 13 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '12px', borderRadius: 10, background: submitting ? '#333' : 'var(--color-brand-400, #6c38ff)', border: 'none', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <>Continue to Payment →</>}
            </button>
          </>
        )}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={20} color="var(--color-brand-400)" /> My Ad Campaigns
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>Manage your sponsored placements on Lunes Explorer.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAds} title="Refresh" style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => { setView('create'); setError(''); setForm(INITIAL_FORM); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--color-brand-400, #6c38ff)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            <Plus size={15} /> New Campaign
          </button>
        </div>
      </div>
      {pricing && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { icon: <DollarSign size={14} />, label: 'Rate', value: `${pricing.costPer1000Impressions} LUNES / 1K impressions` },
            { icon: <Eye size={14} />, label: 'Min impressions', value: pricing.minImpressions.toLocaleString() },
            { icon: <Target size={14} />, label: 'Max impressions', value: pricing.maxImpressions.toLocaleString() },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(108,56,255,0.07)', border: '1px solid rgba(108,56,255,0.15)', fontSize: 12, color: 'var(--text-secondary)' }}>
              {item.icon} <span style={{ color: 'var(--text-muted)' }}>{item.label}:</span> <strong style={{ color: 'white' }}>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
      {loadingAds ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <div style={{ fontSize: 13 }}>Loading campaigns…</div>
        </div>
      ) : ads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Megaphone size={48} color="rgba(108,56,255,0.3)" style={{ marginBottom: 16 }} />
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 8 }}>No campaigns yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Promote your project to thousands of Lunes Explorer users.</p>
          <button onClick={() => { setView('create'); setError(''); setForm(INITIAL_FORM); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'var(--color-brand-400, #6c38ff)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            <Plus size={16} /> Create Your First Campaign
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ads.map(ad => {
            const meta = STATUS_META[ad.status] ?? STATUS_META.expired;
            const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
            const progress = ad.purchasedImpressions ? Math.min(100, (ad.impressions / ad.purchasedImpressions) * 100) : 0;
            return (
              <div key={ad.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{ad.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ad.ctaUrl.replace(/^https?:\/\//, '').slice(0, 50)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: `${meta.color}20`, color: meta.color, fontSize: 12, fontWeight: 600 }}>
                    {meta.icon} {meta.label}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 10 }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}><Eye size={11} /> Impressions</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{ad.impressions.toLocaleString()}</div>
                    {ad.purchasedImpressions && (
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>of {ad.purchasedImpressions.toLocaleString()}</div>
                    )}
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}><MousePointerClick size={11} /> Clicks</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{ad.clicks.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}><BarChart3 size={11} /> CTR</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{ctr}%</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}><DollarSign size={11} /> Paid</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f5a623' }}>{ad.paidAmount ?? 0} <span style={{ fontSize: 10 }}>LUNES</span></div>
                  </div>
                </div>
                {ad.purchasedImpressions && ad.status === 'active' && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}% delivered</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ width: `${progress}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #6c38ff, #26d07c)' }} />
                    </div>
                  </div>
                )}
                {ad.status === 'pending_payment' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setCreatedAdId(ad.id); setPendingAdCost(ad.paidAmount ?? 0); setPendingAdImpressions(ad.purchasedImpressions ?? 0); setPendingFromList(true); setError(''); setView('payment'); }} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#f5a623', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                      Complete Payment
                    </button>
                  </div>
                )}
                {ad.rejectionReason && (
                  <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,40,76,0.1)', border: '1px solid rgba(255,40,76,0.2)', fontSize: 12, color: '#ff284c' }}>
                    <strong>Rejected:</strong> {ad.rejectionReason}
                  </div>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={11} /> {PLACEMENTS.find(p => p.value === ad.placement)?.label || ad.placement}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {new Date(ad.createdAt).toLocaleDateString()}</span>
                  {ad.ctaUrl && <a href={ad.ctaUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-400)', display: 'flex', alignItems: 'center', gap: 2 }}><ExternalLink size={11} /> Visit URL</a>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
