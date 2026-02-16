import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderCheck, CheckCircle, XCircle, ExternalLink, Clock, Pencil, X, Save, Loader2 } from 'lucide-react';
import { useAdminProjectReviews } from '../../hooks/useAdminData';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAllProjects, type KnownProject } from '../../data/knownProjects';
import styles from './Admin.module.css';

const API_BASE = 'http://localhost:4000/api';

const CATEGORIES = ['infrastructure', 'defi', 'dao', 'social', 'nft', 'gaming', 'token', 'meme', 'rwa', 'other'] as const;
const STATUSES = ['active', 'development', 'beta', 'deprecated'] as const;

interface ApiProject {
  slug: string;
  name: string;
  ticker: string;
  description: string;
  longDescription: string;
  category: string;
  status: string;
  tags: string[];
  tokenSymbol: string;
  links: { type: string; url: string; label: string }[];
  [key: string]: unknown;
}

interface Props {
  adminAddress: string;
}

const LINK_TYPES = ['website', 'github', 'x', 'telegram', 'discord', 'docs', 'medium'] as const;
const MILESTONE_STATUSES = ['completed', 'in-progress', 'planned'] as const;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)', outline: 'none',
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
  padding: '4px 10px', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 600,
};

// ─── Edit Modal ───
function EditProjectModal({ project, onClose, onSaved }: { project: ApiProject; onClose: () => void; onSaved: () => void }) {
  const { token } = useAdminAuth();
  const [form, setForm] = useState({
    name: project.name || '',
    ticker: project.ticker || '',
    description: project.description || '',
    longDescription: project.longDescription || '',
    category: project.category || 'other',
    status: project.status || 'development',
    tags: (project.tags || []).join(', '),
    tokenSymbol: project.tokenSymbol || '',
    donationAddress: (project as any).donationAddress || '',
  });
  const [links, setLinks] = useState<{ type: string; url: string; label: string }[]>(
    (project.links || []).map(l => ({ type: l.type || 'website', url: l.url || '', label: l.label || '' }))
  );
  const [team, setTeam] = useState<{ name: string; role: string }[]>(
    ((project as any).team || []).map((t: any) => ({ name: t.name || '', role: t.role || '' }))
  );
  const [milestones, setMilestones] = useState<{ title: string; date: string; status: string; description: string }[]>(
    ((project as any).milestones || []).map((m: any) => ({
      title: m.title || '', date: m.date || '', status: m.status || 'planned', description: m.description || '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null); setSuccess(false);
  };

  // Links helpers
  const updateLink = (i: number, field: string, value: string) => {
    setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };
  const addLink = () => setLinks(prev => [...prev, { type: 'website', url: '', label: '' }]);
  const removeLink = (i: number) => setLinks(prev => prev.filter((_, idx) => idx !== i));

  // Team helpers
  const updateTeam = (i: number, field: string, value: string) => {
    setTeam(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };
  const addTeam = () => setTeam(prev => [...prev, { name: '', role: '' }]);
  const removeTeam = (i: number) => setTeam(prev => prev.filter((_, idx) => idx !== i));

  // Milestones helpers
  const updateMilestone = (i: number, field: string, value: string) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };
  const addMilestone = () => setMilestones(prev => [...prev, { title: '', date: '', status: 'planned', description: '' }]);
  const removeMilestone = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        ticker: form.ticker,
        description: form.description,
        longDescription: form.longDescription,
        category: form.category,
        status: form.status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        tokenSymbol: form.tokenSymbol,
        donationAddress: form.donationAddress,
        links: links.filter(l => l.url.trim()),
        team: team.filter(t => t.name.trim()),
        milestones: milestones.filter(m => m.title.trim()),
      };

      const res = await fetch(`${API_BASE}/admin/projects/${project.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface, #141419)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 720,
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
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
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Name</label>
            <input style={inputStyle} value={form.name} onChange={e => handleChange('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Ticker</label>
            <input style={inputStyle} value={form.ticker} onChange={e => handleChange('ticker', e.target.value)} />
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
            <input style={inputStyle} value={form.tokenSymbol} onChange={e => handleChange('tokenSymbol', e.target.value)} placeholder="e.g. lunes" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tags (comma separated)</label>
            <input style={inputStyle} value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="layer-1, substrate" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Donation Wallet Address</label>
            <input style={inputStyle} value={form.donationAddress} onChange={e => handleChange('donationAddress', e.target.value)} placeholder="5C...  (Lunes address to receive donations)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>Wallet address where donations from the 'Donate LUNES' button will be sent</span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Short Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => handleChange('description', e.target.value)} rows={2} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Long Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} value={form.longDescription} onChange={e => handleChange('longDescription', e.target.value)} rows={4} />
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

        {/* ── Roadmap / Milestones ── */}
        <div style={sectionTitle}>Roadmap ({milestones.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {milestones.map((ms, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 110px auto', gap: 8, alignItems: 'start',
              padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <input style={inputStyle} value={ms.title} onChange={e => updateMilestone(i, 'title', e.target.value)} placeholder="Milestone title" />
              <input style={inputStyle} value={ms.date} onChange={e => updateMilestone(i, 'date', e.target.value)} placeholder="2024-Q1" />
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

        {error && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 13 }}>{error}</div>}
        {success && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(38,208,124,0.1)', color: '#26d07c', fontSize: 13 }}>Project updated!</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className={`${styles.actionBtn} ${styles.neutral}`} onClick={onClose}>Cancel</button>
          <button className={styles.submitBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProjectsTab ───
export default function ProjectsTab({ adminAddress }: Props) {
  const { token } = useAdminAuth();
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const fallbackProjects = getAllProjects();
  const { reviewProject, getReview } = useAdminProjectReviews();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiProjects(data);
      }
    } catch { /* fallback to local */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const projects: KnownProject[] = apiProjects.length > 0
    ? apiProjects.map((p: any) => ({
        id: p.id, name: p.name, slug: p.slug, logo: p.logo, category: p.category,
        description: p.description, longDescription: p.longDescription, status: p.status,
        launchDate: p.launchDate, links: p.links || [], team: p.team || [],
        milestones: p.milestones || [], tags: p.tags || [], contractAddresses: p.contractAddresses || [],
        tokenIds: p.tokenIds || [], nftCollectionIds: p.nftCollectionIds || [],
        assetIds: p.assetIds || [], tokenSymbol: p.tokenSymbol || undefined,
        donationAddress: p.donationAddress || undefined,
        verification: p.verification || { status: 'unverified' },
      }))
    : fallbackProjects;

  const handleReview = (slug: string, decision: 'approved' | 'rejected') => {
    reviewProject(slug, decision, adminAddress, notes[slug] || '');
    setNotes((prev) => ({ ...prev, [slug]: '' }));
  };

  const openEdit = (slug: string) => {
    const ap = apiProjects.find(p => p.slug === slug);
    if (ap) {
      setEditingProject(ap);
    } else {
      // Fallback: build ApiProject from KnownProject for editing
      const kp = fallbackProjects.find(p => p.slug === slug);
      if (kp) {
        setEditingProject({
          slug: kp.slug,
          name: kp.name,
          ticker: kp.tokenSymbol || '',
          description: kp.description,
          longDescription: kp.longDescription || '',
          category: kp.category,
          status: kp.status,
          tags: kp.tags,
          tokenSymbol: kp.tokenSymbol || '',
          links: kp.links.map(l => ({ type: l.type, url: l.url, label: l.label || '' })),
          team: kp.team,
          milestones: kp.milestones,
        } as any);
      }
    }
  };

  const pending = projects.filter((p) => {
    const r = getReview(p.slug);
    return !r || r.decision === 'pending';
  });
  const reviewed = projects.filter((p) => {
    const r = getReview(p.slug);
    return r && r.decision !== 'pending';
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><FolderCheck size={22} /> Project Management</h2>
        <p className={styles.pageSubtitle}>Review, edit, and manage all ecosystem projects ({projects.length} total)</p>
      </div>

      {/* All Projects — Editable */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        <Pencil size={16} style={{ verticalAlign: -2 }} /> All Projects ({projects.length})
      </h3>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', verticalAlign: -3, marginRight: 8 }} />
          Loading projects...
        </div>
      ) : (
        <table className={styles.table} style={{ marginBottom: 32 }}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Category</th>
              <th>Status</th>
              <th>Token</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project: KnownProject) => (
              <tr key={project.id}>
                <td>
                  <Link to={`/project/${project.slug}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {project.name} <ExternalLink size={12} color="var(--text-muted)" />
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{project.description.slice(0, 60)}...</div>
                </td>
                <td>
                  <span className={styles.badge} style={{ background: 'rgba(108,56,255,0.12)', color: 'var(--color-brand-400)' }}>
                    {project.category}
                  </span>
                </td>
                <td>
                  <span className={styles.badge} style={{
                    background: project.status === 'active' ? 'rgba(38,208,124,0.12)' : 'rgba(245,158,11,0.12)',
                    color: project.status === 'active' ? '#26d07c' : '#f59e0b',
                  }}>
                    {project.status}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {project.tokenSymbol || '—'}
                </td>
                <td>
                  <span className={`${styles.badge} ${project.verification.status === 'verified' ? styles.approved : styles.pending}`}>
                    {project.verification.status}
                  </span>
                </td>
                <td>
                  <button
                    className={`${styles.actionBtn} ${styles.neutral}`}
                    onClick={() => openEdit(project.slug)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pending reviews */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        <Clock size={16} style={{ verticalAlign: -2 }} /> Pending Review ({pending.length})
      </h3>

      {pending.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          No projects pending review
        </div>
      ) : (
        <table className={styles.table} style={{ marginBottom: 32 }}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Category</th>
              <th>Verification</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((project: KnownProject) => (
              <tr key={project.id}>
                <td>
                  <Link to={`/project/${project.slug}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {project.name} <ExternalLink size={12} color="var(--text-muted)" />
                  </Link>
                </td>
                <td>
                  <span className={styles.badge} style={{ background: 'rgba(108,56,255,0.12)', color: 'var(--color-brand-400)' }}>
                    {project.category}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles.pending}`}>{project.verification.status}</span>
                </td>
                <td>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Review notes..."
                    value={notes[project.slug] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [project.slug]: e.target.value }))}
                    style={{ width: '100%', minWidth: 120 }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`${styles.actionBtn} ${styles.approve}`} onClick={() => handleReview(project.slug, 'approved')}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button className={`${styles.actionBtn} ${styles.reject}`} onClick={() => handleReview(project.slug, 'rejected')}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Reviewed */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        <CheckCircle size={16} style={{ verticalAlign: -2 }} /> Reviewed ({reviewed.length})
      </h3>

      {reviewed.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No reviewed projects yet
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Decision</th>
              <th>Notes</th>
              <th>Reviewed At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviewed.map((project: KnownProject) => {
              const review = getReview(project.slug)!;
              return (
                <tr key={project.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link to={`/project/${project.slug}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {project.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${review.decision === 'approved' ? styles.approved : styles.rejected}`}>
                      {review.decision}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{review.notes || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(review.reviewedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`${styles.actionBtn} ${styles.neutral}`}
                        onClick={() => openEdit(project.slug)}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.neutral}`}
                        onClick={() => reviewProject(project.slug, 'pending', adminAddress, '')}
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={loadProjects}
        />
      )}
    </div>
  );
}
