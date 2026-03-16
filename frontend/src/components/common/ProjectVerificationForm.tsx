import React, { useState } from 'react';
import { CheckCircle, Send, Loader2, Globe, Github, Mail } from 'lucide-react';
import { useProjectVerification } from '../../hooks/useProjectVerification';
import styles from './ProjectVerificationForm.module.css';

export const ProjectVerificationForm: React.FC = () => {
  const { submitRequest, isLoaded } = useProjectVerification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    github: '',
    contractAddress: '',
    tokenSymbol: '',
    contactEmail: '',
  });

  if (!isLoaded) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.description || !formData.contactEmail) return;

    setIsSubmitting(true);
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    submitRequest(formData);
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSuccess) {
    return (
      <div className={styles.success}>
        <CheckCircle size={48} color="#26d07c" />
        <h3>Verification Request Submitted!</h3>
        <p>Your project verification request has been received.</p>
        <p>We will review your submission and contact you at <strong>{formData.contactEmail}</strong> within 3-5 business days.</p>
        <button onClick={() => setIsSuccess(false)} className={styles.resetBtn}>
          Submit Another Project
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.section}>
        <h4>Project Information</h4>
        
        <div className={styles.field}>
          <label>Project Name *</label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => handleChange('projectName', e.target.value)}
            placeholder="e.g., Lunes DeFi Protocol"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your project, its purpose, and key features..."
            rows={4}
            required
          />
        </div>

        <div className={styles.field}>
          <label>
            <Globe size={14} /> Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://your-project.com"
          />
        </div>
      </div>

      <div className={styles.section}>
        <h4>Social Links</h4>
        
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Twitter / X</label>
            <input
              type="text"
              value={formData.twitter}
              onChange={(e) => handleChange('twitter', e.target.value)}
              placeholder="@username"
            />
          </div>
          <div className={styles.field}>
            <label>Telegram</label>
            <input
              type="text"
              value={formData.telegram}
              onChange={(e) => handleChange('telegram', e.target.value)}
              placeholder="t.me/groupname"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Discord</label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => handleChange('discord', e.target.value)}
              placeholder="discord.gg/invite"
            />
          </div>
          <div className={styles.field}>
            <label>
              <Github size={14} /> GitHub
            </label>
            <input
              type="text"
              value={formData.github}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder="github.com/org/repo"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Blockchain Details</h4>
        
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Contract Address</label>
            <input
              type="text"
              value={formData.contractAddress}
              onChange={(e) => handleChange('contractAddress', e.target.value)}
              placeholder="5xx... (if applicable)"
            />
          </div>
          <div className={styles.field}>
            <label>Token Symbol</label>
            <input
              type="text"
              value={formData.tokenSymbol}
              onChange={(e) => handleChange('tokenSymbol', e.target.value)}
              placeholder="e.g., LUNES"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Contact Information</h4>
        
        <div className={styles.field}>
          <label>
            <Mail size={14} /> Contact Email *
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="team@your-project.com"
            required
          />
        </div>
      </div>

      <button 
        type="submit" 
        className={styles.submitBtn}
        disabled={isSubmitting || !formData.projectName || !formData.description || !formData.contactEmail}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className={styles.spinner} />
            Submitting...
          </>
        ) : (
          <>
            <Send size={18} />
            Submit for Verification
          </>
        )}
      </button>
    </form>
  );
};
