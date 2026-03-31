import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { getApi, onConnectionChange } from '../services/chain';
import { GET_HOME_STATS } from '../services/graphql/queries';
import type { HomeStats } from '../types';

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

  // Query indexer for latest indexed block (polls every 15s)
  const { data: statsData, error: indexerError } = useQuery<HomeStats>(GET_HOME_STATS, {
    pollInterval: POLL_INTERVAL,
    fetchPolicy: 'network-only',
  });

  const indexerBlock = statsData?.blocks?.nodes?.[0]?.number || 0;

  const indexerLag = useMemo(() => {
    if (indexerError) return null;
    if (rpcBlock > 0 && indexerBlock > 0) {
      return Math.max(rpcBlock - indexerBlock, 0);
    }
    return null;
  }, [rpcBlock, indexerBlock, indexerError]);

  const indexerStatus = useMemo((): 'healthy' | 'delayed' | 'lagging' | 'unknown' => {
    if (indexerError) return 'unknown';
    if (indexerLag !== null) return getLagStatus(indexerLag);
    return 'unknown';
  }, [indexerLag, indexerError]);

  const health: HealthStatus = useMemo(() => ({
    rpc: { status: rpcStatus, latestBlock: rpcBlock, lastSeen: rpcLastSeen },
    indexer: { latestBlock: indexerBlock, lag: indexerLag, status: indexerStatus },
  }), [rpcStatus, rpcBlock, rpcLastSeen, indexerBlock, indexerLag, indexerStatus]);

  return health;
}
