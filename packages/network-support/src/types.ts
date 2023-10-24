// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

export enum ProjectType {
  dictionary = 'dictionary',
  deployment = 'deployment',
}

export enum OrderType {
  agreement = 'agreement',
  flexPlan = 'flexPlan',
}

export type OrderWithType = (Order | ServiceAgreementOrder) & { type: OrderType };

export interface Order {
  id: string;
  runner: string;
  url: string;
}

export interface ServiceAgreementOrder extends Order {
  token: string;
}

export type FlexPlanOrder = Order;

export type ChannelState = {
  channelId: string;
  indexer: string;
  consumer: string;
  spent: string;
  remote: string;
  isFinal: boolean;
  indexerSign: string;
  consumerSign: string;
};

export type ChannelAuth = {
  authorization: string;
};

export type RequestParam = {
  url: string;
  headers: { [key: string]: string };
  // type: OrderType;
  runner: string;
  responseTransform?(body: string, headers: Headers): string | Promise<string>;
  postRequest?(body: string, headers: Headers): void | Promise<void>;
};

export class RequestParamError extends Error {
  constructor(message: string, public runner: string) {
    super(message);
  }
}

export interface WrappedResponse {
  result: string; // base64 encoded
  signature: string; // indexer signature
  state: string; // base64 encoded channel state
}
