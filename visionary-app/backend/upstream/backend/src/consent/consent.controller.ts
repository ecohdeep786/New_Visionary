import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { ConsentService } from './consent.service';

/**
 * DATA-05 consent/share endpoints. Every command re-verifies the browser
 * session and expected account; the uid is always server-derived. Consent is
 * the data subject's own; shares belong to the resource owner. Revocation
 * blocks pending jobs, flushes caches and refuses freshly requested downloads.
 * Not yet wired into the connected runtime (Cloud SQL adapter + controller
 * cutover is later integration); standalone module for review.
 */
@Controller('api/consent')
export class ConsentController extends ProductRequestAuthority {
  constructor(
    accounts: FirebaseProductService,
    config: ConfigService,
    private readonly consent: ConsentService,
  ) {
    super(accounts, config);
  }

  @Post()
  async grant(@Req() req: Request, @Body() body: { purpose: string; resourceId?: string; consentVersion: string; expiresInSeconds?: number }) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.consent.grant(uid, { id: `g_${uid}_${Date.now()}`, uid, resourceId: body.resourceId, purpose: body.purpose as any, consentVersion: body.consentVersion, expiresInSeconds: body.expiresInSeconds });
  }

  @Post(':grantId/revoke')
  async revoke(@Req() req: Request, @Param('grantId') grantId: string) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.consent.revoke(uid, grantId);
  }

  @Post('shares')
  async share(@Req() req: Request, @Body() body: { resourceType: string; resourceId: string; grantedToUid: string; purpose: string; scope: string; consentVersion: string; expiresInSeconds?: number }) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.consent.share(uid, { id: `s_${uid}_${Date.now()}`, uid, resourceType: body.resourceType, resourceId: body.resourceId, grantedToUid: body.grantedToUid, purpose: body.purpose as any, scope: body.scope, consentVersion: body.consentVersion, expiresInSeconds: body.expiresInSeconds });
  }

  @Post('shares/:shareId/revoke')
  async revokeShare(@Req() req: Request, @Param('shareId') shareId: string) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.consent.revokeShare(uid, shareId);
  }

  @Get()
  async list(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    return this.consent.list(uid);
  }

  @Get('shares')
  async shares(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    return this.consent.sharesFor(uid);
  }

  @Get('history')
  async track(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    return this.consent.track(uid);
  }
}
