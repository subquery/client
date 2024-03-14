// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';
import { ServiceAgreementOrder, FlexPlanOrder, ProjectType } from '../types';

let timeout = 10_000;

export const setFetchTimeout = (newVal: number) => {
  timeout = newVal;
};

export const timeoutController = () => {
  const abort = new AbortController();

  setTimeout(() => abort.abort(), timeout);

  return abort;
};

export const customFetch = (
  input: URL | RequestInfo,
  init?: RequestInit | undefined
): Promise<Response> => {
  return fetch(input, {
    signal: timeoutController().signal,
    ...init,
  });
};

export async function POST<T>(
  url: string,
  body: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const headers = { 'Content-Type': 'application/json' };
  const res = await customFetch(url, {
    body: JSON.stringify(body),
    method: 'post',
    headers,
  });
  if (res.status >= 400) {
    throw new Error('Bad response from server');
  }
  return res.json();
}

export async function GET<T>(url: string): Promise<T> {
  const headers = { 'Content-Type': 'application/json' };
  const res = await customFetch(url, {
    method: 'get',
    headers,
  });
  if (res.status >= 400) {
    throw new Error('Bad response from server');
  }
  return res.json();
}

interface AgreementsResponse {
  agreements: ServiceAgreementOrder[];
  plans: FlexPlanOrder[];
}

export async function fetchOrders(
  authUrl: string,
  projectId: string,
  projectType: ProjectType,
  apikey?: string
) {
  try {
    const agreementsURL = new URL(`/orders/${projectType}/${projectId}`, authUrl);
    if (apikey) {
      agreementsURL.searchParams.append('apikey', apikey);
    }
    return await GET<AgreementsResponse>(agreementsURL.toString());
  } catch {
    return { agreements: [], plans: [] };
  }
}
