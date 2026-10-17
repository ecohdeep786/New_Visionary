import { BadRequestException } from '@nestjs/common';

export const feedbackId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const surfaces = ['general', 'learn', 'ask', 'guide', 'build', 'classroom', 'billing', 'account'];
export function feedbackCommand(body: unknown) {
  const invalid = () => { throw new BadRequestException('Choose a feedback rating and use a note of at most 1000 characters.'); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalid();
  const value = body as Record<string, unknown>;
  if (Object.keys(value).some(key => !['version', 'commandId', 'surface', 'rating', 'comment', 'locale'].includes(key)) ||
    value.version !== 1 || typeof value.commandId !== 'string' || !feedbackId.test(value.commandId) ||
    typeof value.surface !== 'string' || !surfaces.includes(value.surface) ||
    !['good', 'needs_improvement'].includes(value.rating as string) || !['en', 'hi', 'bn'].includes(value.locale as string) ||
    value.comment !== undefined && (typeof value.comment !== 'string' || value.comment.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value.comment))) return invalid();
  return { version: 1, commandId: value.commandId, surface: value.surface, rating: value.rating as string,
    comment: (value.comment as string || '').trim(), locale: value.locale as string };
}
