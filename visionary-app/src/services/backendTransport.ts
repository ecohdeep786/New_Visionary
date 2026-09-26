import type { RequestContext, Role } from '../domain/workspace.ts';
import type { ContentConcept, ContentGraph, ContentRepositoryAdapter, ContentSelection } from './contentRepository.ts';
import { configureContentRepository } from './contentRepository.ts';
import type { TeachingAdapter, TeachingMode, TeachingResponse, PromptPacket } from './teachingInterface.ts';
import { configureTeachingInterface } from './teachingInterface.ts';
import type { MentorContextPacket, MentorModelAdapter, MentorModelReply } from './mentorModelService.ts';
import { configureMentorModelAdapter } from './mentorModelService.ts';
import { workspaceIdentity } from './workspaceService.ts';

export type BackendOperation = 'content.syllabus' | 'content.concept' | 'teaching.request' | 'mentor.turn';
export interface BackendSession {
 personId: string;
 workspaceId: string;
 role: Role;
 expiresAt?: number;
}
export interface BackendRequest {
 operation: BackendOperation;
 body: unknown;
 requestId: string;
 signal?: AbortSignal;
}

/** The future authenticated client owns its credential and sends it outside the JSON body.
 * getSession must reflect the authenticated account, not values read from local preview storage.
 * The server must independently authorize every operation and object.
 */
export interface BackendTransport {
 getSession(): Promise<BackendSession | null>;
 exchange(request: BackendRequest): Promise<unknown>;
 /** Whole-operation deadline, including both session checks. Defaults to 20 seconds. */
 timeoutMs?: number;
}

let activeTransport: BackendTransport | null = null;
let generation = 0;

function cancelled() { return new DOMException('Cancelled', 'AbortError'); }
function checkContext(ctx: RequestContext, selected: BackendTransport, version: number) {
 if (ctx.signal?.aborted) throw cancelled();
 if (selected !== activeTransport || version !== generation) throw new Error('The backend connection changed. Your saved work is unchanged; retry.');
 workspaceIdentity(ctx);
}
function requireSession(session: BackendSession | null, ctx: RequestContext) {
 if (!session || session.personId !== ctx.personId || session.workspaceId !== ctx.workspaceId || session.role !== ctx.role || (session.expiresAt !== undefined && (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()))) {
  throw new Error('Your authenticated account or workspace changed. Sign in again before retrying.');
 }
}

async function exchange<T>(selected: BackendTransport, version: number, ctx: RequestContext, operation: BackendOperation, body: unknown): Promise<T> {
 checkContext(ctx, selected, version);
 const controller = new AbortController();
 let timer: ReturnType<typeof setTimeout> | undefined;
 let rejectBoundary: (reason?: unknown) => void = () => {};
 const boundary = new Promise<never>((_, reject) => { rejectBoundary = reject; });
 const onAbort = () => { controller.abort(); rejectBoundary(cancelled()); };
 ctx.signal?.addEventListener('abort', onAbort, { once: true });
 if (ctx.signal?.aborted) onAbort();
 timer = setTimeout(() => { controller.abort(); rejectBoundary(new Error('The backend did not respond in time. Your saved work is unchanged; retry.')); }, selected.timeoutMs ?? 20000);
 const checkActive = () => { if (controller.signal.aborted) throw ctx.signal?.aborted ? cancelled() : new Error('The backend did not respond in time. Your saved work is unchanged; retry.'); checkContext(ctx, selected, version); };
 try {
  return await Promise.race([(async () => {
   checkActive();
   const firstSession = await selected.getSession(); checkActive(); requireSession(firstSession, ctx);
   const request: BackendRequest = { operation, body: structuredClone(body), requestId: crypto.randomUUID(), signal: controller.signal };
   const response = await selected.exchange(request); checkActive();
   const finalSession = await selected.getSession(); checkActive(); requireSession(finalSession, ctx);
   return response as T;
  })(), boundary]);
 } finally {
  if (timer) clearTimeout(timer);
  ctx.signal?.removeEventListener('abort', onAbort);
 }
}

/** Installs only a contract, never a URL, token, backend response, or local model. */
export function configureBackendTransport(next: BackendTransport | null) {
 if (next && (typeof next.getSession !== 'function' || typeof next.exchange !== 'function' || (next.timeoutMs !== undefined && (!Number.isInteger(next.timeoutMs) || next.timeoutMs < 1 || next.timeoutMs > 120000)))) throw new Error('A backend transport needs session and exchange functions and a valid deadline.');
 activeTransport = next;
 const version = ++generation;
 if (!next) {
  configureContentRepository(null);
  configureTeachingInterface(null);
  configureMentorModelAdapter(null);
  return;
 }
 const content: ContentRepositoryAdapter = {
  getSyllabus: (selection: ContentSelection, ctx: RequestContext) => exchange<ContentGraph | null>(next, version, ctx, 'content.syllabus', { selection }),
  getConcept: (conceptId: string, ctx: RequestContext) => exchange<ContentConcept | null>(next, version, ctx, 'content.concept', { conceptId }),
 };
 const teaching: TeachingAdapter = {
  request: (mode: TeachingMode, packet: PromptPacket, ctx: RequestContext) => exchange<TeachingResponse>(next, version, ctx, 'teaching.request', { mode, packet }),
 };
 const mentor: MentorModelAdapter = {
  request: (input: string, context: MentorContextPacket, ctx: RequestContext) => exchange<MentorModelReply>(next, version, ctx, 'mentor.turn', { input, context }),
 };
 configureContentRepository(content);
 configureTeachingInterface(teaching);
 configureMentorModelAdapter(mentor);
}

export function isBackendTransportConfigured() { return activeTransport !== null; }
