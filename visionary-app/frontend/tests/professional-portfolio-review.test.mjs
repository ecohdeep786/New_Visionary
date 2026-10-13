import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { getCareerPath } from '../src/services/roleMentorService.ts';
import { assertPortfolioReviewHistory } from '../src/services/portfolioReviewIntegrity.ts';

const memory = new Map();
let failWrite = false;
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { if (failWrite && key === 'visionary_workspace_v2') throw new Error('quota'); memory.set(key, String(value)); }, removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const pro = { personId: 'demo-professional', workspaceId: 'demo-professional:professional', role: 'professional', locale: 'en' };
const parent = { personId: 'demo-parent', workspaceId: 'demo-parent:parent', role: 'parent', locale: 'en' };
const criteria = workspace.portfolioReviewCriteria.map(rule => ({ id: rule.id, rating: 'explained', note: `Evidence for ${rule.label}` }));

test('unreadable retained self-reviews reject new assessments without rewriting originals', () => {
 const artifact = workspace.saveArtifact(pro, { title: 'Retained work', body: 'Source evidence', status: 'completed' });
 const version = workspace.portfolioProjectVersion(artifact);
 workspace.savePortfolioSelfReview(pro, artifact.id, version, criteria, 'Original reflection');
 const original = memory.get('visionary_workspace_v2');
 const valid = workspace.snapshot(pro).artifacts[0].portfolioReviews;
 for (const history of ['broken', null, [null], [{ ...valid[0], criteria: null }], [{ ...valid[0], criteria: [criteria[0], criteria[0], criteria[2]] }], [{ ...valid[0], criteria: criteria.map(row => ({ ...row, rating: 'verified' })) }], [{ ...valid[0], reflection: {} }]]) {
  const db = JSON.parse(original);
  db.data[pro.workspaceId].artifacts[0].portfolioReviews = history;
  memory.set('visionary_workspace_v2', JSON.stringify(db));
  const bytes = memory.get('visionary_workspace_v2');
  assert.equal(getCareerPath(pro).portfolio[0].review, 'Self-review history unavailable');
  assert.throws(() => workspace.savePortfolioSelfReview(pro, artifact.id, version, criteria, 'Replacement'), /Original records were kept/);
  assert.equal(memory.get('visionary_workspace_v2'), bytes);
 }
 memory.set('visionary_workspace_v2', original);
 assert.doesNotThrow(() => assertPortfolioReviewHistory({ portfolioReviews: valid }));
 workspace.savePortfolioSelfReview(pro, artifact.id, version, criteria, 'Recovered next step');
 assert.equal(workspace.snapshot(pro).artifacts[0].portfolioReviews.length, 2);
});

beforeEach(() => {
 memory.clear(); failWrite = false;
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-30T12:00:00Z') });
 workspace.seedDemo('professional');
});

test('criterion review is a versioned self-assessment and later project edits mark it outdated', () => {
 const artifact = workspace.saveArtifact(pro, { title: 'Decision report', body: 'I compared two fictional data sources and described the limits.', milestones: [true, true, true], status: 'completed' });
 assert.equal(getCareerPath(pro).portfolio[0].review, 'Self-review needed');
 const version = workspace.portfolioProjectVersion(artifact);
 workspace.savePortfolioSelfReview(pro, artifact.id, version, criteria, 'Next I will test another source.');
 const reviewed = workspace.snapshot(pro).artifacts[0];
 assert.equal(reviewed.portfolioReviews.length, 1);
 assert.equal(reviewed.portfolioReviews[0].criteria.length, 3);
 assert.equal(getCareerPath(pro).portfolio[0].review, 'Self-reviewed');
 const same = workspace.saveArtifact(pro, { ...reviewed });
 assert.equal(workspace.portfolioProjectVersion(same), version, 'saving unchanged content keeps the review current');
 const changed = workspace.saveArtifact(pro, { ...same, body: 'I changed the method and limitations.' });
 assert.notEqual(workspace.portfolioProjectVersion(changed), version);
 assert.equal(getCareerPath(pro).portfolio[0].review, 'Review outdated');
 assert.throws(() => workspace.savePortfolioSelfReview(pro, artifact.id, version, criteria, 'Stale review'), /changed/);
 assert.equal(workspace.snapshot(pro).artifacts[0].portfolioReviews.length, 1);
});

test('review rejects incomplete work, forged role, missing criteria and failed local writes', () => {
 const draft = workspace.saveArtifact(pro, { title: 'Draft', body: 'Work in progress', status: 'draft' });
 assert.throws(() => workspace.savePortfolioSelfReview(pro, draft.id, workspace.portfolioProjectVersion(draft), criteria, 'Next step'), /Complete the project/);
 const complete = workspace.saveArtifact(pro, { ...draft, status: 'completed' });
 const version = workspace.portfolioProjectVersion(complete);
 assert.throws(() => workspace.savePortfolioSelfReview(parent, complete.id, version, criteria, 'Next step'), /professional workspace/);
 assert.throws(() => workspace.savePortfolioSelfReview(pro, complete.id, version, criteria.slice(0, 2), 'Next step'), /each criterion/);
 assert.throws(() => workspace.savePortfolioSelfReview(pro, complete.id, version, criteria, ' '), /reflection/);
 failWrite = true;
 assert.throws(() => workspace.savePortfolioSelfReview(pro, complete.id, version, criteria, 'Next I will improve it.'), /could not be saved/);
 failWrite = false;
 assert.equal(workspace.snapshot(pro).artifacts[0].portfolioReviews?.length || 0, 0);
 workspace.savePortfolioSelfReview(pro, complete.id, version, criteria, 'Next I will improve it.');
 assert.equal(workspace.snapshot(pro).artifacts[0].portfolioReviews.length, 1);
});
