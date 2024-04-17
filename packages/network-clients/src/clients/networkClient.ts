// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ContractSDK } from '@subql/contract-sdk/sdk';
import type { Provider as AbstractProvider } from '@ethersproject/abstract-provider';
import { Signer, providers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';

import { ContractClient } from './contractClient';
import { IPFSClient } from './ipfsClient';
import { GraphqlQueryClient } from './queryClient';

import { fetchByCacheFirst, isCID } from '../utils';
import { DEFAULT_IPFS_URL, NETWORK_CONFIGS } from '@subql/network-config';
import assert from 'assert';
import { Indexer, IndexerMetadata } from '../models/indexer';
import { parseRawEraValue } from '../utils/parseEraValue';
import { SQNetworks } from '@subql/network-config';
import { ApolloClient, ApolloClientOptions, NormalizedCacheObject } from '@apollo/client/core';
import { IndexerFieldsFragment } from '@subql/network-query';

type Provider = AbstractProvider | Signer;

export class NetworkClient {
  private _contractClient: ContractClient;
  private _ipfs: IPFSClient;

  constructor(private _sdk: ContractSDK, private _gqlClient: GraphqlQueryClient, ipfsUrl?: string) {
    this._ipfs = new IPFSClient(ipfsUrl ?? DEFAULT_IPFS_URL);
    this._contractClient = new ContractClient(_sdk);
  }

  public static create(
    network: SQNetworks,
    provider?: Provider,
    ipfsUrl?: string,
    options?: {
      queryClientOptions?:
        | ApolloClient<NormalizedCacheObject>
        | Partial<ApolloClientOptions<NormalizedCacheObject>>;
    }
  ) {
    const config = NETWORK_CONFIGS[network];
    assert(config, `config for ${network} is missing`);
    const sdk = ContractSDK.create(
      provider ?? new providers.StaticJsonRpcProvider(config.defaultEndpoint),
      config.sdkOptions
    );
    const gqlClient = new GraphqlQueryClient(config, options?.queryClientOptions);
    return new NetworkClient(sdk, gqlClient, ipfsUrl);
  }

  public async getIndexer(
    address: string,
    era?: BigNumber,
    indexerInfo?: IndexerFieldsFragment
  ): Promise<Indexer | undefined> {
    let currentEra = era;
    if (!currentEra) {
      currentEra = await fetchByCacheFirst(this._sdk.eraManager.eraNumber, 'eraNumber', 0);
    }
    const leverageLimit = await fetchByCacheFirst(
      this._sdk.staking.indexerLeverageLimit,
      'leverageLimit',
      0
    );

    const indexer = indexerInfo || (await this._gqlClient.getIndexer(address));

    if (!indexer) return;
    const {
      controller,
      commission,
      selfStake: ownStake,
      totalStake,
      metadata: indexerMetadata,
    } = indexer;

    const metadata = await this._ipfs.getJSON<{
      name: string;
      url: string;
    }>(indexerMetadata);

    const sortedTotalStake = parseRawEraValue(totalStake, currentEra.toNumber());
    const sortedOwnStake = parseRawEraValue(ownStake, currentEra.toNumber());

    const delegated = {
      current: sortedTotalStake.current.sub(sortedOwnStake.current),
      after: sortedTotalStake.after.sub(sortedOwnStake.after),
    };

    const capacity = {
      current:
        sortedOwnStake.current.mul(leverageLimit).sub(sortedTotalStake.current) ||
        BigNumber.from(0),
      after:
        sortedOwnStake.after.mul(leverageLimit).sub(sortedTotalStake.after) || BigNumber.from(0),
    };

    // Jun 2022 commission-divUnit = perMil / 100 -> 10,000
    const COMMISSION_DIV_UNIT = 10000;
    const PERCENTAGE_UNIT = 100;
    const rawCommission = parseRawEraValue(commission, currentEra.toNumber() - 1);
    const sortedCommission = {
      current: rawCommission.current.toNumber() / (COMMISSION_DIV_UNIT * PERCENTAGE_UNIT),
      after: rawCommission.after.toNumber() / (COMMISSION_DIV_UNIT * PERCENTAGE_UNIT),
    };

    return {
      metadata,
      address,
      controller,
      commission: sortedCommission,
      totalStake: sortedTotalStake,
      ownStake: sortedOwnStake,
      delegated,
      capacity,
    };
  }

  public async getIndexerMetadata(address: string): Promise<IndexerMetadata | undefined> {
    const indexer = await this._gqlClient.getIndexer(address);
    if (!indexer) return;
    const { metadata: metadatCID } = indexer;
    const metadata = await this._ipfs.getJSON<{
      name: string;
      url: string;
    }>(metadatCID);

    return metadata;
  }

  public async maxUnstakeAmount(address: string, eraNumber?: number): Promise<BigNumber> {
    const minStakingAmount = await this._sdk.indexerRegistry.minimumStakingAmount();

    const indexer = await this._gqlClient.getIndexer(address);
    const delegation = await this._gqlClient.getDelegation(address, address);

    if (!indexer || !delegation) return BigNumber.from(0);
    const { amount: ownStake } = delegation;

    let _eraNumber = eraNumber;
    if (!_eraNumber) {
      _eraNumber = await (await this._sdk.eraManager.eraNumber()).toNumber();
    }

    const sortedOwnStake = parseRawEraValue(ownStake, _eraNumber);

    const ownStakeAfter = BigNumber.from(sortedOwnStake?.after ?? 0);

    return ownStakeAfter.sub(minStakingAmount);
  }

  public async getDelegating(address: string): Promise<{
    curEra: BigNumber;
    nextEra: BigNumber;
  }> {
    const currentEra = await this._sdk.eraManager.eraNumber();
    const ownDelegation = await this._gqlClient.getDelegation(address, address);
    const delegator = await this._gqlClient.getDelegator(address);

    if (!delegator)
      return {
        curEra: BigNumber.from(0),
        nextEra: BigNumber.from(0),
      };

    const eraNumber = currentEra.toNumber();
    const ownStake = ownDelegation?.amount;
    const { totalDelegations } = delegator;

    const sortedOwnStake = ownStake
      ? parseRawEraValue(ownStake, eraNumber)
      : {
          current: BigNumber.from(0),
          after: BigNumber.from(0),
        };

    const sortedTotalDelegations = parseRawEraValue(totalDelegations, eraNumber);
    return {
      curEra: sortedTotalDelegations.current.sub(sortedOwnStake.current),
      nextEra: sortedTotalDelegations.after.sub(sortedOwnStake.after),
    };
  }

  public async projectMetadata(cid: string) {
    if (!isCID(cid)) throw new Error(`Invalid cid: ${cid}`);
    // get project metadata
    // cat project metadata
  }

  public setGqlClient(gqlClient: GraphqlQueryClient) {
    this._gqlClient = gqlClient;
  }
}
