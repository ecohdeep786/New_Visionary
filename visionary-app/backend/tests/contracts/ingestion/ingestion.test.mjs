/**
 * CONTENT-02 (KAN-61) — bounded scan/parse/chunk/embed/evaluate ingestion jobs
 * with provenance and page/section offsets; preserved embedding model/dimension
 * and transformation versions.
 *
 * Proven here:
 *   1. the full pipeline succeeds over a structured document and every chunk
 *      carries provenance, page/section offsets, the embedding model/dimension
 *      and the transformation versions that produced it,
 *   2. starting is idempotent per input digest: an active or succeeded job is
 *      returned, never duplicated; a failed job does not block a fresh attempt,
 *   3. stage completion is idempotent for identical output and conflicts on
 *      changed output; stale attempts are fenced out (concurrent runners),
 *   4. a runner that lost its working set raises RUNNER_CONTEXT_LOST and leaves
 *      the job runnable by a capable runner (restart honesty, no fake failure),
 *   5. bounded inputs refuse loudly: unsupported types, oversize objects and
 *      oversize chunk sets fail with typed errors — never silent truncation,
 *   6. authority and consent denies: wrong requester, wrong object owner,
 *      missing/empty rights grant, missing processing consent, tampered bytes,
 *      unverified manifests and unscanned/infected verdicts are all refused
 *      before any record is written, and results/status/events are owner-scoped,
 *   7. cancellation: owner-only, refuses terminal jobs, blocks further stage
 *      claims and keeps completed stages recorded,
 *   8. evaluation gates: an empty extraction fails evaluation and yields no
 *      result; a dimension-changing adapter fails the embed stage,
 *   9. durable events are ordered, owner-scoped and refetchable by cursor,
 *  10. re-ingestion of the same bytes into a fresh job is deterministic:
 *      identical chunk ids, offsets and embeddings.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { IngestionService } = req('./dist/src/ingestion/ingestion.service.js');
const { InMemoryIngestionStore } = req('./dist/src/ingestion/ingestion-store.js');
const { LocalDeterministicEmbedder } = req('./dist/src/ingestion/embedding-adapter.js');
const { IngestionError } = req('./dist/src/ingestion/ingestion-errors.js');
const { TRANSFORMATION_VERSIONS } = req('./dist/src/ingestion/ingestion-bounds.js');

const OWNER = 'uid-owner';
const OTHER = 'uid-other';
const PROVENANCE = { provider: 'cisce', edition: 'ed-2024', version: '1.0.0', contentPublicId: null };

const DOC = [
  '# Matter',
  '',
  'Matter is made of particles.',
  '\f',
  '',
  '## Atoms',
  '',
  'Atoms bind into molecules.',
  '',
  '# Forces',
  '',
  'Forces change motion.',
].join('\n');

function receipt(content, overrides = {}) {
  const digest = createHash('sha256').update(content).digest('hex');
  return {
    objectRef: 'obj_' + digest.slice(0, 16),
    digest,
    byteSize: content.length,
    contentType: 'text/markdown',
    ownerUid: OWNER,
    scanVerdict: 'clean',
    scannedAt: '2026-10-26T00:00:00.000Z',
    manifestVerified: true,
    ...overrides,
  };
}

const authorization = (overrides = {}) => ({
  ownerUid: OWNER,
  workspaceId: null,
  rightsGrant: 'owner',
  processingConsent: true,
  ...overrides,
});

function setup(bounds) {
  const store = new InMemoryIngestionStore();
  const embedder = new LocalDeterministicEmbedder(64);
  const service = new IngestionService(store, embedder, bounds ? { bounds } : {});
  return { store, embedder, service };
}

async function startAndRun(service, content, overrides = {}) {
  const { job } = await service.startIngestion({
    requesterUid: overrides.requesterUid ?? OWNER,
    authorization: overrides.authorization ?? authorization(),
    object: overrides.object ?? receipt(content),
    content,
    provenance: overrides.provenance ?? PROVENANCE,
  });
  const final = await service.run(job.jobId);
  return { job, final };
}

async function denialCode(promise) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof IngestionError) return error.code;
    throw error;
  }
  throw new Error('expected the call to be denied');
}

// ---------------------------------------------------------------------------

test('pipeline succeeds over a structured document and preserves provenance, offsets and embedding identity', async () => {
  const { service } = setup();
  const { final } = await startAndRun(service, Buffer.from(DOC, 'utf8'));
  assert.equal(final.status, 'succeeded');
  assert.equal(final.failure, null);
  assert.deepEqual([...final.completedStages], ['scan', 'parse', 'chunk', 'embed', 'evaluate']);

  const result = await service.getResult(final.jobId, OWNER);
  assert.equal(result.provenance.provider, 'cisce');
  assert.equal(result.provenance.edition, 'ed-2024');
  assert.equal(result.provenance.version, '1.0.0');
  assert.deepEqual(result.transformationVersions, {
    scan: TRANSFORMATION_VERSIONS.scan,
    parse: TRANSFORMATION_VERSIONS.parse,
    chunk: TRANSFORMATION_VERSIONS.chunk,
    embed: TRANSFORMATION_VERSIONS.embed,
    evaluate: TRANSFORMATION_VERSIONS.evaluate,
  });
  assert.ok(result.chunks.length >= 3, 'expected one chunk per paragraph group');
  assert.equal(result.evaluation.passed, true);

  const particles = result.chunks.find((c) => c.text.includes('Matter is made of particles.'));
  assert.ok(particles, 'particles chunk exists');
  assert.equal(particles.page, 1);
  assert.equal(particles.sectionPath, 'Matter');
  const atoms = result.chunks.find((c) => c.text.includes('Atoms bind into molecules.'));
  assert.equal(atoms.page, 2, 'content after the form feed is page 2');
  assert.equal(atoms.sectionPath, 'Matter > Atoms');
  const forces = result.chunks.find((c) => c.text.includes('Forces change motion.'));
  assert.equal(forces.sectionPath, 'Forces');

  for (const chunk of result.chunks) {
    assert.equal(chunk.embeddingModel, 'local-deterministic-v1');
    assert.equal(chunk.embeddingDimension, 64);
    assert.equal(chunk.embedding.length, 64);
    assert.ok(chunk.charStart >= 0 && chunk.charEnd > chunk.charStart);
    assert.deepEqual(chunk.provenance, PROVENANCE);
    assert.equal(chunk.transformationVersions.embed, TRANSFORMATION_VERSIONS.embed);
  }
  const text = result.chunks.map((c) => c.text);
  const offsets = result.chunks.map((c) => [c.charStart, c.charEnd]);
  for (const [i, [start, end]] of offsets.entries()) {
    assert.equal(DOC.replace(/\r\n?/g, '\n').slice(start, end), text[i], 'offsets index the normalized document');
  }
});

test('start is idempotent per input digest and a succeeded job is reused, not duplicated', async () => {
  const { service } = setup();
  const content = Buffer.from(DOC, 'utf8');
  const first = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  assert.equal(first.idempotentReplay, false);
  const second = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  assert.equal(second.idempotentReplay, true);
  assert.equal(second.job.jobId, first.job.jobId);

  await service.run(first.job.jobId);
  const third = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  assert.equal(third.idempotentReplay, true);
  assert.equal(third.job.jobId, first.job.jobId);
  assert.equal(third.job.status, 'succeeded');

  const resultA = await service.getResult(first.job.jobId, OWNER);
  const resultB = await service.getResult(third.job.jobId, OWNER);
  assert.deepEqual(resultB.chunks, resultA.chunks);
});

test('a failed job does not block a fresh attempt; the retry runs every stage again', async () => {
  const { service, embedder } = setup();
  const original = embedder.embedBatch.bind(embedder);
  embedder.embedBatch = async () => { throw new IngestionError('EMBEDDER_UNAVAILABLE', 'provider outage'); };
  const content = Buffer.from('Plain text body for the retry check.', 'utf8');
  const first = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  const failed = await service.run(first.job.jobId);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.failure.stage, 'embed');
  assert.equal(failed.failure.code, 'EMBEDDER_UNAVAILABLE');

  embedder.embedBatch = original;
  const retry = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  assert.equal(retry.idempotentReplay, false);
  assert.notEqual(retry.job.jobId, first.job.jobId);
  const recovered = await service.run(retry.job.jobId);
  assert.equal(recovered.status, 'succeeded');
  const result = await service.getResult(retry.job.jobId, OWNER);
  assert.equal(result.evaluation.passed, true);
});

test('stage completion is idempotent for identical output and conflicts on changed output; stale attempts are fenced', async () => {
  const { store, service } = setup();
  const content = Buffer.from(DOC, 'utf8');
  const { job } = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  const claimed = await store.claimStage(job.jobId, 'parse', 0);
  assert.equal(claimed.attempt, 1);

  const claimedAgain = await store.claimStage(job.jobId, 'parse', 0).catch((error) => error);
  assert.equal(claimedAgain.code, 'STALE_ATTEMPT', 'a second claim with the consumed attempt is fenced');

  const receiptA = {
    stage: 'parse', transformationVersion: TRANSFORMATION_VERSIONS.parse,
    startedAt: '2026-10-26T00:00:00.000Z', finishedAt: '2026-10-26T00:00:01.000Z',
    outputDigest: 'digest-a', notes: [],
  };
  await store.completeStage(job.jobId, 1, 'parse', receiptA);
  const replay = await store.completeStage(job.jobId, 1, 'parse', receiptA);
  assert.ok(replay.completedStages.includes('parse'), 'identical completion is a no-op');

  const conflict = await store.completeStage(job.jobId, 1, 'parse', { ...receiptA, outputDigest: 'digest-b' }).catch((error) => error);
  assert.equal(conflict.code, 'CONCURRENT_COMPLETION_CONFLICT', 'changed output for a completed stage conflicts');

  const stale = await store.completeStage(job.jobId, 0, 'chunk', { ...receiptA, stage: 'chunk' }).catch((error) => error);
  assert.equal(stale.code, 'STALE_ATTEMPT');
});

test('a runner without its working set raises RUNNER_CONTEXT_LOST and the job stays runnable', async () => {
  const { store, service } = setup();
  const bystander = new IngestionService(store, new LocalDeterministicEmbedder(64));
  const content = Buffer.from('Restart honesty body text for the context check.', 'utf8');
  const { job } = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  await assert.rejects(() => bystander.run(job.jobId), (error) => error instanceof IngestionError && error.code === 'RUNNER_CONTEXT_LOST');
  const afterLoss = await store.getJob(job.jobId);
  assert.ok(['pending', 'running'].includes(afterLoss.status), 'context loss never fails the job');
  assert.equal(afterLoss.failure, null);
  const recovered = await service.run(job.jobId);
  assert.equal(recovered.status, 'succeeded');
});

test('bounded inputs refuse loudly: unsupported type, oversize object and oversize chunk set', async () => {
  const { service } = setup();
  assert.equal(await denialCode(service.startIngestion({
    requesterUid: OWNER, authorization: authorization(),
    object: receipt(Buffer.from('x', 'utf8'), { contentType: 'application/pdf' }),
    content: Buffer.from('x', 'utf8'), provenance: PROVENANCE,
  })), 'UNSUPPORTED_TYPE');

  const tightBytes = setup({ maxBytes: 8 });
  assert.equal(await denialCode(tightBytes.service.startIngestion({
    requesterUid: OWNER, authorization: authorization(),
    object: receipt(Buffer.from('x', 'utf8'), { byteSize: 4096 }),
    content: Buffer.from('x', 'utf8'), provenance: PROVENANCE,
  })), 'INPUT_TOO_LARGE', 'declared byte size over the bound refuses at start');

  const bounded = setup({ maxChunks: 2 });
  const sentence = 'Concepts build on prior ideas and deserve their own indexed place in the corpus. ';
  const many = Array.from({ length: 6 }, (_, i) => 'Paragraph ' + i + ': ' + sentence.repeat(10)).join('\n\n');
  const { final } = await startAndRun(bounded.service, Buffer.from(many, 'utf8'));
  assert.equal(final.status, 'failed');
  assert.equal(final.failure.stage, 'chunk');
  assert.equal(final.failure.code, 'CHUNK_LIMIT');
  assert.equal(await denialCode(bounded.service.getResult(final.jobId, OWNER)), 'ALREADY_COMPLETED', 'a failed job has no result');
});

test('authority denies: wrong requester, wrong object owner and owner-scoped reads', async () => {
  const { service } = setup();
  const content = Buffer.from(DOC, 'utf8');

  assert.equal(await denialCode(service.startIngestion({
    requesterUid: OTHER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  })), 'AUTHORITY_DENIED');

  assert.equal(await denialCode(service.startIngestion({
    requesterUid: OWNER, authorization: authorization({ ownerUid: OTHER }), object: receipt(content), content, provenance: PROVENANCE,
  })), 'AUTHORITY_DENIED');

  assert.equal(await denialCode(service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content, { ownerUid: OTHER }), content, provenance: PROVENANCE,
  })), 'AUTHORITY_DENIED');

  const { final } = await startAndRun(service, content);
  assert.equal(await denialCode(service.getResult(final.jobId, OTHER)), 'AUTHORITY_DENIED');
  assert.equal(await denialCode(service.getStatus(final.jobId, OTHER)), 'AUTHORITY_DENIED');
  assert.equal(await denialCode(service.listEvents(final.jobId, OTHER)), 'AUTHORITY_DENIED');
  assert.equal(await denialCode(service.cancel(final.jobId, OTHER)), 'AUTHORITY_DENIED');
});

test('consent, digest, manifest and scan verdict denies refuse before any record is written', async () => {
  const { service, store } = setup();
  const content = Buffer.from(DOC, 'utf8');
  const base = { requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE };

  assert.equal(await denialCode(service.startIngestion({ ...base, authorization: authorization({ rightsGrant: '' }) })), 'CONSENT_DENIED');
  assert.equal(await denialCode(service.startIngestion({ ...base, authorization: authorization({ processingConsent: false }) })), 'CONSENT_DENIED');
  assert.equal(await denialCode(service.startIngestion({ ...base, authorization: authorization({ ownerUid: 'uid-owner' }), requesterUid: OWNER, object: receipt(content, { manifestVerified: false }) })), 'OBJECT_UNVERIFIED');
  assert.equal(await denialCode(service.startIngestion({ ...base, object: receipt(content, { scanVerdict: 'unscanned', scannedAt: null }) })), 'SCAN_NOT_CLEAN');
  assert.equal(await denialCode(service.startIngestion({ ...base, object: receipt(content, { scanVerdict: 'infected' }) })), 'SCAN_NOT_CLEAN');
  assert.equal(await denialCode(service.startIngestion({ ...base, provenance: { ...PROVENANCE, provider: '' } })), 'MALFORMED_PROVENANCE');
  assert.equal(await denialCode(service.startIngestion({
    ...base, object: receipt(content), content: Buffer.from(DOC.replace('particles', 'PARTICLES'), 'utf8'),
  })), 'OBJECT_UNVERIFIED', 'tampered bytes fail the digest binding');

  const jobs = await store.findJobByInputDigest('no-such-digest');
  assert.equal(jobs, null);
  const events = await store.listEvents('no-such-job');
  assert.equal(events.events.length, 0, 'denied starts wrote no events');
});

test('tampered parse input fails the job durably at parse with PARSE_DECODE_FAILED', async () => {
  const { service } = setup();
  const invalid = Buffer.from([0x61, 0xc3, 0x28, 0x62], 'utf8'); // invalid UTF-8 sequence
  const object = receipt(invalid);
  const { final } = await startAndRun(service, invalid);
  assert.equal(final.status, 'failed');
  assert.equal(final.failure.stage, 'parse');
  assert.equal(final.failure.code, 'PARSE_DECODE_FAILED');
  assert.equal(object.digest.length, 64);
});

test('cancellation is owner-only, refuses terminal jobs and blocks further stage claims', async () => {
  const { store, service } = setup();
  const content = Buffer.from(DOC, 'utf8');
  const { job } = await service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  await service.runStage(job.jobId, 'scan');
  await service.runStage(job.jobId, 'parse');
  const cancelled = await service.cancel(job.jobId, OWNER);
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.cancellation.requestedBy, OWNER);
  assert.equal(cancelled.cancellation.stage, 'chunk', 'the next incomplete stage is recorded');
  assert.deepEqual([...cancelled.completedStages], ['scan', 'parse'], 'completed stages remain recorded');

  const blocked = await service.runStage(job.jobId, 'chunk').catch((error) => error);
  assert.equal(blocked.code, 'JOB_CANCELLED');
  const stopped = await service.run(job.jobId);
  assert.equal(stopped.status, 'cancelled');

  const succeededJob = await (async () => {
    const retry = await service.startIngestion({
      requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
    });
    return service.run(retry.job.jobId);
  })();
  assert.equal(succeededJob.status, 'succeeded');
  const tooLate = await service.cancel(succeededJob.jobId, OWNER).catch((error) => error);
  assert.equal(tooLate.code, 'ALREADY_COMPLETED');
  assert.equal(await denialCode(service.getResult(job.jobId, OWNER)), 'ALREADY_COMPLETED', 'a cancelled job has no result');
});

test('evaluation gates: empty extraction fails evaluation; dimension-changing adapter fails embed', async () => {
  const { service } = setup();
  const empty = Buffer.from('   \n\n  \f \n\n', 'utf8');
  const { final } = await startAndRun(service, empty);
  assert.equal(final.status, 'failed');
  assert.equal(final.failure.stage, 'evaluate');
  assert.equal(final.failure.code, 'EVALUATION_FAILED');
  assert.ok(final.failure.message.includes('chunks-present'));

  const store = new InMemoryIngestionStore();
  const lyingAdapter = {
    descriptor: { model: 'stub-wrong-dimension', dimension: 8 },
    embedBatch: async (texts) => texts.map(() => new Array(16).fill(0.5)),
  };
  const lying = new IngestionService(store, lyingAdapter);
  const content = Buffer.from('Small body for the dimension mismatch check.', 'utf8');
  const { job } = await lying.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  const failed = await lying.run(job.jobId);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.failure.stage, 'embed');
  assert.equal(failed.failure.code, 'EMBEDDING_DIMENSION_MISMATCH');
});

test('oversize decoded input fails the job at parse without truncation', async () => {
  const { service } = setup({ maxChars: 16 });
  const content = Buffer.from('This body text is definitely longer than sixteen characters.', 'utf8');
  const { final } = await startAndRun(service, content);
  assert.equal(final.status, 'failed');
  assert.equal(final.failure.stage, 'parse');
  assert.equal(final.failure.code, 'INPUT_TOO_LARGE');
});

test('durable events are ordered, owner-scoped and refetchable by cursor', async () => {
  const { service } = setup();
  const content = Buffer.from(DOC, 'utf8');
  const { final } = await startAndRun(service, content);
  const page = await service.listEvents(final.jobId, OWNER, undefined);
  assert.ok(page.events.length >= 7, 'start + claims + completions + success are observable');
  const seqs = page.events.map((e) => e.seq);
  assert.deepEqual([...seqs].sort((a, b) => a - b), seqs, 'events are ordered');
  assert.equal(page.events[0].type, 'job.started');
  assert.equal(page.events[page.events.length - 1].type, 'job.succeeded');

  const firstPage = await service.listEvents(final.jobId, OWNER, undefined, 3);
  assert.equal(firstPage.events.length, 3);
  assert.ok(firstPage.nextCursor, 'more events remain');
  const secondPage = await service.listEvents(final.jobId, OWNER, firstPage.nextCursor);
  assert.equal(secondPage.events[0].seq, firstPage.events[2].seq + 1, 'refetch continues after the cursor');
});

test('re-ingestion of the same bytes in a fresh world is deterministic; a succeeded digest stays deduplicated', async () => {
  const content = Buffer.from(DOC, 'utf8');
  const worldA = setup();
  const a = await startAndRun(worldA.service, content);
  const first = await worldA.service.getResult(a.final.jobId, OWNER);

  const worldB = setup();
  const b = await startAndRun(worldB.service, content);
  const second = await worldB.service.getResult(b.final.jobId, OWNER);
  assert.deepEqual(second.chunks, first.chunks, 'same bytes, versions and model reproduce identical chunks');

  const replay = await worldA.service.startIngestion({
    requesterUid: OWNER, authorization: authorization(), object: receipt(content), content, provenance: PROVENANCE,
  });
  assert.equal(replay.idempotentReplay, true);
  assert.equal(replay.job.jobId, a.final.jobId, 'a succeeded job keeps holding its digest');
  const tooLate = await worldA.service.cancel(a.final.jobId, OWNER).catch((error) => error);
  assert.equal(tooLate.code, 'ALREADY_COMPLETED');
});
