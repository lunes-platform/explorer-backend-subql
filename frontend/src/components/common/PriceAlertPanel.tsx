import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceAlerts, type PriceAlertCondition } from '../../hooks/usePriceAlerts';
import styles from './PriceAlertPanel.module.css';

const SEEN_KEY = 'lunes-alerts-seen-count';

interface PriceAlertPanelProps {
  currentPrice: number;
}

export const PriceAlertPanel: React.FC<PriceAlertPanelProps> = ({ currentPrice }) => {
  const { activeAlerts, triggeredAlerts, triggeredAlert, addAlert, removeAlert, clearTriggered, isLoaded } = usePriceAlerts(currentPrice);
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<PriceAlertCondition>('above');
  const [seenCount, setSeenCount] = useState(() => {
    try { return parseInt(localStorage.getItem(SEEN_KEY) || '0', 10); } catch { return 0; }
  });
  const panelRef = useRef<HTMLDivElement>(null);

  const newCount = Math.max(0, activeAlerts.length - seenCount);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setSeenCount(activeAlerts.length);
      localStorage.setItem(SEEN_KEY, String(activeAlerts.length));
    }
  };

  if (!isLoaded) return null;

  const handleAddAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    addAlert(price, condition);
    setTargetPrice('');
  };

  return (
    <>
      {/* Triggered Alert Banner */}
      {triggeredAlert && (
        <div className={styles.triggeredBanner}>
          <Bell size={18} />
          <span>
            🔔 Price Alert: LUNES is now ${currentPrice.toFixed(4)} 
            ({triggeredAlert.condition === 'above' ? 'above' : 'below'} ${triggeredAlert.targetPrice.toFixed(4)})
          </span>
          <button onClick={() => clearTriggered(triggeredAlert.id)} className={styles.dismissBtn}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Alert Panel */}
      <div className={styles.dropdown} ref={panelRef}>
        <button 
          className={styles.trigger} 
          onClick={handleToggle}
          title="Price Alerts"
        >
          <Bell size={16} />
          {newCount > 0 && <span className={styles.badge}>{newCount}</span>}
        </button>

        {isOpen && (
          <div className={styles.menu}>
            <div className={styles.header}>
              <h4>Price Alerts</h4>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                <X size={14} />
              </button>
            </div>

            <div className={styles.currentPrice}>
              Current: <strong>${currentPrice.toFixed(4)}</strong>
            </div>

            {/* Add New Alert */}
            <div className={styles.addSection}>
              <div className={styles.conditionToggle}>
                <button 
                  className={condition === 'above' ? styles.active : ''}
                  onClick={() => setCondition('above')}
                >
                  <TrendingUp size={14} /> Above
                </button>
                <button 
                  className={condition === 'below' ? styles.active : ''}
                  onClick={() => setCondition('below')}
                >
                  <TrendingDown size={14} /> Below
                </button>
              </div>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Target price..."
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className={styles.priceInput}
                />
                <button 
                  onClick={handleAddAlert}
                  disabled={!targetPrice || parseFloat(targetPrice) <= 0}
                  className={styles.addBtn}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Active Alerts List */}
            {activeAlerts.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={20} opacity={0.3} />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className={styles.alertList}>
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className={styles.alertItem}>
                    <div className={styles.alertInfo}>
                      <span className={styles.alertCondition}>
                        {alert.condition === 'above' ? (
                          <><TrendingUp size={12} /> Above</>
                        ) : (
                          <><TrendingDown size={12} /> Below</>
                        )}
                      </span>
                      <span className={styles.alertPrice}>${alert.targetPrice.toFixed(4)}</span>
                    </div>
                    <button 
                      onClick={() => removeAlert(alert.id)}
                      className={styles.removeBtn}
                      title="Remove alert"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Triggered Alerts History */}
            {triggeredAlerts.length > 0 && (
              <div className={styles.historySection}>
                <button 
                  className={styles.historyToggle}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide' : 'Show'} History ({triggeredAlerts.length})
                </button>
                {showHistory && (
                  <div className={styles.historyList}>
                    {triggeredAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className={styles.historyItem}>
                        <span className={styles.historyCondition}>
                          {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.targetPrice.toFixed(4)}
                        </span>
                        <span className={styles.historyTime}>
                          {new Date(alert.triggeredAt || 0).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
