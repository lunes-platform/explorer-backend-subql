import React, { useState } from 'react';
import { Pencil, X, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { API_BASE_URL } from '../../config';

const API_BASE = API_BASE_URL;

const CATEGORIES = ['infrastructure', 'defi', 'dao', 'social', 'nft', 'gaming', 'token', 'meme', 'rwa', 'other'] as const;
const STATUSES = ['active', 'development', 'beta', 'deprecated'] as const;
const LINK_TYPES = ['website', 'github', 'x', 'telegram', 'discord', 'docs', 'medium'] as const;
const MILESTONE_STATUSES = ['completed', 'in-progress', 'planned'] as const;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const sectionTitle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: 'var(--color-brand-400)',
  textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10,
  borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16,
};
const addBtnStyle: React.CSSProperties = {
  background: 'rgba(108,56,255,0.1)', border: '1px dashed rgba(108,56,255,0.3)',
  borderRadius: 8, padding: '8px 14px', color: 'var(--color-brand-400)',
  cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%',
};
const removeBtnStyle: React.CSSProperties = {
  background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6,
  padding: '4px 10px', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 600, flexShrink: 0,
};

export interface EditableProject {
  slug: string;
  name: string;
  ticker?: string;
  description?: string;
  longDescription?: string;
  category?: string;
  status?: string;
  tags?: string[];
  tokenSymbol?: string;
  logo?: string;
  banner?: string;
  donationAddress?: string;
  links?: { type: string; url: string; label: string }[];
  team?: { name: string; role: string }[];
  milestones?: { title: string; date?: string; status?: string; description?: string }[];
  [key: string]: unknown;
}

interface Props {
  project: EditableProject;
  onClose: () => void;
  onSaved: () => void;
  /** For wallet-authenticated edits (project owner) */
  ownerAddress?: string;
  /** For admin-authenticated edits */
  adminToken?: string;
}

export function EditProjectModal({ project, onClose, onSaved, ownerAddress, adminToken }: Props) {
  const [form, setForm] = useState({
    name: project.name || '',
    ticker: project.ticker || '',
    description: project.description || '',
    longDescription: project.longDescription || '',
    category: project.category || 'other',
    status: project.status || 'development',
    tags: (project.tags || []).join(', '),
    tokenSymbol: project.tokenSymbol || '',
    logo: (project as any).logo || (project as any).tokenSymbolImage || '',
    banner: (project as any).banner || (project as any).bannerImage || '',
    donationAddress: (project as any).donationAddress || '',
  });
  const [links, setLinks] = useState<{ type: string; url: string; label: string }[]>(
    (project.links || []).map(l => ({ type: l.type || 'website', url: l.url || '', label: l.label || '' }))
  );
  const [team, setTeam] = useState<{ name: string; role: string }[]>(
    (project.team || []).map(t => ({ name: t.name || '', role: t.role || '' }))
  );
  const [milestones, setMilestones] = useState<{ title: string; date: string; status: string; description: string }[]>(
    (project.milestones || []).map(m => ({
      title: m.title || '', date: (m as any).date || '', status: m.status || 'planned', description: m.description || '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null); setSuccess(false);
  };

  const updateLink = (i: number, field: string, value: string) =>
    setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  const addLink = () => setLinks(prev => [...prev, { type: 'website', url: '', label: '' }]);
  const removeLink = (i: number) => setLinks(prev => prev.filter((_, idx) => idx !== i));

  const updateTeam = (i: number, field: string, value: string) =>
    setTeam(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  const addTeam = () => setTeam(prev => [...prev, { name: '', role: '' }]);
  const removeTeam = (i: number) => setTeam(prev => prev.filter((_, idx) => idx !== i));

  const updateMilestone = (i: number, field: string, value: string) =>
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  const addMilestone = () => setMilestones(prev => [...prev, { title: '', date: '', status: 'planned', description: '' }]);
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        ticker: form.ticker,
        description: form.description,
        longDescription: form.longDescription,
        category: form.category,
        status: form.status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        tokenSymbol: form.tokenSymbol,
        logo: form.logo,
        tokenSymbolImage: form.logo,
        banner: form.banner,
        bannerImage: form.banner,
        donationAddress: form.donationAddress,
        links: links.filter(l => l.url.trim()),
        team: team.filter(t => t.name.trim()),
        milestones: milestones.filter(m => m.title.trim()),
      };

      let url: string;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (adminToken) {
        // Admin edit via admin endpoint
        url = `${API_BASE}/admin/projects/${project.slug}`;
        headers['Authorization'] = `Bearer ${adminToken}`;
      } else if (ownerAddress) {
        // Owner edit via public endpoint with ownerAddress
        url = `${API_BASE}/projects/${project.slug}`;
        payload['ownerAddress'] = ownerAddress;
      } else {
        throw new Error('No authentication provided');
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update project');
      }

      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface, #141419)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 28, width: '100%', maxWidth: 720,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <Pencil size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
            Edit: {project.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Basic Info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Name *</label>
            <input style={inputStyle} value={form.name} onChange={e => handleChange('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ticker</label>
            <input style={inputStyle} value={form.ticker} onChange={e => handleChange('ticker', e.target.value.toUpperCase())} placeholder="TKN" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Category</label>
            <select style={selectStyle} value={form.category} onChange={e => handleChange('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
            <select style={selectStyle} value={form.status} onChange={e => handleChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Token Symbol</label>
            <input style={inputStyle} value={form.tokenSymbol} onChange={e => handleChange('tokenSymbol', e.target.value)} placeholder="e.g. LUNES" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tags (comma separated)</label>
            <input style={inputStyle} value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="layer-1, defi" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              <ImageIcon size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Logo
            </label>
            <ImageUpload
              value={form.logo}
              onChange={url => handleChange('logo', url)}
              label="Logo (recommended: 200x200px)"
              placeholder="https://..."
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              <ImageIcon size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Banner
            </label>
            <ImageUpload
              value={form.banner}
              onChange={url => handleChange('banner', url)}
              label="Banner (recommended: 1200x280px)"
              placeholder="https://..."
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Donation Wallet Address</label>
            <input style={inputStyle} value={form.donationAddress} onChange={e => handleChange('donationAddress', e.target.value)} placeholder="5C...  (Lunes address to receive donations)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>Wallet address where donations from the "Donate LUNES" button will be sent</span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Short Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} placeholder="Brief description of your project..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Long Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} value={form.longDescription} onChange={e => handleChange('longDescription', e.target.value)} rows={5} placeholder="Detailed description shown on the project page..." />
          </div>
        </div>

        {/* ── Links ── */}
        <div style={sectionTitle}>Links ({links.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select style={{ ...selectStyle, width: 110, flexShrink: 0 }} value={link.type} onChange={e => updateLink(i, 'type', e.target.value)}>
                {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input style={{ ...inputStyle, flex: 1 }} value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} placeholder="Label" />
              <input style={{ ...inputStyle, flex: 2 }} value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder="https://..." />
              <button style={removeBtnStyle} onClick={() => removeLink(i)}>✕</button>
            </div>
          ))}
          <button style={addBtnStyle} onClick={addLink}>+ Add Link</button>
        </div>

        {/* ── Team ── */}
        <div style={sectionTitle}>Team Members ({team.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {team.map((member, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input style={{ ...inputStyle, flex: 1 }} value={member.name} onChange={e => updateTeam(i, 'name', e.target.value)} placeholder="Name" />
              <input style={{ ...inputStyle, flex: 1 }} value={member.role} onChange={e => updateTeam(i, 'role', e.target.value)} placeholder="Role (e.g. CEO, Developer)" />
              <button style={removeBtnStyle} onClick={() => removeTeam(i)}>✕</button>
            </div>
          ))}
          <button style={addBtnStyle} onClick={addTeam}>+ Add Team Member</button>
        </div>

        {/* ── Roadmap ── */}
        <div style={sectionTitle}>Roadmap ({milestones.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {milestones.map((ms, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 120px auto', gap: 8, alignItems: 'start',
              padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <input style={inputStyle} value={ms.title} onChange={e => updateMilestone(i, 'title', e.target.value)} placeholder="Milestone title" />
              <input style={inputStyle} value={ms.date} onChange={e => updateMilestone(i, 'date', e.target.value)} placeholder="Q1 2025" />
              <select style={selectStyle} value={ms.status} onChange={e => updateMilestone(i, 'status', e.target.value)}>
                {MILESTONE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button style={removeBtnStyle} onClick={() => removeMilestone(i)}>✕</button>
              <div style={{ gridColumn: '1 / -1' }}>
                <input style={inputStyle} value={ms.description} onChange={e => updateMilestone(i, 'description', e.target.value)} placeholder="Description (optional)" />
              </div>
            </div>
          ))}
          <button style={addBtnStyle} onClick={addMilestone}>+ Add Milestone</button>
        </div>

        {/* Feedback */}
        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(38,208,124,0.1)', color: '#26d07c', fontSize: 13, border: '1px solid rgba(38,208,124,0.2)' }}>
            Project updated successfully!
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))',
              color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
