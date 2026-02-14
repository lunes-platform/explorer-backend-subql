import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ChainInfo,
  AccountInfo,
  ChainAsset,
  ChainContract,
  StakingOverview,
  DashboardStats,
  RecentBlock,
  RecentTransfer,
  NftCollection,
  RichListResult,
  BlockDetail,
  BlocksPageResult,
  ExtrinsicsPageResult,
} from '../services/chain';
import {
  getChainInfo,
  getAccountInfo,
  getAssets,
  getContracts,
  getStakingOverview,
  getDashboardStats,
  getRecentBlocks,
  getRecentTransfers,
  getAccountTransfers,
  getNftCollections,
  getAccountStaking,
  getRichList,
  getBlockByNumber,
  getBlocksPage,
  getRecentExtrinsics,
} from '../services/chain';

interface UseChainDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useChainQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  enabled: boolean = true
): UseChainDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chain data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useChainInfo(): UseChainDataResult<ChainInfo> {
  return useChainQuery(() => getChainInfo(), []);
}

export function useAccountInfo(address: string | null): UseChainDataResult<AccountInfo> {
  return useChainQuery(
    () => getAccountInfo(address!),
    [address],
    !!address
  );
}

export function useAssets(): UseChainDataResult<ChainAsset[]> {
  return useChainQuery(() => getAssets(), []);
}

export function useContracts(): UseChainDataResult<ChainContract[]> {
  return useChainQuery(() => getContracts(), []);
}

export function useStakingOverview(): UseChainDataResult<StakingOverview> {
  return useChainQuery(() => getStakingOverview(), []);
}

export function useDashboardStats(): UseChainDataResult<DashboardStats> {
  return useChainQuery(() => getDashboardStats(), []);
}

export function useRecentBlocks(count: number = 10): UseChainDataResult<RecentBlock[]> {
  return useChainQuery(() => getRecentBlocks(count), [count]);
}

export function useRecentTransfers(count: number = 20): UseChainDataResult<RecentTransfer[]> {
  return useChainQuery(() => getRecentTransfers(count), [count]);
}

export function useNftCollections(): UseChainDataResult<NftCollection[]> {
  return useChainQuery(() => getNftCollections(), []);
}

export function useRecentExtrinsics(page: number = 0, pageSize: number = 25): UseChainDataResult<ExtrinsicsPageResult> {
  return useChainQuery(() => getRecentExtrinsics(page, pageSize), [page, pageSize]);
}

export function useAccountStaking(address: string | null) {
  return useChainQuery(
    () => getAccountStaking(address!),
    [address],
    !!address
  );
}

export function useAccountTransfers(address: string | null, count: number = 30) {
  return useChainQuery<RecentTransfer[]>(
    () => getAccountTransfers(address!, count),
    [address, count],
    !!address
  );
}

export function useRichList(): UseChainDataResult<RichListResult> {
  return useChainQuery(() => getRichList(), []);
}

export function useBlockDetail(blockId: string | undefined): UseChainDataResult<BlockDetail | null> {
  return useChainQuery(
    () => getBlockByNumber(blockId!),
    [blockId],
    !!blockId
  );
}

export function useBlocksPage(page: number, pageSize: number = 25): UseChainDataResult<BlocksPageResult> {
  return useChainQuery(() => getBlocksPage(page, pageSize), [page, pageSize]);
}

export {
  type ChainInfo,
  type AccountInfo,
  type ChainAsset,
  type ChainContract,
  type StakingOverview,
  type DashboardStats,
  type RecentBlock,
  type RecentTransfer,
  type NftCollection,
  type RichListResult,
  type BlockDetail,
  type BlocksPageResult,
};
