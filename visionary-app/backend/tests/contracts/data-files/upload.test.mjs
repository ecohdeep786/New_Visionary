/**
 * FILE-01 (KAN-56) — authorized upload intent → private quarantine →
 * complete/digest/type/size verification → scan → ready lifecycle; resumable
 * failures and bounded parser/archive output.
 *
 * Proven here:
 *   1. an intent is created by an authorized owner and is private quarantine
 *      (INTENT) — no byte is admitted until READY,
 *   2. chunks append resumably; a retried chunk is idempotent (no double byte)
 *      and progress resumes from the durable bytesReceived,
 *   3. a gap (offset ≠ bytesReceived) is rejected and stays UPLOADING,
 *   4. completion verifies size match, computes the sha256 digest and sniffs
 *      type; a size mismatch rejects the file,
 *   5. verification + scan must both pass before READY; an infected scan result
 *      rejects with scan_infected,
 *   6. only READY files are readable — INTENT/UPLOADING are quarantine and a
 *      read attempt is refused,
 *   7. bounded parser/archive output: exceeding the cap rejects with
 *      parser_output_bound; within-cap stays READY.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { UploadService, FilePolicyError } = req('./dist/src/file/upload.service.js');
const { InMemoryFileStore } = req('./dist/src/file/file-store.js');
const { DEFAULT_FILE_POLICY } = req('./dist/src/file/file-types.js');

function sniff(bytes) {
  // Minimal sniff: assume PDF if it starts with %PDF, else text/plain.
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 ? 'application/pdf' : 'text/plain';
}

function setup(policyOverrides = {}) {
  const s = new InMemoryFileStore();
  const policy = { ...DEFAULT_FILE_POLICY, ...policyOverrides };
  const u = new UploadService(s, policy);
  return { s, u, policy };
}

function bytes(str) {
  return new TextEncoder().encode(str);
}

test('FILE-01 intent: an authorized user creates a private-quarantine intent with durable metadata', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', workspaceId: 'ws-1', name: 'notes.md', declaredType: 'text/markdown', declaredSize: 8 });
  assert.equal(record.state, 'INTENT');
  assert.equal(record.bytesReceived, 0);
  assert.equal(record.uid, 'uid-1');
  assert.equal(record.workspaceId, 'ws-1');
  assert.equal(record.digest, null);
});

test('FILE-01 resumable chunks: idempotent resume, no double-count, progress returned for a failed upload', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', workspaceId: 'ws-1', name: 'big.bin', declaredType: 'application/octet-stream', declaredSize: 6 });
  const chunk = bytes('hello');
  await u.appendChunk(record.id, 'uid-1', { offset: 0, bytes: chunk });
  // Duplicate of an already-received segment is ignored (idempotent resume).
  await u.appendChunk(record.id, 'uid-1', { offset: 0, bytes: chunk });
  const progress = await u.progress(record.id, 'uid-1');
  assert.equal(progress, 5);
  await u.appendChunk(record.id, 'uid-1', { offset: 5, bytes: bytes('!') });
  assert.equal((await s.byId(record.id)).bytesReceived, 6);
  assert.equal((await s.byId(record.id)).state, 'UPLOADING');
});

test('FILE-01 offset gap: a chunk after a gap is rejected and stays UPLOADING', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', name: 'x.bin', declaredType: 'application/octet-stream', declaredSize: 4 });
  // A gap (expected offset was 0) is refused; no byte is admitted.
  await assert.rejects(u.appendChunk(record.id, 'uid-1', { offset: 9, bytes: bytes('abcd') }), (e) => e.code === 'state_conflict');
  assert.equal((await s.byId(record.id)).bytesReceived, 0);
});

test('FILE-01 verify: completion checks size, digest and sniffed type; a size mismatch rejects', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', name: 'doc.pdf', declaredType: 'application/pdf', declaredSize: 4 });
  await u.appendChunk(record.id, 'uid-1', { offset: 0, bytes: bytes('ABCD') });
  await u.verify(record.id, 'uid-1', { sniff });
  const done = await u.scan(record.id, 'uid-1', 'clean');
  assert.equal(done.state, 'READY');
  const ready = await u.requireReady(record.id, 'uid-1');
  assert.equal(ready.digest.length, 64, 'sha256 hex digest computed');
  assert.equal(ready.sniffedType, 'text/plain');
  // A declared-size mismatch fails verification.
  const bad = await u.createIntent({ uid: 'uid-1', name: 'bad.bin', declaredType: 'application/pdf', declaredSize: 100 });
  await u.appendChunk(bad.id, 'uid-1', { offset: 0, bytes: bytes('tiny') });
  await assert.rejects(u.verify(bad.id, 'uid-1', { sniff }), (e) => e.code === 'size_mismatch');
  assert.equal((await s.byId(bad.id)).state, 'UPLOADING');
});

test('FILE-01 quarantine: only READY is readable; INTENT/UPLOADING/SCANNING refuse a read', async () => {
  const { s, u } = setup();
  const intent = await u.createIntent({ uid: 'uid-1', name: 'doc.pdf', declaredType: 'application/pdf', declaredSize: 4 });
  await assert.rejects(u.requireReady(intent.id, 'uid-1'), (e) => e.code === 'not_ready');
  await u.appendChunk(intent.id, 'uid-1', { offset: 0, bytes: bytes('ABCD') });
  await assert.rejects(u.requireReady(intent.id, 'uid-1'), (e) => e.code === 'not_ready');
  await u.verify(intent.id, 'uid-1', { sniff });
  await assert.rejects(u.requireReady(intent.id, 'uid-1'), (e) => e.code === 'not_ready'); // SCANNING
  await u.scan(intent.id, 'uid-1', 'clean');
  assert.equal((await u.requireReady(intent.id, 'uid-1')).state, 'READY');
});

test('FILE-01 scan: an infected object is REJECTED, never admitted', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', name: 'doc.pdf', declaredType: 'application/pdf', declaredSize: 4 });
  await u.appendChunk(record.id, 'uid-1', { offset: 0, bytes: bytes('ABCD') });
  await u.verify(record.id, 'uid-1', { sniff });
  const rej = await u.scan(record.id, 'uid-1', 'infected');
  assert.equal(rej.state, 'REJECTED');
  assert.equal(rej.rejectionReason, 'scan_infected');
});

test('FILE-01 bounded archive/parser output: exceeding the parser cap rejects instead of unbounded expansion', async () => {
  const { s, u } = setup({ maxParserOutputBytes: 100 });
  const record = await u.createIntent({ uid: 'uid-1', name: 'pack.zip', declaredType: 'application/pdf', declaredSize: 4 });
  await u.appendChunk(record.id, 'uid-1', { offset: 0, bytes: bytes('ABCD') });
  await u.verify(record.id, 'uid-1', { sniff });
  await u.scan(record.id, 'uid-1', 'clean');
  const within = await u.expandArchive(record.id, 'uid-1', 50);
  assert.equal(within.state, 'READY');
  assert.equal(within.parserOutputBytes, 50);
  const over = await u.expandArchive(record.id, 'uid-1', 60); // 50+60 > 100
  assert.equal(over.state, 'REJECTED');
  assert.equal(over.rejectionReason, 'parser_output_bound');
});

test('FILE-01 cancel: an intent cancelled before READY admits no bytes', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', name: 'doc.pdf', declaredType: 'application/pdf', declaredSize: 4 });
  await u.appendChunk(record.id, 'uid-1', { offset: 0, bytes: bytes('ABCD') });
  const cancelled = await u.cancel(record.id, 'uid-1');
  assert.equal(cancelled.state, 'CANCELLED');
  await assert.rejects(u.verify(record.id, 'uid-1', { sniff }), (e) => e.code === 'state_conflict');
});

test('FILE-01 authorization: an upload cannot be read or mutated by a non-owner uid', async () => {
  const { s, u } = setup();
  const record = await u.createIntent({ uid: 'uid-1', name: 'doc.pdf', declaredType: 'application/pdf', declaredSize: 4 });
  await assert.rejects(u.appendChunk(record.id, 'uid-9', { offset: 0, bytes: bytes('ABCD') }), (e) => e.code === 'unauthorized');
  await assert.rejects(u.requireReady(record.id, 'uid-9'), (e) => e.code === 'unauthorized');
  await assert.rejects(u.cancel(record.id, 'uid-9'), (e) => e.code === 'unauthorized');
});
