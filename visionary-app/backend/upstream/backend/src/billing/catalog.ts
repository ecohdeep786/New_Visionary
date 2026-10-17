import { BadRequestException } from '@nestjs/common';

export const CATALOG_VERSION = '2026-10-15-test-v1';
export const BILLING_PLANS = [
  { id: 'start', name: 'Start', monthly: 0, annual: 0, members: 1 },
  { id: 'personal', name: 'Personal', monthly: 29900, annual: 299000, members: 1 },
  { id: 'family', name: 'Family', monthly: 49900, annual: 499000, members: 6 },
] as const;
export function offer(plan: unknown, interval: unknown) {
  const found = BILLING_PLANS.find(item => item.id === plan && item.id !== 'start');
  if (!found || !['monthly', 'annual'].includes(interval as string)) throw new BadRequestException('Choose Personal or Family and a monthly or annual billing period.');
  return { plan: found.id, name: found.name, interval: interval as 'monthly' | 'annual', amount: found[interval as 'monthly' | 'annual'], currency: 'INR', members: found.members, version: CATALOG_VERSION };
}
export function recordInput(value: unknown, fields: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !fields.includes(key))) throw new BadRequestException('This payment request has unsupported fields.');
  return value as Record<string, any>;
}
export function externalId(value: unknown, prefix: string) {
  if (typeof value !== 'string' || !new RegExp(`^${prefix}_[A-Za-z0-9]{1,80}$`).test(value)) throw new BadRequestException('The payment reference is invalid.');
  return value;
}
