import { useState, useEffect, useCallback } from 'react';

export type PriceAlertCondition = 'above' | 'below';
export type AlertType = 'price' | 'wallet_balance' | 'token_activity' | 'contract_activity';

export interface PriceAlert {
  id: string;
  targetPrice: number;
  condition: PriceAlertCondition;
  createdAt: number;
  triggeredAt?: number;
  active: boolean;
  paused?: boolean;
  alertType?: AlertType;
  label?: string;
  eventId?: string;
}

const STORAGE_KEY = 'lunes-explorer-price-alerts';

export function usePriceAlerts(currentPrice: number) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [triggeredAlert, setTriggeredAlert] = useState<PriceAlert | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAlerts(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    }
  }, [alerts, isLoaded]);

  // Check for triggered alerts (skip paused)
  useEffect(() => {
    if (!isLoaded || currentPrice <= 0) return;

    const eligibleAlerts = alerts.filter(a => a.active && !a.triggeredAt && !a.paused);
    
    for (const alert of eligibleAlerts) {
      const isTriggered = 
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice);
      
      if (isTriggered) {
        // Deduplication: skip if same eventId already triggered
        const eventId = `${alert.condition}-${alert.targetPrice}`;
        const isDuplicate = alerts.some(a => 
          a.id !== alert.id && a.eventId === eventId && a.triggeredAt
        );
        if (isDuplicate) continue;

        setTriggeredAlert(alert);
        setAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, triggeredAt: Date.now(), eventId } : a
        ));
        break;
      }
    }
  }, [currentPrice, alerts, isLoaded]);

  const addAlert = useCallback((targetPrice: number, condition: PriceAlertCondition, options?: { alertType?: AlertType; label?: string }) => {
    // Deduplication: prevent adding duplicate active alerts with same price+condition
    const exists = alerts.some(a => 
      a.active && !a.triggeredAt && a.targetPrice === targetPrice && a.condition === condition
    );
    if (exists) return null;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setAlerts(prev => [...prev, {
      id,
      targetPrice,
      condition,
      createdAt: Date.now(),
      active: true,
      paused: false,
      alertType: options?.alertType || 'price',
      label: options?.label,
    }]);
    return id;
  }, [alerts]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const dismissTriggered = useCallback(() => {
    setTriggeredAlert(null);
  }, []);

  const clearTriggered = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, triggeredAt: undefined, active: false } : a
    ));
    setTriggeredAlert(null);
  }, []);

  const pauseAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, paused: true } : a
    ));
  }, []);

  const resumeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, paused: false } : a
    ));
  }, []);

  const togglePause = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, paused: !a.paused } : a
    ));
  }, []);

  const activeAlerts = alerts.filter(a => a.active && !a.paused);
  const pausedAlerts = alerts.filter(a => a.active && a.paused);
  const triggeredAlerts = alerts.filter(a => a.triggeredAt).sort((a, b) => (b.triggeredAt || 0) - (a.triggeredAt || 0));

  return {
    alerts,
    activeAlerts,
    pausedAlerts,
    triggeredAlerts,
    triggeredAlert,
    isLoaded,
    addAlert,
    removeAlert,
    dismissTriggered,
    clearTriggered,
    pauseAlert,
    resumeAlert,
    togglePause,
  };
}
