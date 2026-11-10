import { BadRequestException } from '@nestjs/common';

// Bounded projection commands. A command never carries evidence: it references
// one immutable server-assessed receipt from the durable learning store, and the
// projection service reads the verdict, digest and timestamp from the server
// record itself. A browser flag, digest or timestamp is not a command field.
export const knowledgeId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const control = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
export const boundedReference = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 256 && !control.test(value);
export interface KnowledgeProjectionCommand {
  version: 1; commandId: string; sessionId: string; receiptId: string;
}
export function knowledgeProjectionCommand(body: unknown): KnowledgeProjectionCommand {
  const invalid = (): never => { throw new BadRequestException('Project one server-assessed learning receipt using bounded references only.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'sessionId', 'receiptId'].includes(key))) return invalid();
  if (value.version !== 1 || typeof value.commandId !== 'string' || !knowledgeId.test(value.commandId) ||
    typeof value.sessionId !== 'string' || !knowledgeId.test(value.sessionId) ||
    typeof value.receiptId !== 'string' || !knowledgeId.test(value.receiptId)) return invalid();
  return { version: 1, commandId: value.commandId, sessionId: value.sessionId, receiptId: value.receiptId };
}
