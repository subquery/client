// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { from, HttpLink, ApolloLink, HttpOptions } from '@apollo/client/core';

import { AuthLink, GET } from "../auth-link";

interface AuthHttpOptions {
  authUrl: string;          // auth service url
  chainId: string;          // genesis hash of the chain
  httpOptions: HttpOptions; // http options for init `HttpLink`
}

interface MetadataResponse {
  indexer?: string;
  uri: string;
  deploymentId: string;
  networkChainId: number;
}

export async function authHttpLink(options: AuthHttpOptions): Promise<ApolloLink> {
  const { chainId, httpOptions } = options;

  const authUrl = options.authUrl?.trim().replace(/\/+$/, '');
  const metadataUrl = `${authUrl}/metadata/${chainId}`;

  const { indexer, uri, deploymentId, networkChainId } = await GET<MetadataResponse>(metadataUrl);
  if (!indexer) throw new Error(`No indexer found for chainId ${chainId} in the network!`);

  const httpLink = new HttpLink({ ...httpOptions, uri });
  const authLink = new AuthLink({ authUrl, deploymentId, indexer, chainId: networkChainId });

  return from([authLink, httpLink]);
}