// Copyright 2020-2022 SubQuery Pte Ltd authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchAgreements } from "./query";
import { Agreement } from "./types";

class AgreementMananger {

  private nextAgreementIndex: number;
  private agreements: Agreement[] | undefined;

  private authUrl: string;
  private projectChainId: string;
  private interval = 300_000;

  constructor() {
    this.nextAgreementIndex = 0;
    this.authUrl = '';
    this.projectChainId = '';
  }

  private async refreshAgreements() {
    try {
      const agreements = await fetchAgreements(this.authUrl, this.projectChainId);
      this.agreements = agreements;
    } catch {
      // TODO: output log
    }
  }

  public start() {
    this.refreshAgreements();
    setInterval(this.refreshAgreements, this.interval);
  }

  public init(authUrl: string, projectNetworkId: string) {
    this.authUrl = authUrl;
    this.projectChainId = projectNetworkId;
  }

  public async getNextAgreement(): Promise<Agreement | undefined> {
    if (this.agreements === undefined) {
      this.agreements = await fetchAgreements(this.authUrl, this.projectChainId);
    }

    if (this.agreements.length === 0) return;

    let agreement = this.agreements[this.nextAgreementIndex];
    if (this.nextAgreementIndex < this.agreements.length - 1) {
      this.nextAgreementIndex = this.nextAgreementIndex + 1;
      agreement = this.agreements[this.nextAgreementIndex];
    } else {
      this.nextAgreementIndex = 0;
    }

    return agreement;
  }

  public updateTokenById(agreementId: string, token: string) {
    if (this.agreements === undefined) return;
    const index = this.agreements?.findIndex((a) => a.id === agreementId);
    if (index === -1) return;

    this.agreements[index].token = token;
  }
}

const agreementMananger = new AgreementMananger();

export default agreementMananger;