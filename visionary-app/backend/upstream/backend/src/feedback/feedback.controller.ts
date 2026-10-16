import { BadRequestException, Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { FeedbackService } from './feedback.service';
import { feedbackId } from './feedback.contract';

@Controller('account/feedback')
export class FeedbackController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly feedback: FeedbackService) { super(accounts, config); }
  @Post()
  async submit(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    return this.feedback.submit(uid, body);
  }
  @Get()
  async list(@Req() req: Request, @Query('after') after?: string, @Query('limit') limit?: string) {
    const { uid } = await this.commandAccount(req, false);
    if (after !== undefined && (typeof after !== 'string' || !feedbackId.test(after)) ||
      limit !== undefined && (typeof limit !== 'string' || !/^(?:[1-9]|[1-4][0-9]|50)$/.test(limit))) throw new BadRequestException('Use a valid feedback cursor and a limit from 1 to 50.');
    return this.feedback.list(uid, after, limit ? Number(limit) : 20);
  }
}
