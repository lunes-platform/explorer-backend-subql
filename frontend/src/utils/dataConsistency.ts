import { useState, useEffect, useRef } from 'react';

export interface DataSourceComparison<T> {
  rpc: T | null;
  indexer: T | null;
  match: boolean;
  discrepancy?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ConsistencyCheckResult {
  field: string;
  rpcValue: unknown;
  indexerValue: unknown;
  match: boolean;
  tolerance?: number;
  discrepancy?: string;
}

/**
 * BL-TRUST-001: Compare values from RPC and Indexer with tolerance support
 */
export function compareValues(
  rpcValue: number | string | boolean | null,
  indexerValue: number | string | boolean | null,
  field: string,
  tolerance?: number
): ConsistencyCheckResult {
  // Handle null cases
  if (rpcValue === null && indexerValue === null) {
    return { field, rpcValue, indexerValue, match: true };
  }
  if (rpcValue === null || indexerValue === null) {
    return {
      field,
      rpcValue,
      indexerValue,
      match: false,
      discrepancy: `${field}: RPC=${rpcValue}, Indexer=${indexerValue} (one source missing)`,
    };
  }

  // Numeric comparison with tolerance
  if (typeof rpcValue === 'number' && typeof indexerValue === 'number') {
    const diff = Math.abs(rpcValue - indexerValue);
    const allowedDiff = tolerance !== undefined 
      ? tolerance 
      : Math.max(Math.abs(rpcValue), Math.abs(indexerValue)) * 0.001; // 0.1% default tolerance
    
    const match = diff <= allowedDiff;
    return {
      field,
      rpcValue,
      indexerValue,
      match,
      tolerance: allowedDiff,
      discrepancy: match ? undefined : `${field}: RPC=${rpcValue}, Indexer=${indexerValue}, diff=${diff.toFixed(6)}`,
    };
  }

  // String comparison (exact)
  if (typeof rpcValue === 'string' && typeof indexerValue === 'string') {
    const match = rpcValue.toLowerCase() === indexerValue.toLowerCase();
    return {
      field,
      rpcValue,
      indexerValue,
      match,
      discrepancy: match ? undefined : `${field}: RPC="${rpcValue}", Indexer="${indexerValue}"`,
    };
  }

  // Boolean comparison
  if (typeof rpcValue === 'boolean' && typeof indexerValue === 'boolean') {
    const match = rpcValue === indexerValue;
    return {
      field,
      rpcValue,
      indexerValue,
      match,
      discrepancy: match ? undefined : `${field}: RPC=${rpcValue}, Indexer=${indexerValue}`,
    };
  }

  // Type mismatch
  return {
    field,
    rpcValue,
    indexerValue,
    match: false,
    discrepancy: `${field}: Type mismatch RPC=${typeof rpcValue}, Indexer=${typeof indexerValue}`,
  };
}

/**
 * BL-TRUST-001: Hook for monitoring data consistency between RPC and Indexer
 */
export function useDataConsistency<T extends Record<string, unknown>>(
  rpcData: T | null,
  indexerData: T | null,
  toleranceConfig?: Partial<Record<keyof T, number>>
) {
  const [checks, setChecks] = useState<ConsistencyCheckResult[]>([]);
  const [isConsistent, setIsConsistent] = useState(true);
  const [discrepancies, setDiscrepancies] = useState<string[]>([]);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // Throttle checks to once per second
    const now = Date.now();
    if (now - lastCheckRef.current < 1000) return;
    lastCheckRef.current = now;

    if (!rpcData || !indexerData) {
      setChecks([]);
      setIsConsistent(true);
      setDiscrepancies([]);
      return;
    }

    const newChecks: ConsistencyCheckResult[] = [];
    const keys = new Set([...Object.keys(rpcData), ...Object.keys(indexerData)]) as Set<keyof T>;

    keys.forEach((key) => {
      const tolerance = toleranceConfig?.[key];
      const check = compareValues(
        rpcData[key] as number | string | boolean | null,
        indexerData[key] as number | string | boolean | null,
        String(key),
        tolerance
      );
      newChecks.push(check);
    });

    const failedChecks = newChecks.filter(c => !c.match);
    setChecks(newChecks);
    setIsConsistent(failedChecks.length === 0);
    setDiscrepancies(failedChecks.map(c => c.discrepancy).filter(Boolean) as string[]);
  }, [rpcData, indexerData, toleranceConfig]);

  return {
    checks,
    isConsistent,
    discrepancies,
    mismatchCount: discrepancies.length,
  };
}

/**
 * BL-TRUST-001: Hook specifically for account balance consistency
 */
export function useAccountConsistency(
  rpcBalance: { free: string; reserved: string; total: string } | null,
  indexerBalance: { free: string; reserved: string; total: string } | null,
  decimals: number = 8
) {
  const [result, setResult] = useState<{
    isConsistent: boolean;
    discrepancies: string[];
    diffFormatted: { free: number; reserved: number; total: number };
  }>({ isConsistent: true, discrepancies: [], diffFormatted: { free: 0, reserved: 0, total: 0 } });

  useEffect(() => {
    if (!rpcBalance || !indexerBalance) {
      setResult({ isConsistent: true, discrepancies: [], diffFormatted: { free: 0, reserved: 0, total: 0 } });
      return;
    }

    const discrepancies: string[] = [];
    const diffFormatted = { free: 0, reserved: 0, total: 0 };

    // Compare free balance
    const rpcFree = Number(BigInt(rpcBalance.free)) / Math.pow(10, decimals);
    const idxFree = Number(BigInt(indexerBalance.free)) / Math.pow(10, decimals);
    diffFormatted.free = Math.abs(rpcFree - idxFree);
    if (diffFormatted.free > 0.01) {
      discrepancies.push(`Free balance: RPC=${rpcFree.toFixed(4)}, Indexer=${idxFree.toFixed(4)}, diff=${diffFormatted.free.toFixed(4)}`);
    }

    // Compare reserved balance
    const rpcReserved = Number(BigInt(rpcBalance.reserved)) / Math.pow(10, decimals);
    const idxReserved = Number(BigInt(indexerBalance.reserved)) / Math.pow(10, decimals);
    diffFormatted.reserved = Math.abs(rpcReserved - idxReserved);
    if (diffFormatted.reserved > 0.01) {
      discrepancies.push(`Reserved balance: RPC=${rpcReserved.toFixed(4)}, Indexer=${idxReserved.toFixed(4)}, diff=${diffFormatted.reserved.toFixed(4)}`);
    }

    // Compare total balance
    const rpcTotal = Number(BigInt(rpcBalance.total)) / Math.pow(10, decimals);
    const idxTotal = Number(BigInt(indexerBalance.total)) / Math.pow(10, decimals);
    diffFormatted.total = Math.abs(rpcTotal - idxTotal);
    if (diffFormatted.total > 0.01) {
      discrepancies.push(`Total balance: RPC=${rpcTotal.toFixed(4)}, Indexer=${idxTotal.toFixed(4)}, diff=${diffFormatted.total.toFixed(4)}`);
    }

    setResult({
      isConsistent: discrepancies.length === 0,
      discrepancies,
      diffFormatted,
    });
  }, [rpcBalance, indexerBalance, decimals]);

  return result;
}

/**
 * BL-TRUST-001: Component-ready trust indicator
 */
export interface TrustIndicator {
  status: 'trusted' | 'warning' | 'untrusted';
  source: 'rpc' | 'indexer' | 'hybrid';
  confidence: 'high' | 'medium' | 'low';
  message: string;
  discrepancies?: string[];
}

export function calculateTrustStatus(
  rpcData: unknown,
  indexerData: unknown,
  preference: 'rpc' | 'indexer' = 'rpc'
): TrustIndicator {
  // No data available
  if (!rpcData && !indexerData) {
    return {
      status: 'untrusted',
      source: 'rpc',
      confidence: 'low',
      message: 'No data available from any source',
    };
  }

  // Only one source available
  if (!rpcData) {
    return {
      status: 'warning',
      source: 'indexer',
      confidence: 'medium',
      message: 'Using indexer data only (RPC unavailable)',
    };
  }
  if (!indexerData) {
    return {
      status: 'warning',
      source: 'rpc',
      confidence: 'medium',
      message: 'Using RPC data only (indexer unavailable)',
    };
  }

  // Both sources available - basic equality check
  const rpcStr = JSON.stringify(rpcData);
  const idxStr = JSON.stringify(indexerData);
  const match = rpcStr === idxStr;

  if (match) {
    return {
      status: 'trusted',
      source: 'hybrid',
      confidence: 'high',
      message: 'RPC and indexer data match',
    };
  }

  // Data mismatch - use preference
  return {
    status: 'warning',
    source: preference,
    confidence: 'medium',
    message: `Data mismatch: using ${preference.toUpperCase()} (preferred)`,
    discrepancies: ['Data mismatch between RPC and indexer'],
  };
}
