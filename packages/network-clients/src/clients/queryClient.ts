// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';
import { GqlEndpoint, NetworkConfig } from "../config";
import { GetIndexer, GetIndexer_indexer } from "../__generated__/GetIndexer";
import { GET_INDEXER } from "../graphql/indexer";
import { wrapApolloResult } from "../utils/apollo";
import { GET_DELEGATION } from '../graphql/staking';
import { GetDelegation, GetDelegation_delegation } from '../__generated__/GetDelegation';

type ApolloClients = { [key: string]: ApolloClient<unknown> };

export class GraphqlQueryClient {
  private apolloClients: ApolloClients = {};

  get explorerClient() {
    return this.apolloClients[GqlEndpoint.Explorer];
  }

  constructor(private config: NetworkConfig) {
    this.apolloClients[GqlEndpoint.Explorer] = new ApolloClient({
      cache: new InMemoryCache({ resultCaching: true }),
      link: new HttpLink({ uri: config.gql.explorer, fetch: fetch }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache',
        },
        query: {
          fetchPolicy: 'no-cache',
        },
      },
    });
  }

  // QUERY REGISTRY QUERY FUNCTIONS

  async getIndexer(address: string): Promise<GetIndexer_indexer> {
    const result = await wrapApolloResult(this.explorerClient.query<GetIndexer>({
      query: GET_INDEXER,
      variables: {address},
    }));
    if (!result || !result.indexer) {
      throw new Error(`indexer not found`);
    } else {
      return result.indexer;
    }
  }

  async getDelegation(indexer: string, delegator: string): Promise<GetDelegation_delegation> {
    const result = await wrapApolloResult(this.explorerClient.query<GetDelegation>({
      query: GET_DELEGATION,
      variables: {id: `${indexer}:${delegator}`},
    }));
    if (!result || !result.delegation) {
      throw new Error(`delegation not found`);
    } else {
      return result.delegation;
    }
  }
}
