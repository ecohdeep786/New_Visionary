import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { getClassCommunity, postToClassCommunity, removeCommunityPost, reportCommunityPost, restoreCommunityPost, configureCommunityClock } from '../src/services/communityService.ts';
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

test('community trust edges: rate limits, learner reporting and teacher restore', () => {
 const student = ctx('minor-cbse', 'student');
 const teacher = ctx('teacher', 'teacher');
 postToClassCommunity(student, 'demo-class-cube', 'Post one');
 // Cooldown between same-author posts.
 assert.throws(() => postToClassCommunity(student, 'demo-class-cube', 'Too soon'), /short breath/);
 // Advance past the cooldown each time; after ten posts the day ceiling closes.
 for (let index = 2; index <= 10; index++) {
  configureCommunityClock(() => new Date(Date.parse('2026-09-25T12:00:00Z') + index * 20000));
  postToClassCommunity(student, 'demo-class-cube', 'Post ' + index);
 }
 configureCommunityClock(() => new Date(Date.parse('2026-09-25T12:00:00Z') + 11 * 20000));
 assert.throws(() => postToClassCommunity(student, 'demo-class-cube', 'One too many'), /limit/);
 // Learner reporting: a reported post disappears for learners, stays visible flagged for
 // the assigned teacher, and only that teacher can restore it.
 const enrollments = JSON.parse(localStorage.getItem('visionary_entity_Enrollment'));
 enrollments.push({ id: 'qa-maya-cube', class_id: 'demo-class-cube', student_email: 'bengali@visionary.test', student_id: 'demo-bengali', student_name: 'Maya', status: 'active' });
 localStorage.setItem('visionary_entity_Enrollment', JSON.stringify(enrollments));
 const maya = ctx('bengali', 'student');
 const posted = postToClassCommunity(maya, 'demo-class-cube', 'Question from Maya');
 reportCommunityPost(ctx('minor-cbse', 'student'), 'demo-class-cube', posted.id, 'Not about our class');
 assert.equal(getClassCommunity(ctx('minor-cbse', 'student'), 'demo-class-cube').posts.some(p => p.id === posted.id), false);
 const teacherView = getClassCommunity(ctx('teacher', 'teacher'), 'demo-class-cube');
 assert.equal(teacherView.posts.find(p => p.id === posted.id)?.status, 'flagged');
 restoreCommunityPost(ctx('teacher', 'teacher'), 'demo-class-cube', posted.id);
 assert.equal(getClassCommunity(ctx('minor-cbse', 'student'), 'demo-class-cube').posts.some(p => p.id === posted.id), true);
 assert.throws(() => restoreCommunityPost(ctx('school-teacher', 'teacher'), 'demo-class-cube', posted.id), /assigned teacher/);
 assert.throws(() => reportCommunityPost(ctx('teacher', 'teacher'), 'demo-class-cube', posted.id), /moderate this community directly/);
});
