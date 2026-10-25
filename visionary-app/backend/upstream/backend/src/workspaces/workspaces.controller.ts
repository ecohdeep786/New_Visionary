import { Body, Controller, Get, Post, Req, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { WorkspaceRepository } from './workspace.repository';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

/**
 * DATA-01 workspace endpoints. All endpoints verify the browser session and
 * expected account before touching domain records. The UID is always
 * server-derived, never client-supplied as an authority.
 */
@Controller('api/workspaces')
export class WorkspacesController extends ProductRequestAuthority {
  constructor(
    accounts: FirebaseProductService,
    config: ConfigService,
    private readonly workspaceRepo: WorkspaceRepository,
  ) {
    super(accounts, config);
  }

  @Post()
  async create(@Req() req: Request, @Body() body: CreateWorkspaceDto) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.workspaceRepo.createWorkspace(uid, body);
  }

  @Post('invitations/:token/accept')
  async acceptInvitation(@Req() req: Request, @Param('token') token: string) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.workspaceRepo.acceptInvitation(uid, token);
  }

  @Get()
  async list(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    return this.workspaceRepo.listWorkspaces(uid);
  }
}
