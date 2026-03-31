import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Globe,
  FileText,
  Github,
  MessageCircle,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  Info,
  Wallet
} from 'lucide-react';
import Card from '../../components/common/Card';
import ImageUpload from '../../components/common/ImageUpload';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { useProjectMutations } from '../../hooks/useProjects';
import { WS_ENDPOINTS } from '../../config';
import type { ProjectLink, ProjectMilestone } from '../../data/knownProjects';
import styles from './ProjectRegister.module.css';

const CATEGORIES = [
  'Token',
  'NFT',
  'DeFi',
  'Gaming',
  'Infrastructure',
  'DAO',
  'Other'
];

const ProjectRegister: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get('assetId');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Token',
    website: '',
    whitepaper: '',
    github: '',
    x: '',
    discord: '',
    telegram: '',
    logoUrl: '',
    bannerUrl: '',
    donationAddress: ''
  });

  const [teamMembers, setTeamMembers] = useState([
    { name: '', role: '', linkedin: '', x: '' }
  ]);

  const [roadmap, setRoadmap] = useState([
    { quarter: '', title: '', description: '', status: 'Upcoming' }
  ]);

  const { isConnected, connect, wallet } = useWalletAuth();
  const { create, saving: isSubmitting, error: apiError } = useProjectMutations();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Asset issuer validation when assetId is provided in URL
  const [assetOwner, setAssetOwner] = useState<string | null>(null);
  const [assetOwnerChecked, setAssetOwnerChecked] = useState(false);

  useEffect(() => {
    if (!assetId) { setAssetOwnerChecked(true); return; }
    (async () => {
      try {
        const { ApiPromise, WsProvider } = await import('@polkadot/api');
        const wsProvider = new WsProvider(WS_ENDPOINTS);
        const api = await ApiPromise.create({ provider: wsProvider });
        const assetInfo = await (api.query.assets as any).asset(assetId);
        await api.disconnect();
        if (assetInfo.isSome) {
          const info = assetInfo.unwrap();
          setAssetOwner(info.admin?.toString() || info.owner?.toString() || null);
        } else {
          setAssetOwner(null);
        }
      } catch (err) {
        console.warn('[AssetOwner] RPC check failed:', err);
        setAssetOwner(null);
      } finally {
        setAssetOwnerChecked(true);
      }
    })();
  }, [assetId]);

  const connectedAddress = wallet?.account?.address;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setTeamMembers(newMembers);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '', linkedin: '', x: '' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleRoadmapChange = (index: number, field: string, value: string) => {
    const newRoadmap = [...roadmap];
    newRoadmap[index] = { ...newRoadmap[index], [field]: value };
    setRoadmap(newRoadmap);
  };

  const addRoadmapItem = () => {
    setRoadmap([...roadmap, { quarter: '', title: '', description: '', status: 'Upcoming' }]);
  };

  const removeRoadmapItem = (index: number) => {
    setRoadmap(roadmap.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!isConnected || !wallet?.account?.address) {
      setSubmitError('Please connect your wallet first.');
      return;
    }

    if (assetId && assetOwnerChecked && assetOwner !== null) {
      if (assetOwner.toLowerCase() !== wallet.account.address.toLowerCase()) {
        setSubmitError(
          `Only the asset issuer (${assetOwner.slice(0, 8)}...${assetOwner.slice(-6)}) can register a project for asset #${assetId}.`
        );
        return;
      }
    }

    const links: ProjectLink[] = [];
    if (formData.website) links.push({ type: 'website', url: formData.website, label: 'Website' });
    if (formData.github) links.push({ type: 'github', url: formData.github, label: 'GitHub' });
    if (formData.x) links.push({ type: 'x', url: formData.x, label: 'X' });
    if (formData.discord) links.push({ type: 'discord', url: formData.discord, label: 'Discord' });
    if (formData.telegram) links.push({ type: 'telegram', url: formData.telegram, label: 'Telegram' });
    if (formData.whitepaper) links.push({ type: 'docs', url: formData.whitepaper, label: 'Whitepaper' });

    const milestones: ProjectMilestone[] = roadmap
      .filter(r => r.title.trim())
      .map(r => ({
        title: r.title,
        date: r.quarter,
        status: r.status === 'Completed' ? 'completed' as const : r.status === 'In Progress' ? 'in-progress' as const : 'planned' as const,
        description: r.description,
      }));

    const result = await create({
      name: formData.name,
      category: formData.category.toLowerCase() as any,
      description: formData.description,
      logo: formData.logoUrl,
      links,
      team: teamMembers.filter(m => m.name.trim()).map(m => ({ name: m.name, role: m.role })),
      milestones,
      tags: [],
      contractAddresses: [],
      tokenIds: [],
      nftCollectionIds: [],
      assetIds: assetId ? [assetId] : [],
      ownerAddress: wallet.account.address,
      donationAddress: formData.donationAddress || undefined,
    });

    if (result) {
      setSubmitted(true);
    } else {
      setSubmitError(apiError || 'Failed to register project. Make sure the API server is running (port 4000).');
    }
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <CheckCircle size={64} color="#26D07C" />
          <h2>Registration Submitted!</h2>
          <p>
            Your project will be reviewed and verified by the Lunes team. 
            You will be notified once the verification is complete.
          </p>
          <button 
            onClick={() => navigate('/assets')}
            className={styles.backButton}
          >
            View Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backLink}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className={styles.title}>Register Project</h1>
        <p className={styles.subtitle}>
          Register your token, NFT collection, or project on the Lunes blockchain
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Information */}
        <Card title="Basic Information" icon={<Info size={18} />}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Project Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={styles.input}
                placeholder="e.g., Lunes Protocol"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className={styles.select}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className={styles.textarea}
                rows={4}
                placeholder="Describe your project, its purpose, and key features..."
              />
            </div>
          </div>
        </Card>

        {/* Links */}
        <Card title="Project Links" icon={<Globe size={18} />}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Website</label>
              <div className={styles.inputWithIcon}>
                <Globe size={16} />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Whitepaper</label>
              <div className={styles.inputWithIcon}>
                <FileText size={16} />
                <input
                  type="url"
                  name="whitepaper"
                  value={formData.whitepaper}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>GitHub</label>
              <div className={styles.inputWithIcon}>
                <Github size={16} />
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>X (formerly Twitter)</label>
              <div className={styles.inputWithIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <input
                  type="url"
                  name="x"
                  value={formData.x}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://x.com/..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Discord</label>
              <div className={styles.inputWithIcon}>
                <MessageCircle size={16} />
                <input
                  type="url"
                  name="discord"
                  value={formData.discord}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://discord.gg/..."
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Telegram</label>
              <div className={styles.inputWithIcon}>
                <Send size={16} />
                <input
                  type="url"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="https://t.me/..."
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Media */}
        <Card title="Project Media" icon={<Upload size={18} />}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <ImageUpload
                label="Logo (recommended: 200x200px)"
                value={formData.logoUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
                placeholder="https://..."
              />
            </div>

            <div className={styles.formGroup}>
              <ImageUpload
                label="Banner (recommended: 1200x400px)"
                value={formData.bannerUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, bannerUrl: url }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </Card>

        {/* Donation Wallet */}
        <Card title="Donation Wallet" icon={<Wallet size={18} />}>
          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Lunes Wallet Address for Donations</label>
              <div className={styles.inputWithIcon}>
                <Wallet size={16} />
                <input
                  type="text"
                  name="donationAddress"
                  value={formData.donationAddress}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="5C... (SS58 Lunes address)"
                  maxLength={60}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Optional. This address will receive LUNES donations from the "Donate LUNES" button on your project page. Leave blank to disable donations.
              </p>
            </div>
          </div>
        </Card>

        {/* Team Members */}
        <Card title="Team Members" icon={<Info size={18} />}>
          <div className={styles.dynamicList}>
            {teamMembers.map((member, index) => (
              <div key={index} className={styles.dynamicItem}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                      className={styles.input}
                      placeholder="Name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                      className={styles.input}
                      placeholder="Role (e.g., CEO)"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="url"
                      value={member.linkedin}
                      onChange={(e) => handleTeamMemberChange(index, 'linkedin', e.target.value)}
                      className={styles.input}
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      value={member.x}
                      onChange={(e) => handleTeamMemberChange(index, 'x', e.target.value)}
                      className={styles.input}
                      placeholder="X handle"
                    />
                  </div>
                </div>
                {teamMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeamMember(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTeamMember}
              className={styles.addButton}
            >
              + Add Team Member
            </button>
          </div>
        </Card>

        {/* Roadmap */}
        <Card title="Roadmap" icon={<Info size={18} />}>
          <div className={styles.dynamicList}>
            {roadmap.map((item, index) => (
              <div key={index} className={styles.dynamicItem}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      value={item.quarter}
                      onChange={(e) => handleRoadmapChange(index, 'quarter', e.target.value)}
                      className={styles.input}
                      placeholder="Q1 2024"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleRoadmapChange(index, 'title', e.target.value)}
                      className={styles.input}
                      placeholder="Milestone title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <select
                      value={item.status}
                      onChange={(e) => handleRoadmapChange(index, 'status', e.target.value)}
                      className={styles.select}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Upcoming">Upcoming</option>
                    </select>
                  </div>
                  <div className={styles.formGroupFull}>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleRoadmapChange(index, 'description', e.target.value)}
                      className={styles.textarea}
                      rows={2}
                      placeholder="Description of this milestone..."
                    />
                  </div>
                </div>
                {roadmap.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoadmapItem(index)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRoadmapItem}
              className={styles.addButton}
            >
              + Add Roadmap Item
            </button>
          </div>
        </Card>

        {/* Asset issuer warning */}
        {assetId && assetOwnerChecked && assetOwner !== null && connectedAddress &&
          assetOwner.toLowerCase() !== connectedAddress.toLowerCase() && (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.3)', color: '#ffa500', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Asset ownership mismatch:</strong> Asset #{assetId} was issued by{' '}
              <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{assetOwner.slice(0, 10)}...{assetOwner.slice(-8)}</code>.
              {' '}Only the asset issuer can register a project for this token. Connect the correct wallet to proceed.
            </span>
          </div>
        )}

        {/* Submit */}
        <div className={styles.submitSection}>
          <div className={styles.verificationNotice}>
            <AlertCircle size={20} />
            <span>
              Your project will be reviewed by the Lunes team before being verified. 
              This process typically takes 3-5 business days.
            </span>
          </div>

          {submitError && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', color: '#ff4d6a', fontSize: 13, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          {!isConnected ? (
            <button
              type="button"
              onClick={() => connect()}
              className={styles.submitButton}
            >
              <Wallet size={20} />
              Connect Wallet to Submit
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || (
                assetId !== null && assetOwnerChecked && assetOwner !== null && connectedAddress != null &&
                assetOwner.toLowerCase() !== connectedAddress.toLowerCase()
              )}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Submit for Verification
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProjectRegister;
