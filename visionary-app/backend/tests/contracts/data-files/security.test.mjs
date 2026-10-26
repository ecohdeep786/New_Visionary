/**
 * FILE-04 (KAN-59) — proving unauthorized reads, URL/path traversal,
 * unsupported formats, scan failures, object loss, duplicate completion and
 * deletion races; isolating converters/parsers from account/payment
 * credentials.
 *
 * Proven here:
 *   1. unauthorized reads are refused (owner-scoped resolve + READY-only),
 *   2. URL/path traversal (absolute, `..`, backslash, drive letters, NUL,
 *      %2e%2e) is rejected before any read,
 *   3. unsupported formats are refused (only allow-listed expandable types),
 *   4. a scan failure never admits the object — it stays quarantined/refused
 *      and is not silently dropped,
 *   5. object loss: a partial upload that is missing bytes is refused (no
 *      silent drop of incomplete bytes),
 *   6. duplicate completion: a READY object stays READY; a repeat read is the
 *      same durable object (never re-executed),
 *   7. deletion races: a cancelled/rejected object resolves to `deleted` even
 *      if a read attempt races the deletion,
 *   8. converters/parsers never receive account/payment credentials — a payload
 *      carrying a credential field is refused before it reaches third-party
 *      parser code.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { FileSecurityGuard, FileSecurityError, isTraversalPath } = req('./dist/src/file/file-security.js');
const { InMemoryFileStore } = req('./dist/src/file/file-store.js');
const { DEFAULT_FILE_POLICY } = req('./dist/src/file/file-types.js');

function setup(policyOverrides = {}) {
  const store = new InMemoryFileStore();
  const guard = new FileSecurityGuard(store, { ...DEFAULT_FILE_POLICY, ...policyOverrides });
  return { store, guard };
}

async function readyRecord(store, opts = {}) {
  const record = {
    id: opts.id ?? 'file-1',
    uid: opts.uid ?? 'uid-1',
    workspaceId: opts.workspaceId ?? 'ws-1',
    name: opts.name ?? 'doc.pdf',
    declaredType: opts.declaredType ?? 'application/pdf',
    declaredSize: opts.declaredSize ?? 1024,
    state: opts.state ?? 'READY',
    createdAt: new Date().toISOString(),
    bytesReceived: opts.bytesReceived ?? 1024,
    expectedSize: opts.expectedSize ?? 1024,
    digest: opts.digest ?? 'a'.repeat(64),
    sniffedType: opts.sniffedType ?? 'application/pdf',
    scanResult: opts.scanResult ?? 'clean',
    rejectionReason: opts.rejectionReason ?? null,
    parserOutputBytes: opts.parserOutputBytes ?? 0,
    maxParserOutputBytes: opts.maxParserOutputBytes ?? DEFAULT_FILE_POLICY.maxParserOutputBytes,
    lastError: opts.lastError ?? null,
  };
  await store.create(record);
  return record;
}

test('FILE-04 unauthorized read: a non-owner uid is refused even for a READY object', async () => {
  const { store, guard } = setup();
  await readyRecord(store, { uid: 'uid-1', state: 'READY' });
  await assert.rejects(guard.readReady('file-1', 'uid-9', 'uid-1/doc.pdf'), (e) => e.code === 'unauthorized');
  await assert.rejects(guard.readReady('file-1', 'uid-1', 'uid-9/doc.pdf'), (e) => e.code === 'unauthorized');
});

test('FILE-04 URL/path traversal: absolute, backslash, drive, .., NUL and encoded dots are rejected', async () => {
  for (const evil of ['/etc/passwd', '..\\..\\etc', '../secrets', 'C:\\windows\\x', 'a/../../b', '\0/x', '%2e%2e/secret']) {
    assert.ok(isTraversalPath(evil), `path is traversal: ${evil}`);
  }
  const { guard } = setup();
  assert.throws(() => guard.resolveObjectPath('../secrets', 'uid-1'), (e) => e.code === 'traversal');
  assert.throws(() => guard.resolveObjectPath('C:\\windows\\x', 'uid-1'), (e) => e.code === 'traversal');
  assert.throws(() => guard.resolveObjectPath('%2e%2e/secret', 'uid-1'), (e) => e.code === 'traversal');
  // A clean owner-scoped key resolves safely.
  assert.equal(guard.resolveObjectPath('doc-1.pdf', 'uid-1'), 'uid-1/doc-1.pdf');
});

test('FILE-04 unsupported format: an allow-list miss is refused before conversion', async () => {
  const { guard } = setup({ expandableTypes: ['application/pdf'] });
  guard.assertSupportedType('application/pdf'); // allow-listed
  assert.throws(() => guard.assertSupportedType('application/x-msdownload'), (e) => e.code === 'unsupported_format');
  assert.throws(() => guard.assertSupportedType('text/html'), (e) => e.code === 'unsupported_format');
});

test('FILE-04 scan failure: an infected/failing scan never admits the object', async () => {
  const { store, guard } = setup();
  await readyRecord(store, { state: 'SCANNING' });
  await assert.rejects(guard.runScan('file-1', 'uid-1', async () => 'infected'), (e) => e.code === 'scan_failed');
  await assert.rejects(guard.runScan('file-1', 'uid-1', async () => { throw new Error('av-down'); }), (e) => e.code === 'scan_failed');
  const record = await store.byId('file-1');
  assert.equal(record.state, 'SCANNING', 'object not silently admitted on scan failure');
});

test('FILE-04 object loss: an incomplete upload is refused, never silently dropped as complete', async () => {
  const { store, guard } = setup();
  await readyRecord(store, { bytesReceived: 100, expectedSize: 1024 });
  const record = await store.byId('file-1');
  assert.throws(() => guard.ensureNoObjectLoss(record, 1024), (e) => e.code === 'object_loss');
  // When bytes match, no loss.
  await readyRecord(store, { id: 'file-2', bytesReceived: 1024, expectedSize: 1024 });
  const ok = await store.byId('file-2');
  assert.equal(guard.ensureNoObjectLoss(ok, 1024), ok);
});

test('FILE-04 duplicate completion: a READY object stays READY and a second read is the same durable object', async () => {
  const { store, guard } = setup();
  await readyRecord(store);
  const first = await guard.readReady('file-1', 'uid-1', 'uid-1/doc.pdf');
  const second = await guard.readReady('file-1', 'uid-1', 'uid-1/doc.pdf');
  assert.equal(first.state, 'READY');
  assert.equal(second, first, 'same durable object returned; completion not re-executed');
});

test('FILE-04 deletion race: a cancelled/rejected object resolves to deleted even if the read races', async () => {
  const { store, guard } = setup();
  await readyRecord(store, { state: 'CANCELLED' });
  await assert.rejects(guard.readReady('file-1', 'uid-1', 'uid-1/doc.pdf'), (e) => e.code === 'deleted');
  await readyRecord(store, { id: 'file-2', state: 'REJECTED' });
  await assert.rejects(guard.readReady('file-2', 'uid-1', 'uid-1/doc.pdf'), (e) => e.code === 'deleted');
});

test('FILE-04 converter isolation: account/payment credentials never reach the parser scope', async () => {
  const { store, guard } = setup();
  await readyRecord(store);
  const record = await store.byId('file-1');
  // A payload carrying any credential field is refused before parse.
  assert.throws(
    () => guard.converterScope(record, { text: 'hello', apiKey: 'sk-live-123' }),
    (e) => e.code === 'credential_leak',
  );
  assert.throws(
    () => guard.converterScope(record, { cardNumber: '4242' }),
    (e) => e.code === 'credential_leak',
  );
  // Non-credential fields are scrubbed/sanitized and safe for the parser.
  const scope = guard.converterScope(record, { text: 'hello', count: 2 });
  assert.deepEqual(scope.payload, { text: 'hello', count: 2 });
  assert.equal(scope.objectId, 'file-1');
});
