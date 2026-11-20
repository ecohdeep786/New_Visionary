import type { PrismaClient } from '@prisma/client';
import { createServer, type IncomingMessage } from 'node:http';
import { applyConsentRevocation } from './consent-jobs';
import { outboxCursorKey } from './outbox-types';

export const consentRevocationPath = '/internal/outbox/consent-revocations';

async function parseDelivery(request: IncomingMessage): Promise<{ cursor: bigint; attempt: number } | null> {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') return null;
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > 256) return null;
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 2 ||
      typeof value.cursor !== 'string' || !/^[1-9][0-9]{0,18}$/.test(value.cursor) ||
      !Number.isInteger(value.attempt) || value.attempt < 1 || value.attempt > 2147483647) return null;
  return { cursor: outboxCursorKey(BigInt(value.cursor)), attempt: value.attempt };
}

export function createConsentRevocationServer(db: PrismaClient, verifyIdentity: (token: string) => Promise<boolean>) {
  return createServer(async (request, response) => {
    const finish = (status: number) => {
      request.resume();
      response.writeHead(status, { 'Cache-Control': 'no-store' }).end();
    };
    if (request.url !== consentRevocationPath || request.method !== 'POST') return finish(404);
    const token = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(request.headers.authorization ?? '')?.[1];
    if (!token || !await verifyIdentity(token).catch(() => false)) return finish(401);
    const delivery = await parseDelivery(request).catch(() => null);
    if (!delivery) return finish(400);
    try {
      const applied = await applyConsentRevocation(db, delivery.cursor, delivery.attempt);
      return finish(applied ? 204 : 409);
    } catch {
      return finish(503);
    }
  });
}
