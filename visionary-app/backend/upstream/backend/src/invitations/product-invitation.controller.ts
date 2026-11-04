import { BadRequestException, Body, Controller, Header, HttpException, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { record } from '../privacycore/privacy-policy';
import { InvitationPolicyError } from './invitation-types';
import { ProductInvitationService } from './product-invitation.service';

@Controller('account/invitations')
export class ProductInvitationController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly invitations: ProductInvitationService) {
    super(accounts, config);
  }

  private body(input: unknown, fields: string[]) {
    try {
      record(input, fields);
      return input as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Invalid invitation request.');
    }
  }

  private async command<T>(action: () => Promise<T>) {
    try { return await action(); }
    catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof InvitationPolicyError) {
        const status = { invalid_command: 400, unauthorized: 403, invalid_token: 404, not_found: 404,
          expired: 410, revoked: 410, already_accepted: 409, conflict: 409, unavailable: 503 }[error.code];
        throw new HttpException({ code: error.code, message: 'Invitation request could not be completed.' }, status);
      }
      throw new ServiceUnavailableException('Institution invitations are unavailable.');
    }
  }

  @Post('issue')
  @Header('Cache-Control', 'no-store')
  async issue(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { workspaceId, email, role, expiresInSeconds } = this.body(input, ['workspaceId', 'email', 'role', 'expiresInSeconds']);
    if (typeof workspaceId !== 'string') throw new BadRequestException('Workspace is required.');
    return this.command(() => this.invitations.issue(uid, workspaceId, { email, role, expiresInSeconds }));
  }

  @Post('accept')
  @Header('Cache-Control', 'no-store')
  async accept(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { token } = this.body(input, ['token']);
    return this.command(() => this.invitations.accept(uid, token));
  }

  @Post('pending')
  @Header('Cache-Control', 'no-store')
  async pending(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { workspaceId, email } = this.body(input, ['workspaceId', 'email']);
    return this.command(() => this.invitations.pending(uid, workspaceId, email));
  }

  @Post('revoke')
  @Header('Cache-Control', 'no-store')
  async revokeInvitation(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { workspaceId, invitationId } = this.body(input, ['workspaceId', 'invitationId']);
    return this.command(() => this.invitations.revokeInvitation(uid, workspaceId, invitationId));
  }

  @Post('history')
  @Header('Cache-Control', 'no-store')
  async history(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { workspaceId, invitationId } = this.body(input, ['workspaceId', 'invitationId']);
    return this.command(() => this.invitations.history(uid, workspaceId, invitationId));
  }

  @Post('institution/approve')
  @Header('Cache-Control', 'no-store')
  async approve(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { workspaceId, administratorUid, evidenceRef, expiresAt } = this.body(input, ['workspaceId', 'administratorUid', 'evidenceRef', 'expiresAt']);
    if (typeof workspaceId !== 'string' || typeof administratorUid !== 'string' || typeof evidenceRef !== 'string' ||
        typeof expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(expiresAt)) {
      throw new BadRequestException('Invalid institution approval request.');
    }
    const expiry = new Date(expiresAt);
    if (!Number.isFinite(expiry.getTime()) || expiry.toISOString() !== expiresAt) throw new BadRequestException('Invalid approval expiry.');
    return this.command(() => this.invitations.approve(uid, { workspaceId, administratorUid, evidenceRef, expiresAt: expiry }));
  }

  @Post('institution/revoke')
  @Header('Cache-Control', 'no-store')
  async revoke(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req, false);
    const { workspaceId, approvalId } = this.body(input, ['workspaceId', 'approvalId']);
    if (typeof workspaceId !== 'string' || typeof approvalId !== 'string') throw new BadRequestException('Invalid institution revocation request.');
    return this.command(() => this.invitations.revokeApproval(uid, workspaceId, approvalId));
  }
}
