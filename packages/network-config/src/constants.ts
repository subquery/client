// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

export enum SQNetworks {
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
  LOCAL = 'local',
}

export enum GQLEndpoint {
  Network = 'network',
  Leaderboard = 'leaderboard',
}

export const IPFS_URLS = {
  project: 'https://ipfs.subquery.network/ipfs/api/v0',
  metadata: 'https://unauthipfs.subquery.network/ipfs/api/v0',
};

export const RPC_ENDPOINTS = {
  [SQNetworks.MAINNET]: 'https://mainnet.base.org/',
  [SQNetworks.TESTNET]: 'https://sepolia.base.org',
  [SQNetworks.LOCAL]: 'https://sepolia.base.org',
};

export const NETWORK_SUBQL_ENDPOINTS = {
  [SQNetworks.MAINNET]: 'https://api.subquery.network/sq/subquery/kepler-network',
  [SQNetworks.LOCAL]: 'https://api.subquery.network/sq/subquery/kepler-network',
  // TODO: change back to testnet-prod endpoint
  [SQNetworks.TESTNET]: 'https://api.subquery.network/sq/subquery/kepler-testnet',
};

export const LEADERBOARD_SUBQL_ENDPOINTS = {
  [SQNetworks.MAINNET]: 'https://leaderboard-api.subquery.network/graphql',
  [SQNetworks.LOCAL]: 'https://leaderboard-api.subquery.network/graphql',
  [SQNetworks.TESTNET]: 'https://leaderboard-api.thechaindata.com/graphql',
};

export const STABLE_COIN_ADDRESSES = {
  [SQNetworks.MAINNET]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [SQNetworks.TESTNET]: '0x26dF8d79C4FaCa88d0212f0bd7C4A4d1e8955F0e', // TODO: change it
  [SQNetworks.LOCAL]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

export const STABLE_COIN_SYMBOLS = {
  [SQNetworks.MAINNET]: 'USDC',
  [SQNetworks.TESTNET]: 'USDC',
  [SQNetworks.LOCAL]: 'USDC',
} as const;

export const TOKEN_SYMBOLS = {
  [SQNetworks.MAINNET]: 'SQT',
  [SQNetworks.TESTNET]: 'SQT',
  [SQNetworks.LOCAL]: 'kSQT',
} as const;

export const STABLE_COIN_DECIMAL = 6;
export const SQT_DECIMAL = 18;

export function gqlEndpoints(network: SQNetworks) {
  return {
    [GQLEndpoint.Network]: NETWORK_SUBQL_ENDPOINTS[network],
    [GQLEndpoint.Leaderboard]: LEADERBOARD_SUBQL_ENDPOINTS[network],
  };
}

export const NETWORKS_CONFIG_INFO = {
  [SQNetworks.TESTNET]: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia Testnet',
    rpcUrls: ['https://sepolia.base.org'],
    iconUrls: ['https://base.org/document/apple-touch-icon.png'],
    blockExplorerUrls: ['https://sepolia.basescan.org/'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  [SQNetworks.MAINNET]: {
    chainId: '0x2105',
    chainName: 'Base',
    rpcUrls: ['https://mainnet.base.org'],
    iconUrls: ['https://base.org/document/apple-touch-icon.png'],
    blockExplorerUrls: ['https://basescan.org/'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  [SQNetworks.LOCAL]: {
    chainId: '0x14a34',
    chainName: 'Base Sepolia Testnet',
    rpcUrls: ['https://sepolia.base.org'],
    iconUrls: ['https://base.org/document/apple-touch-icon.png'],
    blockExplorerUrls: ['https://sepolia.basescan.org/'],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};
