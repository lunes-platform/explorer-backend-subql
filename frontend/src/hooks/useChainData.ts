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

export function useAccountTransfers(address: string | null, count: number = 50) {
  return useChainQuery<RecentTransfer[]>(
    () => fetchAccountTransfersHybrid(address!, count),
    [address, count],
    !!address
  );
}

interface IndexerTransferNode {
  id: string;
  fromId: string;
  toId: string;
  amount: string;
  value: string;
  blockNumber: string;
  timestamp: string;
  blockId: string;
}

interface AccountTransfersResponse {
  sent: { nodes: IndexerTransferNode[]; totalCount: number };
  received: { nodes: IndexerTransferNode[]; totalCount: number };
}

async function fetchAccountTransfersHybrid(address: string, count: number): Promise<RecentTransfer[]> {
  // Try indexer GraphQL first (has complete history)
  try {
    const { client } = await import('../services/client');
    const { GET_ACCOUNT_TRANSFERS } = await import('../services/graphql/queries');
    const { data } = await client.query<AccountTransfersResponse>({
      query: GET_ACCOUNT_TRANSFERS,
      variables: { id: address, first: count },
      fetchPolicy: 'network-only',
    });

    if (data?.sent?.nodes || data?.received?.nodes) {
      const sentNodes = data.sent?.nodes || [];
      const receivedNodes = data.received?.nodes || [];
      const all = [...sentNodes, ...receivedNodes];

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = all.filter((t: any) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      const transfers: RecentTransfer[] = unique.map((t: any) => {
        // Parse timestamp: could be ms number, seconds number, or ISO date string
        let ts = 0;
        const tsSource = t.timestamp || t.date;
        if (tsSource) {
          const raw = typeof tsSource === 'string'
            ? (isNaN(Number(tsSource)) ? Date.parse(tsSource) : Number(tsSource))
            : Number(tsSource);
          ts = raw > 0 && raw < 1e12 && raw > 1e9 ? raw * 1000 : raw; // seconds → ms
        }
        // Use eventIndex from indexer, or extract from id (format: "blockNumber-eventIndex")
        const extIdx = t.eventIndex != null ? Number(t.eventIndex) : (() => {
          const idParts = (t.id || '').split('-');
          return idParts.length > 1 ? Number(idParts[idParts.length - 1]) || 0 : 0;
        })();
        return {
          blockNumber: Number(t.blockNumber),
          extrinsicIndex: extIdx,
          from: t.fromId,
          to: t.toId,
          amount: t.amount?.toString() || t.value?.toString() || '0',
          amountFormatted: Number(BigInt(t.amount?.toString() || t.value?.toString() || '0')) / 1e8,
          success: true,
          hash: t.blockId || '',
          extrinsicHash: t.extrinsicHash || t.hash || '',
          timestamp: ts,
        };
      });

      transfers.sort((a, b) => b.blockNumber - a.blockNumber);

      if (transfers.length > 0) {
        // Enrich transfers missing timestamp or extrinsicHash from RPC
        const needsEnrich = transfers.filter(t => !t.timestamp || !t.extrinsicHash);
        if (needsEnrich.length > 0) {
          try {
            const { getApi } = await import('../services/chain');
            const api = await getApi();
            // Unique block numbers to fetch
            const blockNums = [...new Set(needsEnrich.map(t => t.blockNumber))];
            const blockData = new Map<number, { timestamp: number; extrinsics: any[] }>();
            await Promise.all(blockNums.slice(0, 10).map(async (num) => {
              try {
                const blockHash = await api.rpc.chain.getBlockHash(num);
                const signedBlock = await api.rpc.chain.getBlock(blockHash);
                const tsExt = signedBlock.block.extrinsics.find(
                  (ex: any) => ex.method.section === 'timestamp' && ex.method.method === 'set'
                );
                const ts = tsExt ? Number(tsExt.method.args[0].toString()) : 0;
                blockData.set(num, { timestamp: ts, extrinsics: signedBlock.block.extrinsics });
              } catch { /* skip */ }
            }));
            for (const t of transfers) {
              const bd = blockData.get(t.blockNumber);
              if (!bd) continue;
              if (!t.timestamp && bd.timestamp) t.timestamp = bd.timestamp;
              if (!t.extrinsicHash && bd.extrinsics) {
                // Find the extrinsic that contains a balances.transfer matching this transfer
                for (let i = 0; i < bd.extrinsics.length; i++) {
                  const ex = bd.extrinsics[i];
                  if (ex.method.section === 'balances' && ex.isSigned) {
                    t.extrinsicHash = ex.hash.toHex();
                    break;
                  }
                }
              }
            }
          } catch (err) {
            console.warn('[Transfers] RPC enrichment failed:', err);
          }
        }
        console.log(`[Transfers] Loaded ${transfers.length} from indexer for ${address.slice(0, 8)}...`);
        return transfers.slice(0, count);
      }
    }
  } catch (err) {
    console.warn('[Transfers] Indexer unavailable, falling back to RPC:', err);
  }

  // Fallback: scan blockchain via RPC
  console.log(`[Transfers] Scanning RPC for ${address.slice(0, 8)}...`);
  return getAccountTransfers(address, count);
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
