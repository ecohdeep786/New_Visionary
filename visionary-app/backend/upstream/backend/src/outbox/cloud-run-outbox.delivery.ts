import type { PrismaClient } from '@prisma/client';
import { OutboxDeliveryDispatcher } from './outbox.dispatcher';
import { CONSENT_REVOCATION_TOPIC, PostgresOutboxDeliveryStore } from './postgres-outbox.store';

const identityEndpoint = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity';

/** Construct a dispatcher for the explicitly configured, IAM-protected worker service. */
export function createConsentRevocationDispatcher(
  db: PrismaClient,
  workerOrigin: string,
  afterCursor: bigint,
  fetcher: typeof fetch = fetch,
): OutboxDeliveryDispatcher {
  const worker = new URL(workerOrigin);
  if (worker.protocol !== 'https:' || !/^(?:[a-z0-9-]+\.)+run\.app$/.test(worker.hostname) ||
      worker.username || worker.password || worker.port || worker.pathname !== '/' || worker.search || worker.hash) {
    throw Error('A Cloud Run worker origin is required.');
  }
  const tokenUrl = new URL(identityEndpoint);
  tokenUrl.searchParams.set('audience', worker.origin);
  const deliveryUrl = new URL('/internal/outbox/consent-revocations', worker);

  return new OutboxDeliveryDispatcher(new PostgresOutboxDeliveryStore(db, afterCursor), {
    topics: new Map([[CONSENT_REVOCATION_TOPIC, async event => {
      const request = { redirect: 'error' as const, signal: AbortSignal.timeout(10_000) };
      const identity = await fetcher(tokenUrl, { ...request, headers: { 'Metadata-Flavor': 'Google' } });
      if (!identity.ok || identity.headers.get('Metadata-Flavor') !== 'Google') {
        await identity.body?.cancel();
        throw Error('OUTBOX_IDENTITY_UNAVAILABLE');
      }
      const token = (await identity.text()).trim();
      if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
        throw Error('OUTBOX_IDENTITY_UNAVAILABLE');
      }
      const response = await fetcher(deliveryUrl, {
        ...request,
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursor: String(event.cursor) }),
      });
      await response.body?.cancel();
      if (response.status !== 204) throw Error('OUTBOX_DELIVERY_NOT_CONFIRMED');
    }]]),
  });
}
