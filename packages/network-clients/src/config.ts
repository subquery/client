// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SdkOptions } from '@subql/contract-sdk/types';

import mainnetDeploymentDetails from '@subql/contract-sdk/publish/mainnet.json';
import keplerDeploymentDetails from '@subql/contract-sdk/publish/kepler.json';
import testnetDeploymentDetails from '@subql/contract-sdk/publish/testnet.json';

export enum SQNetworks {
  TESTNET = 'testnet',
  KEPLER = 'kepler',
  MAINNET = 'mainnet',
}

export enum GqlEndpoint {
  Explorer = 'explorer',
}

export interface NetworkConfig {
  gql: Record<GqlEndpoint, string>;
  defaultEndpoint: string;
  sdkOptions: SdkOptions;
}

export const NETWORK_CONFIGS: Record<SQNetworks, NetworkConfig> = {
  [SQNetworks.KEPLER]: {
    gql: {
      // TODO: change to kepler-prod endpoint
      [GqlEndpoint.Explorer]:
        process.env.KEPLER_SUBQL ?? 'https://api.subquery.network/sq/subquery/kepler-testnet-subql-project',
    },
    defaultEndpoint: process.env.KEPLER_RPC ?? 'https://moonbeam-alpha.api.onfinality.io/public', // TODO when launch
    sdkOptions: { deploymentDetails: keplerDeploymentDetails },
  },
  [SQNetworks.TESTNET]: {
    gql: {
      [GqlEndpoint.Explorer]:
        process.env.DEFAULT_IPFS_URL ?? 'https://api.subquery.network/sq/subquery/kepler-testnet-subql-project',
    },
    defaultEndpoint: process.env.TESTNET_RPC ?? 'https://moonbeam-alpha.api.onfinality.io/public',
    sdkOptions: { deploymentDetails: testnetDeploymentDetails },
  },
  [SQNetworks.MAINNET]: {
    gql: {
      [GqlEndpoint.Explorer]:
       // TODO: change to mainnet-prod endpoint
      process.env.DEFAULT_IPFS_URL ?? 'https://api.subquery.network/sq/subquery/subquery-network-subql-project',
    },
    defaultEndpoint: process.env.MAINNET_RPC ?? 'https://moonbeam-alpha.api.onfinality.io/public', // TODO when launch
    sdkOptions: { deploymentDetails: mainnetDeploymentDetails },
  },
};

export const DEFAULT_IPFS_URL = process.env.DEFAULT_IPFS_URL ?? 'https://interipfs.thechaindata.com/ipfs/api/v0';
