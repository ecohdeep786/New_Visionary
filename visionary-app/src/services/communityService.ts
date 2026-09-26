import type { RequestContext } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';
import { emitInteractionEvent } from './mentorStateService.ts';

// The internal community is class-scoped and teacher-visible by design: learners talk
// only inside the classes they are enrolled in, the assigned teacher can read everything
// and remove any post, and there is no global feed or direct message surface. Minors are
// safe here because every post lives inside a teacher-moderated classroom boundary.
// Nothing here is public; nothing leaves the local preview until a backend connects.
export interface CommunityPost {
 id: string; classId: string; authorId: string; authorName: string; authorRole: 'student' | 'teacher';
 text: string; at: string; status: 'visible' | 'removed' | 'flagged'; removedById?: string; flaggedBy?: string; flagReason?: string;
}
interface CommunityStore { version: 1; posts: CommunityPost[] }
const KEY = 'visionary_community_v1';
const MAX_TEXT = 1000;
type LegacyRow = Record<string, unknown>;
let clock = () => new Date();
export function configureCommunityClock(next: () => Date) { clock = next; }
function check(ctx: RequestContext) { if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); return workspaceIdentity(ctx); }
function read(): CommunityStore {
 const raw = localStorage.getItem(KEY); if (!raw) return { version: 1, posts: [] };
 try { const value = JSON.parse(raw); if (value.version !== 1 || !Array.isArray(value.posts)) throw Error(); return value; }
 catch { throw new Error('Community posts could not be read. Your existing records have not been changed.'); }
}
function write(store: CommunityStore, ctx: RequestContext) {
 try { localStorage.setItem(KEY, JSON.stringify(store)); }
 catch { throw new Error('Your community post could not be saved on this device. Nothing was changed.'); }
 if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('visionary:community-change'));
}
function rows(name: 'Classroom' | 'Enrollment' | 'OrganizationInvite'): LegacyRow[] {
 try { const value = JSON.parse(localStorage.getItem(`visionary_entity_${name}`) || '[]'); if (!Array.isArray(value)) throw Error(); return value; }
 catch { throw new Error('Connection records are unavailable. Community access stays restricted until they can be read.'); }
}
function alive(row: LegacyRow) { return row.status === 'active' && (!row.expiresAt || new Date(String(row.expiresAt)).getTime() > clock().getTime()); }
function schoolMembership(email: string, organization: unknown) { return !organization || rows('OrganizationInvite').some(r => r.email === email && r.organization_email === organization && alive(r)); }
function assertClassAccess(ctx: RequestContext, classId: string): 'student' | 'teacher' {
 const { person, workspace } = check(ctx);
 const classroom = rows('Classroom').find(c => c.id === classId);
 if (!classroom) throw new Error('This class community does not exist.');
 if (ctx.role === 'student') {
  const enrolled = rows('Enrollment').some(e => e.class_id === classId && alive(e) && schoolMembership(String(e.student_email || ''), classroom.organization_email) && (e.student_id === person.id || e.student_email === person.email));
  if (!enrolled) throw new Error('Only learners enrolled in this class can open its community.');
  return 'student';
 }
 if (ctx.role === 'teacher') {
  const assigned = (!workspace.organizationId || classroom.organization_email === workspace.organizationId) &&
   (classroom.teacher_email === person.email || classroom.teacher_id === person.id || classroom.created_by_id === person.id || classroom.created_by === person.email) &&
   schoolMembership(person.email, classroom.organization_email);
  if (!assigned) throw new Error('Only the assigned teacher can open this class community.');
  return 'teacher';
 }
 throw new Error('The community belongs to a class workspace. Open it from a learner or teacher workspace.');
}
export function getClassCommunity(ctx: RequestContext, classId: string): { classId: string; role: 'student' | 'teacher'; posts: CommunityPost[] } {
 const role = assertClassAccess(ctx, classId);
 emitInteractionEvent(ctx, { app: 'COMMUNITY', action: 'view', sessionId: classId, language: ctx.locale });
 const visible = role === 'teacher' ? (p: CommunityPost) => p.status === 'visible' || p.status === 'flagged' : (p: CommunityPost) => p.status === 'visible';
 const posts = read().posts.filter(p => p.classId === classId && visible(p)).sort((a, b) => a.at.localeCompare(b.at));
 return { classId, role, posts };
}
export function postToClassCommunity(ctx: RequestContext, classId: string, text: string): CommunityPost {
 const role = assertClassAccess(ctx, classId);
 const trimmed = text.trim();
 if (!trimmed) throw new Error('Write something before posting.');
 if (trimmed.length > MAX_TEXT) throw new Error(`Keep your post under ${MAX_TEXT} characters.`);
 const { person } = workspaceIdentity(ctx);
 // Trust edges: a short cooldown between posts and a daily ceiling per author per class.
 const nowMs = clock().getTime();
 const mine = read().posts.filter(p => p.classId === classId && p.authorId === ctx.personId && p.status !== 'removed');
 const lastMine = mine.at(-1);
 if (lastMine && nowMs - new Date(lastMine.at).getTime() < MIN_POST_INTERVAL_MS) throw new Error('Take a short breath before posting again.');
 if (mine.filter(p => nowMs - new Date(p.at).getTime() < 86400000).length >= MAX_POSTS_PER_DAY) throw new Error('You have reached today\'s posting limit for this class community. Try again tomorrow.');
 const post: CommunityPost = { id: crypto.randomUUID(), classId, authorId: ctx.personId, authorName: person.name, authorRole: role, text: trimmed, at: clock().toISOString(), status: 'visible' };
 const store = read(); store.posts.push(post); write(store, ctx);
 emitInteractionEvent(ctx, { app: 'COMMUNITY', action: 'save', sessionId: classId, language: ctx.locale, inputType: 'text' });
 return post;
}
const MIN_POST_INTERVAL_MS = 15000;
const MAX_POSTS_PER_DAY = 10;
export function reportCommunityPost(ctx: RequestContext, classId: string, postId: string, reason?: string): void {
 const role = assertClassAccess(ctx, classId);
 if (role !== 'student') throw new Error('Teachers moderate this community directly instead of reporting.');
 const store = read(); const post = store.posts.find(p => p.id === postId && p.classId === classId);
 if (!post || post.status !== 'visible') throw new Error('This post is not available to report.');
 post.status = 'flagged'; post.flaggedBy = ctx.personId;
 if (reason && reason.trim()) post.flagReason = reason.trim().slice(0, 200);
 write(store, ctx);
 emitInteractionEvent(ctx, { app: 'COMMUNITY', action: 'report', sessionId: classId, language: ctx.locale });
}
export function restoreCommunityPost(ctx: RequestContext, classId: string, postId: string): void {
 if (assertClassAccess(ctx, classId) !== 'teacher') throw new Error('Only the assigned teacher can restore a reported post.');
 const store = read(); const post = store.posts.find(p => p.id === postId && p.classId === classId);
 if (!post || post.status !== 'flagged') throw new Error('This post is not waiting for review.');
 post.status = 'visible'; delete post.flaggedBy; delete post.flagReason; write(store, ctx);
 emitInteractionEvent(ctx, { app: 'COMMUNITY', action: 'save', sessionId: classId, language: ctx.locale });
}
export function removeCommunityPost(ctx: RequestContext, classId: string, postId: string): void {
 if (assertClassAccess(ctx, classId) !== 'teacher') throw new Error('Only the assigned teacher can remove a community post.');
 const store = read(); const post = store.posts.find(p => p.id === postId && p.classId === classId);
 if (!post || post.status !== 'visible') throw new Error('This post is not available for moderation.');
 post.status = 'removed'; post.removedById = ctx.personId; write(store, ctx);
 emitInteractionEvent(ctx, { app: 'COMMUNITY', action: 'remove', sessionId: classId, language: ctx.locale });
}