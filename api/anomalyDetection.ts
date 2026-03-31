// Anomaly Detection Service for Pilar C (Intelligence)
// Detects network anomalies: whale transfers, fee spikes, TPS spikes, failures

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

// Thresholds for anomaly detection
const THRESHOLDS = {
  WHALE_TRANSFER: 50, // 50 LUNES (realistic for Lunes chain)
  LARGE_WHALE: 500, // 500 LUNES critical
  TPS_SPIKE: 5, // 5 extrinsics per block is notable
  CONCENTRATION: 0.5, // 50% of volume from one address
};

export function detectAnomalies(
  transfers: Array<{ amountFormatted: number; from: string; to: string; blockNumber: number; hash: string }>,
  blocks: Array<{ number: number; extrinsicCount: number; timestamp: number }>,
  recentBlocks: number = 10
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const now = Date.now();

  // 1. Detect whale transfers
  transfers.forEach(tx => {
    if (tx.amountFormatted >= THRESHOLDS.WHALE_TRANSFER) {
      const isCritical = tx.amountFormatted >= THRESHOLDS.LARGE_WHALE;
      anomalies.push({
        id: `whale-${tx.hash}-${tx.blockNumber}`,
        type: 'whale_transfer',
        severity: isCritical ? 'critical' : 'warning',
        title: isCritical ? '🐋 Large Whale Transfer' : '🐳 Notable Transfer Detected',
        description: `Transfer of ${tx.amountFormatted.toLocaleString(undefined, { maximumFractionDigits: 4 })} LUNES from ${shortenAddress(tx.from)} to ${shortenAddress(tx.to)} in block #${tx.blockNumber}`,
        timestamp: now,
        blockNumber: tx.blockNumber,
        txHash: tx.hash,
        metric: tx.amountFormatted,
        threshold: THRESHOLDS.WHALE_TRANSFER,
        recommendations: [
          'Monitor for unusual token movements',
          'Check if this is a known exchange or custody address',
          'Verify destination address ownership'
        ],
      });
    }
  });

  // 1b. Detect address concentration
  if (transfers.length > 0) {
    const totalVolume = transfers.reduce((s, t) => s + t.amountFormatted, 0);
    const senderVolume: Record<string, number> = {};
    transfers.forEach(t => {
      senderVolume[t.from] = (senderVolume[t.from] || 0) + t.amountFormatted;
    });
    Object.entries(senderVolume).forEach(([addr, vol]) => {
      const ratio = vol / totalVolume;
      if (ratio >= THRESHOLDS.CONCENTRATION && transfers.length >= 3) {
        anomalies.push({
          id: `conc-${addr}`,
          type: 'whale_transfer',
          severity: ratio >= 0.8 ? 'warning' : 'info',
          title: '🔍 Address Concentration',
          description: `Address ${shortenAddress(addr)} accounts for ${(ratio * 100).toFixed(1)}% of recent transfer volume (${vol.toFixed(2)} LUNES)`,
          timestamp: now,
          metric: ratio * 100,
          threshold: THRESHOLDS.CONCENTRATION * 100,
          recommendations: [
            'This address dominates recent activity',
            'Could indicate automated trading or batch operations',
          ],
        });
      }
    });
  }

  // 2. Detect TPS spikes and block patterns
  if (blocks.length >= 2) {
    const recent = blocks.slice(0, recentBlocks);
    const avgExtrinsics = recent.reduce((sum, b) => sum + b.extrinsicCount, 0) / recent.length;
    const maxExtrinsics = Math.max(...recent.map(b => b.extrinsicCount));
    
    // High activity block
    if (maxExtrinsics >= THRESHOLDS.TPS_SPIKE && maxExtrinsics > avgExtrinsics * 2) {
      const spikeBlock = recent.find(b => b.extrinsicCount === maxExtrinsics);
      if (spikeBlock) {
        anomalies.push({
          id: `tps-${spikeBlock.number}`,
          type: 'tps_spike',
          severity: maxExtrinsics > 20 ? 'critical' : 'warning',
          title: '⚡ Network Activity Spike',
          description: `Block #${spikeBlock.number} had ${maxExtrinsics} extrinsics (avg: ${avgExtrinsics.toFixed(1)})`,
          timestamp: spikeBlock.timestamp || now,
          blockNumber: spikeBlock.number,
          metric: maxExtrinsics,
          threshold: THRESHOLDS.TPS_SPIKE,
          recommendations: [
            'Check for market events or token launches',
            'Monitor gas prices during high activity',
            'Watch for potential spam transactions'
          ],
        });
      }
    }

    // Empty blocks pattern
    const emptyBlocks = recent.filter(b => b.extrinsicCount <= 1);
    if (emptyBlocks.length > recent.length * 0.5 && recent.length >= 5) {
      anomalies.push({
        id: `low-activity-${recent[0]?.number}`,
        type: 'tps_spike',
        severity: 'info',
        title: '📉 Low Network Activity',
        description: `${emptyBlocks.length} of ${recent.length} recent blocks have minimal activity (avg ${avgExtrinsics.toFixed(1)} extrinsics/block)`,
        timestamp: now,
        metric: emptyBlocks.length,
        threshold: recent.length * 0.5,
        recommendations: [
          'Network may be in a low-activity period',
          'This is normal during off-peak hours',
        ],
      });
    }
  }

  // 3. Network health summary (always add)
  if (blocks.length > 0 || transfers.length > 0) {
    const totalVolume = transfers.reduce((s, t) => s + t.amountFormatted, 0);
    const uniqueAddresses = new Set([...transfers.map(t => t.from), ...transfers.map(t => t.to)]);
    anomalies.push({
      id: `summary-${now}`,
      type: 'fee_spike',
      severity: 'info',
      title: '📊 Network Scan Summary',
      description: `Scanned ${blocks.length} blocks and ${transfers.length} transfers. Total volume: ${totalVolume.toFixed(4)} LUNES across ${uniqueAddresses.size} unique addresses.`,
      timestamp: now,
      metric: transfers.length,
      threshold: 0,
      recommendations: [
        `Average ${(transfers.length / Math.max(blocks.length, 1)).toFixed(1)} transfers per block`,
        uniqueAddresses.size > 0 ? `${uniqueAddresses.size} unique addresses active` : 'No active addresses in scanned range',
      ],
    });
  }

  return anomalies.sort((a, b) => b.timestamp - a.timestamp);
}

// Simple block-level anomaly detection
export function detectBlockAnomalies(
  currentBlock: { number: number; extrinsicCount: number; eventCount: number },
  historicalAvg: { extrinsics: number; events: number }
): Anomaly | null {
  // Empty block anomaly
  if (currentBlock.extrinsicCount === 0 && historicalAvg.extrinsics > 5) {
    return {
      id: `empty-${currentBlock.number}`,
      type: 'tps_spike',
      severity: 'info',
      title: '📭 Empty Block',
      description: `Block #${currentBlock.number} contains no transactions`,
      timestamp: Date.now(),
      blockNumber: currentBlock.number,
      metric: 0,
      threshold: 1,
      recommendations: ['Network may be experiencing low activity', 'Validator may have missed the slot'],
    };
  }

  // High activity block
  if (currentBlock.extrinsicCount > historicalAvg.extrinsics * 5) {
    return {
      id: `high-${currentBlock.number}`,
      type: 'tps_spike',
      severity: 'warning',
      title: '🔥 High Activity Block',
      description: `Block #${currentBlock.number} has ${currentBlock.extrinsicCount} transactions (${(currentBlock.extrinsicCount / historicalAvg.extrinsics).toFixed(1)}x avg)`,
      timestamp: Date.now(),
      blockNumber: currentBlock.number,
      metric: currentBlock.extrinsicCount,
      threshold: historicalAvg.extrinsics * 3,
      recommendations: ['Monitor network congestion', 'Check for batch transactions or contract deployments'],
    };
  }

  return null;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 14) return addr || 'unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
