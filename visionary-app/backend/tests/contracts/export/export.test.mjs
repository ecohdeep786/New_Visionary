/**
 * BUILD-05 (KAN-79) — explicit saved-revision Markdown/document export through
 * the private file lifecycle (P03):
 *   - export operates on SAVED revisions only (a generation/preview id refuses
 *     revision_not_saved); generation/preview cannot silently save/share/
 *     submit/deploy (no such path exists on this surface);
 *   - supported formats only (markdown | plaintext | html); others refuse;
 *   - artifacts are byte-stable with immutable content hashes; read-back is
 *     verbatim; the source revision is never modified;
 *   - private lifecycle: owner-gateway reads; revocation refuses reads;
 *   - command dedup: replayed exports converge; changed payload refuses;
 *   - owner/workspace boundary (no leak).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { ExportService } = req('./dist/src/export/export-service.js');
const { InMemoryExportStore } = req('./dist/src/export/export-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_1' };
const OTHER = { uid: 'uid_learner_2', workspaceId: 'ws_1' };
const ws2 = { uid: 'uid_learner_1', workspaceId: 'ws_2' };

const REVISION = {
  revisionId: 'rev_42',
  owner: OWNER,
  projectId: 'proj_essay',
  contentMd: '# My Essay\n\nParagraph **one**.\n\n## Section\n\nText.',
  committedAt: '2026-10-29T00:00:00.000Z',
};

async function makeService() {
  const store = new InMemoryExportStore();
  store.seedSavedRevision(REVISION);
  const service = new ExportService(store);
  return { store, service };
}

// ---------------------------------------------------------------------------

test('SAVED REVISIONS ONLY: a generation/preview id refuses; unknown id refuses', async () => {
  const { service } = await makeService();
  // A generation/preview id was never saved -> the only honest refusal.
  await assert.rejects(
    () => service.exportRevision(OWNER, 'cmd-1', 'preview_gen_9', 'markdown'),
    (e) => e.code === 'revision_not_saved',
  );
  // A completely unknown id also refuses (nothing silently saves).
  await assert.rejects(
    () => service.exportRevision(OWNER, 'cmd-1', 'rev_unknown', 'markdown'),
    (e) => e.code === 'revision_not_saved',
  );
});

test('SUPPORTED FORMATS ONLY: an unsupported export type refuses', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.exportRevision(OWNER, 'cmd-1', REVISION.revisionId, 'exe'),
    (e) => e.code === 'export_type_unsupported',
  );
});

test('BYTE-STABLE ARTIFACTS: identical inputs -> identical body/hash; read-back verbatim; source untouched', async () => {
  const { store, service } = await makeService();
  const a = await service.exportRevision(OWNER, 'cmd-2', REVISION.revisionId, 'markdown');
  const b = await service.exportRevision(OWNER, 'cmd-3', REVISION.revisionId, 'markdown');
  assert.equal(a.body, REVISION.contentMd); // markdown export is verbatim
  assert.equal(a.body, b.body);
  assert.equal(a.contentHash, b.contentHash);
  assert.notEqual(a.exportId, b.exportId); // distinct explicit exports
  // Read-back verbatim through the owner gateway.
  const read = await service.readExport(OWNER, a.exportId);
  assert.equal(read.body, REVISION.contentMd);
  assert.equal(read.contentHash, a.contentHash);
  // The saved revision was never modified by exporting.
  const still = await store.savedRevision(REVISION.revisionId);
  assert.equal(still.contentMd, REVISION.contentMd);
  // HTML/plaintext render deterministically too.
  const h1 = await service.exportRevision(OWNER, 'cmd-4', REVISION.revisionId, 'html');
  const h2 = await service.exportRevision(OWNER, 'cmd-5', REVISION.revisionId, 'html');
  assert.equal(h1.body, h2.body);
  assert.ok(h1.body.includes('<h1>My Essay</h1>'));
});

test('NO SILENT SHARE/SUBMIT/DEPLOY: the export surface exposes no such operation', async () => {
  const { service } = await makeService();
  const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
  const forbidden = ['share', 'submit', 'deploy', 'publish'];
  for (const f of forbidden) {
    assert.ok(!proto.some((m) => m.toLowerCase().includes(f)), `surface must not expose ${f}`);
  }
  assert.ok(proto.includes('exportRevision'));
  assert.ok(proto.includes('readExport'));
  assert.ok(proto.includes('revokeExport'));
});

test('COMMAND DEDUP: a replayed export converges to the SAME export; changed payload refuses', async () => {
  const { service } = await makeService();
  const a = await service.exportRevision(OWNER, 'dedup-1', REVISION.revisionId, 'markdown');
  const aReplay = await service.exportRevision(OWNER, 'dedup-1', REVISION.revisionId, 'markdown');
  assert.equal(aReplay.exportId, a.exportId);
  await assert.rejects(
    () => service.exportRevision(OWNER, 'dedup-1', REVISION.revisionId, 'html'),
    (e) => e.code === 'command_changed',
  );
});

test('PRIVATE LIFECYCLE: revocation refuses reads; owner/workspace boundary holds (no leak)', async () => {
  const { service } = await makeService();
  const a = await service.exportRevision(OWNER, 'cmd-6', REVISION.revisionId, 'plaintext');
  // Wrong uid/workspace cannot read.
  await assert.rejects(() => service.readExport(OTHER, a.exportId), (e) => e.code === 'not_owner');
  await assert.rejects(() => service.readExport(ws2, a.exportId), (e) => e.code === 'workspace_mismatch');
  // Owner revokes; reads refuse afterwards.
  await service.revokeExport(OWNER, a.exportId);
  await assert.rejects(() => service.readExport(OWNER, a.exportId), (e) => e.code === 'export_revoked');
  // Another user cannot revoke either.
  const b = await service.exportRevision(OWNER, 'cmd-7', REVISION.revisionId, 'plaintext');
  await assert.rejects(() => service.revokeExport(OTHER, b.exportId), (e) => e.code === 'not_owner');
  // Unknown export refuses.
  await assert.rejects(() => service.readExport(OWNER, 'exp_none'), (e) => e.code === 'export_unknown');
});
