import React from 'react';
import { AlertTriangle, X, TrendingUp, Activity, Fish } from 'lucide-react';
import type { Anomaly } from '../../hooks/useAnomalyDetection';
import styles from './AnomalyAlert.module.css';

interface AnomalyAlertProps {
  anomalies: Anomaly[];
  onDismiss?: (id: string) => void;
  maxVisible?: number;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    className: styles.critical,
    label: 'CRITICAL',
  },
  warning: {
    icon: TrendingUp,
    className: styles.warning,
    label: 'WARNING',
  },
  info: {
    icon: Activity,
    className: styles.info,
    label: 'INFO',
  },
};

const typeIcons = {
  whale_transfer: Fish,
  fee_spike: TrendingUp,
  tps_spike: Activity,
  failure_spike: AlertTriangle,
  large_contract: Activity,
};

const AnomalyAlert: React.FC<AnomalyAlertProps> = ({
  anomalies,
  onDismiss,
  maxVisible = 3,
}) => {
  if (anomalies.length === 0) return null;

  const visible = anomalies.slice(0, maxVisible);
  const remaining = anomalies.length - maxVisible;

  return (
    <div className={styles.container}>
      {visible.map((anomaly) => {
        const config = severityConfig[anomaly.severity];
        const TypeIcon = typeIcons[anomaly.type] || Activity;
        const SeverityIcon = config.icon;

        return (
          <div key={anomaly.id} className={`${styles.alert} ${config.className}`}>
            <div className={styles.header}>
              <div className={styles.badge}>
                <SeverityIcon size={14} />
                <span>{config.label}</span>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(anomaly.id)}
                  className={styles.closeButton}
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className={styles.content}>
              <div className={styles.titleRow}>
                <TypeIcon size={20} />
                <h4 className={styles.title}>{anomaly.title}</h4>
              </div>
              
              <p className={styles.description}>{anomaly.description}</p>

              {anomaly.blockNumber && (
                <div className={styles.meta}>
                  <span>Block #{anomaly.blockNumber}</span>
                  {anomaly.metric > 0 && (
                    <span className={styles.metric}>
                      {anomaly.metric.toLocaleString()} / {anomaly.threshold.toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {anomaly.recommendations.length > 0 && (
                <ul className={styles.recommendations}>
                  {anomaly.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      {remaining > 0 && (
        <div className={styles.moreIndicator}>
          +{remaining} more {remaining === 1 ? 'anomaly' : 'anomalies'} detected
        </div>
      )}
    </div>
  );
};

export default AnomalyAlert;
