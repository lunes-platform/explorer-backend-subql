import React from 'react';
import styles from './StatusBadge.module.css';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const statusConfig: Record<StatusType, { label: string; dot: string }> = {
  success: { label: 'Success', dot: styles.dotSuccess },
  error: { label: 'Failed', dot: styles.dotError },
  warning: { label: 'Warning', dot: styles.dotWarning },
  info: { label: 'Info', dot: styles.dotInfo },
  pending: { label: 'Pending', dot: styles.dotPending }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'md',
  pulse = false
}) => {
  const config = statusConfig[status];
  
  return (
    <span className={`${styles.badge} ${styles[size]} ${styles[status]} ${pulse ? styles.pulse : ''}`}>
      <span className={`${styles.dot} ${config.dot} ${pulse ? styles.animatePulse : ''}`} />
      <span className={styles.label}>{children || config.label}</span>
    </span>
  );
};
