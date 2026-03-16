import React, { useState } from 'react';
import { FolderOpen, Shield, ChevronDown, ChevronUp, Globe, MessageCircle, ExternalLink } from 'lucide-react';
import { getAllProjects } from '../../data/knownProjects';
import { ProjectVerificationForm } from '../../components/common/ProjectVerificationForm';
import styles from './Projects.module.css';

const Projects: React.FC = () => {
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const projects = getAllProjects();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FolderOpen size={28} />
          Verified Projects
        </h1>
        <p className={styles.subtitle}>
          Community-verified projects building on Lunes Network
        </p>
      </div>

      {/* Verification CTA */}
      <div className={styles.verificationCta}>
        <div className={styles.ctaContent}>
          <div className={styles.ctaIcon}>
            <Shield size={32} />
          </div>
          <div className={styles.ctaText}>
            <h3>Get Your Project Verified</h3>
            <p>Submit your project for verification to receive a verified badge and increased visibility in the Lunes ecosystem.</p>
          </div>
          <button 
            className={styles.ctaButton}
            onClick={() => setShowVerificationForm(!showVerificationForm)}
          >
            {showVerificationForm ? (
              <><ChevronUp size={18} /> Hide Form</>
            ) : (
              <><ChevronDown size={18} /> Apply for Verification</>
            )}
          </button>
        </div>

        {showVerificationForm && (
          <div className={styles.formSection}>
            <ProjectVerificationForm />
          </div>
        )}
      </div>

      {/* Projects Grid */}
      <div className={styles.projectsGrid}>
        {projects.map((project) => {
          const websiteLink = project.links.find((link) => link.type === 'website');
          const xLink = project.links.find((link) => link.type === 'x');

          return (
            <div key={project.slug} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <div className={styles.projectIcon}>
                  {project.name.charAt(0)}
                </div>
                <div className={styles.projectInfo}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={styles.verifiedBadge}>
                    <Shield size={12} /> Verified
                  </span>
                </div>
              </div>
              
              <p className={styles.projectDescription}>{project.description}</p>
              
              <div className={styles.projectLinks}>
                {websiteLink && (
                  <a 
                    href={websiteLink.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    <Globe size={14} /> {websiteLink.label || 'Website'}
                  </a>
                )}
                {xLink && (
                  <a 
                    href={xLink.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    <MessageCircle size={14} /> {xLink.label || 'X'}
                  </a>
                )}
                <a 
                  href={`/project/${project.slug}`}
                  className={styles.link}
                >
                  <ExternalLink size={14} /> Details
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className={styles.empty}>
          <FolderOpen size={48} opacity={0.3} />
          <p>No verified projects yet</p>
          <span>Be the first to submit your project for verification</span>
        </div>
      )}
    </div>
  );
};

export default Projects;
