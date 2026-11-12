import { BadRequestException, Body, Controller, Get, Header, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { ProductConsentService } from './product-consent.service';
@Controller('account/privacy/consents')
export class ProductConsentController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly consents: ProductConsentService) { super(accounts, config); }
  @Get()
  @Header('Cache-Control', 'no-store')
  async list(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    if (Object.keys(req.query ?? {}).some(key => key !== 'cursor') || req.query.cursor !== undefined &&
        (typeof req.query.cursor !== 'string' || req.query.cursor.length > 512)) throw new BadRequestException('Invalid consent page.');
    return this.consents.list(uid, req.query.cursor as string | undefined);
  }
  @Post('revoke')
  @Header('Cache-Control', 'no-store')
  async revoke(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).join(',') !== 'grantId' ||
        typeof (input as any).grantId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test((input as any).grantId)) throw new BadRequestException('Use a valid consent reference.');
    return this.consents.revoke(uid, (input as { grantId: string }).grantId);
  }
}
