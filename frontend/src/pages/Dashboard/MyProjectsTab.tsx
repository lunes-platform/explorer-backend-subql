import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Plus, Edit3, Save, CheckCircle, ExternalLink,
  Shield, AlertTriangle, Loader2, X, Image, Trash2, AlertCircle,
} from 'lucide-react';
import {
  VERIFICATION_FEE_LUNES, VERIFICATION_RECEIVER,
  type KnownProject, type VerificationStatus,
} from '../../data/knownProjects';
import { useMyProjects, useProjectMutations } from '../../hooks/useProjects';
import type { ApiProject } from '../../services/projectsApi';
import ImageUpload from '../../components/common/ImageUpload';
import styles from './Dashboard.module.css';

interface Props { address: string; }

const CATEGORIES: KnownProject['category'][] = ['defi', 'nft', 'social', 'infrastructure', 'gaming', 'dao', 'token', 'other'];

interface FormData {
  slug: string;
  name: string;
  ticker: string;
  category: KnownProject['category'];
  description: string;
  logoUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  github: string;
  contractAddress: string;
  assetId: string;
  donationAddress: string;
}

const emptyForm: FormData = {
  slug: '', name: '', ticker: '', category: 'token', description: '',
  logoUrl: '', website: '', twitter: '', telegram: '', github: '',
  contractAddress: '', assetId: '', donationAddress: '',
};

function projectToForm(p: ApiProject): FormData {
  const getLink = (type: string) => p.links?.find(l => l.type === type)?.url || '';
  return {
    slug: p.slug, name: p.name, ticker: p.ticker || '',
    category: p.category, description: p.description,
    logoUrl: p.logo || '',
    website: getLink('website'), twitter: getLink('x'),
    telegram: getLink('telegram'), github: getLink('github'),
    contractAddress: p.contractAddresses?.[0] || '',
    assetId: p.assetIds?.[0] || '',
    donationAddress: (p as any).donationAddress || '',
  };
}

export default function MyProjectsTab({ address }: Props) {
  const { projects, loading, error: loadError, refetch, isApi } = useMyProjects(address);
  const { create, update, remove, verify, saving, error: mutError } = useProjectMutations();
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });

  const startEdit = (project: ApiProject) => {
    setForm(projectToForm(project));
    setEditing(project.slug);
    setShowNew(false);
  };

  const startNew = () => {
    setForm({ ...emptyForm });
    setEditing(null);
    setShowNew(true);
  };

  const buildPayload = () => {
    const links: { type: string; url: string; label: string }[] = [];
    if (form.website) links.push({ type: 'website', url: form.website, label: 'Website' });
    if (form.twitter) links.push({ type: 'x', url: form.twitter, label: 'X' });
    if (form.telegram) links.push({ type: 'telegram', url: form.telegram, label: 'Telegram' });
    if (form.github) links.push({ type: 'github', url: form.github, label: 'GitHub' });
    return {
      name: form.name,
      ticker: form.ticker,
      logo: form.logoUrl,
      category: form.category,
      description: form.description,
      links: links as any,
      contractAddresses: form.contractAddress ? [form.contractAddress] : [],
      assetIds: form.assetId ? [form.assetId] : [],
      donationAddress: form.donationAddress || '',
      ownerAddress: address,
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    let ok: any;
    if (showNew) {
      ok = await create(payload);
    } else if (editing) {
      ok = await update(editing, payload);
    }
    if (ok) {
      setEditing(null);
      setShowNew(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      refetch();
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    const ok = await remove(slug);
    if (ok) refetch();
  };

  const handlePayVerification = async (slug: string) => {
    setPayingFor(slug);
    const result = await verify(slug, {
      payerAddress: address,
      responsibleName: '',
      responsibleEmail: '',
    });
    setPayingFor(null);
    if (result) refetch();
  };

  const verBadge = (status: VerificationStatus) => {
    if (status === 'verified') return <span className={styles.badgeVerified}>Verified</span>;
    if (status === 'pending') return <span className={styles.badgePending}>Pending</span>;
    if (status === 'rejected') return <span className={`${styles.badge}`} style={{ background: 'rgba(255,77,106,0.12)', color: '#ff4d6a' }}>Rejected</span>;
    return <span className={styles.badgeUnverified}>Unverified</span>;
  };

  const isEditing = editing !== null || showNew;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><FolderKanban size={22} /> My Projects</h2>
        <p className={styles.pageSubtitle}>
          Manage your registered projects, edit info, logo, ticker, and request verification.
          {!isApi && <span style={{ color: '#fe9f00', marginLeft: 8 }}>(API offline — start the API server on port 4000)</span>}
        </p>
      </div>

      {(loadError || mutError) && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', color: '#ff4d6a', fontSize: 12, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={14} /> {loadError || mutError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={styles.submitBtn} onClick={startNew} disabled={!isApi}>
          <Plus size={16} /> Register New Project
        </button>
        <Link to="/project/register" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Full Registration Form
        </Link>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#26d07c', fontSize: 13, fontWeight: 600 }}>
            <CheckCircle size={16} /> Saved
          </span>
        )}
      </div>

      {/* Edit / New Form */}
      {isEditing && (
        <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              {showNew ? 'Register New Project' : `Edit: ${form.name}`}
            </h3>
            <button onClick={() => { setEditing(null); setShowNew(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Project Name *</label>
              <input className={styles.formInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Token Project" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ticker Symbol</label>
              <input className={styles.formInput} value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="TKN" maxLength={10} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select className={styles.formSelect} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as KnownProject['category'] })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <ImageUpload
                label="Logo"
                value={form.logoUrl}
                onChange={(url) => setForm({ ...form, logoUrl: url })}
                placeholder="https://..."
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Description</label>
              <textarea className={styles.formTextarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of your project..." rows={3} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website</label>
              <input className={styles.formInput} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Twitter / X</label>
              <input className={styles.formInput} value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="https://x.com/..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telegram</label>
              <input className={styles.formInput} value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="https://t.me/..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>GitHub</label>
              <input className={styles.formInput} value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contract Address</label>
              <input className={styles.formInput} value={form.contractAddress} onChange={(e) => setForm({ ...form, contractAddress: e.target.value })} placeholder="5C..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Asset ID (pallet)</label>
              <input className={styles.formInput} value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} placeholder="1" />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Donation Wallet Address</label>
              <input className={styles.formInput} value={form.donationAddress} onChange={(e) => setForm({ ...form, donationAddress: e.target.value })} placeholder="5C...  (Lunes address to receive donations)" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>The wallet where donations from the "Donate LUNES" button will be sent to your project</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className={styles.submitBtn} onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {showNew ? 'Register Project' : 'Save Changes'}
            </button>
            <button className={`${styles.actionBtn} ${styles.neutral}`} onClick={() => { setEditing(null); setShowNew(false); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading your projects...</p>
        </div>
      ) : projects.length === 0 && !isEditing ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          You have no registered projects yet. Click "Register New Project" to get started.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Ticker</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.slug}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {proj.logo ? (
                      <img src={proj.logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(108,56,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-brand-400)' }}>
                        {proj.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{proj.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{proj.description?.slice(0, 50)}...</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 700, fontSize: 12 }}>{proj.ticker || '—'}</td>
                <td><span className={styles.badge} style={{ background: 'rgba(108,56,255,0.12)', color: 'var(--color-brand-400)' }}>{proj.category}</span></td>
                <td>{verBadge(proj.verification?.status || 'unverified')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => startEdit(proj)}>
                      <Edit3 size={12} /> Edit
                    </button>
                    {(proj.verification?.status || 'unverified') === 'unverified' && (
                      <button
                        className={styles.submitBtn}
                        style={{ padding: '5px 12px', fontSize: 11 }}
                        onClick={() => handlePayVerification(proj.slug)}
                        disabled={payingFor === proj.slug}
                      >
                        {payingFor === proj.slug ? (
                          <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Paying...</>
                        ) : (
                          <><Shield size={12} /> Verify ({VERIFICATION_FEE_LUNES} LUNES)</>
                        )}
                      </button>
                    )}
                    <Link to={`/project/${proj.slug}`} className={`${styles.actionBtn} ${styles.neutral}`} style={{ textDecoration: 'none' }}>
                      <ExternalLink size={12} /> View
                    </Link>
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(proj.slug)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Verification info */}
      <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 10, background: 'rgba(254,159,0,0.06)', border: '1px solid rgba(254,159,0,0.15)', fontSize: 12, color: '#fe9f00', display: 'flex', gap: 8 }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Verification:</strong> Costs {VERIFICATION_FEE_LUNES} LUNES sent to <code style={{ fontSize: 10 }}>{VERIFICATION_RECEIVER.slice(0, 12)}...</code>.
          After payment, the Lunes team reviews your project. Verified projects get a badge on the explorer.
        </div>
      </div>
    </div>
  );
}
