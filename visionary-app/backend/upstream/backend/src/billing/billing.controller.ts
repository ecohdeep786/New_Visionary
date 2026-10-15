import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController extends ProductRequestAuthority {
  constructor(auth: FirebaseProductService, config: ConfigService, private readonly billing: BillingService) { super(auth, config); }
  private async reader(req: Request) { return this.commandAccount(req, false); }
  private async writer(req: Request, limit = 12) {
    this.csrf(req); const { uid } = await this.commandAccount(req); await this.service.rateLimit('billing', uid, limit); return uid;
  }
  @Get('catalog') catalog() { return this.billing.catalog(); }
  @Get('account') async account(@Req() req: Request) { return this.billing.account((await this.reader(req)).uid); }
  @Post('checkouts') async checkout(@Req() req: Request, @Body() body: unknown) { return this.billing.checkout(await this.writer(req), body); }
  @Post('verify') async verify(@Req() req: Request, @Body() body: unknown) { return this.billing.verify(await this.writer(req), body); }
  @Post('sync') async sync(@Req() req: Request, @Body() body: unknown) { const uid = await this.writer(req, 30); return this.billing.sync(uid); }
  @Post('cancel') async cancel(@Req() req: Request, @Body() body: unknown) { return this.billing.cancel(await this.writer(req), body); }
  @Get('invoices/:id') async invoice(@Req() req: Request, @Param('id') id: string) { return this.billing.invoice((await this.reader(req)).uid, id); }
  @Post('family/invitations') async invite(@Req() req: Request, @Body() body: unknown) { return this.billing.inviteFamily(await this.writer(req), body); }
  @Get('family/invitations/:id') async invitation(@Req() req: Request, @Param('id') id: string) { return this.billing.familyInvitation((await this.reader(req)).uid, id); }
  @Post('family/accept') async accept(@Req() req: Request, @Body() body: unknown) { return this.billing.acceptFamily(await this.writer(req), body); }
  @Post('family/remove') async remove(@Req() req: Request, @Body() body: unknown) { return this.billing.removeFamily(await this.writer(req), body); }
  @Post('family/leave') async leave(@Req() req: Request) { return this.billing.leaveFamily(await this.writer(req)); }
  @Post('jobs/reconcile') scheduled(@Req() req: Request) { return this.billing.scheduledReconciliation(req.get('X-Visionary-Billing-Job')); }
  @Post('webhooks/razorpay') webhook(@Req() req: Request) { return this.billing.webhook(req.body, req.get('X-Razorpay-Signature'), req.get('X-Razorpay-Event-Id')); }
}
