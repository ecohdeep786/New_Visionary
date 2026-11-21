import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { consentRevocationPath } from './consent-revocation.http';
import { OutboxDeliveryDispatcher } from './outbox.dispatcher';
import { DEFAULT_BACKOFF } from './outbox-types';
import { CONSENT_REVOCATION_TOPIC, PostgresOutboxDeliveryStore } from './postgres-outbox.store';

export interface ConsentTasksConfig {
  environment: 'staging' | 'production';
  workerOrigin: string;
  invokerServiceAccount: string;
  afterCursor: bigint;
  accessToken: () => Promise<string | null>;
}

/** Admit a leased cursor to Cloud Tasks. The private worker commits the effect and receipt. */
export function createConsentRevocationDispatcher(
  db: PrismaClient,
  config: ConsentTasksConfig,
  fetcher: typeof fetch = fetch,
): OutboxDeliveryDispatcher {
  const origin = cloudRunWorkerOrigin(config.workerOrigin);
  const account = `visionary-outbox-invoke-${config.environment === 'production' ? 'prod' : 'stg'}@visionary-research.iam.gserviceaccount.com`;
  if (config.invokerServiceAccount !== account) throw Error('Outbox invoker must be scoped to the delivery environment.');
  const queue = `projects/visionary-research/locations/asia-south1/queues/visionary-consent-${config.environment}`;
  const api = new URL(`https://cloudtasks.googleapis.com/v2/${queue}/tasks`);
  const deliveryUrl = new URL(consentRevocationPath, origin);

  return new OutboxDeliveryDispatcher(new PostgresOutboxDeliveryStore(db, config.afterCursor), {
    topics: new Map([[CONSENT_REVOCATION_TOPIC, async event => {
      const token = await config.accessToken();
      if (!token) throw Error('OUTBOX_IDENTITY_UNAVAILABLE');
      const payload = JSON.stringify({ cursor: String(event.cursor), attempt: event.attempts });
      const taskId = createHash('sha256').update(event.id).update(payload).digest('hex');
      const response = await fetcher(api, {
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: {
          name: `${queue}/tasks/${taskId}`,
          dispatchDeadline: '20s',
          httpRequest: {
            httpMethod: 'POST',
            url: deliveryUrl.href,
            headers: { 'Content-Type': 'application/json' },
            body: Buffer.from(payload).toString('base64'),
            oidcToken: { serviceAccountEmail: account, audience: origin },
          },
        } }),
      });
      await response.body?.cancel();
      if (response.status !== 200 && response.status !== 409) throw Error('OUTBOX_ADMISSION_FAILED');
      return 'queued' as const;
    }]]),
  }, { ...DEFAULT_BACKOFF, leaseMs: 90_000 });
}

export function cloudRunWorkerOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/^(?:[a-z0-9-]+\.)+run\.app$/.test(url.hostname) || url.hostname.includes('---') ||
      url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw Error('A canonical Cloud Run worker origin is required.');
  }
  return url.origin;
}
