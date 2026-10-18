import type { RequestContext, Locale } from '../domain/workspace.ts';
import { snapshot } from './workspaceService.ts';
import { getLearningWorkspace } from './learningPipelineService.ts';

export interface WorkspaceSearchItem {
  id: string; kind: 'activity' | 'project' | 'conversation'; label: string;
  detail?: string; locale?: Locale; to: string; updatedAt?: string;
}

/** Only title metadata from the currently authorized workspace; never index documents or messages. */
export function getSavedWorkspaceSearch(ctx: RequestContext) {
  const data = snapshot(ctx); // Fail closed before exposing any partial result.
  const items: WorkspaceSearchItem[] = [];
  const unavailable: string[] = [];
  for (const artifact of data.artifacts) items.push({id: artifact.id, kind: 'project', label: artifact.title, to: '/dashboard/build?artifact=' + encodeURIComponent(artifact.id), updatedAt: artifact.updatedAt});
  for (const conversation of data.conversations) items.push({id: conversation.id, kind: 'conversation', label: conversation.title, to: '/dashboard/ask?conversation=' + encodeURIComponent(conversation.id), updatedAt: conversation.updatedAt});
  if (['student', 'teacher', 'professional'].includes(ctx.role)) {
    try {
      for (const unit of getLearningWorkspace(ctx).units) items.push({id: unit.id, kind: 'activity', label: unit.title, locale: unit.locale, detail: unit.sourceContext?.selection.subject, to: '/dashboard/learn?unit=' + encodeURIComponent(unit.id), updatedAt: unit.updatedAt});
    } catch { unavailable.push('activities'); }
  }
  return {items: items.filter(item => typeof item.id === 'string' && item.id && typeof item.label === 'string' && item.label.trim()).sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')), unavailable};
}
