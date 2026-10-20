import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { LearningService } from './learning.service';
import { learningId } from './learning.contract';

// Owner-scoped durable teaching loop. Reads and commands always re-verify the
// browser session and expected account before touching submitted records.
@Controller('account/learning')
export class LearningController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly learning: LearningService) { super(accounts, config); }
  private session(sessionId: string) {
    if (typeof sessionId !== 'string' || !learningId.test(sessionId)) throw new BadRequestException('Use a valid learning session reference.');
    return sessionId;
  }
  @Post('sessions')
  async start(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.learning.start(uid, body);
  }
  @Get('sessions')
  async list(@Req() req: Request, @Query('workspaceId') workspaceId?: string, @Query('after') after?: string, @Query('limit') limit?: string) {
    const { uid } = await this.commandAccount(req, false);
    if (workspaceId !== undefined && (typeof workspaceId !== 'string' || !/^[A-Za-z0-9:._-]{1,128}$/.test(workspaceId)) ||
      after !== undefined && (typeof after !== 'string' || !learningId.test(after)) ||
      limit !== undefined && (typeof limit !== 'string' || !/^(?:[1-9]|[1-4][0-9]|50)$/.test(limit)))
      throw new BadRequestException('Use a valid learning page cursor and a limit from 1 to 50.');
    return this.learning.list(uid, { workspaceId, after, limit: limit ? Number(limit) : 20 });
  }
  @Get('sessions/:sessionId')
  async get(@Req() req: Request, @Param('sessionId') sessionId: string) {
    const { uid } = await this.commandAccount(req, false);
    return this.learning.get(uid, this.session(sessionId));
  }
  @Post('sessions/:sessionId/checks')
  async present(@Req() req: Request, @Param('sessionId') sessionId: string, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.learning.present(uid, this.session(sessionId), body);
  }
  @Post('sessions/:sessionId/assessments')
  async assess(@Req() req: Request, @Param('sessionId') sessionId: string, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.learning.assess(uid, this.session(sessionId), body);
  }
  @Post('sessions/:sessionId/cancel')
  async cancel(@Req() req: Request, @Param('sessionId') sessionId: string, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.learning.cancel(uid, this.session(sessionId), body);
  }
}
