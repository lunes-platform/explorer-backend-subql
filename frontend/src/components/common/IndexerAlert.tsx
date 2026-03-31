import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import styles from './IndexerAlert.module.css';

interface IndexerAlertProps {
  lag: number | null;
  onDismiss?: () => void;
}

export const IndexerAlert: React.FC<IndexerAlertProps> = ({ lag, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  if (lag === null || lag <= 10 || dismissed) return null;

  const isCatchingUp = lag > 1000;
  const isMinorDelay = lag <= 100;

  const message = isCatchingUp
    ? `Indexer is syncing — ${lag.toLocaleString()} blocks behind. Some indexed data (transfers, tokens) may be incomplete while catch-up is in progress.`
    : isMinorDelay
    ? `Indexer delay: ${lag} blocks behind`
    : `Indexer is ${lag.toLocaleString()} blocks behind. Indexed data may be incomplete.`;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`${styles.alert} ${isCatchingUp ? styles.info : isMinorDelay ? styles.warning : styles.warning}`}>
      {isCatchingUp ? <Info size={18} /> : <AlertTriangle size={18} />}
      <span className={styles.message}>{message}</span>
      <button onClick={handleDismiss} className={styles.dismiss} aria-label="Dismiss alert">
        <X size={14} />
      </button>
    </div>
  );
};
