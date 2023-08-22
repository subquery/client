// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Agreement, OrderType, Plan, ProjectType } from '../types';
import { CacheTool } from './cache';
import { Logger } from './logger';
import { fetchOrders } from './query';

type Options = {
  logger: Logger;
  authUrl: string;
  projectId: string;
  projectType: ProjectType;
  cache: CacheTool;
};

class OrderManager {
  private nextAgreementIndex: number | undefined;
  private agreements: Agreement[] | undefined;

  private nextPlanIndex: number | undefined;
  private plans: Plan[] | undefined;

  private projectType: ProjectType;
  private logger: Logger;
  private cache: CacheTool;

  private authUrl: string;
  private projectId: string;
  private interval = 300_000;
  private healthy = true;
  private _init: Promise<void>;

  constructor(options: Options) {
    const { authUrl, projectId, logger, projectType, cache } = options;
    this.authUrl = authUrl;
    this.projectId = projectId;
    this.projectType = projectType;
    this.logger = logger;
    this.cache = cache;

    this._init = this.refreshAgreements();
    setInterval(this.refreshAgreements, this.interval);
  }

  private async refreshAgreements() {
    try {
      const { agreements, plans } = await fetchOrders(
        this.authUrl,
        this.projectId,
        this.projectType
      );
      this.agreements = agreements;
      this.plans = plans;
      this.healthy = true;
    } catch (e) {
      // it seems cannot reach this code, fetchOrders already handle the errors.
      this.logger.error(`fetch orders failed: ${String(e)}`);
      this.healthy = false;
    }
  }

  private getRandomStartIndex(n: number) {
    return Math.floor(Math.random() * n);
  }

  private getNextOrderIndex(total: number, currentIndex: number) {
    return currentIndex < total - 1 ? currentIndex + 1 : 0;
  }

  public async getNextOrderType(): Promise<OrderType | undefined> {
    await this._init;
    if (this.agreements?.length) return OrderType.agreement;
    if (this.plans?.length) return OrderType.flexPlan;
    return undefined;
  }

  public async getNextAgreement(): Promise<Agreement | undefined> {
    await this._init;

    if (!this.healthy || !this.agreements?.length) return;

    if (this.nextAgreementIndex === undefined) {
      this.nextAgreementIndex = this.getRandomStartIndex(this.agreements.length);
    }

    const agreement = this.agreements[this.nextAgreementIndex];
    this.nextAgreementIndex = this.getNextOrderIndex(
      this.agreements.length,
      this.nextAgreementIndex
    );

    return agreement;
  }

  public async getNextPlan(): Promise<Plan | undefined> {
    await this._init;

    if (!this.healthy || !this.plans?.length) return;

    if (this.nextPlanIndex === undefined) {
      this.nextPlanIndex = this.getRandomStartIndex(this.plans.length);
    }

    const plan = this.plans[this.nextPlanIndex];
    this.nextPlanIndex = this.getNextOrderIndex(this.plans.length, this.nextPlanIndex);

    return plan;
  }

  public updateTokenById(agreementId: string, token: string) {
    if (this.agreements === undefined) return;
    const index = this.agreements?.findIndex((a) => a.id === agreementId);
    if (index === -1) return;

    this.agreements[index].token = token;
  }
}

export default OrderManager;
