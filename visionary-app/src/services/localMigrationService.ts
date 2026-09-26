import type { Database, RequestContext, Role, WorkspaceData } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';

interface ContentSpace { graphs: { syllabus: { status: string }; concepts: { status: string }[] }[]; aliases: Record<string, string>; gaps: unknown[] }
interface LearningSpace { units: unknown[] }
interface MentorSpace { owner: string; role: Role; evidence: unknown[]; events: unknown[]; memory: unknown[] }
interface ScopedStore<T> { version: number; spaces: Record<string, T> }
export interface LocalMigrationCounts {
 conversations: number; sessions: number; artifacts: number; resources: number;
 contentGraphs: number; provisionalConcepts: number; conceptAliases: number; dataGaps: number;
 learningUnits: number; evidence: number; events: number; memoryEntries: number;
}
export interface LocalWorkspaceMigrationPreview {
 sourceWorkspaceId: string; role: Role; counts: LocalMigrationCounts;
}
export interface LocalMigrationPreview {
 sourcePersonId: string; workspaces: LocalWorkspaceMigrationPreview[];
 connectedWorkspacesNeedingReview: number; unassignedStoreSpaces: number;
 relationshipsNeedingReconsent: number; blockers: string[];
 readyForOwnerMapping: boolean; transferPerformed: false;
}
export interface ProposedTargetWorkspace { sourceWorkspaceId: string; targetWorkspaceId: string; role: Role }
export interface LocalMigrationMappingPlan {
 sourcePersonId: string; proposedTargetPersonId: string;
 workspaces: { sourceWorkspaceId: string; proposedTargetWorkspaceId: string; role: Role; counts: LocalMigrationCounts }[];
 requiresServerVerification: true; requiresUserConfirmation: true; transferPerformed: false;
}

function object(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function readWorkspaceDb(): Database {
 const raw = localStorage.getItem('visionary_workspace_v2');
 if (!raw) throw new Error('No local workspace is available for migration review.');
 try {
  const db: unknown = JSON.parse(raw);
  if (!object(db) || db.version !== 2 || !Array.isArray(db.people) || !Array.isArray(db.workspaces) || !object(db.data) || !Array.isArray(db.relationships)) throw Error();
  return db as unknown as Database;
 } catch { throw new Error('Local workspace records could not be read. No data was changed.'); }
}
function readScopedStore<T>(key: string, version: number): ScopedStore<T> {
 const raw = localStorage.getItem(key);
 if (!raw) return { version, spaces: {} };
 try {
  const value: unknown = JSON.parse(raw);
  if (!object(value) || value.version !== version || !object(value.spaces)) throw Error();
  return value as unknown as ScopedStore<T>;
 } catch { throw new Error(`Local ${key} records need review before migration. No data was changed.`); }
}
function array(value: unknown, label: string): unknown[] {
 if (!Array.isArray(value)) throw new Error(`${label} records need review before migration. No data was changed.`);
 return value;
}
function counts(data: WorkspaceData, content?: ContentSpace, learning?: LearningSpace, mentor?: MentorSpace): LocalMigrationCounts {
 const graphs = content ? array(content.graphs, 'Curriculum') as ContentSpace['graphs'] : [];
 if (content && (!object(content.aliases) || !Array.isArray(content.gaps))) throw new Error('Curriculum records need review before migration. No data was changed.');
 if (learning) array(learning.units, 'Learning activity');
 if (mentor) { array(mentor.evidence, 'Evidence'); array(mentor.events, 'Interaction event'); array(mentor.memory, 'Memory'); }
 return {
  conversations: array(data.conversations, 'Conversation').length, sessions: array(data.sessions, 'Session').length,
  artifacts: array(data.artifacts, 'Project').length, resources: array(data.resources, 'Resource').length,
  contentGraphs: graphs.length,
  provisionalConcepts: graphs.reduce((sum, graph) => {
   if (!object(graph) || !Array.isArray(graph.concepts)) throw new Error('Curriculum records need review before migration. No data was changed.');
   return sum + graph.concepts.filter(concept => concept.status === 'provisional').length;
  }, 0),
  conceptAliases: content ? Object.keys(content.aliases).length : 0, dataGaps: content?.gaps.length ?? 0,
  learningUnits: learning?.units.length ?? 0, evidence: mentor?.evidence.length ?? 0,
  events: mentor?.events.length ?? 0, memoryEntries: mentor?.memory.length ?? 0,
 };
}

/** Read-only preview. It never exports, uploads, deletes, or assigns an unowned record. */
export function inspectLocalMigration(ctx: RequestContext): LocalMigrationPreview {
 if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
 workspaceIdentity(ctx);
 const db = readWorkspaceDb();
 const content = readScopedStore<ContentSpace>('visionary_content_v1', 1);
 const learning = readScopedStore<LearningSpace>('visionary_learning_pipeline_v1', 1);
 const mentor = readScopedStore<MentorSpace>('visionary_mentor_v1', 1);
 const workspaceIds = new Set<string>();
 const duplicateWorkspaceIds = new Set<string>();
 for (const workspace of db.workspaces) {
  if (workspaceIds.has(workspace.id)) duplicateWorkspaceIds.add(workspace.id);
  workspaceIds.add(workspace.id);
 }
 const knownWorkspaceIds = new Set(db.workspaces.map(workspace => workspace.id));
 const unassignedStoreSpaces = new Set([
  ...Object.keys(content.spaces), ...Object.keys(learning.spaces), ...Object.keys(mentor.spaces),
 ].filter(id => !knownWorkspaceIds.has(id))).size;
 const workspaces: LocalWorkspaceMigrationPreview[] = [];
 let connectedWorkspacesNeedingReview = 0;
 const blockers: string[] = [];
 for (const workspace of db.workspaces.filter(item => item.personId === ctx.personId)) {
  if (duplicateWorkspaceIds.has(workspace.id)) { blockers.push('A workspace identifier has conflicting owners and must be reviewed.'); continue; }
  // Organization membership is separate from personal ownership; it must be reviewed by the server.
  if (workspace.organizationId) { connectedWorkspacesNeedingReview++; continue; }
  const data = db.data[workspace.id];
  if (!data) { blockers.push('An owned workspace has no saved data.'); continue; }
  const state = mentor.spaces[workspace.id];
  if (state && (state.owner !== ctx.personId || state.role !== workspace.role)) {
   blockers.push('Learning evidence ownership does not match an owned workspace.');
   continue;
  }
  workspaces.push({ sourceWorkspaceId: workspace.id, role: workspace.role, counts: counts(data, content.spaces[workspace.id], learning.spaces[workspace.id], state) });
 }
 if (unassignedStoreSpaces) blockers.push('Some local activity has no known workspace owner and must not be assigned automatically.');
 if (connectedWorkspacesNeedingReview) blockers.push('Connected organization workspaces require renewed membership review.');
 if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
 return {
  sourcePersonId: ctx.personId, workspaces, connectedWorkspacesNeedingReview, unassignedStoreSpaces,
  relationshipsNeedingReconsent: db.relationships.filter(row => row.from === ctx.personId || row.to === ctx.personId).length,
  blockers, readyForOwnerMapping: blockers.length === 0, transferPerformed: false,
 };
}

/** Validates a proposed mapping only. Neither local identity nor a caller-provided target proves server ownership. */
export function planLocalMigrationMapping(ctx: RequestContext, proposedTargetPersonId: string, proposed: ProposedTargetWorkspace[]): LocalMigrationMappingPlan {
 const preview = inspectLocalMigration(ctx);
 if (!preview.readyForOwnerMapping) throw new Error('Review the unresolved local records before mapping workspaces. No data was changed.');
 if (typeof proposedTargetPersonId !== 'string' || !proposedTargetPersonId.trim() || !Array.isArray(proposed) || proposed.length !== preview.workspaces.length) {
  throw new Error('Map every owned personal workspace to one target workspace. No data was changed.');
 }
 const source = new Map(preview.workspaces.map(item => [item.sourceWorkspaceId, item]));
 const seenSource = new Set<string>();
 const seenTarget = new Set<string>();
 const workspaces = proposed.map(item => {
  const own = item && source.get(item.sourceWorkspaceId);
  if (!own || own.role !== item.role || typeof item.targetWorkspaceId !== 'string' || !item.targetWorkspaceId.trim() || seenSource.has(item.sourceWorkspaceId) || seenTarget.has(item.targetWorkspaceId)) {
   throw new Error('Workspace mapping has a missing, duplicate, or cross-role target. No data was changed.');
  }
  seenSource.add(item.sourceWorkspaceId);
  seenTarget.add(item.targetWorkspaceId);
  return { sourceWorkspaceId: own.sourceWorkspaceId, proposedTargetWorkspaceId: item.targetWorkspaceId, role: own.role, counts: own.counts };
 });
 if (seenSource.size !== source.size) throw new Error('Every owned workspace needs an explicit target. No data was changed.');
 return { sourcePersonId: ctx.personId, proposedTargetPersonId: proposedTargetPersonId.trim(), workspaces,
  requiresServerVerification: true, requiresUserConfirmation: true, transferPerformed: false };
}
