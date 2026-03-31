import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FolderCheck, CheckCircle, XCircle, ExternalLink, Clock, Pencil, Loader2 } from 'lucide-react';
import { useAdminProjectReviews } from '../../hooks/useAdminData';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getAllProjects, type KnownProject } from '../../data/knownProjects';
import { EditProjectModal } from '../../components/common/EditProjectModal';
import styles from './Admin.module.css';
import { API_BASE_URL } from '../../config';

const API_BASE = API_BASE_URL;

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
          adminToken={token || undefined}
        />
      )}
    </div>
  );
}
