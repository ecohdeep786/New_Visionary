import { BadRequestException, Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { boundedReference } from './knowledge-command';
import { KnowledgeProjectionService } from './knowledge-projection.service';

// Authenticated owner surface for knowledge projections. Commands reference one
// server-assessed receipt; reads are owner-scoped and never expose answer keys.
@Controller('account/learning/knowledge')
export class KnowledgeProjectionController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly knowledge: KnowledgeProjectionService) { super(accounts, config); }
  @Post('project')
  @HttpCode(200)
  async project(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.knowledge.project(uid, body);
  }
  @Get('projections')
  async projections(@Req() req: Request, @Query('workspaceId') workspaceId?: string, @Query('conceptId') conceptId?: string,
    @Query('sourceVersion') sourceVersion?: string, @Query('criteriaVersion') criteriaVersion?: string) {
    const { uid } = await this.commandAccount(req, false);
    if (![workspaceId, conceptId, sourceVersion, criteriaVersion].every(boundedReference)) throw new BadRequestException('Specify the workspace, concept, source version and criteria version.');
    return this.knowledge.projection(uid, { workspaceId: workspaceId as string, conceptId: conceptId as string, sourceVersion: sourceVersion as string, criteriaVersion: criteriaVersion as string });
  }
  @Get('models')
  async models(@Req() req: Request, @Query('sourceVersion') sourceVersion?: string, @Query('criteriaVersion') criteriaVersion?: string) {
    const { uid } = await this.commandAccount(req, false);
    if (!boundedReference(sourceVersion) || !boundedReference(criteriaVersion)) throw new BadRequestException('Specify the source version and criteria version.');
    return { version: 1, uid, model: await this.knowledge.model(uid, sourceVersion, criteriaVersion) };
  }
}
