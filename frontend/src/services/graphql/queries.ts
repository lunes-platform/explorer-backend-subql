import { gql } from '@apollo/client';

export const GET_LATEST_BLOCKS = gql`
  query GetLatestBlocks($first: Int = 5) {
    blocks(first: $first, orderBy: NUMBER_DESC) {
      nodes {
        id
        number
        timestamp
        parentHash
        specVersion
      }
    }
  }
`;

export const GET_LATEST_EXTRINSICS = gql`
  query GetLatestExtrinsics($first: Int = 5) {
    extrinsics(first: $first, orderBy: BLOCK_NUMBER_DESC) {
      nodes {
        id
        blockNumber
        extrinsicIndex
        isSigned
        signer
        section
        method
        success
      }
    }
  }
`;

export const GET_LATEST_TRANSFERS = gql`
  query GetLatestTransfers($first: Int = 8) {
    transfers(first: $first, orderBy: ID_DESC) {
      nodes {
        id
        fromId
        toId
        amount
        blockNumber
        timestamp
      }
    }
  }
`;

export const GET_HOME_STATS = gql`
  query GetHomeStats {
    transfers(first: 100, orderBy: TIMESTAMP_DESC) {
       totalCount
    }
    blocks(first: 1, orderBy: NUMBER_DESC) {
      nodes {
        number
        timestamp
      }
    }
    dailyStats(first: 1, orderBy: DATE_DESC) {
      nodes {
        transfersCount
        totalVolume
        uniqueAccounts
        date
      }
    }
    psp22Tokens(first: 0) {
      totalCount
    }
    psp34Collections(first: 0) {
      totalCount
    }
    smartContracts(first: 0) {
      totalCount
    }
  }
`;

export const GET_TOKEN_MARKET_DATA = gql`
  query GetTokenMarketData {
    psp22Tokens(first: 20, orderBy: TOTAL_SUPPLY_DESC) {
      nodes {
        id
        name
        symbol
        contractAddress
        totalSupply
        decimals
        verified
      }
    }
  }
`;

export const GET_BLOCK_DETAIL = gql`
  query GetBlockDetail($id: String!) {
    block(id: $id) {
      id
      number
      timestamp
      parentHash
      specVersion
    }
    extrinsics(filter: { id: { startsWith: $id } }, first: 100) {
      nodes {
        id
        section
        method
        signer
        success
      }
    }
  }
`;

export const GET_EXTRINSIC_DETAIL = gql`
  query GetExtrinsicDetail($id: String!) {
    extrinsic(id: $id) {
      id
      success
      blockNumber
      section
      method
      signer
      signature
      fee
      tip
    }
  }
`;

export const GET_NFT_COLLECTIONS = gql`
  query GetNftCollections {
    psp34Collections(first: 20, orderBy: CREATED_AT_DESC) {
      nodes {
        id
        contractAddress
        name
        symbol
        creator
        totalSupply
        verified
      }
    }
  }
`;

export const GET_SMART_CONTRACTS = gql`
  query GetSmartContracts {
    smartContracts {
      nodes {
        id
        contractAddress
        name
        version
        deployedAt
        isVerified
      }
    }
  }
`;

export const GET_BLOCKS = gql`
  query GetBlocks($first: Int!, $offset: Int!) {
    blocks(first: $first, offset: $offset, orderBy: NUMBER_DESC) {
      nodes {
        id
        number
        timestamp
        specVersion
      }
      totalCount
    }
  }
`;

export const GET_EXTRINSICS = gql`
  query GetExtrinsics($first: Int!, $offset: Int!) {
    extrinsics(first: $first, offset: $offset, orderBy: BLOCK_NUMBER_DESC) {
      nodes {
        id
        blockNumber
        extrinsicIndex
        signer
        section
        method
        success
      }
      totalCount
    }
  }
`;
export const GET_ACCOUNT_DETAIL = gql`
  query GetAccountDetail($id: String!) {
    account(id: $id) {
      id
      balance
      sentTransfersCount
      receivedTransfersCount
      lastTransferBlock
      sentTransfers: transfersByFromId(first: 10, orderBy: TIMESTAMP_DESC) {
        nodes {
          id
          fromId
          toId
          amount
          timestamp
          blockId
          success
        }
      }
    }
  }
`;

export const GET_ACCOUNT_TRANSFERS = gql`
  query GetAccountTransfers($id: String!, $first: Int = 50) {
    sent: transfers(filter: { fromId: { equalTo: $id } }, first: $first, orderBy: BLOCK_NUMBER_DESC) {
      nodes {
        id
        fromId
        toId
        amount
        value
        blockNumber
        eventIndex
        timestamp
        date
        blockId
      }
      totalCount
    }
    received: transfers(filter: { toId: { equalTo: $id } }, first: $first, orderBy: BLOCK_NUMBER_DESC) {
      nodes {
        id
        fromId
        toId
        amount
        value
        blockNumber
        eventIndex
        timestamp
        date
        blockId
      }
      totalCount
    }
  }
`;

export const GET_ACCOUNT_TOKENS = gql`
  query GetAccountTokens($accountId: String!) {
    psp22Accounts(filter: { accountId: { equalTo: $accountId } }, first: 50) {
      nodes {
        id
        balance
        token {
          id
          name
          symbol
          decimals
          contractAddress
          totalSupply
        }
      }
    }
  }
`;

export const GET_ACCOUNT_ASSETS = gql`
  query GetAccountAssets($accountId: String!) {
    assetAccounts(filter: { accountId: { equalTo: $accountId } }, first: 50) {
      nodes {
        id
        balance
        asset {
          id
          name
          symbol
          decimals
          totalSupply
          assetType
          verified
        }
      }
    }
  }
`;

export const GET_ACCOUNT_NFTS = gql`
  query GetAccountNfts($accountId: String!) {
    nftAccounts(filter: { accountId: { equalTo: $accountId } }, first: 50) {
      nodes {
        id
        tokenCount
        collection {
          id
          name
          symbol
          contractAddress
        }
        tokens(first: 100) {
          nodes {
            id
            tokenId
            metadata
            tokenUri
          }
        }
      }
    }
  }
`;

export const SEARCH_GLOBAL = gql`
  query SearchGlobal($searchTerm: String!) {
    psp22Tokens(filter: { or: [{ symbol: { equalTo: $searchTerm } }, { name: { startsWith: $searchTerm } }, { id: { equalTo: $searchTerm } }] }, first: 5) {
      nodes {
        id
        name
        symbol
      }
    }
    psp34Collections(filter: { or: [{ symbol: { equalTo: $searchTerm } }, { name: { startsWith: $searchTerm } }, { id: { equalTo: $searchTerm } }] }, first: 5) {
      nodes {
        id
        name
        symbol
      }
    }
    smartContracts(filter: { or: [{ name: { startsWith: $searchTerm } }, { id: { equalTo: $searchTerm } }] }, first: 5) {
      nodes {
        id
        name
      }
    }
  }
`;

// Staking Queries
export const GET_STAKING_STATS = gql`
  query GetStakingStats {
    stakingPools(first: 10, orderBy: TOTAL_STAKED_DESC) {
      nodes {
        id
        name
        totalStaked
        totalRewards
        apy
        lockPeriod
        minStake
        maxStake
        participantCount
        status
      }
    }
    stakingPositions(first: 100, orderBy: STAKED_AMOUNT_DESC) {
      totalCount
      nodes {
        id
        stakedAmount
        rewards
        status
      }
    }
  }
`;

// Asset Queries
export const GET_ASSETS = gql`
  query GetAssets($first: Int!, $offset: Int!) {
    assets(first: $first, offset: $offset, orderBy: TOTAL_SUPPLY_DESC) {
      nodes {
        id
        assetType
        contractAddress
        name
        symbol
        decimals
        totalSupply
        metadata
        verified
      }
      totalCount
    }
  }
`;

export const GET_NATIVE_ASSETS = gql`
  query GetNativeAssets {
    assets(filter: { assetType: { equalTo: "Native" } }, first: 100) {
      nodes {
        id
        assetType
        contractAddress
        name
        symbol
        decimals
        totalSupply
        metadata
        verified
      }
    }
  }
`;

export const GET_ASSET_DETAIL = gql`
  query GetAssetDetail($id: String!) {
    asset(id: $id) {
      id
      assetType
      contractAddress
      name
      symbol
      decimals
      totalSupply
      metadata
      verified
    }
    assetAccounts(filter: { assetId: { equalTo: $id } }, first: 50) {
      nodes {
        id
        balance
        account {
          id
        }
      }
      totalCount
    }
    assetTransfers(filter: { assetId: { equalTo: $id } }, first: 20, orderBy: BLOCK_NUMBER_DESC) {
      nodes {
        id
        fromId
        toId
        amount
        blockNumber
        timestamp
      }
    }
  }
`;

export const GET_ASSET_TRANSFERS = gql`
  query GetAssetTransfers(
    $first: Int!,
    $offset: Int!,
    $assetId: String,
    $address: String,
    $useAssetAndWallet: Boolean!,
    $useAssetOnly: Boolean!,
    $useWalletOnly: Boolean!,
    $useAll: Boolean!
  ) {
    assetTransfersAssetAndWallet: assetTransfers(
      filter: { and: [
        { assetId: { equalTo: $assetId } },
        { or: [{ fromId: { equalTo: $address } }, { toId: { equalTo: $address } }] }
      ] },
      first: $first,
      offset: $offset,
      orderBy: BLOCK_NUMBER_DESC
    ) @include(if: $useAssetAndWallet) {
      nodes {
        id
        assetId
        fromId
        toId
        amount
        blockNumber
        timestamp
        asset {
          id
          name
          symbol
          decimals
        }
      }
      totalCount
    }
    assetTransfersAssetOnly: assetTransfers(
      filter: { assetId: { equalTo: $assetId } },
      first: $first,
      offset: $offset,
      orderBy: BLOCK_NUMBER_DESC
    ) @include(if: $useAssetOnly) {
      nodes {
        id
        assetId
        fromId
        toId
        amount
        blockNumber
        timestamp
        asset {
          id
          name
          symbol
          decimals
        }
      }
      totalCount
    }
    assetTransfersWalletOnly: assetTransfers(
      filter: { or: [{ fromId: { equalTo: $address } }, { toId: { equalTo: $address } }] },
      first: $first,
      offset: $offset,
      orderBy: BLOCK_NUMBER_DESC
    ) @include(if: $useWalletOnly) {
      nodes {
        id
        assetId
        fromId
        toId
        amount
        blockNumber
        timestamp
        asset {
          id
          name
          symbol
          decimals
        }
      }
      totalCount
    }
    assetTransfersAll: assetTransfers(
      first: $first,
      offset: $offset,
      orderBy: BLOCK_NUMBER_DESC
    ) @include(if: $useAll) {
      nodes {
        id
        assetId
        fromId
        toId
        amount
        blockNumber
        timestamp
        asset {
          id
          name
          symbol
          decimals
        }
      }
      totalCount
    }
  }
`;

export const GET_STAKING_POSITIONS = gql`
  query GetStakingPositions($first: Int!, $offset: Int!) {
    stakingPositions(first: $first, offset: $offset, orderBy: STAKED_AT_DESC) {
      nodes {
        id
        accountId
        stakedAmount
        rewards
        apy
        lastClaimedAt
        stakedAt
        lockPeriod
        status
        unbondingAmount
        unbondingEnd
      }
      totalCount
    }
  }
`;

export const GET_STAKING_REWARDS = gql`
  query GetStakingRewards($accountId: String!) {
    stakingRewards(filter: { accountId: { equalTo: $accountId } }, first: 50, orderBy: TIMESTAMP_DESC) {
      nodes {
        id
        amount
        blockNumber
        timestamp
        type
      }
    }
  }
`;

// Project Queries
export const GET_PROJECT = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      category
      website
      whitepaper
      github
      twitter
      discord
      telegram
      logoUrl
      bannerUrl
      createdAt
      updatedAt
      verified
      verifiedAt
      createdBy
    }
    projectTeamMembers(filter: { projectId: { equalTo: $id } }) {
      nodes {
        id
        name
        role
        linkedin
        twitter
        avatarUrl
      }
    }
    projectRoadmaps(filter: { projectId: { equalTo: $id } }, orderBy: ID_ASC) {
      nodes {
        id
        quarter
        title
        description
        status
        completedAt
      }
    }
  }
`;

export const GET_PROJECTS = gql`
  query GetProjects($first: Int!, $offset: Int!) {
    projects(first: $first, offset: $offset, orderBy: CREATED_AT_DESC) {
      nodes {
        id
        name
        description
        category
        logoUrl
        verified
        createdAt
        createdBy
      }
      totalCount
    }
  }
`;

export const GET_NFT_COLLECTION = gql`
  query GetNFTCollection($id: String!) {
    psp34Collection(id: $id) {
      id
      name
      symbol
      totalSupply
      contractAddress
      createdAt
      createdBy
    }
  }
`;
export const GET_LATEST_TRANSFERS_ASSETS = gql`
  query GetLatestAssetTransfers($first: Int = 50) {
    assetTransfers(first: $first, orderBy: ID_DESC) {
      nodes {
        id
        assetId
        fromId
        toId
        amount
        blockNumber
        timestamp,
        asset {
          id
          name
          symbol
          decimals
        }
      }
    }
  }
`;
