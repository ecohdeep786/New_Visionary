import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from '../data-01/postgres-fixture.cjs';
import roles from '../data-02/postgres-fixture.cjs';

const { canonicalMigrations } = fixture.req('./dist/src/data/migration-registry.js');
const { MigrationRunner } = fixture.req('./dist/src/data/migration-runner.js');
const { UploadService } = fixture.req('./dist/src/file/upload.service.js');
const { DEFAULT_FILE_POLICY, sha256Hex } = fixture.req('./dist/src/file/file-types.js');
const { PostgresFileStore } = fixture.req('./dist/src/file/file-store.sql.js');
const { GcsQuarantineStorage } = fixture.req('./dist/src/file/quarantine-storage.gcs.js');

const matches = code => error => error.code === code;
const clean = { scan: async () => 'clean' };

function quarantine() {
  const bucket = 'visionary-kan56-quarantine-fixture';
  const objects = new Map();
  const requests = [];
  let dropOnce = false;
  let corrupt = false;
  const store = new GcsQuarantineStorage(bucket, async () => 'synthetic-local-only', async (url, request) => {
    requests.push({ url: new URL(url), method: request.method || 'GET' });
    assert.equal(url.origin, 'https://storage.googleapis.com');
    assert.equal(request.headers.Authorization, 'Bearer synthetic-local-only');
    if (request.method === 'POST') {
      const name = url.searchParams.get('name');
      assert.equal(url.searchParams.get('ifGenerationMatch'), '0');
      const old = objects.get(name);
      if (old) return new Response(null, { status: 412 });
      const bytes = Uint8Array.from(request.body);
      const meta = { name, bucket, size: String(bytes.length), generation: String(101 + objects.size) };
      objects.set(name, { bytes, meta });
      if (dropOnce) {
        dropOnce = false;
        throw Error('synthetic response loss after durable write');
      }
      return Response.json(meta);
    }
    const key = decodeURIComponent(url.pathname.slice(url.pathname.lastIndexOf('/') + 1));
    const object = objects.get(key);
    assert.ok(object, 'expected immutable object reference');
    if (url.searchParams.get('alt') === 'media') {
      assert.equal(url.searchParams.get('generation'), object.meta.generation);
      assert.equal(url.searchParams.get('ifGenerationMatch'), object.meta.generation);
      return new Response(corrupt ? Uint8Array.of(...object.bytes, 0) : object.bytes);
    }
    return Response.json(object.meta);
  });
  return { store, requests, objects, dropResponse: () => { dropOnce = true; }, corruptRead: () => { corrupt = true; } };
}

async function setup(t, overrides = {}) {
  const env = await roles.stagingDatabase();
  t.after(() => env.close());
  await new MigrationRunner(env.store(), canonicalMigrations(fixture.backend)).applyAll();
  const { db, runtime, runtimeRole, schema } = env;
  for (const [permissions, table] of [
    ['SELECT, INSERT, UPDATE (state, revision, "bytesReceived", digest, "sniffedType", "scanResult", "rejectionReason", "parserOutputBytes", "archiveEntries")', 'file_uploads'],
    ['SELECT, INSERT, UPDATE (generation)', 'file_upload_chunks'],
    ['SELECT (uid), UPDATE ("updatedAt")', 'persons'],
    ['SELECT (uid, "resourceType", "resourceId")', 'deletion_tombstones'],
    ['SELECT (id, uid), UPDATE ("updatedAt")', 'workspaces'],
    ['SELECT (id, uid, "workspaceId", role), UPDATE ("updatedAt")', 'workspace_memberships'],
  ]) {
    await db.$executeRawUnsafe('GRANT ' + permissions + ' ON "' + schema + '".' + table + ' TO "' + runtimeRole + '"');
  }
  await db.person.createMany({ data: ['owner', 'peer', 'member', 'guest'].map(uid => ({ uid })) });
  const workspace = await db.workspace.create({ data: { uid: 'owner', name: 'Upload QA', slug: 'upload-qa' } });
  await db.workspaceMembership.createMany({ data: [
    { uid: 'member', workspaceId: workspace.id, role: 'MEMBER', source: 'direct' },
    { uid: 'guest', workspaceId: workspace.id, role: 'GUEST', source: 'direct' },
  ] });
  const peer = fixture.client(env.config.runtimeUrl);
  t.after(() => peer.$disconnect());
  const storage = quarantine();
  const policy = { ...DEFAULT_FILE_POLICY, chunkBytes: 3, ...overrides };
  const worker = (inspection = clean, connection = runtime) =>
    new UploadService(new PostgresFileStore(connection), storage.store, inspection, policy);
  return { ...storage, db, worker, upload: worker(), restart: worker(clean, peer), workspaceId: workspace.id };
}

function intent(bytes, overrides = {}) {
  return { uid: 'owner', name: 'notes.txt', declaredType: 'text/plain',
    declaredSize: bytes.length, expectedDigest: sha256Hex(bytes), ...overrides };
}

async function send(service, record, bytes) {
  for (let offset = 0; offset < bytes.length; offset += record.chunkBytes) {
    await service.appendChunk(record.id, record.uid, offset, bytes.subarray(offset, offset + record.chunkBytes));
  }
}

test('FILE-01 resumes from PostgreSQL and recovers a response lost after the GCS write', async t => {
  const { upload, restart, requests, objects, dropResponse, workspaceId } = await setup(t);
  const bytes = Buffer.from('hello!');
  const record = await upload.createIntent(intent(bytes, { workspaceId }));
  await assert.rejects(upload.requireReady(record.id, 'owner'), matches('not_ready'));
  await assert.rejects(upload.appendChunk(record.id, 'peer', 0, bytes.subarray(0, 3)), matches('not_found'));
  await assert.rejects(upload.appendChunk(record.id, 'owner', 3, bytes.subarray(3)), matches('state_conflict'));
  assert.equal(requests.length, 0);
  dropResponse();
  await assert.rejects(upload.appendChunk(record.id, 'owner', 0, bytes.subarray(0, 3)), /response loss/);
  assert.equal(await restart.progress(record.id, 'owner'), 0);
  assert.equal(objects.size, 1);
  await restart.appendChunk(record.id, 'owner', 0, bytes.subarray(0, 3));
  assert.equal(await restart.progress(record.id, 'owner'), 3);
  const sent = requests.length;
  await restart.appendChunk(record.id, 'owner', 0, bytes.subarray(0, 3));
  await assert.rejects(upload.appendChunk(record.id, 'owner', 0, Buffer.from('XXX')), matches('part_mismatch'));
  assert.equal(requests.length, sent);
  await assert.rejects(restart.verify(record.id, 'owner'), matches('size_mismatch'));
  await restart.appendChunk(record.id, 'owner', 3, bytes.subarray(3));
  assert.equal((await upload.verify(record.id, 'owner')).state, 'SCANNING');
  await assert.rejects(restart.requireReady(record.id, 'owner'), matches('not_ready'));
  assert.equal((await restart.scan(record.id, 'owner')).state, 'READY');
  assert.equal((await upload.requireReady(record.id, 'owner')).digest, sha256Hex(bytes));
  await assert.rejects(upload.requireReady(record.id, 'peer'), matches('not_found'));
});

test('FILE-01 concurrent conflicting parts reserve one blob write, offset and manifest entry', async t => {
  const { upload, restart, db, requests } = await setup(t);
  const record = await upload.createIntent(intent(Buffer.from('abcdef')));
  const values = await Promise.allSettled([upload.appendChunk(record.id, 'owner', 0, Buffer.from('abc')),
    restart.appendChunk(record.id, 'owner', 0, Buffer.from('ABC'))]);
  assert.equal(values.filter(r => r.status === 'fulfilled').length, 1);
  assert.ok(matches('part_mismatch')(values.find(r => r.status === 'rejected').reason));
  assert.equal(await restart.progress(record.id, 'owner'), 3);
  assert.equal(await db.fileUploadChunk.count(), 1);
  assert.equal(requests.filter(request => request.method === 'POST').length, 1);
});

test('FILE-01 rejects wrong declared digest and type before the scan and refuses corrupted generations', async t => {
  const { upload, corruptRead } = await setup(t);
  const bytes = Buffer.from('hello');
  for (const [override, reason] of [
    [{ expectedDigest: 'a'.repeat(64) }, 'digest_mismatch'],
    [{ declaredType: 'application/pdf' }, 'type_mismatch'],
  ]) {
    const record = await upload.createIntent(intent(bytes, override));
    await send(upload, record, bytes);
    assert.equal((await upload.verify(record.id, 'owner')).rejectionReason, reason);
    await assert.rejects(upload.requireReady(record.id, 'owner'), matches('not_ready'));
  }
  const record = await upload.createIntent(intent(bytes));
  await send(upload, record, bytes);
  corruptRead();
  await assert.rejects(upload.verify(record.id, 'owner'), /size mismatch/);
  await assert.rejects(upload.requireReady(record.id, 'owner'), matches('not_ready'));
});

test('FILE-01 enforces workspace authority on intent, durable progress and completion', async t => {
  const { db, upload, restart, workspaceId } = await setup(t);
  const bytes = Buffer.from('abc');
  for (const uid of ['peer', 'guest', 'no-account']) {
    await assert.rejects(upload.createIntent(intent(bytes, { uid, workspaceId })), matches('scope_denied'));
  }
  const scoped = await upload.createIntent(intent(bytes, { uid: 'member', workspaceId }));
  await send(upload, scoped, bytes);
  await db.workspaceMembership.delete({ where: { uid_workspaceId: { uid: 'member', workspaceId } } });
  await assert.rejects(restart.progress(scoped.id, 'member'), matches('not_found'));
  await assert.rejects(restart.verify(scoped.id, 'member'), matches('not_found'));
});

test('FILE-01 a stale scan cannot publish after cancellation and a temporary scan failure can be retried', async t => {
  const { upload, worker, restart } = await setup(t);
  const bytes = Buffer.from('harmless document');
  const record = await upload.createIntent(intent(bytes));
  await send(upload, record, bytes);
  await upload.verify(record.id, 'owner');
  const temporary = worker({ scan: async () => { throw Error('scanner offline'); } });
  await assert.rejects(temporary.scan(record.id, 'owner'), /scanner offline/);
  let started, finish;
  const ready = new Promise(resolve => { started = resolve; });
  const blocked = new Promise(resolve => { finish = resolve; });
  const delayed = worker({ scan: async () => { started(); return blocked; } });
  const scanning = delayed.scan(record.id, 'owner');
  await ready;
  try {
    assert.equal((await restart.cancel(record.id, 'owner')).state, 'CANCELLED');
  } finally {
    finish('clean');
  }
  await assert.rejects(scanning, matches('state_conflict'));
  await assert.rejects(restart.requireReady(record.id, 'owner'), matches('not_ready'));
});

test('FILE-01 rejects infected uploads and bounds streamed parser bytes and archive entries before READY', async t => {
  const { upload, worker } = await setup(t, { maxArchiveEntries: 1, maxParserOutputBytes: 4 });
  const text = Buffer.from('suspicious');
  const bad = await upload.createIntent(intent(text));
  await send(upload, bad, text);
  await upload.verify(bad.id, 'owner');
  assert.equal((await worker({ scan: async () => 'infected' }).scan(bad.id, 'owner')).rejectionReason, 'scan_infected');
  const archive = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('fixture')]);
  for (const [parts, expected] of [
    [[Buffer.from('x'), Buffer.from('y')], 'archive_entry_bound'],
    [[Buffer.from('oversize')], 'parser_output_bound'],
  ]) {
    const record = await upload.createIntent(intent(archive, { declaredType: 'application/zip' }));
    await send(upload, record, archive);
    await upload.verify(record.id, 'owner');
    await assert.rejects(upload.scan(record.id, 'owner'), matches('inspection_unavailable'));
    const bounded = worker({ ...clean, expand: async function* () {
      for (const part of parts) yield (async function* () { yield part; })();
    } });
    assert.equal((await bounded.scan(record.id, 'owner')).rejectionReason, expected);
  }
});
