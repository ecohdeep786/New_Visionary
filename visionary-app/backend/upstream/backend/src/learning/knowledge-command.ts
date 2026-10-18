import { BadRequestException } from '@nestjs/common';
import type { LearningScope } from './teaching-policy';

export const receiptId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const opaque = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 256 && !/[\u0000-\u001f\u007f]/.test(value);
const workspaces = ['personal', 'classroom', 'organization'];
export interface KnowledgeEvidenceCommand {
  version: 1; commandId: string; workspaceId: string; conceptId: string; sourceVersion: string; criteriaVersion: string; correct: boolean; assessedAt: number;
}
export function knowledgeEvidence(body: unknown): KnowledgeEvidenceCommand {
  const invalid = (): never => { throw new BadRequestException('Use a supported source version, criteria version, concept and immutable server-assessed evidence.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'workspaceId', 'conceptId', 'sourceVersion', 'criteriaVersion', 'correct', 'assessedAt'].includes(key))) return invalid();
  if (value.version !== 1 || typeof value.commandId !== 'string' || !receiptId.test(value.commandId)) return invalid();
  const workspaceId = value.workspaceId, conceptId = value.conceptId, sourceVersion = value.sourceVersion, criteriaVersion = value.criteriaVersion;
  if (typeof workspaceId !== 'string' || !workspaces.includes(workspaceId)) return invalid();
  if (!opaque(conceptId) || !opaque(sourceVersion) || !opaque(criteriaVersion)) return invalid();
  const correct = value.correct, assessedAt = value.assessedAt;
  if (typeof correct !== 'boolean' || typeof assessedAt !== 'number' || !Number.isSafeInteger(assessedAt) || assessedAt < 0) return invalid();
  return { version: 1, commandId: value.commandId, workspaceId, conceptId, sourceVersion, criteriaVersion, correct, assessedAt };
}
export function knowledgeScope(uid: string, evidence: KnowledgeEvidenceCommand): LearningScope {
  return { uid, workspaceId: evidence.workspaceId, conceptId: evidence.conceptId, sourceVersion: evidence.sourceVersion, criteriaVersion: evidence.criteriaVersion };
}
