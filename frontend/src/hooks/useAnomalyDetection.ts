import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export interface Anomaly {
  id: string;
  type: 'whale_transfer' | 'fee_spike' | 'tps_spike' | 'failure_spike' | 'large_contract';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  blockNumber?: number;
  txHash?: string;
  metric: number;
  threshold: number;
  recommendations: string[];
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  count: number;
  generatedAt: string;
}

export interface UseAnomalyDetectionResult {
  anomalies: Anomaly[];
  loading: boolean;
  error: string | null;
  detect: (transfers: Array<{
    amountFormatted: number;
    from: string;
    to: string;
    blockNumber: number;
    hash: string;
  }>, blocks: Array<{
    number: number;
    extrinsicCount: number;
    timestamp: number;
  }>) => Promise<void>;
  clear: () => void;
  hasCritical: boolean;
  hasWarning: boolean;
}

export function useAnomalyDetection(): UseAnomalyDetectionResult {
  const [result, setResult] = useState<AnomalyDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async (
    transfers: Array<{
      amountFormatted: number;
      from: string;
      to: string;
      blockNumber: number;
      hash: string;
    }>,
    blocks: Array<{
      number: number;
      extrinsicCount: number;
      timestamp: number;
    }>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfers, blocks }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to detect anomalies');
      }

      const data: AnomalyDetectionResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback: detect anomalies locally
      setResult({
        anomalies: detectLocalAnomalies(transfers, blocks),
        count: 0,
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const hasCritical = result?.anomalies.some(a => a.severity === 'critical') || false;
  const hasWarning = result?.anomalies.some(a => a.severity === 'warning') || false;

  return {
    anomalies: result?.anomalies || [],
    loading,
    error,
    detect,
    clear,
    hasCritical,
    hasWarning,
  };
}

// Local fallback anomaly detection
function detectLocalAnomalies(
  transfers: Array<{
    amountFormatted: number;
    from: string;
    to: string;
    blockNumber: number;
    hash: string;
  }>,
  blocks: Array<{
    number: number;
    extrinsicCount: number;
    timestamp: number;
  }>
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = Date.now();
  
  // Whale transfer detection
  transfers.forEach(tx => {
    if (tx.amountFormatted >= 1000000) {
      anomalies.push({
        id: `whale-${tx.hash}`,
        type: 'whale_transfer',
        severity: tx.amountFormatted >= 10000000 ? 'critical' : 'warning',
        title: '🐋 Whale Transfer',
        description: `${tx.amountFormatted.toLocaleString()} LUNES transferred`,
        timestamp: now,
        blockNumber: tx.blockNumber,
        txHash: tx.hash,
        metric: tx.amountFormatted,
        threshold: 1000000,
        recommendations: ['Monitor this address'],
      });
    }
  });

  // TPS spike detection
  if (blocks.length >= 2) {
    const avg = blocks.reduce((s, b) => s + b.extrinsicCount, 0) / blocks.length;
    const max = Math.max(...blocks.map(b => b.extrinsicCount));
    if (max > 100 && max > avg * 3) {
      const block = blocks.find(b => b.extrinsicCount === max);
      if (block) {
        anomalies.push({
          id: `tps-${block.number}`,
          type: 'tps_spike',
          severity: 'warning',
          title: '⚡ High Activity',
          description: `Block #${block.number}: ${max} txs (avg: ${avg.toFixed(0)})`,
          timestamp: block.timestamp || now,
          blockNumber: block.number,
          metric: max,
          threshold: 100,
          recommendations: ['Check network load'],
        });
      }
    }
  }

  return anomalies;
}
