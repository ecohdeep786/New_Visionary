import { BadRequestException, Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { KnowledgeProjectionService } from './knowledge-projection.service';

@Controller('account/learning/knowledge')
export class KnowledgeProjectionController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly knowledge: KnowledgeProjectionService) { super(accounts, config); }
  @Post('assess')
  @HttpCode(200)
  async assess(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.knowledge.submit(uid, body);
  }
  @Get('projections')
  async projections(@Req() req: Request, @Query('workspaceId') workspaceId?: string, @Query('conceptId') conceptId?: string,
    @Query('sourceVersion') sourceVersion?: string, @Query('criteriaVersion') criteriaVersion?: string) {
    const { uid } = await this.commandAccount(req, false);
    if (![workspaceId, conceptId, sourceVersion, criteriaVersion].every(value => typeof value === 'string' && value.length > 0 && value.length <= 256)) throw new BadRequestException('Specify the workspace, concept, source version and criteria version.');
    return this.knowledge.projection(uid, { workspaceId: workspaceId as string, conceptId: conceptId as string, sourceVersion: sourceVersion as string, criteriaVersion: criteriaVersion as string });
  }
  @Get('models')
  async models(@Req() req: Request, @Query('sourceVersion') sourceVersion?: string, @Query('criteriaVersion') criteriaVersion?: string) {
    const { uid } = await this.commandAccount(req, false);
    if (typeof sourceVersion !== 'string' || !sourceVersion || sourceVersion.length > 256 || typeof criteriaVersion !== 'string' || !criteriaVersion || criteriaVersion.length > 256) throw new BadRequestException('Specify the source version and criteria version.');
    return { version: 1, uid, model: await this.knowledge.model(uid, sourceVersion, criteriaVersion) };
  }
}
