import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Plus } from 'lucide-react';
import Card from '../common/Card';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { LunesLogo } from '../common/LunesLogo';
import type { KnownProject } from '../../data/knownProjects';
import { useProjects } from '../../hooks/useProjects';
import { getProjectSocialData } from '../../hooks/useSocialInteractions';

interface SimilarProjectsProps {
  currentProject: KnownProject;
}

export const SimilarProjects: React.FC<SimilarProjectsProps> = ({ currentProject }) => {
  const { projects } = useProjects();

  const similarProjects = useMemo(() => {
    // Filter out current project and get candidates
    const candidates = projects.filter(p => p.id !== currentProject.id);

    // Score each project based on similarity
    const scored = candidates.map(project => {
      let score = 0;

      // Same category (primary factor) - +10 points
      if (project.category === currentProject.category) {
        score += 10;
      }

      // Same verification status - +5 points
      if (project.verification.status === currentProject.verification.status) {
        score += 5;
      }

      // Shared tags (secondary factor) - +3 points per tag
      const sharedTags = project.tags.filter(tag =>
        currentProject.tags.includes(tag)
      );
      score += sharedTags.length * 3;

      // Same status (active, development, etc) - +2 points
      if (project.status === currentProject.status) {
        score += 2;
      }

      return { project, score, sharedTags };
    });

    // Sort by score descending and take top 3
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).filter(s => s.score > 0);
  }, [projects, currentProject]);

  // Get primary tag for CTA (first tag of current project or category)
  const primaryTag = currentProject.tags[0] || currentProject.category;

  if (similarProjects.length === 0) {
    return (
      <Card title="Similar Projects" icon={<Sparkles size={18} />}>
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-muted)',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: 14 }}>
            No similar projects found yet.
          </p>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6C38FF, #9B6DFF)',
              color: 'white',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Register a {primaryTag} project
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Similar Projects" icon={<Sparkles size={18} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {similarProjects.map(({ project, sharedTags }) => {
          const social = getProjectSocialData(project.id);
          return (
            <Link
              key={project.id}
              to={`/project/${project.slug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(108,56,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(108,56,255,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              {/* Logo */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}>
                {project.id === 'lunes-network' ? <LunesLogo size={20} /> : project.name.charAt(0)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 2,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {project.name}
                  </span>
                  <VerifiedBadge status={project.verification.status} size="sm" showLabel={false} />
                  {project.category === currentProject.category && (
                    <span style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(108, 56, 255, 0.15)',
                      color: 'var(--color-brand-400)',
                      textTransform: 'uppercase',
                    }}>
                      Same category
                    </span>
                  )}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {project.description}
                </p>
                {sharedTags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}>
                    {sharedTags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          color: 'var(--color-brand-400)',
                          background: 'rgba(108, 56, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social stats */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 2,
                fontSize: 11,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {social.followers > 0 && (
                  <span>{social.followers} followers</span>
                )}
                {social.likes > 0 && (
                  <span>{social.likes} likes</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA to add more */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--color-brand-400)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <Plus size={14} />
          Add your {primaryTag} project
        </Link>
      </div>
    </Card>
  );
};
