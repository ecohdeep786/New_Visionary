import { Controller, Get, Query, Req, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FieldPath } from 'firebase-admin/firestore';
import { Request } from 'express';
import { ProductRequestAuthority } from './request-authority';
import { FirebaseProductService } from './firebase-product.service';
import { BillingService } from '../../billing/billing.service';
import { accountPath } from './account-storage';

@Controller('account')
export class AccountController extends ProductRequestAuthority {
  constructor(service: FirebaseProductService, config: ConfigService, private readonly billing: BillingService) { super(service, config); }
  @Get('overview')
  async overview(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    const [details, billing] = await Promise.all([this.service.accountDetails(uid), this.billing.account(uid)]);
    return { uid, asOf: new Date().toISOString(), ...details, billing,
      records: { devices: '/api/account/devices', invoices: '/api/account/invoices', feedback: '/api/account/feedback' } };
  }
  private async page(collection: string, after?: string, size?: string) {
    if (after !== undefined && (typeof after !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(after)) || size !== undefined && (typeof size !== 'string' || !/^(?:[1-9]|[1-4][0-9]|50)$/.test(size))) throw new BadRequestException('Use a valid account page cursor and a limit from 1 to 50.');
    const maximum = size ? Number(size) : 20;
    let query = this.service.getDatabase().collection(collection).orderBy(FieldPath.documentId());
    if (after) query = query.startAfter(after);
    const rows = await query.limit(maximum + 1).get().catch(() => { throw new ServiceUnavailableException('Account records are temporarily unavailable. Your saved data is retained.'); });
    const items = rows.docs.slice(0, maximum);
    return { items, nextCursor: rows.docs.length > maximum ? items.at(-1).id : null };
  }
  @Get('devices')
  async devices(@Req() req: Request, @Query('after') after?: string, @Query('limit') limit?: string) {
    const { uid, sessionId } = await this.commandAccount(req, false);
    const page = await this.page(`${accountPath(uid)}/devices`, after, limit), now = Date.now();
    const iso = (value: any) => value?.toDate?.().toISOString() || null;
    return { uid, items: page.items.map(row => {
      const data = row.data(), seen = data.lastSeenAt?.toMillis?.(), expiry = data.expiresAt?.toMillis?.();
      return { id: row.id, current: row.id === sessionId, kind: 'browser-session', provider: data.provider || 'unknown',
        firstSeenAt: iso(data.firstSeenAt), lastSeenAt: iso(data.lastSeenAt), expiresAt: iso(data.expiresAt), revokedAt: iso(data.revokedAt),
        status: data.revokedAt ? 'revoked' : !Number.isFinite(seen) || !Number.isFinite(expiry) ? 'unknown' : expiry <= now || now - seen >= 1800000 ? 'expired' : 'active',
        observedIp: (data.observedIp || '').slice(0, 64), userAgent: (data.userAgent || '').slice(0, 512) };
    }), nextCursor: page.nextCursor };
  }
  @Get('invoices')
  async invoices(@Req() req: Request, @Query('after') after?: string, @Query('limit') limit?: string) {
    const { uid } = await this.commandAccount(req, false);
    const page = await this.page(`${accountPath(uid)}/billing/test/invoices`, after, limit);
    return { uid, items: page.items.map(row => {
      const data = row.data();
      return { id: row.id, number: data.number, mode: data.mode, status: data.status, currency: data.currency, amount: data.amount, amountRefunded: data.amountRefunded || 0,
        issuedAt: data.issuedAt, paidAt: data.paidAt, periodStart: data.periodStart, periodEnd: data.periodEnd };
    }), nextCursor: page.nextCursor };
  }
}
