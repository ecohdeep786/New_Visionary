import { Controller, Get, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { OverviewService } from './overview.service';

/**
 * DATA-07 owner-scoped overview endpoints. The uid is always server-derived
 * from the verified browser session; the repository only returns rows the uid
 * owns. Not wired into the connected runtime yet (Cloud SQL/Firestore adapter
 * + controller cutover is later integration); ship as a standalone module.
 */
@Controller('api/overview')
export class OverviewController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly overview: OverviewService) {
    super(accounts, config);
  }

  @Get()
  async getOverview(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    return this.overview.overview(uid);
  }

  @Get('history')
  async history(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.overview.history(uid, after, limit);
  }

  @Get('audit')
  async audit(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.overview.audit(uid, after, limit);
  }
}
