// Tipos do GraphQL/Apollo Client

export interface Block {
    id: string;
    number: number;
    timestamp: string;
    specVersion: number;
}

export interface BlocksConnection {
    nodes: Block[];
    totalCount: number;
}

export interface Transfer {
    id: string;
    fromId: string;
    toId: string;
    amount: string;
    timestamp: string;
    blockId: string;
    success: boolean;
}

export interface TransfersConnection {
    nodes: Transfer[];
    totalCount: number;
}

export interface Extrinsic {
    id: string;
    blockNumber: number;
    extrinsicIndex: number;
    isSigned?: boolean;
    method: string;
    section: string;
    signer?: string;
    success: boolean;
    timestamp?: string;
    hash?: string;
    blockId?: string;
}

export interface ExtrinsicsConnection {
    nodes: Extrinsic[];
    totalCount: number;
}

export interface Token {
    id: string;
    contractAddress: string;
    name: string;
    symbol: string;
    totalSupply: string;
    decimals: number;
}

export interface TokensConnection {
    nodes: Token[];
    totalCount: number;
}

export interface NFTCollection {
    id: string;
    contractAddress: string;
    name: string;
    symbol: string;
    totalSupply: number;
    creator?: string;
    verified?: boolean;
}

export interface NFTCollectionsConnection {
    nodes: NFTCollection[];
    totalCount: number;
}

export interface SmartContract {
    id: string;
    contractAddress: string;
    name: string;
    version?: string;
    isVerified: boolean;
    deployedAt: string;
}

export interface SmartContractsConnection {
    nodes: SmartContract[];
    totalCount: number;
}

// Respostas de queries
export interface GetBlocksResponse {
    blocks: BlocksConnection;
}

export interface GetTransfersResponse {
    transfers: TransfersConnection;
}

export interface GetExtrinsicsResponse {
    extrinsics: ExtrinsicsConnection;
}

export interface GetLatestBlocksResponse {
    blocks: {
        nodes: Array<{
            id: string;
            number: number;
            timestamp: string;
            parentHash: string;
            specVersion: number;
        }>;
    };
}

export interface LatestExtrinsic {
    id: string;
    blockNumber: number;
    extrinsicIndex: number;
    isSigned: boolean;
    signer?: string;
    section: string;
    method: string;
    success: boolean;
}

export interface GetLatestExtrinsicsResponse {
    extrinsics: {
        nodes: LatestExtrinsic[];
    };
}

export interface GetTokensResponse {
    psp22Tokens: TokensConnection;
}

export interface GetNFTCollectionsResponse {
    psp34Collections: NFTCollectionsConnection;
}

export interface GetSmartContractsResponse {
    smartContracts: SmartContractsConnection;
}

export interface Account {
    id: string;
    balance: string;
    sentTransfersCount: number;
    receivedTransfersCount: number;
    lastTransferBlock?: number;
    sentTransfers?: TransfersConnection;
}

export interface GetAccountDetailResponse {
    account: Account | null;
}

// Token Balance Types
export interface PSP22Account {
    id: string;
    balance: string;
    token: {
        id: string;
        name: string;
        symbol: string;
        decimals: number;
        contractAddress: string;
        totalSupply: string;
    };
}

export interface PSP22AccountsConnection {
    nodes: PSP22Account[];
}

export interface GetAccountTokensResponse {
    psp22Accounts: PSP22AccountsConnection;
}

// NFT Types
export interface PSP34Token {
    id: string;
    tokenId: string;
    metadata: string;
    tokenUri: string;
}

export interface NftAccount {
    id: string;
    tokenCount: number;
    collection: {
        id: string;
        name: string;
        symbol: string;
        contractAddress: string;
    };
    tokens: {
        nodes: PSP34Token[];
    };
}

export interface NftAccountsConnection {
    nodes: NftAccount[];
}

export interface GetAccountNftsResponse {
    nftAccounts: NftAccountsConnection;
}

// Staking Types
export interface StakingPool {
    id: string;
    name: string;
    totalStaked: string;
    totalRewards: string;
    apy: number;
    lockPeriod: number;
    minStake: string;
    maxStake: string | null;
    participantCount: number;
    status: string;
}

export interface StakingPosition {
    id: string;
    accountId: string;
    stakedAmount: string;
    rewards: string;
    apy: number;
    lastClaimedAt: string;
    stakedAt: string;
    lockPeriod: number;
    status: string;
    unbondingAmount: string;
    unbondingEnd: string;
}

export interface StakingPoolsConnection {
    nodes: StakingPool[];
}

export interface StakingPositionsConnection {
    nodes: StakingPosition[];
    totalCount: number;
}

export interface GetStakingStatsResponse {
    stakingPools: StakingPoolsConnection;
    stakingPositions: StakingPositionsConnection;
}

// Asset Types
export interface Asset {
    id: string;
    assetType: string;
    contractAddress: string | null;
    name: string | null;
    symbol: string | null;
    decimals: number | null;
    totalSupply: string;
    metadata: string | null;
    verified: boolean;
}

export interface AssetAccount {
    id: string;
    balance: string;
    account: {
        id: string;
    };
}

export interface AssetTransfer {
    id: string;
    fromId: string;
    toId: string;
    amount: string;
    blockNumber: number;
    timestamp: string;
}

export interface AssetsConnection {
    nodes: Asset[];
    totalCount: number;
}

export interface AssetAccountsConnection {
    nodes: AssetAccount[];
    totalCount: number;
}

export interface AssetTransfersConnection {
    nodes: AssetTransfer[];
}

export interface GetAssetsResponse {
    assets: AssetsConnection;
}

export interface GetAssetDetailResponse {
    asset: Asset | null;
    assetAccounts: AssetAccountsConnection;
    assetTransfers: AssetTransfersConnection;
}

// Project Types
export interface Project {
    id: string;
    name: string;
    description: string | null;
    category: string;
    website: string | null;
    whitepaper: string | null;
    github: string | null;
    twitter: string | null;
    discord: string | null;
    telegram: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    createdAt: string;
    updatedAt: string | null;
    verified: boolean;
    verifiedAt: string | null;
    createdBy: string;
}

export interface ProjectTeamMember {
    id: string;
    projectId: string;
    name: string;
    role: string;
    linkedin: string | null;
    twitter: string | null;
    avatarUrl: string | null;
}

export interface ProjectRoadmap {
    id: string;
    projectId: string;
    quarter: string;
    title: string;
    description: string | null;
    status: string;
    completedAt: string | null;
}

export interface GetProjectResponse {
    project: Project | null;
}

export interface GetProjectsResponse {
    projects: {
        nodes: Project[];
        totalCount: number;
    };
}
export interface GlobalSearchResponse {
    psp22Tokens: TokensConnection;
    psp34Collections: NFTCollectionsConnection;
    smartContracts: SmartContractsConnection;
}

// Home stats
export interface HomeStats {
    blocks: {
        nodes: Block[];
    };
    transfers: {
        totalCount: number;
    };
    psp22Tokens: {
        totalCount: number;
    };
    psp34Collections: {
        totalCount: number;
    };
    smartContracts: {
        totalCount: number;
    };
    dailyStats: {
        nodes: Array<{
            transfersCount: number;
            totalVolume: string;
            uniqueAccounts: number;
            date: string;
        }>;
    };
}
