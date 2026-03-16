import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit3, Eye, EyeOff, GripVertical,
  CheckCircle, AlertTriangle, Loader2, Save, X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { API_BASE_URL } from '../../config';

const API_BASE = API_BASE_URL;

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  gradient?: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #0d1520 100%)',
  'linear-gradient(135deg, #0a1628 0%, #1b3a4b 40%, #0d2818 100%)',
  'linear-gradient(135deg, #1a0a2e 0%, #3b1d8e 40%, #1a0533 100%)',
  'linear-gradient(135deg, #0d1520 0%, #2a1a4e 40%, #1a0533 100%)',
  'linear-gradient(135deg, #0d2818 0%, #1a3a2a 40%, #0a1628 100%)',
];

export default function BannersTab() {
  const { token } = useAdminAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    gradient: DEFAULT_GRADIENTS[0],
    linkUrl: '',
    linkLabel: '',
    isActive: true,
  });

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setBanners(data);
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to load banners' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const resetForm = () => {
    setForm({ title: '', subtitle: '', imageUrl: '', gradient: DEFAULT_GRADIENTS[0], linkUrl: '', linkLabel: '', isActive: true });
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (banner: Banner) => {
    setEditing(banner);
    setCreating(false);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      gradient: banner.gradient || DEFAULT_GRADIENTS[0],
      linkUrl: banner.linkUrl || '',
      linkLabel: banner.linkLabel || '',
      isActive: banner.isActive,
    });
  };

  const startCreate = () => {
    resetForm();
    setCreating(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFeedback({ type: 'error', msg: 'Title is required' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const url = editing
        ? `${API_BASE}/admin/banners/${editing.id}`
        : `${API_BASE}/admin/banners`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          order: editing?.order ?? banners.length,
        }),
      });
      if (res.ok) {
        setFeedback({ type: 'success', msg: editing ? 'Banner updated' : 'Banner created' });
        resetForm();
        fetchBanners();
      } else {
        const err = await res.json();
        setFeedback({ type: 'error', msg: err.error || 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await fetch(`${API_BASE}/admin/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setFeedback({ type: 'success', msg: 'Banner deleted' });
      fetchBanners();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to delete' });
    }
  };

  const handleToggle = async (banner: Banner) => {
    try {
      await fetch(`${API_BASE}/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      fetchBanners();
    } catch {
      setFeedback({ type: 'error', msg: 'Failed to toggle' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0 }}>Banner Management</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Manage promotional banners displayed on the home page slider
          </p>
        </div>
        <button
          onClick={startCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', background: 'var(--color-brand-600, #6c38ff)',
            color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> New Banner
        </button>
      </div>

      {feedback && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 13,
          background: feedback.type === 'success' ? 'rgba(38,208,124,0.08)' : 'rgba(255,40,76,0.08)',
          border: feedback.type === 'success' ? '1px solid rgba(38,208,124,0.2)' : '1px solid rgba(255,40,76,0.2)',
          color: feedback.type === 'success' ? '#26d07c' : '#ff284c',
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Editor Form */}
      {(creating || editing) && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>
              {editing ? 'Edit Banner' : 'Create Banner'}
            </h3>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Subtitle</label>
              <input
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Link URL</label>
              <input
                value={form.linkUrl}
                onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                placeholder="/staking or https://..."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Link Label</label>
              <input
                value={form.linkLabel}
                onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))}
                placeholder="Learn More"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Image URL (optional)</label>
              <input
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Background Gradient</label>
              <select
                value={form.gradient}
                onChange={e => setForm(f => ({ ...f, gradient: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white',
                }}
              >
                {DEFAULT_GRADIENTS.map((g, i) => (
                  <option key={i} value={g}>Gradient {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div style={{
            marginTop: 16, padding: '24px 28px', borderRadius: 12,
            background: form.gradient, minHeight: 80,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{form.title || 'Banner Title'}</div>
            {form.subtitle && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{form.subtitle}</div>}
            {form.linkLabel && (
              <span style={{
                display: 'inline-block', marginTop: 8, padding: '6px 14px', borderRadius: 6,
                background: 'rgba(108,56,255,0.8)', color: 'white', fontSize: 12, fontWeight: 600,
              }}>
                {form.linkLabel}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={resetForm} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
                border: 'none', background: 'var(--color-brand-600, #6c38ff)', color: 'white',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1,
              }}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            No banners yet. Click "New Banner" to create one.
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: banner.isActive ? 1 : 0.5,
              }}
            >
              <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

              {/* Preview swatch */}
              <div style={{
                width: 80, height: 44, borderRadius: 6, flexShrink: 0,
                background: banner.gradient || 'rgba(108,56,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
              }}>
                #{banner.order + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {banner.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {banner.linkUrl || 'No link'} · {banner.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleToggle(banner)} title={banner.isActive ? 'Deactivate' : 'Activate'} style={{
                  padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: banner.isActive ? '#26d07c' : 'var(--text-muted)', cursor: 'pointer',
                }}>
                  {banner.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => startEdit(banner)} title="Edit" style={{
                  padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: 'var(--color-brand-400)', cursor: 'pointer',
                }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(banner.id)} title="Delete" style={{
                  padding: 6, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: '#ff284c', cursor: 'pointer',
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
