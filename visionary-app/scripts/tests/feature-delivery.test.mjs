import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchBacklog } from '../launch-backlog.mjs';
import { featureDelivery, ticketTrace } from '../feature-delivery.mjs';
const source = fs.readFileSync(new URL('../../docs/architecture/BACKEND_LAUNCH_CHECKLIST.md', import.meta.url), 'utf8');
const backlog = launchBacklog(source);
const map = JSON.parse(fs.readFileSync(new URL('../../docs/architecture/tracking/jira-issue-map.json', import.meta.url), 'utf8'));
test('every checklist task has an explicit feature or shared layer contract with valid anchors and dependencies', () => {
  const manifest = featureDelivery(backlog, map);
  assert.equal(manifest.tasks.length, backlog.issues.length);
  assert.equal(manifest.features.length, 18);
  assert.equal(new Set(manifest.features.map(f => f.id)).size, 18);
  for (const task of manifest.tasks) {
    assert.ok(task.scope === 'product-wide' || task.features.length > 0);
    assert.deepEqual(task.layers, Object.keys(manifest.sharedLayers));
  }
  for (const feature of manifest.features) {
    for (const field of ['api', 'database', 'jobs', 'cache', 'realtime', 'ml', 'outcome']) assert.ok(feature[field]?.length > 30, `${feature.id}/${field}`);
    for (const anchor of feature.frontend) assert.ok(fs.existsSync(new URL('../../' + anchor, import.meta.url)), anchor);
  }
  assert.ok(manifest.dependencies.some(e => e.blocks === 'SYNC-01' && e.blocked === 'SYNC-02'));
  assert.ok(manifest.dependencies.some(e => e.blocks === 'AI-14' && e.blocked === 'AI-13'));
});
test('new or removed requirements cannot silently escape delivery coverage', () => {
  const removed = structuredClone(backlog); removed.issues = removed.issues.filter(i => i.sourceId !== 'AI-14');
  assert.throws(() => featureDelivery(removed, map), /Unknown delivery source ID/);
  const added = structuredClone(backlog); added.issues.push({ sourceId: 'FUTURE-01', phase: 'P07', localComplete: false });
  assert.throws(() => featureDelivery(added, map), /Unmapped feature task/);
});
test('Done evidence remains local and connected integration requires separate acceptance', () => {
  const manifest = featureDelivery(backlog, map);
  const done = ticketTrace(manifest.tasks.find(t => t.sourceId === 'DONE-02'), manifest, map);
  const feature = ticketTrace(manifest.tasks.find(t => t.sourceId === 'BUILD-04'), manifest, map);
  assert.match(done, /Historical local accomplishment/); assert.match(done, /do not extend or certify/);
  assert.match(feature, /bind base revision/); assert.match(feature, /replay\/refetch\/revocation/);
  assert.match(feature, /observed|committed product state/); assert.match(feature, /broad AGI capability require separate measured evidence/);
});
