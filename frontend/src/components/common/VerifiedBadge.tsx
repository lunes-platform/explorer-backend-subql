import React from 'react';
import { ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import type { VerificationStatus } from '../../data/knownProjects';

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZES = {
  sm: { icon: 12, font: '10px', pad: '2px 6px', gap: '3px' },
  md: { icon: 14, font: '12px', pad: '3px 8px', gap: '4px' },
  lg: { icon: 16, font: '13px', pad: '4px 10px', gap: '5px' },
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ status, size = 'md', showLabel = true }) => {
  const s = SIZES[size];

  if (status === 'verified') {
    return (
      <span
        title="Verified Project - KYC approved"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: s.gap,
          padding: s.pad,
          borderRadius: '6px',
          background: 'rgba(38, 208, 124, 0.12)',
          border: '1px solid rgba(38, 208, 124, 0.25)',
          color: '#26d07c',
          fontSize: s.font,
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <ShieldCheck size={s.icon} />
        {showLabel && 'Verified'}
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span
        title="Verification pending review"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: s.gap,
          padding: s.pad,
          borderRadius: '6px',
          background: 'rgba(234, 179, 8, 0.12)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          color: '#eab308',
          fontSize: s.font,
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <Clock size={s.icon} />
        {showLabel && 'Pending'}
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        title="Verification rejected"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: s.gap,
          padding: s.pad,
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#ef4444',
          fontSize: s.font,
          fontWeight: 600,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <ShieldAlert size={s.icon} />
        {showLabel && 'Rejected'}
      </span>
    );
  }

  // unverified - show nothing or subtle indicator
  return (
    <span
      title="Unverified project"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.pad,
        borderRadius: '6px',
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        color: 'rgba(148, 163, 184, 0.6)',
        fontSize: s.font,
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <ShieldAlert size={s.icon} />
      {showLabel && 'Unverified'}
    </span>
  );
};
