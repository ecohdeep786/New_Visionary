import { BadRequestException, Controller, ForbiddenException, Get, Header, HttpException, Query, Req, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { OverviewPolicyError, OverviewService } from './overview.service';

/**
 * DATA-07 owner-scoped overview endpoints. The uid is always server-derived
 * from the verified browser session; the repository only returns rows the uid
 * owns. The product's SQL adapter is explicitly enabled; unavailable owning
 * stores never fall back to fictional browser or in-memory projections.
 */
@Controller('overview')
export class OverviewController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly overview: OverviewService) {
    super(accounts, config);
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  async getOverview(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    return this.read(() => this.overview.overview(uid));
  }

  @Get('history')
  @Header('Cache-Control', 'no-store')
  async history(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.read(() => this.overview.history(uid, after, limit));
  }

  @Get('audit')
  @Header('Cache-Control', 'no-store')
  async audit(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.read(() => this.overview.audit(uid, after, limit));
  }

  @Get('workspaces')
  @Header('Cache-Control', 'no-store')
  async workspaces(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.read(() => this.overview.workspaces(uid, after, limit));
  }
  @Get('memberships')
  @Header('Cache-Control', 'no-store')
  async memberships(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.read(() => this.overview.memberships(uid, after, limit));
  }
  @Get('consents')
  @Header('Cache-Control', 'no-store')
  async consents(@Req() req: Request, @Query('after') after: string, @Query('limit') limit: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.read(() => this.overview.consents(uid, after, limit));
  }
  private async read<T>(operation: () => Promise<T>) {
    try { return await operation(); }
    catch (error) {
      if (error instanceof OverviewPolicyError) {
        if (error.code === 'unauthorized') throw new ForbiddenException('Account records are unavailable for this identity.');
        throw new BadRequestException('Use a valid overview cursor and a limit from 1 to 50.');
      }
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Account overview is temporarily unavailable. Your saved records are retained.');
    }
  }
  protected async commandAccount(req: Request, touch = false) {
    const current = await super.commandAccount(req, touch);
    if (Object.keys(req.query ?? {}).some(key => !['after', 'limit'].includes(key))) throw new BadRequestException('Use only overview pagination parameters.');
    await this.service.rateLimit('account-overview', current.uid, 30);
    return current;
  }
}
