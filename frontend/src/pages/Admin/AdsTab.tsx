import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2, Save, X, DollarSign, Settings, Users, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

interface Ad {
  id: string; title: string; description: string; ctaText: string; ctaUrl: string;
  imageUrl?: string; placement: string; isActive: boolean; priority: number;
  impressions: number; clicks: number; startDate?: string; endDate?: string;
  createdAt: string; updatedAt: string;
  advertiserAddress?: string; advertiserName?: string; advertiserEmail?: string;
  status: string; paidAmount?: number; purchasedImpressions?: number;
  paymentTxHash?: string; reviewNotes?: string; rejectionReason?: string;
}

interface Pricing {
  costPer1000Impressions: number; minImpressions: number; maxImpressions: number;
  paymentWallet: string; autoApprove: boolean; allowedPlacements: string[];
}

interface Advertiser {
  address: string; name: string; email: string; totalSpent: number;
  totalAds: number; totalImpressions: number; createdAt: string;
}

const PL = [
  { value: 'home_stats', label: 'Home Stats' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'global', label: 'Global' },
];

const IS: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
  color: 'white', boxSizing: 'border-box',
};

const EF = {
  title: '', description: '', ctaText: 'Get Started →', ctaUrl: '',
  imageUrl: '', placement: 'home_stats', isActive: true, priority: 0,
  startDate: '', endDate: '',
};

type SubTab = 'ads' | 'pricing' | 'review' | 'advertisers';

const STATUS_COLORS: Record<string, string> = {
  active: '#26d07c', approved: '#26d07c', pending_payment: '#f5a623',
  pending_review: '#6c38ff', rejected: '#ff284c', expired: '#666',
};

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

export default function AdsTab() {
  const { token } = useAdminAuth();
  const [subTab, setSubTab] = useState<SubTab>('ads');
  const [ads, setAds] = useState<Ad[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fb, setFb] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [form, setForm] = useState(EF);
  const [pricingForm, setPricingForm] = useState<Pricing | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    try {
      const [adsR, pricingR, advR] = await Promise.all([
        fetch(`${API}/admin/ads`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/ads/pricing`),
        fetch(`${API}/admin/advertisers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const adsD = await adsR.json(); if (Array.isArray(adsD)) setAds(adsD);
      const pD = await pricingR.json(); setPricingForm(pD);
      const aD = await advR.json(); if (Array.isArray(aD)) setAdvertisers(aD);
    } catch { /* */ } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(EF); setEditing(null); setCreating(false); };

  const startEdit = (ad: Ad) => {
    setEditing(ad); setCreating(false);
    setForm({ title: ad.title, description: ad.description || '', ctaText: ad.ctaText || '',
      ctaUrl: ad.ctaUrl || '', imageUrl: ad.imageUrl || '', placement: ad.placement || 'home_stats',
      isActive: ad.isActive, priority: ad.priority || 0,
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : '' });
  };

  const handleSave = async () => {
    if (!form.title || !form.ctaUrl) { setFb({ type: 'error', msg: 'Title and URL are required' }); return; }
    setSaving(true); setFb(null);
    try {
      const url = editing ? `${API}/admin/ads/${editing.id}` : `${API}/admin/ads`;
      const r = await fetch(url, { method: editing ? 'PUT' : 'POST', headers,
        body: JSON.stringify({ ...form, priority: Number(form.priority) || 0,
          startDate: form.startDate || undefined, endDate: form.endDate || undefined }) });
      if (r.ok) { setFb({ type: 'success', msg: editing ? 'Updated' : 'Created' }); reset(); load(); }
      else { const e = await r.json(); setFb({ type: 'error', msg: e.error || 'Error' }); }
    } catch { setFb({ type: 'error', msg: 'Network error' }); }
    finally { setSaving(false); }
  };

  const handleDel = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try { await fetch(`${API}/admin/ads/${id}`, { method: 'DELETE', headers }); setFb({ type: 'success', msg: 'Deleted' }); load(); }
    catch { setFb({ type: 'error', msg: 'Error' }); }
  };

  const handleToggle = async (ad: Ad) => {
    try { await fetch(`${API}/admin/ads/${ad.id}`, { method: 'PUT', headers,
      body: JSON.stringify({ isActive: !ad.isActive }) }); load(); } catch { /* */ }
  };

  const handleReview = async (adId: string, decision: 'approved' | 'rejected') => {
    const notes = decision === 'rejected' ? prompt('Rejection reason (optional):') || '' : '';
    try {
      const r = await fetch(`${API}/admin/ads/${adId}/review`, { method: 'PUT', headers,
        body: JSON.stringify({ decision, notes }) });
      if (r.ok) { setFb({ type: 'success', msg: `Ad ${decision}` }); load(); }
      else { setFb({ type: 'error', msg: 'Failed to review ad' }); }
    } catch { setFb({ type: 'error', msg: 'Network error' }); }
  };

  const handleSavePricing = async () => {
    if (!pricingForm) return;
    setSavingPricing(true); setFb(null);
    try {
      const r = await fetch(`${API}/admin/ads/pricing`, { method: 'PUT', headers,
        body: JSON.stringify(pricingForm) });
      if (r.ok) { setFb({ type: 'success', msg: 'Pricing updated' }); load(); }
      else { setFb({ type: 'error', msg: 'Failed to update pricing' }); }
    } catch { setFb({ type: 'error', msg: 'Network error' }); }
    finally { setSavingPricing(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" /></div>;

  const ok = fb?.type === 'success';
  const pendingReview = ads.filter(a => a.status === 'pending_review');
  const totalRevenue = ads.filter(a => a.paidAmount).reduce((s, a) => s + (a.paidAmount || 0), 0);

  return (<div>
    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
      {[{ l: 'Total Ads', v: ads.length }, { l: 'Active', v: ads.filter(a => a.isActive).length },
        { l: 'Pending Review', v: pendingReview.length, c: pendingReview.length > 0 ? '#f5a623' : undefined },
        { l: 'Revenue (LUNES)', v: totalRevenue.toLocaleString(), c: '#26d07c' }].map((s, i) => (
        <div key={i} style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{s.l}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: (s as any).c || 'white' }}>{s.v}</div>
        </div>))}
    </div>

    {/* Sub-tabs */}
    <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
      {([['ads', 'All Ads', ads.length], ['review', 'Pending Review', pendingReview.length], ['pricing', 'Pricing', null], ['advertisers', 'Advertisers', advertisers.length]] as const).map(([k, l, c]) => (
        <button key={k} onClick={() => setSubTab(k as SubTab)}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: subTab === k ? '#6c38ff' : 'transparent', color: subTab === k ? 'white' : 'var(--text-muted)' }}>
          {k === 'pricing' && <Settings size={14} />}
          {k === 'advertisers' && <Users size={14} />}
          {k === 'review' && <Clock size={14} />}
          {l} {c !== null && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 10, fontSize: 11 }}>{c}</span>}
        </button>))}
    </div>

    {/* Feedback */}
    {fb && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
      background: ok ? 'rgba(38,208,124,0.08)' : 'rgba(255,40,76,0.08)',
      border: ok ? '1px solid rgba(38,208,124,0.2)' : '1px solid rgba(255,40,76,0.2)',
      color: ok ? '#26d07c' : '#ff284c' }}>
      {ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {fb.msg}
    </div>}

    {/* Pricing Tab */}
    {subTab === 'pricing' && pricingForm && (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={18} /> Ad Pricing Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Cost per 1,000 Impressions (LUNES)</label>
            <input type="number" value={pricingForm.costPer1000Impressions} onChange={e => setPricingForm(p => p ? { ...p, costPer1000Impressions: Number(e.target.value) } : p)} style={IS} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Payment Wallet</label>
            <input value={pricingForm.paymentWallet} onChange={e => setPricingForm(p => p ? { ...p, paymentWallet: e.target.value } : p)} style={IS} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Min Impressions</label>
            <input type="number" value={pricingForm.minImpressions} onChange={e => setPricingForm(p => p ? { ...p, minImpressions: Number(e.target.value) } : p)} style={IS} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Max Impressions</label>
            <input type="number" value={pricingForm.maxImpressions} onChange={e => setPricingForm(p => p ? { ...p, maxImpressions: Number(e.target.value) } : p)} style={IS} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={pricingForm.autoApprove} onChange={e => setPricingForm(p => p ? { ...p, autoApprove: e.target.checked } : p)} />
            Auto-approve paid ads (skip manual review)
          </label>
          <button onClick={handleSavePricing} disabled={savingPricing}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6c38ff', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: savingPricing ? 0.6 : 1 }}>
            {savingPricing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Pricing
          </button>
        </div>
        <div style={{ marginTop: 20, padding: 16, background: 'rgba(108,56,255,0.1)', borderRadius: 8, border: '1px solid rgba(108,56,255,0.2)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Pricing Example:</div>
          <div style={{ fontSize: 14, color: 'white' }}>
            10,000 impressions = <strong style={{ color: '#26d07c' }}>{(10000 / 1000 * pricingForm.costPer1000Impressions).toLocaleString()} LUNES</strong>
          </div>
        </div>
      </div>
    )}

    {/* Pending Review Tab */}
    {subTab === 'review' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pendingReview.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            <CheckCircle size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>No ads pending review</div>
          </div>
        ) : pendingReview.map(ad => (
          <div key={ad.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,56,255,0.3)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>{ad.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{ad.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#26d07c' }}>{ad.paidAmount?.toLocaleString()} LUNES</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ad.purchasedImpressions?.toLocaleString()} impressions</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              <div><strong>Advertiser:</strong> {ad.advertiserName}</div>
              <div><strong>Email:</strong> {ad.advertiserEmail}</div>
              <div><strong>Wallet:</strong> {shortAddr(ad.advertiserAddress || '')}</div>
              <div><strong>CTA URL:</strong> <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6c38ff' }}>{ad.ctaUrl}</a></div>
              <div><strong>Placement:</strong> {ad.placement}</div>
              <div><strong>Tx Hash:</strong> {shortAddr(ad.paymentTxHash || '')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleReview(ad.id, 'approved')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#26d07c', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                <ThumbsUp size={14} /> Approve
              </button>
              <button onClick={() => handleReview(ad.id, 'rejected')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#ff284c', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                <ThumbsDown size={14} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Advertisers Tab */}
    {subTab === 'advertisers' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {advertisers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div>No advertisers yet</div>
          </div>
        ) : advertisers.map(adv => (
          <div key={adv.address} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6c38ff, #26d07c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16 }}>
              {adv.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{adv.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{adv.email} · {shortAddr(adv.address)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#26d07c' }}>{adv.totalSpent.toLocaleString()} LUNES</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{adv.totalAds} ads</div>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Ads Tab */}
    {subTab === 'ads' && (<>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>All Advertisements</h2>
        </div>
        <button onClick={() => { reset(); setCreating(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6c38ff', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          <Plus size={16} /> New Ad
        </button>
      </div>

      {(creating || editing) && <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>{editing ? 'Edit' : 'Create'} Ad</h3>
          <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={IS} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CTA URL *</label>
            <input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} style={IS} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={IS} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Button Text</label>
            <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} style={IS} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Placement</label>
            <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))} style={IS}>
              {PL.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Priority</label>
            <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} style={IS} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={IS} /></div>
          <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>End Date</label>
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={IS} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active
          </label>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6c38ff', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ads.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>No ads yet.</div> :
          ads.map(ad => (
            <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: ad.isActive ? 1 : 0.6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[ad.status] || '#666', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.title}</span>
                  {ad.advertiserName && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(108,56,255,0.2)', color: '#a78bfa' }}>Self-service</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {ad.placement} · {ad.impressions} imp · {ad.clicks} clicks · {ad.status}
                  {ad.paidAmount ? ` · ${ad.paidAmount} LUNES` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleToggle(ad)} style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: ad.isActive ? '#26d07c' : 'var(--text-muted)', cursor: 'pointer' }}>
                  {ad.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => startEdit(ad)} style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6c38ff', cursor: 'pointer' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDel(ad.id)} style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#ff284c', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>))}
      </div>
    </>)}
  </div>);
}
