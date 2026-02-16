import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit3, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

interface Ad {
  id: string; title: string; description: string; ctaText: string; ctaUrl: string;
  imageUrl?: string; placement: string; isActive: boolean; priority: number;
  impressions: number; clicks: number; startDate?: string; endDate?: string;
  createdAt: string; updatedAt: string;
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

export default function AdsTab() {
  const { token } = useAdminAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fb, setFb] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [form, setForm] = useState(EF);

  const load = useCallback(async () => {
    try { const r = await fetch(`${API}/admin/ads`, { headers: { Authorization: `Bearer ${token}` } }); const d = await r.json(); if (Array.isArray(d)) setAds(d); }
    catch { /* */ } finally { setLoading(false); }
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
    if (!form.title || !form.ctaUrl) { setFb({ type: 'error', msg: 'Título e URL obrigatórios' }); return; }
    setSaving(true); setFb(null);
    try {
      const url = editing ? `${API}/admin/ads/${editing.id}` : `${API}/admin/ads`;
      const r = await fetch(url, { method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, priority: Number(form.priority) || 0,
          startDate: form.startDate || undefined, endDate: form.endDate || undefined }) });
      if (r.ok) { setFb({ type: 'success', msg: editing ? 'Atualizado' : 'Criado' }); reset(); load(); }
      else { const e = await r.json(); setFb({ type: 'error', msg: e.error || 'Erro' }); }
    } catch { setFb({ type: 'error', msg: 'Erro de rede' }); }
    finally { setSaving(false); }
  };

  const handleDel = async (id: string) => {
    if (!confirm('Excluir?')) return;
    try { await fetch(`${API}/admin/ads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); setFb({ type: 'success', msg: 'Excluído' }); load(); }
    catch { setFb({ type: 'error', msg: 'Erro' }); }
  };

  const handleToggle = async (ad: Ad) => {
    try { await fetch(`${API}/admin/ads/${ad.id}`, { method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !ad.isActive }) }); load(); } catch { /* */ }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} /></div>;

  const ok = fb?.type === 'success';

  return (<div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
      {[{ l: 'Total', v: ads.length }, { l: 'Ativos', v: ads.filter(a => a.isActive).length },
        { l: 'Impressões', v: ads.reduce((s, a) => s + a.impressions, 0) },
        { l: 'Cliques', v: ads.reduce((s, a) => s + a.clicks, 0) }].map((s, i) => (
        <div key={i} style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{s.l}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{s.v}</div>
        </div>))}
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Gerenciamento de Ads</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Anúncios promocionais do explorer</p>
      </div>
      <button onClick={() => { reset(); setCreating(true); }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6c38ff', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
        <Plus size={16} /> Novo Anúncio
      </button>
    </div>

    {fb && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13,
      background: ok ? 'rgba(38,208,124,0.08)' : 'rgba(255,40,76,0.08)',
      border: ok ? '1px solid rgba(38,208,124,0.2)' : '1px solid rgba(255,40,76,0.2)',
      color: ok ? '#26d07c' : '#ff284c' }}>
      {ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {fb.msg}
    </div>}

    {(creating || editing) && <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>{editing ? 'Editar' : 'Criar'} Anúncio</h3>
        <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Título *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={IS} /></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>URL do CTA *</label>
          <input value={form.ctaUrl} onChange={e => setForm(f => ({ ...f, ctaUrl: e.target.value }))} style={IS} /></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Descrição</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={IS} /></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Texto Botão</label>
          <input value={form.ctaText} onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))} style={IS} /></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Posição</label>
          <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))} style={IS}>
            {PL.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prioridade</label>
          <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} style={IS} /></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Data Início</label>
          <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={IS} /></div>
        <div><label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Data Fim</label>
          <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={IS} /></div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Ativo
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#6c38ff', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? <Loader2 size={14} /> : <Save size={14} />} {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>}

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ads.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Nenhum anúncio.</div> :
        ads.map(ad => (
          <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: ad.isActive ? 1 : 0.5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ad.isActive ? '#26d07c' : '#666', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {ad.placement} · {ad.impressions} imp · {ad.clicks} cliques · CTR: {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
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
  </div>);
}
