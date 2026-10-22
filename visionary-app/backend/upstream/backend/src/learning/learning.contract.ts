import { BadRequestException } from '@nestjs/common';
import { Pedagogy, pedagogies } from './teaching-policy';

// Bounded commands for the durable teaching loop. The server owns assessment:
// no command may name a correct answer, mastery, teacher contact or escalation.
export const learningId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const control = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const reference = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 256 && !control.test(value);
const content = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !control.test(value);
const bounded = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;

export function startLearningSessionCommand(body: unknown) {
  const invalid = () => { throw new BadRequestException('Start a learning session with a bounded concept, source and criteria reference.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'workspaceId', 'conceptId', 'sourceVersion', 'criteriaVersion', 'provider', 'sourceId', 'maxFailedChecks'].includes(key)) ||
    value.version !== 1 || typeof value.commandId !== 'string' || !learningId.test(value.commandId) ||
    !reference(value.workspaceId) || !reference(value.conceptId) || !reference(value.sourceVersion) ||
    !reference(value.criteriaVersion) || !reference(value.provider) || !reference(value.sourceId) ||
    value.maxFailedChecks !== undefined && !bounded(value.maxFailedChecks, 1, 3)) return invalid();
  return { version: 1, commandId: value.commandId, workspaceId: value.workspaceId, conceptId: value.conceptId,
    sourceVersion: value.sourceVersion, criteriaVersion: value.criteriaVersion, provider: value.provider, sourceId: value.sourceId,
    maxFailedChecks: value.maxFailedChecks === undefined ? 3 : value.maxFailedChecks as number };
}

export function presentTeachingCheckCommand(body: unknown) {
  const invalid = () => { throw new BadRequestException('Present a validated authored check for this workspace and source revision.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'expectedRevision', 'workspaceId', 'sourceVersion', 'criteriaVersion', 'strategy', 'validation', 'checkId', 'prompt', 'options', 'answerIndex'].includes(key)) ||
    value.version !== 1 || typeof value.commandId !== 'string' || !learningId.test(value.commandId) ||
    !bounded(value.expectedRevision, 0, Number.MAX_SAFE_INTEGER) ||
    !reference(value.workspaceId) || !reference(value.sourceVersion) || !reference(value.criteriaVersion) ||
    typeof value.strategy !== 'string' || !pedagogies.includes(value.strategy as Pedagogy) || value.validation !== 'passed' ||
    !reference(value.checkId) || !content(value.prompt, 512) ||
    !Array.isArray(value.options) || value.options.length < 2 || value.options.length > 8 || !value.options.every(option => content(option, 256)) ||
    !bounded(value.answerIndex, 0, value.options.length - 1) || new Set(value.options.map(option => (option as string).trim())).size !== value.options.length)
    return invalid();
  return { version: 1, commandId: value.commandId, expectedRevision: value.expectedRevision,
    workspaceId: value.workspaceId, sourceVersion: value.sourceVersion, criteriaVersion: value.criteriaVersion,
    strategy: value.strategy as Pedagogy, validation: 'passed' as const, checkId: value.checkId, prompt: value.prompt.trim(),
    options: (value.options as string[]).map(option => option.trim()), answerIndex: value.answerIndex };
}

export function assessTeachingCheckCommand(body: unknown) {
  const invalid = () => { throw new BadRequestException('Assess a current check with one available answer from this workspace and source revision.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'expectedRevision', 'workspaceId', 'sourceVersion', 'criteriaVersion', 'checkId', 'selection'].includes(key)) ||
    value.version !== 1 || typeof value.commandId !== 'string' || !learningId.test(value.commandId) ||
    !bounded(value.expectedRevision, 0, Number.MAX_SAFE_INTEGER) ||
    !reference(value.workspaceId) || !reference(value.sourceVersion) || !reference(value.criteriaVersion) ||
    !reference(value.checkId) || !bounded(value.selection, 0, 7))
    return invalid();
  return { version: 1, commandId: value.commandId, expectedRevision: value.expectedRevision,
    workspaceId: value.workspaceId, sourceVersion: value.sourceVersion, criteriaVersion: value.criteriaVersion,
    checkId: value.checkId, selection: value.selection };
}

export function cancelLearningSessionCommand(body: unknown) {
  const invalid = () => { throw new BadRequestException('Cancel a learning session with its current revision, workspace and source revision.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'expectedRevision', 'workspaceId', 'sourceVersion', 'criteriaVersion'].includes(key)) ||
    value.version !== 1 || typeof value.commandId !== 'string' || !learningId.test(value.commandId) ||
    !bounded(value.expectedRevision, 0, Number.MAX_SAFE_INTEGER) ||
    !reference(value.workspaceId) || !reference(value.sourceVersion) || !reference(value.criteriaVersion))
    return invalid();
  return { version: 1, commandId: value.commandId, expectedRevision: value.expectedRevision,
    workspaceId: value.workspaceId, sourceVersion: value.sourceVersion, criteriaVersion: value.criteriaVersion };
}
