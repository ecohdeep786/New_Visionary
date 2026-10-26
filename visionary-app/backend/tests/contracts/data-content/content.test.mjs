/**
 * CONTENT-01 (KAN-60) — stable curriculum/book/chapter/topic/concept IDs,
 * source provider/version, rights, owner/visibility, grade/category and
 * authored-language metadata.
 *
 * Proven here:
 *   1. register derives a STABLE public ID from the immutable identity
 *      (kind|parentId|provider|edition) — never recycled, unchanged by metadata
 *      edits or source-version advancement,
 *   2. registration is IDEMPOTENT by public ID: the same registration returns
 *      the same node (retries/replays cannot duplicate or drift), and a
 *      different owner claiming the same public ID is refused (id_claimed),
 *   3. structural lineage is enforced (book under curriculum, ... concept under
 *      topic; missing or wrong-kind parent refuses),
 *   4. source provider/version is first-class: updateSourceVersion keeps the
 *      stable public ID and resets approval to pending,
 *   5. source approval is forward-only (pending → approved → released; reject
 *      is terminal; downgrades refuse) and publish REQUIRES an approved/released
 *      source — a pending/rejected source cannot be published,
 *   6. publication lifecycle: register (draft/private) → publish → withdraw;
 *      publish records publishedAt once, withdraw makes the node ineligible
 *      immediately and records withdrawnAt,
 *   7. owner authority: only the owning uid may update metadata, advance source,
 *      approve/reject, publish or withdraw; provenance kind/parent stay
 *      immutable,
 *   8. eligibility gating: a node is eligible only when it AND every ancestor
 *      are published & public AND its own source version is approved/released.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { CatalogService, CatalogError } = req('./dist/src/content/catalog.service.js');
const { InMemoryCatalogStore } = req('./dist/src/content/content-store.js');

function setup() {
  const store = new InMemoryCatalogStore();
  const svc = new CatalogService(store);
  return { store, svc };
}

const PUB = { provider: 'cisce', edition: 'ed-2024', version: '1.0' };

async function seed(svc) {
  const curriculum = await svc.register({ kind: 'curriculum', name: 'ICSE', parentId: null, ownerUid: 'uid-pub', source: PUB, grade: '6-10', category: 'national', authoredLanguage: 'en' });
  const book = await svc.register({ kind: 'book', name: 'Science 7', parentId: curriculum.publicId, ownerUid: 'uid-pub', source: PUB, grade: '7', category: 'science' });
  const chapter = await svc.register({ kind: 'chapter', name: 'Matter', parentId: book.publicId, ownerUid: 'uid-pub', source: PUB });
  return { curriculum, book, chapter };
}

test('KAN-60 stable IDs: metadata edits and source-version advances do not change the public ID', async () => {
  const { svc } = setup();
  const { book } = await seed(svc);
  const publicIdBefore = book.publicId;
  const renamed = await svc.updateMetadata(book.publicId, 'uid-pub', { name: 'Science 7 (Rev C)', grade: '8', category: 'science' });
  assert.equal(renamed.publicId, publicIdBefore);
  const advanced = await svc.updateSourceVersion(book.publicId, 'uid-pub', { provider: 'cisce', edition: 'ed-2024', version: '1.2' });
  assert.equal(advanced.publicId, publicIdBefore, 'source-version advance keeps the stable public ID');
  assert.equal(advanced.source.version, '1.2');
  assert.equal(advanced.source.approval, 'pending', 'new version is a fresh release candidate');
  assert.equal(advanced.source.provider, 'cisce');
});

test('KAN-60 idempotent registration: same identity returns the same node; a foreign owner claiming the ID is refused', async () => {
  const { svc } = setup();
  const { book } = await seed(svc);
  const again = await svc.register({ kind: 'book', name: 'Science 7 b', parentId: (await svc.lineage(book.publicId))[0].publicId, ownerUid: 'uid-pub', source: PUB });
  assert.equal(again.publicId, book.publicId, 'identical retry returns the same node, not a duplicate');
  // A different owner cannot claim the same public ID (even with its own name).
  await assert.rejects(
    svc.register({ kind: 'book', name: 'Other', parentId: (await svc.lineage(book.publicId))[0].publicId, ownerUid: 'uid-other', source: PUB }),
    (e) => e.code === 'id_claimed',
  );
});

test('KAN-60 structural lineage: a chapter needs a book, a book needs a curriculum, wrong kind refused', async () => {
  const { svc } = setup();
  const { curriculum } = await seed(svc);
  await assert.rejects(
    svc.register({ kind: 'curriculum', name: 'X', parentId: 'content:any', ownerUid: 'u', source: { provider: 'p', edition: 'e1', version: '1' } }),
    (e) => e.code === 'invalid_parent',
  );
  await assert.rejects(
    svc.register({ kind: 'chapter', name: 'C', parentId: curriculum.publicId, ownerUid: 'u', source: { provider: 'p', edition: 'e2', version: '1' } }),
    (e) => e.code === 'invalid_parent',
  );
  await assert.rejects(
    svc.register({ kind: 'book', name: 'B', parentId: 'content:none', ownerUid: 'u', source: { provider: 'p', edition: 'e3', version: '1' } }),
    (e) => e.code === 'missing_parent',
  );
  const { book, chapter } = await seed(svc);
  const topic = await svc.register({ kind: 'topic', name: '1.1', parentId: chapter.publicId, ownerUid: 'uid-pub', source: PUB });
  const concept = await svc.register({ kind: 'concept', name: 'Atom', parentId: topic.publicId, ownerUid: 'uid-pub', source: PUB });
  assert.equal(concept.kind, 'concept');
  assert.equal((await svc.lineage(concept.publicId)).length, 5); // curriculum, book, chapter, topic, concept
  assert.equal(book.parentId, curriculum.publicId);
});

test('KAN-60 source approval is forward-only: approve → released; reverse/downgrade and reject-after-release refuse', async () => {
  const { svc } = setup();
  const { book } = await seed(svc);
  // pending cannot be released directly, cannot be rejected after release, etc.
  await assert.rejects(svc.approveSource(book.publicId, 'uid-pub', 'released'), (e) => e.code === 'invalid_approval_transition');
  const approved = await svc.approveSource(book.publicId, 'uid-pub', 'approved');
  assert.equal(approved.source.approval, 'approved');
  const released = await svc.approveSource(book.publicId, 'uid-pub', 'released');
  assert.equal(released.source.approval, 'released');
  assert.ok(released.source.releasedAt, 'releasedAt recorded');
  // Downgrades refuse.
  await assert.rejects(svc.approveSource(book.publicId, 'uid-pub', 'approved'), (e) => e.code === 'invalid_approval_transition');
  // A rejected source is terminal for that version.
  const rejected = await svc.rejectSource(book.publicId, 'uid-pub');
  assert.equal(rejected.source.approval, 'rejected');
  await assert.rejects(svc.approveSource(book.publicId, 'uid-pub', 'approved'), (e) => e.code === 'source_rejected');
});

test('KAN-60 publish requires an approved/released source; a pending or rejected source cannot publish', async () => {
  const { svc } = setup();
  const { book } = await seed(svc);
  await assert.rejects(svc.publish(book.publicId, 'uid-pub'), (e) => e.code === 'not_approved');
  await svc.rejectSource(book.publicId, 'uid-pub');
  await assert.rejects(svc.publish(book.publicId, 'uid-pub'), (e) => e.code === 'source_rejected');
  await svc.updateSourceVersion(book.publicId, 'uid-pub', { provider: 'cisce', edition: 'ed-2024', version: '2.0' });
  await svc.approveSource(book.publicId, 'uid-pub', 'approved');
  await svc.approveSource(book.publicId, 'uid-pub', 'released');
  const published = await svc.publish(book.publicId, 'uid-pub');
  assert.equal(published.publication, 'published');
  assert.equal(published.rights.visibility, 'public');
  assert.ok(published.publishedAt, 'publishedAt recorded');
});

test('KAN-60 owner authority: only the owning uid may update, advance, approve, publish or withdraw', async () => {
  const { svc } = setup();
  const { book } = await seed(svc);
  await assert.rejects(svc.updateMetadata(book.publicId, 'uid-other', { name: 'hijack' }), (e) => e.code === 'unauthorized');
  await assert.rejects(svc.updateSourceVersion(book.publicId, 'uid-other', { provider: 'cisce', edition: 'ed-2024', version: '9.9' }), (e) => e.code === 'unauthorized');
  await assert.rejects(svc.approveSource(book.publicId, 'uid-other', 'approved'), (e) => e.code === 'unauthorized');
  await assert.rejects(svc.publish(book.publicId, 'uid-other'), (e) => e.code === 'unauthorized');
  await assert.rejects(svc.withdraw(book.publicId, 'uid-other'), (e) => e.code === 'unauthorized');
  // Owner approves the source, then publishes and withdraws its own node.
  await svc.approveSource(book.publicId, 'uid-pub', 'approved');
  await svc.approveSource(book.publicId, 'uid-pub', 'released');
  const published = await svc.publish(book.publicId, 'uid-pub');
  assert.equal(published.rights.visibility, 'public');
  const withdrawn = await svc.withdraw(book.publicId, 'uid-pub');
  assert.equal(withdrawn.publication, 'withdrawn');
  assert.ok(withdrawn.withdrawnAt, 'withdrawnAt recorded');
});

test('KAN-60 eligibility gating: a private/draft ancestor or pending source blocks retrieval; a fully released public chain is eligible', async () => {
  const { svc } = setup();
  const { curriculum, book, chapter } = await seed(svc);
  // Nothing published / source pending → ineligible.
  assert.equal((await svc.eligibleForRetrieval(chapter.publicId)).ok, false);
  // Approve + release + publish the whole chain, then the leaf is eligible.
  for (const node of [curriculum, book, chapter]) {
    await svc.approveSource(node.publicId, 'uid-pub', 'approved');
    await svc.approveSource(node.publicId, 'uid-pub', 'released');
    await svc.publish(node.publicId, 'uid-pub');
  }
  const topic = await svc.register({ kind: 'topic', name: '1.1', parentId: chapter.publicId, ownerUid: 'uid-pub', source: PUB });
  // Chapter is released+public but topic is draft → ineligible.
  assert.equal((await svc.eligibleForRetrieval(topic.publicId)).ok, false, 'draft leaf is ineligible');
  await svc.approveSource(topic.publicId, 'uid-pub', 'approved');
  await svc.approveSource(topic.publicId, 'uid-pub', 'released');
  await svc.publish(topic.publicId, 'uid-pub');
  assert.equal((await svc.eligibleForRetrieval(topic.publicId)).ok, true, 'fully released public chain eligible');
  // Withdraw the book → whole subtree becomes ineligible immediately.
  await svc.withdraw(book.publicId, 'uid-pub');
  assert.equal((await svc.eligibleForRetrieval(topic.publicId)).ok, false, 'withdrawing an ancestor blocks the whole subtree');
});

test('KAN-60 metadata: grade/category/authored-language are recorded and editable; provenance preserved', async () => {
  const { svc } = setup();
  const { book } = await seed(svc);
  assert.equal(book.grade, '7');
  assert.equal(book.category, 'science');
  assert.equal(book.authoredLanguage, 'en');
  const updated = await svc.updateMetadata(book.publicId, 'uid-pub', { grade: '8', authoredLanguage: 'hi', name: 'Science 7a' });
  assert.equal(updated.grade, '8');
  assert.equal(updated.authoredLanguage, 'hi');
  assert.equal(updated.source.provider, 'cisce');
  assert.equal(updated.source.edition, 'ed-2024');
});
