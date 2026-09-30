import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { getParentNotificationPreview } from '../src/services/parentNotificationService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const parent = { personId: 'demo-parent', workspaceId: 'demo-parent:parent', role: 'parent', locale: 'en' };
beforeEach(() => { memory.clear(); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-29T12:00:00Z') }); workspace.seedDemo('parent'); });

test('manual parent preview is localized, consent scoped and contains no private learner record', () => {
 const learner = { personId: 'demo-minor-cbse', workspaceId: 'demo-minor-cbse:student', role: 'student', locale: 'en' };
 const conversation = workspace.newConversation(learner);
 workspace.updateConversation(learner, conversation.id, { draft: 'PRIVATE QUESTION' });
 let view = getParentNotificationPreview(parent);
 assert.equal(view.connections.length, 2);
 assert.equal(view.digest.length, 2);
 assert.equal(JSON.stringify(view).includes('PRIVATE QUESTION'), false);
 workspace.updatePreferences(parent, { notificationLocale: 'hi', notifications: 'daily' });
 view = getParentNotificationPreview(parent);
 assert.match(view.connections[0].text, /[\u0900-\u097f]/);
 assert.match(view.digest[0].text, /[\u0900-\u097f]/);
 workspace.updatePreferences(parent, { notificationLocale: 'bn', notifications: 'off' });
 view = getParentNotificationPreview(parent);
 assert.equal(view.digest.length, 0);
 assert.match(view.connections[0].text, /[\u0980-\u09ff]/);
 assert.throws(() => getParentNotificationPreview(learner), /parent workspace/);
});

test('revocation immediately removes digest and report action for only the affected child', () => {
 const relationship = workspace.visibleRelationships(parent).find(row => row.to === 'demo-minor-cbse');
 workspace.changeRelationship(parent, relationship.id, 'revoked');
 const view = getParentNotificationPreview(parent);
 assert.equal(view.digest.some(item => item.childId === 'demo-minor-cbse'), false);
 assert.equal(view.digest.some(item => item.childId === 'demo-bengali'), true);
 const closed = view.connections.find(item => item.childId === 'demo-minor-cbse');
 assert.equal(closed.status, 'revoked');
 assert.equal(closed.path, '/dashboard/child');
 assert.match(view.connections.find(item => item.childId === 'demo-bengali').path, /reports\?child=/);
});

test('new guardian actions append ordered local event history without widening report access', () => {
 const learner = { personId: 'demo-exam', workspaceId: 'demo-exam:student', role: 'student', locale: 'en' };
 workspace.requestRelationship(parent, 'exam@visionary.test', 'guardian');
 const pending = workspace.visibleRelationships(parent).find(row => row.to === learner.personId && row.status === 'pending');
 let view = getParentNotificationPreview(parent);
 assert.match(view.history[0].text, /Requested progress sharing/);
 assert.equal(view.digest.some(item => item.childId === learner.personId), false);
 workspace.changeRelationship(learner, pending.id, 'active');
 view = getParentNotificationPreview(parent);
 assert.match(view.history[0].text, /accepted progress sharing/);
 assert.equal(view.digest.some(item => item.childId === learner.personId), true);
 workspace.changeRelationship(learner, pending.id, 'revoked');
 view = getParentNotificationPreview(parent);
 assert.match(view.history[0].text, /was stopped/);
 assert.equal(view.digest.some(item => item.childId === learner.personId), false);
 assert.ok(view.history.every(item => item.path === '/dashboard/child'));
 workspace.markNotification(parent, view.history[0].id);
 assert.equal(getParentNotificationPreview(parent).history[0].read, true);
});
