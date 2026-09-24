import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { getContentRepository } from '../src/services/contentRepository.ts';
import { getTeachingInterface } from '../src/services/teachingInterface.ts';
import { buildMentorPacket } from '../src/services/mentorCompanionService.ts';
import { requestMentorModelTurn } from '../src/services/mentorModelService.ts';
import { configureBackendTransport, isBackendTransportConfigured } from '../src/services/backendTransport.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = signal => ({ personId: 'demo-adult', workspaceId: 'demo-adult:student', role: 'student', locale: 'en', signal });
const identity = () => ({ personId: 'demo-adult', workspaceId: 'demo-adult:student', role: 'student', expiresAt: Date.now() + 60000 });
const ready = { status: 'ready', source: 'connected_model', locale: 'en', promptVersion: 'server-v1', text: 'Open your saved learning outline.', actionIds: ['learn'] };

beforeEach(() => { memory.clear(); workspace.configureMock({ latency: 0, fault: 'none' }); workspace.seedDemo('adult'); configureBackendTransport(null); });
afterEach(() => configureBackendTransport(null));

test('one authenticated boundary routes content, teaching and mentor without changing pages or claiming content coverage', async () => {
 const calls = [];
 configureBackendTransport({ async getSession() { return identity(); }, async exchange(request) {
  calls.push(request);
  if (request.operation === 'content.syllabus') return null;
  if (request.operation === 'teaching.request') return { status: 'ready', source: 'adapter', text: 'Connected response.' };
  return ready;
 } });
 assert.equal(isBackendTransportConfigured(), true);
 const syllabus = await getContentRepository(ctx()).getSyllabus('Unknown board', '7', 'Science');
 assert.equal(syllabus.status, 'provisional');
 assert.equal((await getContentRepository(ctx()).getDataGaps()).length, 1);
 const teaching = await getTeachingInterface(ctx()).requestExplanation({ input: 'Explain this.', language: 'en' });
 assert.equal(teaching.text, 'Connected response.');
 const mentor = await requestMentorModelTurn(ctx(), 'What next?', buildMentorPacket(ctx()));
 assert.equal(mentor.blocks.at(-1).path, '/dashboard/learn');
 assert.deepEqual(calls.map(call => call.operation), ['content.syllabus', 'teaching.request', 'mentor.turn']);
 assert.ok(calls.every(call => typeof call.requestId === 'string' && call.requestId.length > 0));
 assert.ok(calls.every(call => !JSON.stringify(call.body).includes('accessToken')));
});

test('no session, mismatched workspace, and an expired session fail before exchange', async () => {
 let current = null; let calls = 0;
 configureBackendTransport({ async getSession() { return current; }, async exchange() { calls++; return null; } });
 await assert.rejects(getContentRepository(ctx()).getSyllabus('X', '7', 'Y'), /authenticated account/);
 current = { ...identity(), workspaceId: 'demo-adult:teacher' };
 await assert.rejects(getContentRepository(ctx()).getSyllabus('X', '7', 'Y'), /authenticated account/);
 current = { ...identity(), expiresAt: Date.now() - 1 };
 await assert.rejects(getContentRepository(ctx()).getSyllabus('X', '7', 'Y'), /authenticated account/);
 assert.equal(calls, 0);
});

test('a session change after the reply refuses stale data; an explicit retry can succeed', async () => {
 let current = identity(); let calls = 0;
 configureBackendTransport({ async getSession() { return current; }, async exchange() { calls++; current = { ...identity(), workspaceId: 'demo-adult:teacher' }; return { status: 'ready', source: 'adapter', text: 'Old reply' }; } });
 await assert.rejects(getTeachingInterface(ctx()).requestExplanation({ input: 'Explain', language: 'en' }), /authenticated account/);
 assert.equal(calls, 1);
 configureBackendTransport({ async getSession() { return identity(); }, async exchange() { return { status: 'ready', source: 'adapter', text: 'Fresh reply' }; } });
 assert.equal((await getTeachingInterface(ctx()).requestExplanation({ input: 'Explain', language: 'en' })).text, 'Fresh reply');
});

test('cancellation and connection switching refuse late replies even if a transport ignores AbortSignal', async () => {
 const controller = new AbortController(); let resolveFirst; let resolveSecond; let requests = 0;
 configureBackendTransport({ async getSession() { return identity(); }, exchange() { return new Promise(resolve => { if (++requests === 1) resolveFirst = resolve; else resolveSecond = resolve; }); } });
 const cancelled = getTeachingInterface(ctx(controller.signal)).requestExplanation({ input: 'Explain', language: 'en' });
 await new Promise(resolve => setImmediate(resolve));
 controller.abort();
 await assert.rejects(cancelled, error => error.name === 'AbortError');
 resolveFirst({ status: 'ready', source: 'adapter', text: 'Late reply' });

 const pending = getTeachingInterface(ctx()).requestExplanation({ input: 'Explain again', language: 'en' });
 await new Promise(resolve => setImmediate(resolve));
 // The first transport starts a second request before it is disconnected.
 configureBackendTransport(null);
 resolveSecond?.({ status: 'ready', source: 'adapter', text: 'Too late' });
 await assert.rejects(pending, /connection changed/);
 assert.equal(isBackendTransportConfigured(), false);
 assert.equal((await getTeachingInterface(ctx()).requestExplanation({ input: 'Explain', language: 'en' })).status, 'not_connected');
});

test('malformed connected replies fail through the existing service validators', async () => {
 configureBackendTransport({ async getSession() { return identity(); }, async exchange(request) {
  if (request.operation === 'teaching.request') return { status: 'ready', source: 'adapter', text: '' };
  return { ...ready, actionIds: ['people'] };
 } });
 await assert.rejects(getTeachingInterface(ctx()).requestExplanation({ input: 'Explain', language: 'en' }), /incomplete response/);
 await assert.rejects(requestMentorModelTurn(ctx(), 'What next?', buildMentorPacket(ctx())), /out-of-scope/);
});
