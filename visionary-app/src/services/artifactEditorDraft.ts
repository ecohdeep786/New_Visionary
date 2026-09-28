import type { Artifact, RequestContext } from '../domain/workspace.ts';
import { snapshot } from './workspaceService.ts';

interface EditorDraft { artifactId: string; title: string; body: string; milestones: boolean[]; status: Artifact['status']; responses: Record<string, string>; savedAt: string }
interface EditorStore { version: 1; spaces: Record<string, Record<string, EditorDraft>> }
const KEY = 'visionary_artifact_editor_v1';

function read(): EditorStore {
 const raw = localStorage.getItem(KEY);
 if (!raw) return { version: 1, spaces: {} };
 try { const value = JSON.parse(raw); if (value.version !== 1 || !value.spaces || typeof value.spaces !== 'object') throw Error(); return value; }
 catch { throw Error('Recovered project drafts could not be read. Saved projects were not changed.'); }
}
function owned(ctx: RequestContext, artifactId: string) {
 const artifact = snapshot(ctx).artifacts.find(item => item.id === artifactId);
 if (!artifact) throw Error('This project is unavailable in this workspace.');
 return artifact;
}
function write(db: EditorStore) {
 try { localStorage.setItem(KEY, JSON.stringify(db)); }
 catch { throw Error('Unsaved project edits could not be backed up on this device. Keep this page open and choose Save.'); }
}
export function saveArtifactEditorDraft(ctx: RequestContext, artifact: Artifact) {
 owned(ctx, artifact.id);
 const db = read(); const drafts = db.spaces[ctx.workspaceId] ??= {};
 drafts[artifact.id] = { artifactId: artifact.id, title: artifact.title, body: artifact.body, milestones: [...artifact.milestones], status: artifact.status, responses: { ...(artifact.rubric?.responses ?? {}) }, savedAt: new Date().toISOString() };
 write(db);
}
export function getArtifactEditorDraft(ctx: RequestContext, artifactId: string): EditorDraft | null {
 owned(ctx, artifactId);
 const draft = read().spaces[ctx.workspaceId]?.[artifactId];
 if (!draft) return null;
 if (draft.artifactId !== artifactId || typeof draft.title !== 'string' || typeof draft.body !== 'string' || !Array.isArray(draft.milestones) || draft.milestones.some(item => typeof item !== 'boolean') || !['draft', 'in-progress', 'completed'].includes(draft.status) || !draft.responses || typeof draft.responses !== 'object') throw Error('Recovered project draft is incomplete. The saved project remains available.');
 return structuredClone(draft);
}
export function clearArtifactEditorDraft(ctx: RequestContext, artifactId: string) {
 owned(ctx, artifactId);
 const db = read(); const drafts = db.spaces[ctx.workspaceId];
 if (!drafts?.[artifactId]) return;
 delete drafts[artifactId]; write(db);
}
export function recoverArtifactEditorDraft(artifact: Artifact, draft: EditorDraft): Artifact {
 if (artifact.id !== draft.artifactId) throw Error('This draft belongs to another project.');
 return { ...artifact, title: draft.title, body: draft.body, milestones: draft.milestones, status: draft.status, rubric: artifact.rubric ? { ...artifact.rubric, responses: draft.responses } : undefined };
}
export function hasUnsavedArtifactEdits(artifact: Artifact, draft: EditorDraft) {
 return artifact.title !== draft.title || artifact.body !== draft.body || artifact.status !== draft.status || JSON.stringify(artifact.milestones) !== JSON.stringify(draft.milestones) || JSON.stringify(artifact.rubric?.responses ?? {}) !== JSON.stringify(draft.responses);
}
