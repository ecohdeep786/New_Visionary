import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchBacklog, launchIssueType } from '../launch-backlog.mjs';
const source = fs.readFileSync(new URL('../../docs/architecture/BACKEND_LAUNCH_CHECKLIST.md', import.meta.url), 'utf8');
test('launch backlog preserves every checked and open task, stable identity, dependency and truthful completion scope', () => {
  const backlog = launchBacklog(source), ids = backlog.issues.map(issue => issue.sourceId);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(ids.length, [...source.matchAll(/^- \[[ x]\] \*\*[A-Z]+-\d+\*\*/gm)].length);
  for (const issue of backlog.issues) {
    assert.ok(issue.labels.includes('visionary-id-' + issue.sourceId.toLowerCase()));
    assert.ok(backlog.phases.some(phase => phase.id === issue.phase));
    if (!issue.sourceId.startsWith('DONE-')) assert.equal(issue.localComplete, false);
    assert.equal(issue.dueDate, undefined); assert.equal(issue.assignee, undefined);
  }
  assert.deepEqual(backlog.phases.find(phase => phase.id === 'P07').dependencies, ['P01', 'P03', 'P04']);
  assert.equal(backlog.schedule.datesCommitted, false); assert.equal(backlog.schedule.workInProgressLimit, 2);
  assert.equal(backlog.targetProject.key, 'KAN');
  for (const edge of backlog.taskDependencies) {
    assert.ok(ids.includes(edge.blocks) && ids.includes(edge.blocked));
    assert.equal(backlog.issues.find(issue => issue.sourceId === edge.blocks).localComplete, false);
  }
  assert.throws(() => launchBacklog(source + '\n- [ ] **LATER-01** — duplicate'), /duplicate/);
  assert.throws(() => launchBacklog(source.replace('## P07 —', '## Removed —')), /Unscoped|Missing/);
});

test('Jira work types distinguish feature delivery, isolation defects and acceptance work', () => {
  assert.equal(launchIssueType('BUILD-01', 'Implement private projects.'), 'Story');
  assert.equal(launchIssueType('BUILD-08', 'Prove duplicate accept and stale proposals.'), 'Task');
  assert.equal(launchIssueType('AI-04', 'Enforce conversation ownership.'), 'Bug');
  assert.equal(launchIssueType('AI-11', 'Repair evaluation metrics.'), 'Bug');
  assert.equal(launchIssueType('AI-01', 'Benchmark candidate APIs.'), 'Task');
  assert.equal(launchIssueType('DONE-01', 'Repository foundation exists.'), 'Task');
});
