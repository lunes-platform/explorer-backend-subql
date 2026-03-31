import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Plus, Edit3, CheckCircle, ExternalLink,
  Shield, AlertTriangle, Loader2, Trash2, AlertCircle,
} from 'lucide-react';
import {
  VERIFICATION_FEE_LUNES, VERIFICATION_RECEIVER,
  type KnownProject, type VerificationStatus,
} from '../../data/knownProjects';
import { useMyProjects, useProjectMutations } from '../../hooks/useProjects';
import type { ApiProject } from '../../services/projectsApi';
import { EditProjectModal } from '../../components/common/EditProjectModal';
import styles from './Dashboard.module.css';

interface Props { address: string; }

const CATEGORIES: KnownProject['category'][] = ['defi', 'nft', 'social', 'infrastructure', 'gaming', 'dao', 'token', 'other'];

interface NewFormData {
  name: string;
  ticker: string;
  category: KnownProject['category'];
  description: string;
  assetId: string;
}

const emptyNewForm: NewFormData = {
  name: '', ticker: '', category: 'token', description: '', assetId: '',
};

export default function MyProjectsTab({ address }: Props) {
  const { projects, loading, error: loadError, refetch, isApi } = useMyProjects(address);
  const { create, remove, saving, error: mutError } = useProjectMutations();
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newForm, setNewForm] = useState<NewFormData>({ ...emptyNewForm });

  const startNew = () => {
    setNewForm({ ...emptyNewForm });
    setShowNew(true);
  };

  const handleCreate = async () => {
    const links: { type: string; url: string; label: string }[] = [];
    const ok = await create({
      name: newForm.name,
      ticker: newForm.ticker,
      logo: '',
      category: newForm.category,
      description: newForm.description,
      links: links as any,
      assetIds: newForm.assetId ? [newForm.assetId] : [],
      donationAddress: '',
      ownerAddress: address,
      contractAddresses: [],
      tokenIds: [],
      nftCollectionIds: [],
      tags: [],
    });
    if (ok) {
      setShowNew(false);
      setNewForm({ ...emptyNewForm });
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

  const verBadge = (status: VerificationStatus) => {
    if (status === 'verified') return <span className={styles.badgeVerified}>Verified</span>;
    if (status === 'pending') return <span className={styles.badgePending}>Pending</span>;
    if (status === 'rejected') return <span className={`${styles.badge}`} style={{ background: 'rgba(255,77,106,0.12)', color: '#ff4d6a' }}>Rejected</span>;
    return <span className={styles.badgeUnverified}>Unverified</span>;
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><FolderKanban size={22} /> My Projects</h2>
        <p className={styles.pageSubtitle}>
          Manage your registered projects, edit info, logo, banner, team and roadmap.
          {!isApi && <span style={{ color: '#fe9f00', marginLeft: 8 }}>(API offline — start the API server on port 4000)</span>}
        </p>
      </div>

      {(loadError || mutError) && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', color: '#ff4d6a', fontSize: 12, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={14} /> {loadError || mutError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className={styles.submitBtn} onClick={startNew} disabled={!isApi}>
          <Plus size={16} /> Quick Register
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

      {/* Quick New Project Form */}
      {showNew && (
        <div style={{ padding: 20, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Quick Register New Project</h3>
            <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Project Name *</label>
              <input className={styles.formInput} value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="My Token Project" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ticker</label>
              <input className={styles.formInput} value={newForm.ticker} onChange={(e) => setNewForm({ ...newForm, ticker: e.target.value.toUpperCase() })} placeholder="TKN" maxLength={10} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select className={styles.formSelect} value={newForm.category} onChange={(e) => setNewForm({ ...newForm, category: e.target.value as KnownProject['category'] })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Asset ID (pallet-assets)</label>
              <input className={styles.formInput} value={newForm.assetId} onChange={(e) => setNewForm({ ...newForm, assetId: e.target.value })} placeholder="1" />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.formLabel}>Description</label>
              <textarea className={styles.formTextarea} value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} placeholder="Brief description..." rows={2} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className={styles.submitBtn} onClick={handleCreate} disabled={!newForm.name.trim() || saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
              Register Project
            </button>
            <button className={`${styles.actionBtn} ${styles.neutral}`} onClick={() => setShowNew(false)}>Cancel</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, marginBottom: 0 }}>
            Tip: Use the <Link to="/project/register" style={{ color: 'var(--color-brand-400)' }}>Full Registration Form</Link> to add links, team members, roadmap and banner image.
          </p>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading your projects...</p>
        </div>
      ) : projects.length === 0 && !showNew ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          You have no registered projects yet.{' '}
          <Link to="/project/register" style={{ color: 'var(--color-brand-400)' }}>Register your first project</Link>.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Ticker</th>
              <th>Category</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.slug}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {proj.logo ? (
                      <img
                        src={proj.logo}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(108,56,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-brand-400)' }}>
                        {proj.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{proj.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {proj.description && proj.description.length > 50
                          ? proj.description.slice(0, 50) + '...'
                          : proj.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 700, fontSize: 12 }}>{proj.ticker || '—'}</td>
                <td>
                  <span className={styles.badge} style={{ background: 'rgba(108,56,255,0.12)', color: 'var(--color-brand-400)' }}>
                    {proj.category}
                  </span>
                </td>
                <td>{verBadge(proj.verification?.status || 'unverified')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className={`${styles.actionBtn} ${styles.primary}`}
                      onClick={() => setEditingProject(proj)}
                      title="Edit project info, logo, banner, team, roadmap..."
                    >
                      <Edit3 size={12} /> Edit
                    </button>

                    {(proj.verification?.status === 'unverified' || proj.verification?.status === 'rejected') && (
                      <Link
                        to="/project/verify"
                        className={styles.submitBtn}
                        style={{ padding: '5px 12px', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title={`Request verification — costs ${VERIFICATION_FEE_LUNES} LUNES`}
                      >
                        <Shield size={12} /> Verify
                      </Link>
                    )}

                    {proj.verification?.status === 'pending' && (
                      <span style={{ fontSize: 11, color: '#fe9f00', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px' }}>
                        <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Awaiting review
                      </span>
                    )}

                    <Link
                      to={`/project/${proj.slug}`}
                      className={`${styles.actionBtn} ${styles.neutral}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> View
                    </Link>

                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => handleDelete(proj.slug)}
                      title="Delete project"
                    >
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
          <strong>Verification:</strong> Costs {VERIFICATION_FEE_LUNES} LUNES sent to{' '}
          <code style={{ fontSize: 10 }}>{VERIFICATION_RECEIVER.slice(0, 12)}...</code>.
          After payment, the Lunes team reviews your project. Verified projects get a badge on the explorer.
        </div>
      </div>

      {/* Edit Project Modal — full editor identical to admin, authenticated by ownerAddress */}
      {editingProject && (
        <EditProjectModal
          project={{
            ...editingProject,
            links: (editingProject.links || []).map((link) => ({
              type: link.type,
              url: link.url,
              label: link.label || '',
            })),
          }}
          onClose={() => setEditingProject(null)}
          onSaved={() => {
            setEditingProject(null);
            refetch();
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
          ownerAddress={address}
        />
      )}
    </div>
  );
}
