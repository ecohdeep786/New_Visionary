import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { buildMentorPacket, sendMentorTurn } from '../src/services/mentorCompanionService.ts';
import { configureMentorModelAdapter } from '../src/services/mentorModelService.ts';
import { configureDailyPlanClock } from '../src/services/dailyPlanService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const at = () => new Date('2026-09-23T12:00:00Z');
const ctx = (person = 'adult', role = 'student', signal) => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en', signal });
const ready = (actionIds = ['learn']) => ({ status: 'ready', source: 'connected_model', locale: 'en', promptVersion: 'mentor-backend-v1', text: 'Open your saved learning outline.', actionIds });

beforeEach(() => { memory.clear(); workspace.configureMock({ latency: 0, fault: 'none', now: at }); configureDailyPlanClock(at); configureMentorModelAdapter(null); workspace.seedDemo('adult'); });

test('a connected model can respond through the scoped mentor packet without logging prompt text', async () => {
 const request = ctx(); const conversation = workspace.newConversation(request); let received;
 configureMentorModelAdapter({ async request(input, packet, context) { received = { input, packet, context }; return ready(); } });
 const response = await sendMentorTurn(request, conversation.id, 'What should I do today?');
 assert.equal(response.status, 'model');
 assert.equal(received.packet.role, 'student');
 assert.equal(received.packet.promptVersion, 'mentor-context-v1');
 assert.equal(received.context.workspaceId, request.workspaceId);
 const saved = workspace.snapshot(request).conversations.find(item => item.id === conversation.id);
 assert.equal(saved.messages.at(-1).status, 'model');
 assert.deepEqual(saved.messages.at(-1).blocks.at(-1), { type: 'action', label: 'Open Learn', path: '/dashboard/learn', locale: 'en' });
 const events = mentor.getInteractionEvents(request).filter(event => event.app === 'ASK');
 assert.equal(events.length, 2);
 assert.equal(JSON.stringify(events).includes(received.input), false);
 assert.match(events.at(-1).prompt_version, /^ref-/);
 assert.equal(JSON.stringify(events).includes('mentor-backend-v1'), false);
});

test('model action identifiers cannot cross a role boundary or create external links', async () => {
 workspace.seedDemo('parent'); const request = ctx('parent', 'parent'); const conversation = workspace.newConversation(request);
 configureMentorModelAdapter({ async request() { return ready(['learners']); } });
 await assert.rejects(sendMentorTurn(request, conversation.id, 'Show my child'), /out-of-scope/);
 const saved = workspace.snapshot(request).conversations.find(item => item.id === conversation.id);
 assert.equal(saved.messages.length, 0);
 assert.equal(saved.draft, 'Show my child');
});

test('a safety concern bypasses both the model and the plan intent router', async () => {
 const request = ctx(); const conversation = workspace.newConversation(request); let calls = 0;
 configureMentorModelAdapter({ async request() { calls++; return ready(); } });
 const response = await sendMentorTurn(request, conversation.id, 'What should I do today? I want to kill myself');
 assert.equal(calls, 0);
 assert.equal(response.status, 'blocked');
 assert.equal(workspace.snapshot(request).conversations.find(item => item.id === conversation.id).messages.at(-1).status, 'blocked');
});

test('cancelled model work leaves the question as a draft and appends no answer', async () => {
 const controller = new AbortController(); const request = ctx('adult', 'student', controller.signal); const conversation = workspace.newConversation(request);
 configureMentorModelAdapter({ request: () => new Promise(() => {}) });
 const turn = sendMentorTurn(request, conversation.id, 'Help me plan a project');
 controller.abort();
 await assert.rejects(turn, error => error.name === 'AbortError');
 const saved = workspace.snapshot(ctx()).conversations.find(item => item.id === conversation.id);
 assert.equal(saved.draft, 'Help me plan a project');
 assert.equal(saved.messages.length, 0);
});

test('conversation context is sent only for opted-in personalization', () => {
 const request = ctx(); const conversation = workspace.newConversation(request);
 workspace.updateConversation(request, conversation.id, { title: 'Private astronomy question', useForPersonalization: true });
 assert.deepEqual(buildMentorPacket(request).conversationTitles, ['Private astronomy question']);
 workspace.updatePreferences(request, { memory: false });
 assert.deepEqual(buildMentorPacket(request).conversationTitles, []);
});
