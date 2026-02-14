import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import Card from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
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
    bannerUrl: ''
  });

  const [teamMembers, setTeamMembers] = useState([
    { name: '', role: '', linkedin: '', x: '' }
  ]);

  const [roadmap, setRoadmap] = useState([
    { quarter: '', title: '', description: '', status: 'Upcoming' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitted(true);
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
              <label className={styles.label}>Logo URL</label>
              <input
                type="url"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="https://... (recommended: 200x200px)"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Banner URL</label>
              <input
                type="url"
                name="bannerUrl"
                value={formData.bannerUrl}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="https://... (recommended: 1200x400px)"
              />
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

        {/* Submit */}
        <div className={styles.submitSection}>
          <div className={styles.verificationNotice}>
            <AlertCircle size={20} />
            <span>
              Your project will be reviewed by the Lunes team before being verified. 
              This process typically takes 3-5 business days.
            </span>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
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
        </div>
      </form>
    </div>
  );
};

export default ProjectRegister;
