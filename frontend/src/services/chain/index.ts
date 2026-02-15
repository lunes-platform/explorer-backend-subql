// @ts-nocheck - Polkadot API returns dynamic Codec types based on chain metadata
import { ApiPromise, WsProvider } from '@polkadot/api';

const WS_ENDPOINTS = [
  'wss://ws-archive.lunes.io',
  'wss://ws-lunes-main-02.lunes.io',
  'wss://ws-lunes-main-01.lunes.io',
];

let api: ApiPromise | null = null;
let connectionPromise: Promise<ApiPromise> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const RECONNECT_DELAY = 3_000;

export type ConnectionListener = (connected: boolean) => void;
const connectionListeners = new Set<ConnectionListener>();

export function onConnectionChange(listener: ConnectionListener): () => void {
  connectionListeners.add(listener);
  return () => { connectionListeners.delete(listener); };
}

function notifyListeners(connected: boolean) {
  connectionListeners.forEach(fn => { try { fn(connected); } catch { /* ignore */ } });
}

export async function getApi(): Promise<ApiPromise> {
  if (api && api.isConnected) return api;

  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      if (api) {
        try { await api.disconnect(); } catch { /* ignore */ }
        api = null;
      }
      const provider = new WsProvider(WS_ENDPOINTS, RECONNECT_DELAY);
      const instance = await ApiPromise.create({ provider });

      instance.on('connected', () => {
        console.info('[Chain] RPC connected');
        notifyListeners(true);
      });
      instance.on('disconnected', () => {
        console.warn('[Chain] RPC disconnected — will auto-reconnect');
        notifyListeners(false);
        scheduleReconnect();
      });
      instance.on('error', (err: Error) => {
        console.error('[Chain] RPC error:', err.message);
      });

      api = instance;
      notifyListeners(true);
      return api;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await getApi();
    } catch (err) {
      console.warn('[Chain] Reconnect attempt failed, retrying...', err);
      scheduleReconnect();
    }
  }, RECONNECT_DELAY);
}

export async function disconnectApi(): Promise<void> {
  if (api) {
    await api.disconnect();
    api = null;
  }
}

// ==================== CHAIN INFO ====================

export interface ChainInfo {
  chain: string;
  nodeName: string;
  nodeVersion: string;
  latestBlock: number;
  totalIssuance: string;
  totalIssuanceFormatted: number;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}

export async function getChainInfo(): Promise<ChainInfo> {
  const api = await getApi();
  const [chain, nodeName, nodeVersion, header, totalIssuance, properties] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
    api.rpc.chain.getHeader(),
    api.query.balances.totalIssuance(),
    api.registry.getChainProperties(),
  ]);

  const decimals = properties?.tokenDecimals?.unwrapOr(api.registry.createType('u32', 8))?.toJSON() as number[] | number;
  const tokenDecimals = Array.isArray(decimals) ? decimals[0] : (decimals || 8);
  const symbols = properties?.tokenSymbol?.unwrapOr(api.registry.createType('Vec<Text>', ['LUNES']))?.toJSON() as string[] | string;
  const tokenSymbol = Array.isArray(symbols) ? symbols[0] : (symbols || 'LUNES');
  const ss58Format = (properties?.ss58Format?.unwrapOr(api.registry.createType('u32', 42))?.toJSON() as number) || 42;

  const issuanceBigInt = BigInt(totalIssuance.toString());
  const totalIssuanceFormatted = Number(issuanceBigInt) / Math.pow(10, tokenDecimals);

  return {
    chain: chain.toString(),
    nodeName: nodeName.toString(),
    nodeVersion: nodeVersion.toString(),
    latestBlock: header.number.toNumber(),
    totalIssuance: totalIssuance.toString(),
    totalIssuanceFormatted,
    ss58Format,
    tokenDecimals,
    tokenSymbol,
  };
}

// ==================== ACCOUNT ====================

export interface AccountInfo {
  address: string;
  freeBalance: string;
  reservedBalance: string;
  totalBalance: string;
  freeFormatted: number;
  reservedFormatted: number;
  totalFormatted: number;
  nonce: number;
}

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  const api = await getApi();
  const account = await api.query.system.account(address);
  const decimals = 12;

  const free = BigInt(account.data.free.toString());
  const reserved = BigInt(account.data.reserved.toString());
  const total = free + reserved;

  return {
    address,
    freeBalance: free.toString(),
    reservedBalance: reserved.toString(),
    totalBalance: total.toString(),
    freeFormatted: Number(free) / Math.pow(10, decimals),
    reservedFormatted: Number(reserved) / Math.pow(10, decimals),
    totalFormatted: Number(total) / Math.pow(10, decimals),
    nonce: account.nonce.toNumber(),
  };
}

// ==================== ASSETS (pallet assets) ====================

export interface ChainAsset {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  supplyFormatted: number;
  owner: string;
  minBalance: string;
  isFrozen: boolean;
  accounts: number;
}

export async function getAssets(): Promise<ChainAsset[]> {
  const api = await getApi();
  const assetKeys = await api.query.assets.asset.keys();
  const assets: ChainAsset[] = [];

  for (const key of assetKeys) {
    try {
      const assetId = key.args[0].toString();
      const [assetOpt, metadataRaw] = await Promise.all([
        api.query.assets.asset(assetId),
        api.query.assets.metadata(assetId),
      ]);

      let asset: any;
      if ((assetOpt as any).isSome) {
        asset = (assetOpt as any).unwrap();
      } else if ((assetOpt as any).unwrapOrDefault) {
        asset = (assetOpt as any).unwrapOrDefault();
      } else {
        asset = assetOpt;
      }

      if (!asset || !asset.supply) continue;

      const metadata = metadataRaw as any;
      const name = (metadata.name?.toHuman?.() as string) || `Asset #${assetId}`;
      const symbol = (metadata.symbol?.toHuman?.() as string) || assetId;
      const decimals = metadata.decimals?.toNumber?.() ?? 0;
      const supply = asset.supply.toString();
      const supplyFormatted = decimals > 0 ? Number(BigInt(supply)) / Math.pow(10, decimals) : Number(supply);

      let isFrozen = false;
      try { isFrozen = !!asset.isFrozen?.isTrue; } catch { /* ignore */ }

      let accounts = 0;
      try { accounts = asset.accounts?.toNumber?.() ?? 0; } catch { /* ignore */ }

      assets.push({
        id: assetId,
        name,
        symbol,
        decimals,
        supply,
        supplyFormatted,
        owner: asset.owner?.toString?.() ?? '',
        minBalance: asset.minBalance?.toString?.() ?? '0',
        isFrozen,
        accounts,
      });
    } catch (err) {
      console.warn('Failed to load asset:', key.args[0]?.toString(), err);
    }
  }

  return assets;
}

export async function getAssetBalance(assetId: string, address: string): Promise<string> {
  const api = await getApi();
  const balance = await api.query.assets.account(assetId, address);
  if (balance.isSome) {
    return balance.unwrap().balance.toString();
  }
  return '0';
}

// ==================== CONTRACTS ====================

export interface ChainContract {
  address: string;
  codeHash: string;
  storageDeposit: string;
  storageBytes: number;
}

export async function getContracts(): Promise<ChainContract[]> {
  const api = await getApi();
  const contractKeys = await api.query.contracts.contractInfoOf.keys();
  const addresses = contractKeys.map(key => key.args[0].toString());

  // Query all contracts in parallel using multi-query
  const infos = await api.query.contracts.contractInfoOf.multi(addresses);

  return addresses.map((address, i) => {
    const info = infos[i];
    try {
      if (info && info.isSome) {
        const data = info.unwrap();
        return {
          address,
          codeHash: data.codeHash.toString(),
          storageDeposit: data.storageDeposit?.toString() || '0',
          storageBytes: data.storageBytes?.toNumber() || 0,
        };
      }
    } catch { /* fallback below */ }
    return {
      address,
      codeHash: 'unknown',
      storageDeposit: '0',
      storageBytes: 0,
    };
  });
}

// ==================== STAKING ====================

export interface ValidatorInfo {
  address: string;
  totalStake: string;
  ownStake: string;
  commission: string;
  isActive: boolean;
  nominatorCount: number;
}

export interface StakingOverview {
  currentEra: number;
  activeValidatorCount: number;
  totalStaked: string;
  totalStakedFormatted: number;
  idealStakePercent: number;
  validators: ValidatorInfo[];
}

export async function getStakingOverview(): Promise<StakingOverview> {
  const api = await getApi();

  const [currentEraOpt, sessionValidators] = await Promise.all([
    api.query.staking.currentEra(),
    api.query.session.validators(),
  ]);

  const currentEra = currentEraOpt.unwrapOrDefault().toNumber();
  const activeValidators = sessionValidators.map(v => v.toString());

  const validators: ValidatorInfo[] = [];
  let totalStaked = BigInt(0);

  for (const addr of activeValidators) {
    try {
      const [prefs, exposure] = await Promise.all([
        api.query.staking.validators(addr),
        api.query.staking.erasStakers
          ? api.query.staking.erasStakers(currentEra, addr)
          : Promise.resolve(null),
      ]);

      const commission = prefs.commission.toNumber() / 10_000_000;
      let ownStake = '0';
      let totalValidatorStake = '0';
      let nominatorCount = 0;

      if (exposure) {
        totalValidatorStake = exposure.total?.toString() || '0';
        ownStake = exposure.own?.toString() || '0';
        nominatorCount = exposure.others?.length || 0;
        totalStaked += BigInt(totalValidatorStake);
      }

      validators.push({
        address: addr,
        totalStake: totalValidatorStake,
        ownStake,
        commission: `${commission.toFixed(1)}%`,
        isActive: true,
        nominatorCount,
      });
    } catch {
      validators.push({
        address: addr,
        totalStake: '0',
        ownStake: '0',
        commission: '0%',
        isActive: true,
        nominatorCount: 0,
      });
    }
  }

  return {
    currentEra,
    activeValidatorCount: activeValidators.length,
    totalStaked: totalStaked.toString(),
    totalStakedFormatted: Number(totalStaked) / Math.pow(10, 8),
    idealStakePercent: 50,
    validators,
  };
}

export async function getAccountStaking(address: string): Promise<{
  bonded: string;
  bondedFormatted: number;
  isNominator: boolean;
  isValidator: boolean;
  nominations: string[];
  unbonding: Array<{ amount: string; era: number }>;
}> {
  const api = await getApi();

  const [ledgerOpt, nominationsOpt, validators] = await Promise.all([
    api.query.staking.ledger(address),
    api.query.staking.nominators(address),
    api.query.staking.validators(address),
  ]);

  let bonded = '0';
  const unbonding: Array<{ amount: string; era: number }> = [];

  if (ledgerOpt.isSome) {
    const ledger = ledgerOpt.unwrap();
    bonded = ledger.active.toString();
    const unlocking = ledger.unlocking;
    if (unlocking) {
      for (const chunk of unlocking) {
        unbonding.push({
          amount: chunk.value.toString(),
          era: chunk.era.toNumber(),
        });
      }
    }
  }

  const nominations: string[] = [];
  if (nominationsOpt.isSome) {
    const nom = nominationsOpt.unwrap();
    nom.targets.forEach(t => nominations.push(t.toString()));
  }

  const isValidator = validators.commission.toNumber() > 0;

  return {
    bonded,
    bondedFormatted: Number(BigInt(bonded)) / Math.pow(10, 8),
    isNominator: nominations.length > 0,
    isValidator,
    nominations,
    unbonding,
  };
}

// ==================== NFTs (nfts pallet) ====================

export interface NftCollection {
  id: string;
  owner: string;
  items: number;
}

export async function getNftCollections(): Promise<NftCollection[]> {
  const api = await getApi();

  if (!api.query.nfts) return [];

  try {
    const collectionKeys = await api.query.nfts.collection.keys();
    const collections: NftCollection[] = [];

    for (const key of collectionKeys) {
      const collectionId = key.args[0].toString();
      const info = await api.query.nfts.collection(collectionId);

      if (info.isSome) {
        const data = info.unwrap();
        collections.push({
          id: collectionId,
          owner: data.owner.toString(),
          items: data.items.toNumber(),
        });
      }
    }

    return collections;
  } catch {
    return [];
  }
}

// ==================== BLOCK DETAIL (RPC) ====================

export interface BlockExtrinsic {
  index: number;
  hash: string;
  section: string;
  method: string;
  signer: string | null;
  success: boolean;
  args: string;
}

export interface BlockDetail {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: number;
  specVersion: number;
  extrinsicCount: number;
  eventCount: number;
  extrinsics: BlockExtrinsic[];
}

export async function getBlockByNumber(blockNumOrHash: string | number): Promise<BlockDetail | null> {
  try {
    const api = await getApi();

    let blockHash: any;
    let blockNum: number;

    if (typeof blockNumOrHash === 'string' && blockNumOrHash.startsWith('0x')) {
      blockHash = blockNumOrHash;
      const header = await api.rpc.chain.getHeader(blockHash);
      blockNum = header.number.toNumber();
    } else {
      blockNum = typeof blockNumOrHash === 'number' ? blockNumOrHash : parseInt(blockNumOrHash, 10);
      if (isNaN(blockNum)) return null;
      blockHash = await api.rpc.chain.getBlockHash(blockNum);
    }

    const [signedBlock, events, runtimeVersion] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.query.system.events.at(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
    ]);

    const block = signedBlock.block;
    const header = block.header;

    const timestampExt = block.extrinsics.find(
      (ex: any) => ex.method.section === 'timestamp' && ex.method.method === 'set'
    );
    const ts = timestampExt ? Number(timestampExt.method.args[0].toString()) : 0;

    const extrinsics: BlockExtrinsic[] = block.extrinsics.map((ext: any, idx: number) => {
      const extEvents = events.filter(
        (e: any) => e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() === idx
      );
      const success = !extEvents.some(
        (e: any) => e.event.section === 'system' && e.event.method === 'ExtrinsicFailed'
      );

      return {
        index: idx,
        hash: ext.hash.toHex(),
        section: ext.method.section,
        method: ext.method.method,
        signer: ext.isSigned ? ext.signer.toString() : null,
        success,
        args: ext.method.args.map((a: any) => a.toString()).join(', '),
      };
    });

    return {
      number: blockNum,
      hash: blockHash.toString(),
      parentHash: header.parentHash.toString(),
      stateRoot: header.stateRoot.toString(),
      extrinsicsRoot: header.extrinsicsRoot.toString(),
      timestamp: ts,
      specVersion: runtimeVersion.specVersion.toNumber(),
      extrinsicCount: block.extrinsics.length,
      eventCount: events.length,
      extrinsics,
    };
  } catch (err) {
    console.error('getBlockByNumber error:', err);
    return null;
  }
}

export interface BlocksPageResult {
  blocks: RecentBlock[];
  latestBlock: number;
}

export async function getBlocksPage(page: number, pageSize: number = 25): Promise<BlocksPageResult> {
  const api = await getApi();
  const header = await api.rpc.chain.getHeader();
  const latestBlock = header.number.toNumber();
  const startBlock = latestBlock - (page * pageSize);
  const blocks: RecentBlock[] = [];

  const BATCH = 5;
  for (let offset = 0; offset < pageSize; offset += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, pageSize - offset) }, (_, i) => startBlock - offset - i)
      .filter(n => n >= 0);

    if (batch.length === 0) break;

    const results = await Promise.all(batch.map(async (blockNum) => {
      try {
        const blockHash = await api.rpc.chain.getBlockHash(blockNum);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        const evts = await api.query.system.events.at(blockHash);
        const tsExt = signedBlock.block.extrinsics.find(
          (ex: any) => ex.method.section === 'timestamp' && ex.method.method === 'set'
        );
        return {
          number: blockNum,
          hash: blockHash.toString(),
          timestamp: tsExt ? Number(tsExt.method.args[0].toString()) : 0,
          extrinsicCount: signedBlock.block.extrinsics.length,
          eventCount: evts.length,
        };
      } catch {
        return null;
      }
    }));

    results.forEach(r => { if (r) blocks.push(r); });
  }

  return { blocks: blocks.sort((a, b) => b.number - a.number), latestBlock };
}

// ==================== RECENT EXTRINSICS (RPC) ====================

export interface RecentExtrinsic {
  id: string;
  blockNumber: number;
  index: number;
  hash: string;
  section: string;
  method: string;
  signer: string | null;
  success: boolean;
  timestamp: number;
}

export interface ExtrinsicsPageResult {
  extrinsics: RecentExtrinsic[];
  latestBlock: number;
}

export async function getRecentExtrinsics(page: number = 0, pageSize: number = 25): Promise<ExtrinsicsPageResult> {
  const api = await getApi();
  const header = await api.rpc.chain.getHeader();
  const latestBlock = header.number.toNumber();

  const extrinsics: RecentExtrinsic[] = [];
  const blocksToScan = 50;
  const startBlock = latestBlock - (page * blocksToScan);

  for (let i = 0; i < blocksToScan && extrinsics.length < pageSize; i++) {
    const blockNum = startBlock - i;
    if (blockNum < 1) break;

    try {
      const blockHash = await api.rpc.chain.getBlockHash(blockNum);
      const [signedBlock, events] = await Promise.all([
        api.rpc.chain.getBlock(blockHash),
        api.query.system.events.at(blockHash),
      ]);

      const tsExt = signedBlock.block.extrinsics.find(
        (ex: any) => ex.method.section === 'timestamp' && ex.method.method === 'set'
      );
      const ts = tsExt ? Number(tsExt.method.args[0].toString()) : 0;

      for (let idx = 0; idx < signedBlock.block.extrinsics.length; idx++) {
        if (extrinsics.length >= pageSize) break;
        const ext = signedBlock.block.extrinsics[idx] as any;

        const extEvents = (events as any[]).filter(
          (e: any) => e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() === idx
        );
        const success = !extEvents.some(
          (e: any) => e.event.section === 'system' && e.event.method === 'ExtrinsicFailed'
        );

        extrinsics.push({
          id: `${blockNum}-${idx}`,
          blockNumber: blockNum,
          index: idx,
          hash: ext.hash.toHex(),
          section: ext.method.section,
          method: ext.method.method,
          signer: ext.isSigned ? ext.signer.toString() : null,
          success,
          timestamp: ts,
        });
      }
    } catch {
      // skip failed blocks
    }
  }

  return { extrinsics, latestBlock };
}

// ==================== RECENT BLOCKS ====================

export interface RecentBlock {
  number: number;
  hash: string;
  timestamp: number;
  extrinsicCount: number;
  eventCount: number;
}

export async function getRecentBlocks(count: number = 10): Promise<RecentBlock[]> {
  const api = await getApi();
  const header = await api.rpc.chain.getHeader();
  const latestBlock = header.number.toNumber();
  const blocks: RecentBlock[] = [];

  for (let i = 0; i < count; i++) {
    const blockNum = latestBlock - i;
    if (blockNum < 0) break;

    try {
      const blockHash = await api.rpc.chain.getBlockHash(blockNum);
      const signedBlock = await api.rpc.chain.getBlock(blockHash);
      const events = await api.query.system.events.at(blockHash);
      const timestamp = signedBlock.block.extrinsics.find(
        ex => ex.method.section === 'timestamp' && ex.method.method === 'set'
      );

      let ts = Date.now();
      if (timestamp) {
        ts = Number(timestamp.method.args[0].toString());
      }

      blocks.push({
        number: blockNum,
        hash: blockHash.toString(),
        timestamp: ts,
        extrinsicCount: signedBlock.block.extrinsics.length,
        eventCount: events.length,
      });
    } catch {
      break;
    }
  }

  return blocks;
}

// ==================== DASHBOARD STATS ====================

export interface DashboardStats {
  latestBlock: number;
  totalIssuance: string;
  totalIssuanceFormatted: number;
  tokenSymbol: string;
  tokenDecimals: number;
  activeValidators: number;
  currentEra: number;
  totalContracts: number;
  totalAssets: number;
  totalNftCollections: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const api = await getApi();

  const [header, totalIssuance, eraOpt, validators, contractKeys, assetKeys, properties] = await Promise.all([
    api.rpc.chain.getHeader(),
    api.query.balances.totalIssuance(),
    api.query.staking.currentEra(),
    api.query.session.validators(),
    api.query.contracts.contractInfoOf.keys(),
    api.query.assets.asset.keys(),
    api.registry.getChainProperties(),
  ]);

  let nftCollections = 0;
  if (api.query.nfts) {
    try {
      const nftKeys = await api.query.nfts.collection.keys();
      nftCollections = nftKeys.length;
    } catch { /* ignore */ }
  }

  const decimals = 8; // LUNES native token uses 8 decimal places
  const symbols = properties?.tokenSymbol?.unwrapOr(api.registry.createType('Vec<Text>', ['LUNES']))?.toJSON() as string[] | string;
  const tokenSymbol = Array.isArray(symbols) ? symbols[0] : (symbols || 'LUNES');

  return {
    latestBlock: header.number.toNumber(),
    totalIssuance: totalIssuance.toString(),
    totalIssuanceFormatted: Number(BigInt(totalIssuance.toString())) / Math.pow(10, decimals),
    tokenSymbol,
    tokenDecimals: decimals,
    activeValidators: validators.length,
    currentEra: eraOpt.unwrapOrDefault().toNumber(),
    totalContracts: contractKeys.length,
    totalAssets: assetKeys.length,
    totalNftCollections: nftCollections,
  };
}

// ==================== RICH LIST ====================

export interface RichListAccount {
  address: string;
  free: string;
  freeFormatted: number;
  reserved: string;
  reservedFormatted: number;
  total: string;
  totalFormatted: number;
  percentOfSupply: number;
}

export interface RichListResult {
  accounts: RichListAccount[];
  totalAccounts: number;
  totalIssuance: string;
  totalIssuanceFormatted: number;
  fetchedAt: number;
}

let richListCache: RichListResult | null = null;
let richListFetching = false;

export async function getRichList(): Promise<RichListResult> {
  if (richListCache && (Date.now() - richListCache.fetchedAt < 5 * 60 * 1000)) {
    return richListCache;
  }

  if (richListFetching && richListCache) {
    return richListCache;
  }

  richListFetching = true;

  try {
    const api = await getApi();

    const [entries, totalIssuanceRaw] = await Promise.all([
      api.query.system.account.entries(),
      api.query.balances.totalIssuance(),
    ]);

    const totalIssuance = BigInt(totalIssuanceRaw.toString());
    const totalIssuanceNum = Number(totalIssuance) / 1e8; // LUNES uses 8 decimals

    const accounts: RichListAccount[] = entries
      .map(([key, accountInfo]) => {
        const address = key.args[0].toString();
        const info = accountInfo as any;
        const data = info.data || info;
        const free = BigInt(data.free?.toString() || '0');
        const reserved = BigInt(data.reserved?.toString() || '0');
        const total = free + reserved;
        const totalNum = Number(total) / 1e8;

        return {
          address,
          free: free.toString(),
          freeFormatted: Number(free) / 1e8,
          reserved: reserved.toString(),
          reservedFormatted: Number(reserved) / 1e8,
          total: total.toString(),
          totalFormatted: totalNum,
          percentOfSupply: totalIssuance > 0n ? (Number(total) / Number(totalIssuance)) * 100 : 0,
        };
      })
      .filter(a => a.totalFormatted > 0)
      .sort((a, b) => b.totalFormatted - a.totalFormatted);

    richListCache = {
      accounts,
      totalAccounts: accounts.length,
      totalIssuance: totalIssuance.toString(),
      totalIssuanceFormatted: totalIssuanceNum,
      fetchedAt: Date.now(),
    };

    return richListCache;
  } finally {
    richListFetching = false;
  }
}

// ==================== TRANSFERS (recent via RPC) ====================

export interface RecentTransfer {
  blockNumber: number;
  extrinsicIndex: number;
  from: string;
  to: string;
  amount: string;
  amountFormatted: number;
  success: boolean;
  hash: string;
  timestamp: number;
}

export async function getAccountTransfers(address: string, count: number = 30): Promise<RecentTransfer[]> {
  const api = await getApi();
  const header = await api.rpc.chain.getHeader();
  const latestBlock = header.number.toNumber();
  const transfers: RecentTransfer[] = [];
  const BATCH_SIZE = 10;
  const MAX_BLOCKS = 100;

  async function scanBlock(blockNum: number): Promise<RecentTransfer[]> {
    try {
      const blockHash = await api.rpc.chain.getBlockHash(blockNum);
      const [signedBlock, events] = await Promise.all([
        api.rpc.chain.getBlock(blockHash),
        api.query.system.events.at(blockHash),
      ]);

      const timestampExt = signedBlock.block.extrinsics.find(
        ex => ex.method.section === 'timestamp' && ex.method.method === 'set'
      );
      const ts = timestampExt ? Number(timestampExt.method.args[0].toString()) : Date.now();
      const found: RecentTransfer[] = [];

      events.forEach((record) => {
        const { event } = record;
        if (event.section === 'balances' && event.method === 'Transfer') {
          const [from, to, amount] = event.data;
          const fromAddr = from.toString();
          const toAddr = to.toString();

          if (fromAddr === address || toAddr === address) {
            const extrinsicIndex = record.phase.isApplyExtrinsic ? record.phase.asApplyExtrinsic.toNumber() : 0;
            found.push({
              blockNumber: blockNum,
              extrinsicIndex,
              from: fromAddr,
              to: toAddr,
              amount: amount.toString(),
              amountFormatted: Number(BigInt(amount.toString())) / 1e8,
              success: true,
              hash: blockHash.toString(),
              timestamp: ts,
            });
          }
        }
      });
      return found;
    } catch {
      return [];
    }
  }

  // Scan in parallel batches of BATCH_SIZE
  for (let offset = 0; offset < MAX_BLOCKS && transfers.length < count; offset += BATCH_SIZE) {
    const blockNums = Array.from({ length: BATCH_SIZE }, (_, i) => latestBlock - offset - i)
      .filter(n => n >= 0);
    const results = await Promise.all(blockNums.map(scanBlock));
    results.forEach(r => transfers.push(...r));
  }

  return transfers.sort((a, b) => b.blockNumber - a.blockNumber).slice(0, count);
}

export async function getRecentTransfers(count: number = 20): Promise<RecentTransfer[]> {
  const api = await getApi();
  const header = await api.rpc.chain.getHeader();
  const latestBlock = header.number.toNumber();
  const transfers: RecentTransfer[] = [];

  for (let i = 0; i < 50 && transfers.length < count; i++) {
    const blockNum = latestBlock - i;
    if (blockNum < 0) break;

    try {
      const blockHash = await api.rpc.chain.getBlockHash(blockNum);
      const signedBlock = await api.rpc.chain.getBlock(blockHash);
      const events = await api.query.system.events.at(blockHash);

      const timestampExt = signedBlock.block.extrinsics.find(
        ex => ex.method.section === 'timestamp' && ex.method.method === 'set'
      );
      const ts = timestampExt ? Number(timestampExt.method.args[0].toString()) : Date.now();

      events.forEach((record, eventIdx) => {
        const { event } = record;
        if (event.section === 'balances' && event.method === 'Transfer') {
          const [from, to, amount] = event.data;
          const amountBigInt = BigInt(amount.toString());

          // find if the extrinsic succeeded
          const extrinsicIndex = record.phase.isApplyExtrinsic ? record.phase.asApplyExtrinsic.toNumber() : 0;

          transfers.push({
            blockNumber: blockNum,
            extrinsicIndex,
            from: from.toString(),
            to: to.toString(),
            amount: amount.toString(),
            amountFormatted: Number(amountBigInt) / Math.pow(10, 8),
            success: true,
            hash: blockHash.toString(),
            timestamp: ts,
          });
        }
      });
    } catch {
      continue;
    }
  }

  return transfers.slice(0, count);
}
