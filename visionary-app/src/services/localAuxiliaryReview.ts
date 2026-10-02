import type { Database, RequestContext } from '../domain/workspace.ts';

export interface AuxiliaryOwnershipReview {
 label: string; personalRecords: number; connectedRecords: number; unresolvedRecords: number;
 unreadable: boolean; requiresReview: boolean;
}
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));

/** Ownership inventory only. Counts are not schema approval, transfer consent or source validation. */
export function inspectAuxiliaryOwnership(ctx: RequestContext, db: Database): AuxiliaryOwnershipReview[] {
 const reviews = new Map<string, AuxiliaryOwnershipReview>();
 const people = new Set(db.people.map(person => person.id));
 const workspaceRows = (id: string) => db.workspaces.filter(workspace => workspace.id === id);
 function row(label: string) {
  if (!reviews.has(label)) reviews.set(label, { label, personalRecords: 0, connectedRecords: 0, unresolvedRecords: 0, unreadable: false, requiresReview: false });
  return reviews.get(label)!;
 }
 function workspaceCount(label: string, id: string, count: number) {
  const matches = workspaceRows(id);
  if (matches.length !== 1) { row(label).unresolvedRecords += Math.max(count, 1); return; }
  const workspace = matches[0]!;
  if (workspace.personId !== ctx.personId) return;
  row(label)[workspace.organizationId ? 'connectedRecords' : 'personalRecords'] += count;
 }
 function personCount(label: string, id: unknown, connected = false) {
  if (typeof id !== 'string' || !people.has(id)) row(label).unresolvedRecords++;
  else if (id === ctx.personId) row(label)[connected ? 'connectedRecords' : 'personalRecords']++;
 }
 function read(key: string, label: string, inspect: (value: unknown) => void) {
  const raw = localStorage.getItem(key);
  if (raw === null) return;
  try { inspect(JSON.parse(raw)); }
  catch { row(label).unreadable = true; }
 }
 function scoped(value: unknown, label: string) {
  if (!object(value)) throw Error();
  for (const [id, entries] of Object.entries(value)) {
   // Valid known foreign scopes are excluded before inspecting their private payload.
   const matches = workspaceRows(id);
   if (matches.length === 1 && matches[0]!.personId !== ctx.personId) continue;
   if (!object(entries)) { row(label).unresolvedRecords++; row(label).unreadable = true; continue; }
   workspaceCount(label, id, Object.keys(entries).length);
  }
 }
 for (const [key, label] of [['visionary_artifact_editor_v1', 'Unsaved project edits'], ['visionary_resource_editor_v1', 'Unsaved resource edits']]) {
  read(key!, label!, value => { if (!object(value) || value.version !== 1) throw Error(); scoped(value.spaces, label!); });
 }
 read(`visionary_classwork_drafts_v1:${ctx.personId}`, 'Classwork response drafts', value => {
  // Legacy response backups identify the person but do not record the workspace.
  // A classroom ID must be reconciled before classifying personal versus Work scope.
  if (!object(value)) throw Error(); row('Classwork response drafts').unresolvedRecords += Object.keys(value).length;
 });
 read(`visionary_classwork_study_v1:${ctx.personId}`, 'Private classroom Ask and rehearsal', value => scoped(value, 'Private classroom Ask and rehearsal'));
 read('visionary_stage_transitions_v1', 'Stage transition history', value => {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.transitions)) throw Error();
  for (const transition of value.transitions) personCount('Stage transition history', object(transition) ? transition.personId : undefined);
 });
 for (const workspace of db.workspaces.filter(item => item.personId === ctx.personId)) {
  read(`visionary_stage_editor_v1:${workspace.id}`, 'Stage profile editor drafts', value => {
   if (!object(value) || value.version !== 1 || value.personId !== ctx.personId || !object(value.fields) || typeof value.base !== 'string') throw Error();
   workspaceCount('Stage profile editor drafts', workspace.id, 1);
  });
 }
 read('visionary_daily_deferrals_v1', 'Daily plan deferrals', value => {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.deferred)) throw Error();
  for (const deferred of value.deferred) workspaceCount('Daily plan deferrals', object(deferred) && typeof deferred.workspaceId === 'string' ? deferred.workspaceId : '', 1);
 });
 read('visionary_community_v1', 'Community records', value => {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.posts)) throw Error();
  for (const post of value.posts) personCount('Community records', object(post) ? post.authorId : undefined, true);
 });
 read('visionary_organization_billing_v1', 'Organization seat requests', value => {
  if (!Array.isArray(value)) throw Error();
  for (const request of value) personCount('Organization seat requests', object(request) ? request.requestedBy : undefined, true);
 });
 // Review keys contain workspace IDs followed by assignment IDs. Multiple matching
 // workspace prefixes are ambiguous and must never be resolved by guessing.
 if (typeof localStorage.key === 'function') {
  for (let index = 0; index < localStorage.length; index++) {
   const key = localStorage.key(index);
   if (key?.startsWith('visionary_stage_editor_v1:')) {
    const id = key.slice('visionary_stage_editor_v1:'.length);
    if (!workspaceRows(id).length) row('Stage profile editor drafts').unresolvedRecords++;
   }
   if (!key?.startsWith('visionary_review_drafts_v1:')) continue;
   const suffix = key.slice('visionary_review_drafts_v1:'.length);
   const matches = db.workspaces.filter(workspace => suffix.startsWith(`${workspace.id}:`));
   if (matches.length === 1 && matches[0]!.personId !== ctx.personId) continue;
   if (matches.length !== 1 || matches[0]!.role !== 'teacher') { row('Classroom review drafts').unresolvedRecords++; continue; }
   read(key, 'Classroom review drafts', value => {
    if (!object(value)) throw Error(); workspaceCount('Classroom review drafts', matches[0]!.id, Object.keys(value).length);
   });
  }
 }
 return [...reviews.values()].map(review => ({ ...review, requiresReview: review.unreadable || review.personalRecords + review.connectedRecords + review.unresolvedRecords > 0 }));
}
