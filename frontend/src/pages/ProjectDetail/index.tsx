import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Github,
  MessageCircle,
  Send,
  FileText,
  BookOpen,
  Users,
  Map,
  Coins,
  Code2,
  Image,
  ExternalLink,
  CheckCircle,
  Clock,
  Circle,
  ShieldCheck,
  Heart,
  ThumbsUp,
  Trophy,
  TrendingUp,
  ArrowUpDown,
  UserCheck,
  Flame,
  Search,
} from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { SocialActions } from '../../components/social/SocialActions';
import { DonateModal } from '../../components/social/DonateModal';
import { useSocialInteractions, getProjectSocialData } from '../../hooks/useSocialInteractions';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { LunesLogo } from '../../components/common/LunesLogo';
import {
  getProjectBySlug,
  getAllProjects,
  VERIFICATION_RECEIVER,
  type KnownProject,
  type ProjectLink,
} from '../../data/knownProjects';
import styles from './ProjectDetail.module.css';

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const linkIcon = (type: ProjectLink['type']) => {
  switch (type) {
    case 'website': return <Globe size={14} />;
    case 'github': return <Github size={14} />;
    case 'x': return <XIcon />;
    case 'telegram': return <Send size={14} />;
    case 'discord': return <MessageCircle size={14} />;
    case 'docs': return <BookOpen size={14} />;
    case 'medium': return <FileText size={14} />;
    default: return <ExternalLink size={14} />;
  }
};

const milestoneIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle size={14} color="#26d07c" />;
    case 'in-progress': return <Clock size={14} color="var(--color-brand-400)" />;
    default: return <Circle size={14} color="rgba(255,255,255,0.2)" />;
  }
};

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

// Project detail view
const ProjectDetailView: React.FC<{ project: KnownProject }> = ({ project }) => {
  const { wallet, isConnected } = useWalletAuth();
  const userAddr = isConnected ? wallet?.account?.address : null;
  const {
    socialData, userInteractions, toggleLike, toggleLove,
    toggleFollow, recordDonation, addComment, isConnected: socialConnected,
  } = useSocialInteractions(project.id, userAddr);
  const [showDonate, setShowDonate] = useState(false);

  const donationReceiver = project.contractAddresses[0] || VERIFICATION_RECEIVER;

  const hasOnChain = project.contractAddresses.length > 0 ||
    project.assetIds.length > 0 ||
    project.nftCollectionIds.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/projects" className={styles.backLink}>
          <ArrowLeft size={16} />
          All Projects
        </Link>

        <div className={styles.projectHeader}>
          <div className={styles.projectLogo}>
            {project.id === 'lunes-network' ? <LunesLogo size={32} /> : project.name.charAt(0)}
          </div>
          <div className={styles.projectTitle}>
            <h1 className={styles.projectName}>{project.name}</h1>
            <div className={styles.projectMeta}>
              <span className={styles.categoryBadge} data-category={project.category}>
                {project.category}
              </span>
              <span className={styles.statusDot} data-status={project.status} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {project.status}
              </span>
              {project.launchDate && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Since {project.launchDate}
                </span>
              )}
              <VerifiedBadge status={project.verification.status} size="md" />
            </div>
            {project.verification.status === 'unverified' && (
              <Link
                to="/project/verify"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: 'linear-gradient(135deg, #6C38FF, #9B6DFF)', color: 'white',
                  textDecoration: 'none', marginTop: '8px',
                }}
              >
                <ShieldCheck size={14} />
                Get Verified — 1,000 LUNES
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <Card title="About" icon={<FileText size={18} />}>
        <p className={styles.description}>
          {project.longDescription || project.description}
        </p>
        {project.tags.length > 0 && (
          <div className={styles.tagsRow} style={{ marginTop: '16px' }}>
            {project.tags.map(tag => (
              <span key={tag} className={styles.tag}>#{tag}</span>
            ))}
          </div>
        )}
      </Card>

      {/* Social Actions */}
      <Card title="Community" icon={<Heart size={18} />}>
        <SocialActions
          socialData={socialData}
          userInteractions={userInteractions}
          isConnected={socialConnected}
          onLike={toggleLike}
          onLove={toggleLove}
          onFollow={toggleFollow}
          onDonate={() => setShowDonate(true)}
          onComment={addComment}
        />
      </Card>

      {/* Donate Modal */}
      <DonateModal
        isOpen={showDonate}
        onClose={() => setShowDonate(false)}
        projectName={project.name}
        receiverAddress={donationReceiver}
        onDonated={(amt) => { recordDonation(amt); setShowDonate(false); }}
      />

      {/* Links */}
      {project.links.length > 0 && (
        <Card title="Links" icon={<Globe size={18} />}>
          <div className={styles.linksGrid}>
            {project.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkBtn}
              >
                {linkIcon(link.type)}
                {link.label || link.url}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* On-Chain References */}
      {hasOnChain && (
        <Card title="On-Chain" icon={<Code2 size={18} />}>
          <div className={styles.refGrid}>
            {project.assetIds.map(assetId => (
              <Link key={`asset-${assetId}`} to={`/asset/${assetId}`} className={styles.refItem}>
                <div className={styles.refIcon} style={{ background: 'rgba(38, 208, 124, 0.12)' }}>
                  <Coins size={18} color="#26d07c" />
                </div>
                <div className={styles.refInfo}>
                  <span className={styles.refLabel}>Native Asset</span>
                  <span className={styles.refValue}>Asset #{assetId}</span>
                </div>
                <ExternalLink size={14} color="var(--text-muted)" />
              </Link>
            ))}
            {project.contractAddresses.map(addr => (
              <Link key={`contract-${addr}`} to={`/account/${addr}`} className={styles.refItem}>
                <div className={styles.refIcon} style={{ background: 'rgba(108, 56, 255, 0.12)' }}>
                  <Code2 size={18} color="var(--color-brand-400)" />
                </div>
                <div className={styles.refInfo}>
                  <span className={styles.refLabel}>Smart Contract</span>
                  <span className={styles.refValue}>{shortAddr(addr)}</span>
                </div>
                <ExternalLink size={14} color="var(--text-muted)" />
              </Link>
            ))}
            {project.nftCollectionIds.map(colId => (
              <Link key={`nft-${colId}`} to={`/nft/${colId}`} className={styles.refItem}>
                <div className={styles.refIcon} style={{ background: 'rgba(168, 85, 247, 0.12)' }}>
                  <Image size={18} color="#a855f7" />
                </div>
                <div className={styles.refInfo}>
                  <span className={styles.refLabel}>NFT Collection</span>
                  <span className={styles.refValue}>Collection #{colId}</span>
                </div>
                <ExternalLink size={14} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Team */}
      {project.team.length > 0 && (
        <Card title="Team" icon={<Users size={18} />}>
          <div className={styles.teamGrid}>
            {project.team.map((member, i) => (
              <div key={i} className={styles.teamCard}>
                <div className={styles.teamAvatar}>
                  {member.name.charAt(0)}
                </div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>{member.name}</span>
                  <span className={styles.teamRole}>{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Roadmap */}
      {project.milestones.length > 0 && (
        <Card title="Roadmap" icon={<Map size={18} />}>
          <div className={styles.timeline}>
            {project.milestones.map((ms, i) => (
              <div key={i} className={styles.timelineItem}>
                <div className={styles.timelineDot} data-status={ms.status} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {milestoneIcon(ms.status)}
                  <span className={styles.timelineTitle}>{ms.title}</span>
                </div>
                <div className={styles.timelineDate}>{ms.date}</div>
                {ms.description && (
                  <div className={styles.timelineDesc}>{ms.description}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Sort options
type SortKey = 'traction' | 'followers' | 'likes' | 'loves' | 'donations' | 'name';
const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'traction', label: 'Traction', icon: <TrendingUp size={13} /> },
  { key: 'followers', label: 'Followers', icon: <UserCheck size={13} /> },
  { key: 'likes', label: 'Likes', icon: <ThumbsUp size={13} /> },
  { key: 'loves', label: 'Loves', icon: <Heart size={13} /> },
  { key: 'donations', label: 'Donations', icon: <Flame size={13} /> },
  { key: 'name', label: 'Name', icon: <ArrowUpDown size={13} /> },
];

const CATEGORIES = ['all', 'infrastructure', 'defi', 'dao', 'social', 'nft', 'gaming', 'token', 'meme', 'rwa', 'other'] as const;

function getTractionScore(data: ReturnType<typeof getProjectSocialData>): number {
  return (data.followers * 3) + (data.likes * 2) + (data.loves * 4) + (data.donations * 5) + (data.donatedAmount * 0.1);
}

// Projects list view
const ProjectsList: React.FC = () => {
  const projects = getAllProjects();
  const [sortBy, setSortBy] = useState<SortKey>('traction');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const rankedProjects = useMemo(() => {
    const withData = projects.map(project => {
      const social = getProjectSocialData(project.id);
      return { project, social, traction: getTractionScore(social) };
    });

    // Filter
    let filtered = withData;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.project.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.project.name.toLowerCase().includes(q) ||
        p.project.description.toLowerCase().includes(q) ||
        p.project.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'followers': return b.social.followers - a.social.followers;
        case 'likes': return b.social.likes - a.social.likes;
        case 'loves': return b.social.loves - a.social.loves;
        case 'donations': return b.social.donatedAmount - a.social.donatedAmount;
        case 'name': return a.project.name.localeCompare(b.project.name);
        case 'traction':
        default: return b.traction - a.traction;
      }
    });

    return filtered;
  }, [projects, sortBy, categoryFilter, searchQuery]);

  const totalFollowers = projects.reduce((s, p) => s + getProjectSocialData(p.id).followers, 0);
  const totalDonated = projects.reduce((s, p) => s + getProjectSocialData(p.id).donatedAmount, 0);
  const topProject = rankedProjects[0];

  return (
    <div className={styles.container} style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Trophy size={28} style={{ color: '#FFC107' }} />
          <div>
            <h1 className={styles.projectName} style={{ margin: 0 }}>Project Rankings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
              {projects.length} projects ranked by community traction on Lunes Network
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
        <StatBox label="Projects" value={projects.length.toString()} icon={<Code2 size={16} color="var(--color-brand-400)" />} />
        <StatBox label="Total Followers" value={totalFollowers.toString()} icon={<UserCheck size={16} color="#26d07c" />} />
        <StatBox label="Total Donated" value={`${totalDonated} LUNES`} icon={<LunesLogo size={16} />} />
        {topProject && (
          <StatBox label="#1 Project" value={topProject.project.name} icon={<Trophy size={16} color="#FFC107" />} />
        )}
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '7px 12px', flex: '1', minWidth: 180, maxWidth: 280,
        }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text" placeholder="Search projects..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontSize: 13, width: '100%' }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '5px 10px', borderRadius: 6, border: '1px solid',
                borderColor: categoryFilter === cat ? 'var(--color-brand-400)' : 'rgba(255,255,255,0.08)',
                background: categoryFilter === cat ? 'rgba(108,56,255,0.15)' : 'rgba(255,255,255,0.03)',
                color: categoryFilter === cat ? 'var(--color-brand-400)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: 0.3, transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Sort by:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, border: '1px solid',
              borderColor: sortBy === opt.key ? 'var(--color-brand-400)' : 'rgba(255,255,255,0.06)',
              background: sortBy === opt.key ? 'rgba(108,56,255,0.15)' : 'transparent',
              color: sortBy === opt.key ? 'var(--color-brand-400)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 12, fontWeight: sortBy === opt.key ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* Register CTA */}
      <Link
        to="/project/verify"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: 'linear-gradient(135deg, #6C38FF, #9B6DFF)', color: 'white',
          textDecoration: 'none', alignSelf: 'flex-start', marginBottom: 16,
        }}
      >
        <ShieldCheck size={14} /> Verify Your Project — 1,000 LUNES
      </Link>

      {/* Ranked list */}
      {rankedProjects.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No projects match your filters
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rankedProjects.map((item, idx) => {
            const { project, social, traction } = item;
            const rank = idx + 1;
            return (
              <Link
                key={project.id}
                to={`/project/${project.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 12, textDecoration: 'none', color: 'var(--text-primary)',
                  background: rank <= 3 ? 'rgba(108,56,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${rank <= 3 ? 'rgba(108,56,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,56,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(108,56,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = rank <= 3 ? 'rgba(108,56,255,0.04)' : 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = rank <= 3 ? 'rgba(108,56,255,0.12)' : 'rgba(255,255,255,0.05)'; }}
              >
                {/* Rank */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  fontSize: rank <= 3 ? 16 : 14, flexShrink: 0,
                  background: rank === 1 ? 'linear-gradient(135deg, #FFC107, #FF9800)'
                    : rank === 2 ? 'linear-gradient(135deg, #B0BEC5, #78909C)'
                    : rank === 3 ? 'linear-gradient(135deg, #CD7F32, #A0522D)'
                    : 'rgba(255,255,255,0.05)',
                  color: rank <= 3 ? 'white' : 'var(--text-muted)',
                }}>
                  {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
                </div>

                {/* Logo */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'white',
                }}>
                  {project.id === 'lunes-network' ? <LunesLogo size={24} /> : project.name.charAt(0)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{project.name}</span>
                    <VerifiedBadge status={project.verification.status} size="sm" showLabel={false} />
                    <span className={styles.categoryBadge} data-category={project.category} style={{ fontSize: 10 }}>
                      {project.category}
                    </span>
                  </div>
                  <p style={{
                    margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {project.description}
                  </p>
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0,
                  fontSize: 12, color: 'var(--text-muted)',
                }}>
                  <MetricPill icon={<UserCheck size={12} />} value={social.followers} label="followers" highlight={sortBy === 'followers'} />
                  <MetricPill icon={<ThumbsUp size={12} />} value={social.likes} highlight={sortBy === 'likes'} />
                  <MetricPill icon={<Heart size={12} />} value={social.loves} highlight={sortBy === 'loves'} />
                  <MetricPill icon={<LunesLogo size={11} />} value={social.donatedAmount} label="LUNES" highlight={sortBy === 'donations'} />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 6,
                    background: sortBy === 'traction' ? 'rgba(108,56,255,0.12)' : 'rgba(255,255,255,0.04)',
                    color: sortBy === 'traction' ? 'var(--color-brand-400)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: 12,
                  }}>
                    <TrendingUp size={12} /> {Math.round(traction)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper: stat box for overview row
const StatBox: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
    borderRadius: 10, background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  }}>
    {icon}
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  </div>
);

// Helper: metric pill for ranked row
const MetricPill: React.FC<{ icon: React.ReactNode; value: number; label?: string; highlight?: boolean }> = ({ icon, value, label, highlight }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 3,
    color: highlight ? 'var(--color-brand-400)' : 'var(--text-muted)',
    fontWeight: highlight ? 600 : 400,
  }}>
    {icon} {value}{label ? ` ${label}` : ''}
  </div>
);

// Social stats shown on project cards
const ProjectCardStats: React.FC<{ projectId: string }> = ({ projectId }) => {
  const data = getProjectSocialData(projectId);
  if (data.likes === 0 && data.loves === 0 && data.followers === 0 && data.donatedAmount === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8,
      borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4,
      fontSize: 11, color: 'var(--text-muted)',
    }}>
      {data.likes > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <ThumbsUp size={11} /> {data.likes}
        </span>
      )}
      {data.loves > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Heart size={11} /> {data.loves}
        </span>
      )}
      {data.followers > 0 && (
        <span>{data.followers} followers</span>
      )}
      {data.donatedAmount > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <LunesLogo size={10} /> {data.donatedAmount} LUNES
        </span>
      )}
    </div>
  );
};

// Main component: route to list or detail
const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return <ProjectsList />;
  }

  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <div className={styles.container}>
        <EmptyState
          type="no-data"
          message={`Project "${slug}" not found`}
          action={{ label: 'View All Projects', onClick: () => window.location.href = '/projects' }}
        />
      </div>
    );
  }

  return <ProjectDetailView project={project} />;
};

export default ProjectDetail;
