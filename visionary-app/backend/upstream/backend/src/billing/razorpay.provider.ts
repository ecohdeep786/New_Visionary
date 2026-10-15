import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { offer } from './catalog';

export class PaymentProviderError extends ServiceUnavailableException {
  constructor(public readonly ambiguous: boolean) { super('Razorpay could not confirm this request. Check the saved payment status before trying again.'); }
}
export function validSignature(raw: Buffer | string, signature: unknown, secret: string) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature) || !secret) return false;
  return timingSafeEqual(Buffer.from(signature, 'hex'), createHmac('sha256', secret).update(raw).digest());
}
@Injectable()
export class RazorpayProvider {
  constructor(private readonly config: ConfigService) {}
  settings() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID'), secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    if (this.config.get('BILLING_MODE') !== 'test' || !/^rzp_test_[A-Za-z0-9]+$/.test(keyId || '') || !secret) throw new ServiceUnavailableException('Test billing is not configured. Please retry later.');
    return { keyId, secret, webhookSecret: this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') || '' };
  }
  planId(selected: ReturnType<typeof offer>) {
    const id = this.config.get<string>(`RAZORPAY_PLAN_${selected.plan.toUpperCase()}_${selected.interval.toUpperCase()}`);
    if (!/^plan_[A-Za-z0-9]+$/.test(id || '')) throw new ServiceUnavailableException('This subscription is not available yet. Please retry later.');
    return id;
  }
  authorizeReconciliation(token: unknown) {
    const expected = this.config.get<string>('BILLING_RECONCILE_TOKEN');
    if (!/^[a-f0-9]{64}$/.test(expected || '') || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(Buffer.from(expected), Buffer.from(token))) throw new ForbiddenException('Invalid reconciliation credentials.');
  }
  async request(method: string, resource: string, body?: unknown): Promise<any> {
    const settings = this.settings();
    let response: Response;
    try {
      response = await fetch(`https://api.razorpay.com/v1/${resource}`, {
        method, headers: { Authorization: `Basic ${Buffer.from(`${settings.keyId}:${settings.secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(12000),
      });
    } catch { throw new PaymentProviderError(true); }
    if (!response.ok) throw new PaymentProviderError(response.status >= 500 || response.status === 429);
    try { return await response.json(); } catch { throw new PaymentProviderError(true); }
  }
  getSubscription(id: string) { return this.request('GET', `subscriptions/${id}`); }
  invoices(id: string) { return this.request('GET', `invoices?subscription_id=${id}&count=100`); }
  payment(id: string) { return this.request('GET', `payments/${id}`); }
}
