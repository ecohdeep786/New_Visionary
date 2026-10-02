import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { recordLearningOutcome } from '../src/services/mentorStateService.ts';
import { answerParentReportQuestion, getParentReportAsk } from '../src/services/parentReportAskService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const parent = { personId: 'demo-parent', workspaceId: 'demo-parent:parent', role: 'parent', locale: 'en' };
const learner = { personId: 'demo-minor-cbse', workspaceId: 'demo-minor-cbse:student', role: 'student', locale: 'en' };

beforeEach(() => {
 memory.clear();
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') });
 workspace.seedDemo('parent');
});

test('report Ask uses the selected child and permitted summary without retaining conversation or private work', () => {
 recordLearningOutcome(learner, { id: 'permitted-check', conceptId: 'sample:cube:concept', kind: 'check', correct: 1, total: 1, verified: true, sessionId: 'private-session' });
 const privateConversation = workspace.newConversation(learner);
 workspace.updateConversation(learner, privateConversation.id, { draft: 'PRIVATE_DOUBT_TOKEN' });
 const before = workspace.snapshot(parent).conversations.length;
 const answer = answerParentReportQuestion(parent, learner.personId, 'What does this evidence mean?');
 assert.match(answer.answer, /1 of 1 recorded check/);
 assert.match(answer.teacherQuestion, /teacher/);
 assert.match(answer.activity, /review/);
 assert.equal(JSON.stringify(answer).includes('PRIVATE_DOUBT_TOKEN'), false);
 assert.equal(JSON.stringify(answer).includes('private-session'), false);
 assert.equal(workspace.snapshot(parent).conversations.length, before);
 assert.equal(getParentReportAsk(parent, 'demo-bengali').concepts.length, 0);
 assert.match(answerParentReportQuestion(parent, learner.personId, 'Tell me a story').answer, /three topics|Choose one of those topics/);
});

test('forged selection and revoked consent fail closed for every answer', () => {
 assert.throws(() => answerParentReportQuestion(parent, 'unknown-child', 'Help me'), /no longer shared/);
 assert.throws(() => getParentReportAsk(learner, learner.personId), /parent workspace/);
 const relationship = workspace.visibleRelationships(parent).find(row => row.to === learner.personId && row.status === 'active');
 workspace.changeRelationship(parent, relationship.id, 'revoked');
 assert.throws(() => answerParentReportQuestion(parent, learner.personId, 'Help me'), /no longer shared/);
 assert.equal(getParentReportAsk(parent, 'demo-bengali').childId, 'demo-bengali');
});
