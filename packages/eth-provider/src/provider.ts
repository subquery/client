// Copyright 2020-2023 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { JsonRpcProvider } from '@ethersproject/providers';
import { deepCopy } from '@ethersproject/properties';
import { ConnectionInfo, fetchJson } from '@ethersproject/web';
import { Networkish } from '@ethersproject/networks';
import {
  Logger,
  OrderManager,
  ProjectType,
  RequestParam,
  silentLogger,
} from '@subql/network-support';
import { IStore } from '@subql/apollo-links/dist/utils/store';

function getResult(payload: {
  error?: { code?: number; data?: any; message?: string };
  result?: any;
}): any {
  if (payload.error) {
    // @TODO: not any
    const error: any = new Error(payload.error.message);
    error.code = payload.error.code;
    error.data = payload.error.data;
    throw error;
  }

  return payload.result;
}

interface Options {
  deploymentId: string;
  authUrl: string; // auth service url
  logger?: Logger; // logger for `AuthLink`
  fallbackUrl?: string | ConnectionInfo; // fall back service url for `AuthLink`
  scoreStore?: IStore; // pass store in, so it doesn't get lost between page refresh
  maxRetries?: number;
  network?: Networkish;
}

const MAX_RETRIES = 3;

export class SubqueryAuthedRpcProvider extends JsonRpcProvider {
  protected logger: Logger;
  protected fallbackUrl?: string | ConnectionInfo;
  protected maxRetries: number;
  protected orderManager: OrderManager;

  constructor(opt: Options) {
    super(undefined, opt.network);
    this.logger = opt.logger ? opt.logger : silentLogger();
    this.fallbackUrl = opt.fallbackUrl;
    this.maxRetries = opt.maxRetries ?? MAX_RETRIES;
    this.orderManager = new OrderManager({
      authUrl: opt.authUrl,
      projectId: opt.deploymentId,
      projectType: ProjectType.deployment,
      logger: this.logger,
    });
  }

  override async send(method: string, params: Array<any>): Promise<any> {
    const request = {
      method: method,
      params: params,
      id: this._nextId++,
      jsonrpc: '2.0',
    };

    this.emit('debug', {
      action: 'request',
      request: deepCopy(request),
      provider: this,
    });

    // We can expand this in the future to any call, but for now these
    // are the biggest wins and do not require any serializing parameters.
    const cache = ['eth_chainId', 'eth_blockNumber'].indexOf(method) >= 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (cache && super._cache[method]) {
      return super._cache[method];
    }
    let result;
    const requestParams = await this.orderManager.getRequestParams();
    if (requestParams) {
      const { url, runner, headers, responseTransform, postRequest } = requestParams;
      try {
        result = await this._send(
          {
            url,
            headers,
          },
          request,
          responseTransform
        );
        if (postRequest) {
          await postRequest(result);
        }
      } catch (err) {
        if (this.fallbackUrl) {
          result = await this._send(this.fallbackUrl, request);
        } else {
          throw err;
        }
      }
    }

    // Cache the fetch, but clear it on the next event loop
    if (cache) {
      this._cache[method] = result;
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super._cache[method] = null;
      }, 50);
    }
    return;
  }

  async _send(
    url: string | ConnectionInfo,
    request: unknown,
    transform?: RequestParam['responseTransform'],
    retries = 0
  ): Promise<any> {
    let result;
    try {
      result = await fetchJson(this.connection, JSON.stringify(request), async (payload, resp) => {
        let res = payload;
        if (transform) {
          res = await transform(payload, new Headers(resp.headers));
        }
        return getResult(res);
      }).then((result) => {
        this.emit('debug', {
          action: 'response',
          request: request,
          response: result,
          provider: this,
        });

        return result;
      });
    } catch (error) {
      this.logger.debug({
        action: 'response',
        error: error,
        request: request,
        provider: this,
      });
      if (retries < this.maxRetries) {
        return this._send(url, request, transform, retries + 1);
      }
    }

    return result;
  }
}
