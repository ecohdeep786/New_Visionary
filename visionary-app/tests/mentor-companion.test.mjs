import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { sendMentorTurn, mentorGreeting, buildMentorPacket } from '../src/services/mentorCompanionService.ts';
import { configureDailyPlanClock } from '../src/services/dailyPlanService.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
const at = () => new Date('2026-09-23T12:00:00Z');
beforeEach(() => {
 memory.clear();
 workspace.configureMock({ latency: 0, fault: 'none', now: at });
 configureDailyPlanClock(at);
 workspace.seedDemo('adult');
});

test('a mentor turn answers today’s question from real records with actions and no transcript in events', async () => {
 const request = ctx();
 const conversationId = workspace.newConversation(request).id;
 const reply = await sendMentorTurn(request, conversationId, 'What should I do today?');
 assert.equal(reply.status, 'mentor');
 const conversation = workspace.snapshot(request).conversations.find(c => c.id === conversationId);
 assert.equal(conversation.messages.length, 2);
 assert.equal(conversation.messages.at(-1).status, 'mentor');
 const guide = conversation.messages.at(-1);
 assert.equal(guide.blocks[0].type, 'text');
 assert.ok(guide.blocks.some(block => block.type === 'action'), 'an action accompanies the answer');
 assert.ok(reply.text.includes('From your saved records'));
 const events = mentor.getInteractionEvents(request).filter(event => event.app === 'ASK');
 assert.equal(events.length, 2);
 assert.equal(JSON.stringify(events).includes('What should I do today'), false);
});

test('mentor replies speak the user’s language', async () => {
 const request = { ...ctx(), locale: 'hi' };
 const conversationId = workspace.newConversation(request).id;
 const reply = await sendMentorTurn(request, conversationId, 'आज क्या करूँ?');
 assert.equal(reply.status, 'mentor');
 assert.equal(reply.blocks[0].locale, 'hi');
 assert.match(reply.text, /आपके सहेजे अभिलेखों से/);
});

test('the same request reaches category-specific guidance per role', async () => {
 seedConnectedFixtures(localStorage, at());
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'companion-classwork', class_id: 'demo-class-cube', title: 'Make a model', status: 'published', due_date: '2026-09-30' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 const student = ctx('minor-cbse');
 const studentConv = workspace.newConversation(student).id;
 const studentReply = await sendMentorTurn(student, studentConv, 'Open my classwork');
 assert.ok(studentReply.blocks.some(block => block.type === 'action' && block.path.includes('classes?class=')), 'student reaches classwork');
 const teacher = ctx('teacher', 'teacher');
 const teacherConv = workspace.newConversation(teacher).id;
 const teacherReply = await sendMentorTurn(teacher, teacherConv, 'Open my classwork');
 assert.ok(teacherReply.blocks.some(block => block.type === 'action' && block.path.startsWith('/dashboard/class/')), 'teacher reaches class evidence, never student records');
 assert.equal(JSON.stringify(teacherReply.blocks).includes('Make a model'), false);
});

test('open-ended questions fall through to the teaching seam exactly once', async () => {
 const request = ctx();
 const conversationId = workspace.newConversation(request).id;
 const reply = await sendMentorTurn(request, conversationId, 'Explain how rainbows form');
 assert.equal(reply.status, 'not_connected');
 const conversation = workspace.snapshot(request).conversations.find(c => c.id === conversationId);
 assert.equal(conversation.messages.length, 2);
 assert.equal(conversation.messages.at(-1).status, 'not_connected');
});

test('the proactive greeting is evidence-based, category-aware, and localized', () => {
 const empty = mentorGreeting(ctx());
 assert.ok(empty.text.length > 0);
 assert.ok(empty.actions.some(item => item.path === '/dashboard/learn'));
 seedConnectedFixtures(localStorage, at());
 const assignments = JSON.parse(localStorage.getItem('visionary_entity_Assignment'));
 assignments.push({ id: 'companion-classwork', class_id: 'demo-class-cube', title: 'Make a model', status: 'published', due_date: '2026-09-30' });
 localStorage.setItem('visionary_entity_Assignment', JSON.stringify(assignments));
 const withClasswork = mentorGreeting(ctx('minor-cbse'));
 assert.ok(withClasswork.actions.some(item => item.path.includes('classes?class=')));
 assert.match(mentorGreeting({ ...ctx(), locale: 'hi' }).text, /[\u0900-\u097F]/);
 assert.ok(mentorGreeting(ctx('parent', 'parent')).actions.some(item => item.path === '/dashboard/reports'));
 assert.ok(mentorGreeting(ctx('school-admin', 'organization')).actions.some(item => item.path === '/dashboard/analytics'));
});

test('the context packet assembles the category view while events stay free of content', () => {
 const request = ctx();
 const packet = buildMentorPacket(request);
 assert.equal(packet.promptVersion, 'mentor-context-v1');
 assert.equal(packet.role, 'student');
 assert.deepEqual(packet.plan, []);
 assert.equal(Array.isArray(packet.observations), true);
 assert.equal(mentor.getInteractionEvents(request).length, 0);
});
