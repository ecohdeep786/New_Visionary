/**
 * CONTENT-07 (KAN-66) — media delivery authorization gate.
 *
 * Proven here:
 *   1. official approved embeds are preserved when the node is released +
 *      eligible and the embed's rights gate passes; an owned-media item with a
 *      blocked rights/privacy/cost gate is NOT delivered (fail closed),
 *   2. owned media processing/delivery is added only when released content
 *      requires it AND rights + privacy + cost all pass,
 *   3. withdrawal / pointer demotion / source rejection immediately remove the
 *      item from delivery (server-live; no authoritative cache),
 *   4. media labels are claims: an unknown node/media or a blocked item is
 *      never "deliverable" (claim evaluation fails closed),
 *   5. a node with no media pointer delivers nothing — no invented media.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { MediaDeliveryGate } = req('./dist/src/mediagate/media-gate.js');
const { InMemoryMediaStore } = req('./dist/src/mediagate/media-gate-lookups.js');

function makeStore(nodes) {
  const store = new InMemoryMediaStore();
  for (const n of nodes) store.setNode(n);
  return store;
}

function embed(overrides) {
  return InMemoryMediaStore.mediaPointer({ kind: 'official_embed', ...overrides });
}
function owned(overrides) {
  return InMemoryMediaStore.mediaPointer({ kind: 'owned_media', ...overrides });
}

// ---------------------------------------------------------------------------

test('official approved embeds are preserved for released eligible nodes with an approved rights gate', async () => {
  const store = makeStore([
    InMemoryMediaStore.node({
      nodeKey: 'src_math_9_en',
      media: [embed({ mediaKey: 'emb_official_math9', ref: 'https://approved.example.in/board/math9' })],
    }),
  ]);
  const gate = new MediaDeliveryGate(store);
  const report = await gate.evaluateAll();
  assert.equal(report.decisionSource, 'server-live');
  const node = report.nodes.find((n) => n.nodeKey === 'src_math_9_en');
  assert.ok(node, 'released node delivered');
  assert.equal(node.deliverable.length, 1);
  assert.equal(node.deliverable[0].kind, 'official_embed');
  assert.equal(node.deliverable[0].ref, 'https://approved.example.in/board/math9');
  assert.equal(node.blocked.length, 0);
});

test('owned media delivery requires released content AND rights + privacy + cost gates all approved', async () => {
  // Node declares owned media but the cost gate (processing/delivery spend) is blocked.
  const storeCostBlocked = makeStore([
    InMemoryMediaStore.node({
      nodeKey: 'src_science_8_en',
      media: [owned({ mediaKey: 'own_science8_movie', ref: 'gs://media/own_science8.mp4', gates: { rights: 'approved', privacy: 'approved', cost: 'blocked' } })],
    }),
  ]);
  let gate = new MediaDeliveryGate(storeCostBlocked);
  let report = await gate.evaluateAll();
  let node = report.nodes.find((n) => n.nodeKey === 'src_science_8_en');
  assert.equal(node.deliverable.length, 0, 'owned media is not delivered while cost gate is blocked');
  assert.equal(node.blocked.length, 1);
  assert.equal(node.blocked[0].reason, 'cost_gate');

  // Same node, cost gate approved -> owned media becomes deliverable.
  storeCostBlocked.setNode(InMemoryMediaStore.node({
    nodeKey: 'src_science_8_en',
    media: [owned({ mediaKey: 'own_science8_movie', ref: 'gs://media/own_science8.mp4', gates: { rights: 'approved', privacy: 'approved', cost: 'approved' } })],
  }));
  report = await gate.evaluateAll();
  node = report.nodes.find((n) => n.nodeKey === 'src_science_8_en');
  assert.equal(node.deliverable.length, 1, 'owned media delivered once released content requires it and all gates pass');
  assert.equal(node.deliverable[0].mediaKey, 'own_science8_movie');
});

test('withdrawal / pointer demotion / source rejection immediately remove the item from delivery (server-live, no cache)', async () => {
  const store = makeStore([
    InMemoryMediaStore.node({
      nodeKey: 'src_hist_7_en',
      media: [owned({ mediaKey: 'own_hist7', ref: 'gs://media/own_hist7.mp4' })],
    }),
  ]);
  const gate = new MediaDeliveryGate(store);

  let node = await gate.evaluateNode('src_hist_7_en');
  assert.equal(node.deliverable.length, 1, 'deliverable before withdrawal');

  // Privacy gate demoted -> immediate removal, no cache.
  store.setNode(InMemoryMediaStore.node({
    nodeKey: 'src_hist_7_en',
    media: [owned({ mediaKey: 'own_hist7', ref: 'gs://media/own_hist7.mp4', gates: { rights: 'approved', privacy: 'blocked', cost: 'approved' } })],
  }));
  node = await gate.evaluateNode('src_hist_7_en');
  assert.equal(node.deliverable.length, 0, 'withdrawal removes delivery immediately');
  assert.equal(node.blocked[0].reason, 'privacy_gate');

  // Source rejection also removes delivery.
  store.setNode(InMemoryMediaStore.node({
    nodeKey: 'src_hist_7_en',
    sourceRelease: 'rejected',
    media: [owned({ mediaKey: 'own_hist7', ref: 'gs://media/own_hist7.mp4' })],
  }));
  node = await gate.evaluateNode('src_hist_7_en');
  assert.equal(node.deliverable.length, 0, 'rejected source removes delivery');
  assert.equal(node.blocked[0].reason, 'source_not_released');

  // Unknown node fails closed.
  const unknown = await gate.evaluateNode('nowhere_node');
  assert.equal(unknown.unknown, true);
});

test('media labels are claims: an unknown node/media or a blocked item is never deliverable', async () => {
  const store = makeStore([
    InMemoryMediaStore.node({
      nodeKey: 'src_geo_9_en',
      media: [owned({ mediaKey: 'own_geo9', ref: 'gs://media/own_geo9.mp4', gates: { rights: 'approved', privacy: 'approved', cost: 'blocked' } })],
    }),
  ]);
  const gate = new MediaDeliveryGate(store);

  const unknownNode = await gate.evaluateClaim({ nodeKey: 'no_such', mediaKey: 'own_geo9' });
  assert.equal(unknownNode.proved, false);
  assert.equal(unknownNode.status, 'unknown_node');

  const unknownMedia = await gate.evaluateClaim({ nodeKey: 'src_geo_9_en', mediaKey: 'not_declared' });
  assert.equal(unknownMedia.proved, false);
  assert.equal(unknownMedia.status, 'unknown_media');

  // Blocked item claim: fail closed with the honest reason.
  const blocked = await gate.evaluateClaim({ nodeKey: 'src_geo_9_en', mediaKey: 'own_geo9' });
  assert.equal(blocked.proved, false);
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.reason, 'cost_gate');

  // Approved item claim: proved.
  store.setNode(InMemoryMediaStore.node({
    nodeKey: 'src_geo_9_en',
    media: [owned({ mediaKey: 'own_geo9', ref: 'gs://media/own_geo9.mp4' })],
  }));
  const proved = await gate.evaluateClaim({ nodeKey: 'src_geo_9_en', mediaKey: 'own_geo9' });
  assert.equal(proved.proved, true);
  assert.equal(proved.status, 'deliverable');
});

test('a node with no media pointer delivers nothing — no invented media', async () => {
  const store = makeStore([
    InMemoryMediaStore.node({ nodeKey: 'src_no_media', media: [] }),
  ]);
  const gate = new MediaDeliveryGate(store);
  const node = await gate.evaluateNode('src_no_media');
  // Present with no deliverable extra media; node itself may rely on text-only.
  assert.ok(node.deliverable);
  assert.equal(node.deliverable.length, 0);
  assert.equal(node.blocked.length, 0);
});

test('not_published / pending source nodes deliver nothing even with declared media', async () => {
  const store = makeStore([
    InMemoryMediaStore.node({
      nodeKey: 'src_draft_10',
      sourceRelease: 'pending',
      eligible: false,
      media: [owned({ mediaKey: 'own_draft10', ref: 'gs://media/own_draft10.mp4' })],
    }),
  ]);
  const gate = new MediaDeliveryGate(store);
  const node = await gate.evaluateNode('src_draft_10');
  assert.equal(node.deliverable.length, 0, 'draft/unpublished node delivers no media');
  assert.deepEqual(new Set(node.blocked.map((b) => b.reason)), new Set(['not_published']), 'unpublished is the blocking reason');
});

test('a mixed node resolves each media item independently — one blocked gate gates only that item', async () => {
  // Same released node carries an approved official embed (preserved) AND an owned
  // item whose cost gate is still blocked. The official embed stays deliverable;
  // only the owned item is withheld — each pointer is gated on its own merits.
  const store = makeStore([
    InMemoryMediaStore.node({
      nodeKey: 'src_math_9_en',
      media: [
        embed({ mediaKey: 'emb_official_math9', ref: 'https://approved.example.in/board/math9' }),
        owned({ mediaKey: 'own_math9_extra', ref: 'gs://media/own_math9_extra.mp4', gates: { rights: 'approved', privacy: 'approved', cost: 'blocked' } }),
      ],
    }),
  ]);
  const gate = new MediaDeliveryGate(store);
  const node = await gate.evaluateNode('src_math_9_en');
  assert.deepEqual(node.deliverable.map((d) => d.mediaKey), ['emb_official_math9'], 'official embed preserved and delivered');
  assert.deepEqual(node.blocked.map((b) => b.mediaKey), ['own_math9_extra'], 'only the owned item is withheld');
  assert.equal(node.blocked[0].reason, 'cost_gate', 'owned item blocked by its own cost gate');
  const total = node.deliverable.length + node.blocked.length;
  assert.equal(total, 2, 'both declared media items are accounted for');
});
