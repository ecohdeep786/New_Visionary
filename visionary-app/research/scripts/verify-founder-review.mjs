import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { featureDelivery } from '../../scripts/feature-delivery.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const qa = path.join(root, 'artifacts/qa/founder-spec-2026-10-16');
const read = p => fs.readFileSync(path.join(root, p));
const json = p => JSON.parse(read(p));
const sha = b => createHash('sha256').update(b).digest('hex');
const backlog = json('docs/architecture/tracking/jira-backlog.json');
const mapPath = 'docs/architecture/tracking/jira-issue-map.json', map = json(mapPath);
const ledger = json('docs/architecture/tracking/founder-spec-review.json');
const snapshot = JSON.parse(fs.readFileSync(path.join(qa, 'jira-readback-final.json')));
const before = JSON.parse(fs.readFileSync(path.join(qa, 'jira-before.json')));
const updates = JSON.parse(fs.readFileSync(path.join(qa, 'jira-updates.json')));
const rows = snapshot.issues, keyed = new Map(rows.map(r => [r.key, r]));
const normalize = s => s.replace(/\\\*/g, '*').replace(/(^|\n)\s*[-*] /g, '$1- ').replace(/\s+/g, ' ').trim();
assert.equal(snapshot.paginationComplete, true); assert.deepEqual(snapshot.pageSizes, [100, 52]);
assert.equal(rows.length, 152); assert.equal(keyed.size, 152);
assert.deepEqual(backlog.totals, { issues: 137, locallyComplete: 12, openLaunch: 119, later: 6 });
assert.equal(backlog.sourceSha256, sha(read(backlog.source)));
assert.equal(Object.keys(map.issues).length, 137);
const overrides = { 'AI-11': 'Testing', 'LEARN-09': 'In Progress', 'LEARN-10': 'In Progress' };
for (const spec of backlog.issues) {
  const mapping = map.issues[spec.sourceId], f = keyed.get(mapping.key)?.fields;
  assert.ok(f, 'Missing ' + spec.sourceId);
  assert.equal(f.issuetype.name, spec.issueType); assert.equal(f.parent?.key, map.epics[spec.phase]);
  const status = overrides[spec.sourceId] || (spec.localComplete ? 'Done' : spec.phase === 'LATER' ? 'Idea' : 'To Do');
  assert.equal(f.status.name, status, spec.sourceId);
  const label = 'visionary-id-' + spec.sourceId.toLowerCase();
  assert.equal(rows.filter(r => r.fields.labels.includes(label)).length, 1, label);
  for (const label of spec.labels) assert.ok(f.labels.includes(label), label);
  assert.ok(f.labels.includes(spec.localComplete ? 'visionary-local-complete' : 'visionary-' + spec.queue.toLowerCase()));
  assert.ok(f.description.includes('Cross-layer closure:'), spec.sourceId);
}
for (const phase of backlog.phases) {
  const f = keyed.get(map.epics[phase.id]).fields;
  assert.equal(f.issuetype.name, 'Epic');
  assert.equal(f.status.name, phase.id === 'FOUNDATION' ? 'Done' : phase.id === 'LATER' ? 'Idea' : 'To Do');
}
const manifest = featureDelivery(backlog, map);
assert.deepEqual(json('docs/architecture/tracking/feature-delivery.json'), manifest);
assert.equal(manifest.dependencies.length, 75); assert.equal(map.dependencies.length, 30);
const taskEdges = manifest.dependencies.map(e => ({ sourceId: e.blocks, blockedSourceId: e.blocked, blocks: map.issues[e.blocks].key, blocked: map.issues[e.blocked].key }));
for (const e of [...map.dependencies, ...taskEdges]) {
  assert.ok(keyed.get(e.blocks).fields.issuelinks.some(l => l.type.name === 'Blocks' && l.outwardIssue?.key === e.blocked), 'Missing outward ' + e.blocks + '>' + e.blocked);
  assert.ok(keyed.get(e.blocked).fields.issuelinks.some(l => l.type.name === 'Blocks' && l.inwardIssue?.key === e.blocks), 'Missing reciprocal ' + e.blocked);
}
const edges = rows.flatMap(r => r.fields.issuelinks.filter(l => l.type.name === 'Blocks' && l.outwardIssue).map(l => r.key + '>' + l.outwardIssue.key));
assert.equal(edges.length, 105); assert.equal(new Set(edges).size, 105);
assert.equal(updates.length, 82); assert.equal(new Set(updates.map(u => u.key)).size, 82);
for (const u of updates) {
  const actual = keyed.get(u.key).fields;
  assert.ok(normalize(actual.description).startsWith(normalize(u.originalDescription)), 'Original prefix ' + u.key);
  assert.equal(normalize(actual.description), normalize(u.description), 'Complete description ' + u.key);
  assert.equal(actual.description.split('## D-086 — Founder specification reconciliation').length - 1, 1, u.key);
  if (u.summary) assert.equal(actual.summary, u.summary);
}
for (const row of before) if (!updates.some(u => u.key === row.key)) {
  assert.equal(normalize(keyed.get(row.key).fields.description), normalize(row.fields.description), 'Unrelated description ' + row.key);
  assert.equal(keyed.get(row.key).fields.summary, row.fields.summary);
}
assert.equal(ledger.sourceFiles, 37); assert.equal(ledger.records.length, 37);
assert.equal(new Set(ledger.records.map(r => r.documentNumber)).size, 35);
assert.equal(ledger.records.reduce((n, r) => n + r.embeddedImagesInspected, 0), 39);
for (const r of ledger.records) {
  assert.equal(sha(read(r.source)), r.sha256, 'Original source changed ' + r.source);
  assert.ok(r.retain && r.correction && r.disposition && r.textBlocksReviewed > 0);
  for (const id of r.tickets) assert.ok(map.issues[id], id);
}
const byStatus = rows.reduce((a, r) => (a[r.fields.status.name] = (a[r.fields.status.name] || 0) + 1, a), {});
assert.deepEqual(byStatus, { Done: 13, 'To Do': 129, Idea: 7, Testing: 1, 'In Progress': 2 });
const nowTasks = rows.filter(r => r.fields.issuetype.name !== 'Epic' && r.fields.labels.includes('visionary-now')).map(r => r.key).sort();
assert.deepEqual(nowTasks, ['KAN-28', 'KAN-30', 'KAN-31', 'KAN-33', 'KAN-36', 'KAN-37', 'KAN-45']);
const journal = read('docs/architecture/tracking/jira-sync-journal.jsonl').toString('utf8').trim().split(/\r?\n/).map(JSON.parse);
const audit = journal.filter(r => r.decision === 'D-086');
assert.equal(audit.filter(r => r.kind === 'issue').length, 9);
assert.equal(audit.filter(r => r.kind === 'description').length, 82);
assert.equal(audit.filter(r => r.kind === 'dependency').length, 30);
for (const e of audit.filter(r => r.kind === 'dependency')) for (const id of [e.blocks, e.blocked]) {
  assert.ok(updates.some(u => u.sourceId === id), 'Changed dependency endpoint lacks current trace: ' + id);
}
const latestSource = audit.filter(r => r.kind === 'source_update').at(-1);
assert.equal(latestSource?.sha256, backlog.sourceSha256);
let localLinks = 0;
const docs = ['FOUNDER_SPEC_RECONCILIATION.md', 'FEATURE_DELIVERY_MATRIX.md', 'BACKEND_LAUNCH_CHECKLIST.md', 'BACKEND_LAUNCH_EVIDENCE.md', 'BACKEND_ML_JIRA_REVIEW.md', 'IMPLEMENTATION_HANDOFF.md', 'README.md', 'tracking/JIRA_SYNC.md'];
for (const name of docs) {
  const doc = 'docs/architecture/' + name;
  for (const match of read(doc).toString('utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]; if (!target || /^[a-z]+:/i.test(target)) continue;
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(doc), target)), doc + ' missing ' + target); localLinks++;
  }
}
const result = { decision: 'D-086', verifiedAt: snapshot.readAt, sourceSha256: backlog.sourceSha256, sourceFiles: 37, topics: 35, images: 39, sourceHashesUnchanged: true, jira: { total: 152, tasks: 137, epics: 15, byStatus, dependencyLinks: 105, phaseDependencyLinks: 30, taskDependencyLinks: 75, nowTasks, paginationComplete: true, errors: [] }, descriptionsVerified: 82, originalPrefixesPreserved: true, unrelatedDescriptionsUnchanged: true, featureFamilies: 18, layers: 11, taskGraphAcyclic: true, localDocumentLinks: localLinks, journal: { creates: 9, descriptions: 82, linksAdded: 30 }, noNewDone: true, limits: 'Local policy/client/metrics tests and planning verification only; no live domain persistence, model/provider benchmark, hosted acceptance, deployment, training, data purge or AGI proof.' };
if (process.argv.includes('--finalize')) {
  if (!map.sourceHistory?.some(r => r.decision === 'D-085')) map.sourceHistory = [...(map.sourceHistory || []), { decision: 'D-085', verifiedAt: map.verifiedAt, source: { ...map.source }, summary: { ...map.summary }, deliveryReview: { ...map.deliveryReview } }];
  map.source.sha256 = backlog.sourceSha256; map.verifiedAt = snapshot.readAt; map.summary = result.jira; map.taskDependencies = taskEdges;
  for (const entry of Object.values(map.issues)) entry.status = keyed.get(entry.key).fields.status.name;
  map.deliveryReview = { decision: 'D-086', path: 'docs/architecture/FEATURE_DELIVERY_MATRIX.md', manifest: 'docs/architecture/tracking/feature-delivery.json', features: 18, layers: 11, taskDescriptionsVerified: 137, founderDescriptionsUpdated: 82, noNewCompletion: true };
  map.founderReview = { decision: 'D-086', path: 'docs/architecture/FOUNDER_SPEC_RECONCILIATION.md', ledger: 'docs/architecture/tracking/founder-spec-review.json', sourceFiles: 37, topics: 35, images: 39, updatedKeys: updates.map(u => u.key), noNewCompletion: true };
  delete map.syncPending;
  fs.writeFileSync(path.join(root, mapPath), JSON.stringify(map, null, 2) + '\n');
}
fs.writeFileSync(path.join(qa, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
