import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Radar, AlertTriangle, Shield, Clock, Hash,
  Loader2, RefreshCw, Lightbulb, Sparkles, X,
} from 'lucide-react';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './AnomalyRadar.module.css';

interface Anomaly {
  id: string;
  type: string;
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

const API_BASE = 'http://localhost:4000/api';

const AnomalyRadar: React.FC = () => {
  usePageTitle('Anomaly Radar', 'Detect unusual activity on the Lunes blockchain. Scan for large transfers, whale movements, and suspicious patterns.');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [lastScan, setLastScan] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocksScanned, setBlocksScanned] = useState(0);
  const [transfersFound, setTransfersFound] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const health = useHealthStatus();
  const rpcHealth = health.rpc.status === 'connected' ? 'healthy' as const
    : health.rpc.status === 'connecting' ? 'delayed' as const : 'disconnected' as const;

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setAiAnalysis(null);
    setScanProgress('Fetching recent blocks and transfers from RPC...');
    abortRef.current = new AbortController();

    try {
      // Step 1: Call backend scan endpoint that fetches data from RPC
      setScanProgress('Scanning blockchain for anomalies...');
      const res = await fetch(`${API_BASE}/anomalies/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockCount: 20, transferCount: 50 }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setAnomalies(data.anomalies || []);
      setBlocksScanned(data.blocksScanned || 0);
      setTransfersFound(data.transfersFound || 0);
      setLastScan(Date.now());
      setScanProgress('');

      // Step 2: Get AI analysis of results
      if (data.anomalies?.length > 0) {
        setAiLoading(true);
        try {
          const aiRes = await fetch(`${API_BASE}/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'block',
              data: {
                number: data.blocksScanned,
                extrinsicCount: data.transfersFound,
                anomalyCount: data.anomalies.length,
                criticalCount: data.anomalies.filter((a: Anomaly) => a.severity === 'critical').length,
                warningCount: data.anomalies.filter((a: Anomaly) => a.severity === 'warning').length,
                sources: data.anomalies.map((a: Anomaly) => `${a.severity}: ${a.title}`),
              },
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            setAiAnalysis(aiData.explanation);
          }
        } catch { /* AI is optional */ }
        setAiLoading(false);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to run anomaly scan');
      }
      setScanProgress('');
    } finally {
      setScanning(false);
    }
  }, []);

  const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
  const warningCount = anomalies.filter(a => a.severity === 'warning').length;
  const infoCount = anomalies.filter(a => a.severity === 'info').length;

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} color="#ff284c" />;
      case 'warning': return <AlertTriangle size={16} color="#fe9f00" />;
      default: return <Shield size={16} color="#6c38ff" />;
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className={styles.title}>Anomaly Radar</h1>
          <p className={styles.subtitle}>
            AI-powered network anomaly detection — whale transfers, TPS spikes, and unusual activity
          </p>
          <DataSourceBadge
            source="RPC + API"
            updatedAt={lastScan ? `Scanned ${new Date(lastScan).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : undefined}
            loading={scanning}
            health={rpcHealth}
          />
        </div>
        <button
          className={styles.scanButton}
          onClick={runScan}
          disabled={scanning}
        >
          {scanning ? (
            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</>
          ) : (
            <><RefreshCw size={16} /> {lastScan ? 'Re-scan' : 'Run Scan'}</>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statPill}>
          <Radar size={16} />
          <span>Total: <strong>{anomalies.length}</strong></span>
        </div>
        {criticalCount > 0 && (
          <div className={styles.statPill}>
            <AlertTriangle size={14} color="#ff284c" />
            <span>Critical: <strong style={{ color: '#ff284c' }}>{criticalCount}</strong></span>
          </div>
        )}
        {warningCount > 0 && (
          <div className={styles.statPill}>
            <AlertTriangle size={14} color="#fe9f00" />
            <span>Warning: <strong style={{ color: '#fe9f00' }}>{warningCount}</strong></span>
          </div>
        )}
        {infoCount > 0 && (
          <div className={styles.statPill}>
            <Shield size={14} color="#6c38ff" />
            <span>Info: <strong style={{ color: '#6c38ff' }}>{infoCount}</strong></span>
          </div>
        )}
        <div className={styles.statPill}>
          <span>Blocks scanned: <strong>{blocksScanned}</strong></span>
        </div>
        <div className={styles.statPill}>
          <span>Transfers analyzed: <strong>{transfersFound}</strong></span>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(255, 40, 76, 0.06)', border: '1px solid rgba(255, 40, 76, 0.15)',
          color: '#ff6464', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* AI Analysis */}
      {(aiAnalysis || aiLoading) && (
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(108, 56, 255, 0.06)', border: '1px solid rgba(108, 56, 255, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-brand-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Sparkles size={14} /> AI Analysis
            </span>
            {aiAnalysis && (
              <button onClick={() => setAiAnalysis(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                <X size={14} color="var(--text-muted)" />
              </button>
            )}
          </div>
          {aiLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Analyzing scan results with AI...
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{aiAnalysis}</p>
          )}
        </div>
      )}

      {/* Anomaly List */}
      {anomalies.length > 0 ? (
        <div className={styles.anomalyList}>
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className={`${styles.anomalyCard} ${styles[anomaly.severity]}`}>
              <div className={styles.anomalyHeader}>
                <span className={styles.anomalyTitle}>
                  {anomaly.title}
                </span>
                <span className={`${styles.severityBadge} ${styles[anomaly.severity]}`}>
                  {severityIcon(anomaly.severity)}
                  {anomaly.severity}
                </span>
              </div>

              <p className={styles.anomalyDescription}>{anomaly.description}</p>

              <div className={styles.anomalyMeta}>
                {anomaly.blockNumber && (
                  <span>
                    <Hash size={12} />
                    <Link to={`/block/${anomaly.blockNumber}`} style={{ color: 'var(--color-brand-400)', textDecoration: 'none' }}>
                      Block #{anomaly.blockNumber.toLocaleString()}
                    </Link>
                  </span>
                )}
                <span>
                  <Clock size={12} />
                  {new Date(anomaly.timestamp).toLocaleTimeString()}
                </span>
                {anomaly.threshold > 0 && (
                  <span>
                    Metric: <strong>{anomaly.metric.toLocaleString()}</strong> / Threshold: {anomaly.threshold.toLocaleString()}
                  </span>
                )}
              </div>

              {anomaly.recommendations.length > 0 && (
                <div className={styles.recommendations}>
                  {anomaly.recommendations.map((rec, i) => (
                    <span key={i}>
                      <Lightbulb size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                      {rec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : scanning ? (
        <div className={styles.emptyState}>
          <Loader2 size={48} style={{ color: 'var(--color-brand-400)', marginBottom: 16, animation: 'spin 1s linear infinite' }} />
          <h3>Scanning Network...</h3>
          <p>{scanProgress || 'Analyzing blockchain data...'}</p>
        </div>
      ) : lastScan ? (
        <div className={styles.emptyState}>
          <Shield size={48} style={{ color: 'var(--color-success)', marginBottom: 16 }} />
          <h3>No Anomalies Detected</h3>
          <p>The network looks healthy. No whale transfers, TPS spikes, or unusual activity found in the recent data.</p>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Radar size={48} style={{ color: 'var(--color-brand-400)', marginBottom: 16 }} />
          <h3>Ready to Scan</h3>
          <p>Click "Run Scan" to analyze recent blocks and transfers for anomalies.</p>
        </div>
      )}
    </div>
  );
};

export default AnomalyRadar;
