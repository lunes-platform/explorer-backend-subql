import { useState, useEffect, useRef, useMemo } from 'react';
import { getApi, onConnectionChange } from '../services/chain';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface HealthStatus {
  rpc: {
    status: ConnectionStatus;
    latestBlock: number;
    lastSeen: number | null;
  };
  indexer: {
    latestBlock: number;
    lag: number | null;
    status: 'healthy' | 'delayed' | 'lagging' | 'unknown';
  };
}

const POLL_INTERVAL = 15_000;

function getLagStatus(lag: number): 'healthy' | 'delayed' | 'lagging' {
  if (lag <= 10) return 'healthy';
  if (lag <= 100) return 'delayed';
  return 'lagging';
}

export function useHealthStatus(): HealthStatus {
  const [rpcConnected, setRpcConnected] = useState<boolean | null>(null);
  const [rpcBlock, setRpcBlock] = useState(0);
  const [rpcLastSeen, setRpcLastSeen] = useState<number | null>(null);
  const mountedRef = useRef(true);

  // Subscribe to connection events from the chain service
  useEffect(() => {
    mountedRef.current = true;
    const unsub = onConnectionChange((connected) => {
      if (mountedRef.current) setRpcConnected(connected);
    });
    return () => { mountedRef.current = false; unsub(); };
  }, []);

  // Poll RPC latest block on interval (external system sync)
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const api = await getApi();
        if (!active) return;
        if (api.isConnected) {
          const header = await api.rpc.chain.getHeader();
          if (!active) return;
          setRpcBlock(header.number.toNumber());
          setRpcLastSeen(Date.now());
          setRpcConnected(true);
        }
      } catch {
        // getApi may throw if all endpoints fail — handled by onConnectionChange
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { active = false; clearInterval(id); };
  }, []);

  const rpcStatus: ConnectionStatus = useMemo(() => {
    if (rpcConnected === null) return 'connecting';
    return rpcConnected ? 'connected' : 'disconnected';
  }, [rpcConnected]);

  const indexerLag = useMemo(() => {
    return null; // Will be computed once indexer feed is wired
  }, []);

  const indexerStatus = useMemo(() => {
    if (indexerLag !== null) return getLagStatus(indexerLag);
    return 'unknown' as const;
  }, [indexerLag]);

  const health: HealthStatus = useMemo(() => ({
    rpc: { status: rpcStatus, latestBlock: rpcBlock, lastSeen: rpcLastSeen },
    indexer: { latestBlock: 0, lag: indexerLag, status: indexerStatus },
  }), [rpcStatus, rpcBlock, rpcLastSeen, indexerLag, indexerStatus]);

  return health;
}
