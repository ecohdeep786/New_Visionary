/**
 * PRIV-04 (KAN-113) — durable in-app notification/read/preference state and
 * approved email delivery, with idempotency, quiet/retry handling and no
 * private data in public links/logs.
 *
 * Proven here:
 *   1. durable in-app state: notifications are server-owned per owner; read
 *      transitions persist (idempotent markRead),
 *   2. idempotency: a retried delivery (same notificationId) converges to ONE
 *      notification — no duplicates,
 *   3. preferences: an opted-out channel suppresses honestly (recorded, never
 *      delivered, never silently dropped),
 *   4. quiet hours: in-window deliveries DEFER (not dropped); post-window
 *      retry delivers,
 *   5. retry handling: bounded attempts; beyond the bound refuses honestly,
 *   6. no private data in public links: the link carries the opaque token only,
 *   7. the email recipient is the SERVER-DERIVED verified address; owner-only
 *      access throughout.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { NotificationService } = req('./dist/src/notifications/notification-service.js');
const { InMemoryNotificationStore } = req('./dist/src/notifications/notification-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const NO_QUIET = { quietHoursStart: 0, quietHoursEnd: 0 };

async function makeService(prefs = {}) {
  const store = new InMemoryNotificationStore();
  const svc = new NotificationService(store);
  store.seedPreference(OWNER, { channel: 'in_app', enabled: true, ...NO_QUIET, ...(prefs.in_app ?? {}) });
  store.seedPreference(OWNER, { channel: 'email', enabled: true, ...NO_QUIET, ...(prefs.email ?? {}) });
  store.seedVerifiedEmail(OWNER.uid, 'learner@verified.example');
  return { store, svc };
}

function deliver(svc, overrides = {}) {
  return svc.deliver({
    notificationId: 'n1',
    owner: OWNER,
    channel: 'in_app',
    subject: 'Weekly progress ready',
    publicToken: 'tok_opaque_123',
    currentHour: 12,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------

test('durable in-app state: notifications are server-owned per owner; read transitions persist (idempotent markRead)', async () => {
  const { store, svc } = await makeService();
  await deliver(svc);
  const marked = await svc.markRead('n1', OWNER);
  assert.equal(marked.read, true);
  const again = await svc.markRead('n1', OWNER);
  assert.equal(again.read, true, 'markRead idempotent');
  const list = await store.notificationsFor(OWNER);
  assert.equal(list.length, 1);
  assert.equal(list[0].read, true, 'read state durable');
});

test('idempotency: a retried delivery (same notificationId) converges to ONE notification', async () => {
  const { store, svc } = await makeService();
  const first = await deliver(svc);
  const replay = await deliver(svc);
  assert.deepEqual(replay, first, 'replay returns the same notification');
  assert.equal((await store.notificationsFor(OWNER)).length, 1, 'no duplicate notification');
});

test('preferences: an opted-out channel suppresses honestly (recorded, never delivered)', async () => {
  const { svc } = await makeService({ email: { enabled: false } });
  const suppressed = await deliver(svc, { channel: 'email', notificationId: 'n2' });
  assert.equal(suppressed.state, 'suppressed', 'opt-out recorded honestly');
  assert.equal(suppressed.read, false);
});

test('quiet hours: in-window deliveries DEFER (not dropped); post-window retry delivers', async () => {
  const { svc } = await makeService({ in_app: { quietHoursStart: 22, quietHoursEnd: 7 } });
  // 23:00 is inside the quiet window (wraps midnight).
  const deferred = await deliver(svc, { currentHour: 23 });
  assert.equal(deferred.state, 'deferred', 'deferred, not dropped, not sent');

  // Retry after the window (10:00): delivers.
  const delivered = await svc.retry('n1', OWNER, { currentHour: 10, maxAttempts: 3 });
  assert.equal(delivered.state, 'delivered');
  assert.equal(delivered.attempts, 2, 'attempt counted');
});

test('retry handling: bounded attempts; beyond the bound refuses honestly', async () => {
  const { svc } = await makeService();
  await deliver(svc, { providerFails: true }); // attempt 1 failed
  await svc.retry('n1', OWNER, { currentHour: 12, maxAttempts: 3, providerFails: true }); // attempt 2
  const third = await svc.retry('n1', OWNER, { currentHour: 12, maxAttempts: 3, providerFails: true }); // attempt 3
  assert.equal(third.state, 'failed', 'honest failed state, never silently lost');
  await assert.rejects(
    () => svc.retry('n1', OWNER, { currentHour: 12, maxAttempts: 3 }),
    (e) => e.code === 'retry_bound_exceeded',
    'beyond the bound refuses',
  );
});

test('no private data in public links: the link carries the opaque token only', async () => {
  const { svc } = await makeService();
  const notification = await deliver(svc, { subject: 'Progress report for Ananya — internal detail' });
  const link = svc.publicLink(notification, 'https://visionary.example');
  assert.equal(link, 'https://visionary.example/n/tok_opaque_123', 'opaque token only');
  assert.equal(link.includes('Ananya'), false, 'no subject text');
  assert.equal(link.includes(OWNER.uid), false, 'no uid');
});

test('the email recipient is the SERVER-DERIVED verified address; owner-only access', async () => {
  const { svc } = await makeService();
  assert.equal(await svc.emailRecipient(OWNER.uid), 'learner@verified.example', 'server-derived address');

  await deliver(svc);
  await assert.rejects(() => svc.markRead('n1', STRANGER), (e) => e.code === 'not_owner');
  await assert.rejects(() => svc.retry('n1', STRANGER, { currentHour: 12, maxAttempts: 3 }), (e) => e.code === 'not_owner');
  await assert.rejects(() => svc.markRead('n_ghost', OWNER), (e) => e.code === 'unknown_notification');
});
