import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { getClassCommunity, postToClassCommunity, removeCommunityPost, configureCommunityClock } from '../src/services/communityService.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.crypto ??= { randomUUID: () => 'id-' + Math.random().toString(16).slice(2) };
const ctx = (person, role) => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
const at = () => new Date('2026-09-25T12:00:00Z');
beforeEach(() => {
 memory.clear();
 workspace.configureMock({ latency: 0, fault: 'none', now: at });
 configureCommunityClock(at);
 workspace.seedDemo('adult');
 seedConnectedFixtures(localStorage, at());
});

test('the class community is enrollment- and assignment-scoped with no global surface', () => {
 const student = ctx('minor-cbse', 'student');
 getClassCommunity(student, 'demo-class-cube');
 assert.throws(() => getClassCommunity(ctx('bengali', 'student'), 'demo-class-cube'), /enrolled/);
 getClassCommunity(ctx('teacher', 'teacher'), 'demo-class-cube');
 assert.throws(() => getClassCommunity(ctx('school-teacher', 'teacher'), 'demo-class-cube'), /assigned teacher/);
 assert.throws(() => getClassCommunity(ctx('parent', 'parent'), 'demo-class-cube'), /class workspace/);
 assert.throws(() => getClassCommunity(ctx('school-admin', 'organization'), 'demo-class-cube'), /class workspace/);
});

test('learners and the assigned teacher post; validation and moderation are real', () => {
 const student = ctx('minor-cbse', 'student');
 const teacher = ctx('teacher', 'teacher');
 const posted = postToClassCommunity(student, 'demo-class-cube', 'Why does the box hold 27 cubic units?');
 assert.equal(posted.authorRole, 'student');
 postToClassCommunity(teacher, 'demo-class-cube', 'Bring your models tomorrow.');
 assert.throws(() => postToClassCommunity(student, 'demo-class-cube', '   '), /Write something/);
 assert.throws(() => postToClassCommunity(student, 'demo-class-cube', 'x'.repeat(1001)), /under 1000/);
 const view = getClassCommunity(student, 'demo-class-cube');
 assert.equal(view.posts.length, 2);
 removeCommunityPost(teacher, 'demo-class-cube', posted.id);
 assert.equal(getClassCommunity(student, 'demo-class-cube').posts.length, 1);
 assert.throws(() => removeCommunityPost(ctx('school-teacher', 'teacher'), 'demo-class-cube', posted.id), /assigned teacher/);
 assert.throws(() => removeCommunityPost(student, 'demo-class-cube', posted.id), /assigned teacher/);
});

test('community events carry no post text and stay scoped to each workspace', () => {
 const student = ctx('minor-cbse', 'student');
 const teacher = ctx('teacher', 'teacher');
 const posted = postToClassCommunity(student, 'demo-class-cube', 'A private question about cubes');
 removeCommunityPost(teacher, 'demo-class-cube', posted.id);
 const studentEvents = mentor.getInteractionEvents(student).filter(e => e.app === 'COMMUNITY');
 const teacherEvents = mentor.getInteractionEvents(teacher).filter(e => e.app === 'COMMUNITY');
 // Events are per-workspace: the learner's save and the teacher's moderation never mix.
 assert.equal(studentEvents.some(e => e.action === 'save'), true);
 assert.equal(studentEvents.some(e => e.action === 'remove'), false);
 assert.equal(teacherEvents.some(e => e.action === 'remove'), true);
 assert.equal(JSON.stringify(studentEvents).includes('A private question'), false);
 assert.equal(JSON.stringify(teacherEvents).includes('A private question'), false);
});
