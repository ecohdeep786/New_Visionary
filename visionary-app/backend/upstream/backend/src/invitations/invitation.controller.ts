import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { InvitationService } from './invitation.service';

/**
 * DATA-04 invitation endpoints. Every command re-verifies the browser session
 * and expected account before touching domain records; the uid is always
 * server-derived. A role picker, email match, guessed ID or browser record
 * never establishes permission — that is enforced by InvitationService.
 * Not yet wired into the connected runtime (Cloud SQL adapter + controller
 * cutover is later integration); ship as a standalone module for review.
 */
@Controller('api/invitations')
export class InvitationsController extends ProductRequestAuthority {
  constructor(
    accounts: FirebaseProductService,
    config: ConfigService,
    private readonly invitations: InvitationService,
  ) {
    super(accounts, config);
  }

  @Post()
  async create(@Req() req: Request, @Body() body: { workspaceId: string; email: string; role: string }) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.invitations.invite(uid, body.workspaceId, { email: body.email, role: body.role });
  }

  @Post(':invitationId/revoke')
  async revoke(@Req() req: Request, @Param('invitationId') invitationId: string) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.invitations.revoke(uid, invitationId);
  }

  @Post('accept')
  async accept(@Req() req: Request, @Body() body: { token: string }) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.invitations.accept(uid, body.token);
  }

  @Get(':workspaceId')
  async list(@Req() req: Request, @Param('workspaceId') workspaceId: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.invitations.list(uid, workspaceId);
  }

  @Get(':workspaceId/history/:invitationId')
  async track(@Req() req: Request, @Param('workspaceId') _ws: string, @Param('invitationId') invitationId: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.invitations.track(uid, invitationId);
  }
}
