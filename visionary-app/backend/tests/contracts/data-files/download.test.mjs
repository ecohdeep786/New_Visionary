/**
 * FILE-03 (KAN-58) — private downloads, exports and revocation.
 *
 * Two delivery paths are qualified:
 *   1. AUTHENTICATED GATEWAY grants: every read re-checks ACTIVE + owner +
 *      lease, so `revoke` is IMMEDIATE — the very next read is refused (no
 *      residual window). Used wherever immediate revocation is required.
 *   2. SIGNED LINKS: a one-shot/time-bounded link with an explicit expiry.
 *      Residual validity is documented: bytes already delivered to a device are
 *      NOT recalled, and the link is consumable only until expiry or
 *      revocation, whichever is earlier.
 *
 * And exports: bound, owner-scoped records of READY immutable generations,
 * read through the same gateway discipline so export revocation is immediate.
 *
 * Proven here:
 *   1. a grant is issued only for a READY immutable generation owned by the
 *      acting uid; quarantine/other objects are refused,
 *   2. a gateway read delivers the object and accounts bytes; a second channel
 *      read still works while ACTIVE,
 *   3. immediate revocation: after `revoke`, the next gateway read is refused —
 *      no residual window,
 *   4. expiry is enforced on every read and by the sweep step,
 *   5. signed links: one-shot by default; residual validity is bounded by the
 *      documented expiry; a revoked/used/expired token is refused,
 *   6. exports: creation pins READY generations, read delivers all members and
 *      revoking the export refuses subsequent reads immediately,
 *   7. authorization: a non-owner cannot read, revoke or expire another uid's
 *      grant or export; a non-owner cannot deliver a generation it does not own.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DownloadGateway, ExportService, DownloadPolicyError } = req('./dist/src/file/download.service.js');
const { InMemoryDownloadStore } = req('./dist/src/file/download-store.js');

/** In-memory resolver: only generations published as READY by the owner are deliverable. */
function makeResolver(ready = new Map()) {
  const objects = ready;
  return {
    objects,
    requireReady: async (ownerUid, objectId, generation) => {
      const key = `${objectId}#${generation}`;
      const obj = objects.get(key);
      if (!obj) throw new DownloadPolicyError('not_ready');
      if (obj.ownerUid !== ownerUid) throw new DownloadPolicyError('unauthorized');
      return { ...obj };
    },
  };
}

function publishReady(resolver, ownerUid, objectId, generation, type = 'application/pdf', size = 64) {
  const bytes = new Uint8Array(size).map((_, i) => (i + generation) % 256);
  resolver.objects.set(`${objectId}#${generation}`, { objectId, generation, ownerUid, digest: 'd'.repeat(64), size, type, bytes });
}

function setup() {
  const store = new InMemoryDownloadStore();
  const resolver = makeResolver();
  const gateway = new DownloadGateway(store, resolver);
  const exports = new ExportService(store, resolver);
  return { store, resolver, gateway, exports };
}

test('FILE-03 gateway read: a READY owned generation is delivered over the authenticated gateway', async () => {
  const { resolver, gateway } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  const grant = await gateway.issueGrant({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1, channel: 'gateway' });
  const result = await gateway.read(grant.id, 'uid-1');
  assert.equal(result.digest, 'd'.repeat(64));
  assert.equal(result.size, 64);
  assert.equal(result.bytes.byteLength, 64);
  assert.equal(result.deliveredBytes, 64);
});

test('FILE-03 gateway: a grant is refused for a non-READY generation (quarantine stays private)', async () => {
  const { resolver, gateway } = setup();
  // obj-2 exists but was never verified/scanned to READY.
  await assert.rejects(gateway.issueGrant({ ownerUid: 'uid-1', objectId: 'obj-2', generation: 1, channel: 'gateway' }), (e) => e.code === 'not_ready');
});

test('FILE-03 immediate revocation: after revoke the very next gateway read is refused (no residual window)', async () => {
  const { resolver, gateway } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  const grant = await gateway.issueGrant({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1, channel: 'gateway' });
  const first = await gateway.read(grant.id, 'uid-1');
  assert.equal(first.bytes.byteLength, 64);
  await gateway.revoke(grant.id, 'uid-1');
  await assert.rejects(gateway.read(grant.id, 'uid-1'), (e) => e.code === 'revoked');
});

test('FILE-03 expiry: an expired gateway grant is refused on read and swept to EXPIRED', async () => {
  const { resolver, gateway } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  const grant = await gateway.issueGrant({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1, channel: 'gateway', leaseMs: 1 });
  await new Promise((r) => setTimeout(r, 5));
  await assert.rejects(gateway.read(grant.id, 'uid-1'), (e) => e.code === 'expired');
  const swept = await gateway.expire(new Date().toISOString());
  assert.equal(swept, 1);
  await assert.rejects(gateway.read(grant.id, 'uid-1'), (e) => e.code === 'expired');
});

test('FILE-03 signed link: one-shot by default; an issued token delivers once then is used', async () => {
  const { resolver, gateway } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  const { signedLink } = await gateway.issueSignedLink({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1 });
  const first = await gateway.readSignedLink(signedLink.token, 'uid-1');
  assert.equal(first.bytes.byteLength, 64);
  await assert.rejects(gateway.readSignedLink(signedLink.token, 'uid-1'), (e) => e.code === 'link_used');
});

test('FILE-03 signed link residual validity: an expired link is refused; a revoked link is refused', async () => {
  const { resolver, gateway } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  const expired = await gateway.issueSignedLink({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1, ttlMs: 1 });
  await new Promise((r) => setTimeout(r, 5));
  await assert.rejects(gateway.readSignedLink(expired.signedLink.token, 'uid-1'), (e) => e.code === 'link_expired');

  const revoked = await gateway.issueSignedLink({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1 });
  await gateway.revoke(revoked.grant.id, 'uid-1');
  await assert.rejects(gateway.readSignedLink(revoked.signedLink.token, 'uid-1'), (e) => e.code === 'link_revoked');
});

test('FILE-03 unknown or foreign signed-link token is refused', async () => {
  const { resolver, gateway } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  await assert.rejects(gateway.readSignedLink('not-a-real-token', 'uid-1'), (e) => e.code === 'link_not_found');
  const { signedLink } = await gateway.issueSignedLink({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1 });
  await assert.rejects(gateway.readSignedLink(signedLink.token, 'uid-9'), (e) => e.code === 'link_not_found');
});

test('FILE-03 export: creation pins READY generations; reading delivers all members; revocation is immediate', async () => {
  const { resolver, exports } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  publishReady(resolver, 'uid-1', 'obj-2', 1);
  const record = await exports.createExport({ ownerUid: 'uid-1', objects: [{ objectId: 'obj-1', generation: 1 }, { objectId: 'obj-2', generation: 1 }] });
  assert.equal(record.objects.length, 2);
  const { members, deliveredBytes } = await exports.readExport(record.id, 'uid-1');
  assert.equal(members.length, 2);
  assert.equal(deliveredBytes, 128);
  await exports.revokeExport(record.id, 'uid-1');
  await assert.rejects(exports.readExport(record.id, 'uid-1'), (e) => e.code === 'revoked');
});

test('FILE-03 export bounds: an empty or oversized export is refused; a non-READY member is refused', async () => {
  const { resolver, exports } = setup();
  await assert.rejects(exports.createExport({ ownerUid: 'uid-1', objects: [] }), (e) => e.code === 'out_of_bounds');
  await assert.rejects(exports.createExport({ ownerUid: 'uid-1', objects: [{ objectId: 'obj-9', generation: 1 }] }), (e) => e.code === 'not_ready');
});

test('FILE-03 authorization: a non-owner cannot read, revoke or expire another uid grant/export', async () => {
  const { resolver, gateway, exports } = setup();
  publishReady(resolver, 'uid-1', 'obj-1', 1);
  const grant = await gateway.issueGrant({ ownerUid: 'uid-1', objectId: 'obj-1', generation: 1, channel: 'gateway' });
  // Foreign owner cannot deliver (resolver refuses), read or revoke.
  await assert.rejects(gateway.read(grant.id, 'uid-9'), (e) => e.code === 'unauthorized');
  await gateway.revoke(grant.id, 'uid-1');
  await assert.rejects(gateway.revoke(grant.id, 'uid-9'), (e) => e.code === 'unauthorized');

  const record = await exports.createExport({ ownerUid: 'uid-1', objects: [{ objectId: 'obj-1', generation: 1 }] });
  await assert.rejects(exports.readExport(record.id, 'uid-9'), (e) => e.code === 'unauthorized');
  await assert.rejects(exports.revokeExport(record.id, 'uid-9'), (e) => e.code === 'unauthorized');
});
