import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const policy = JSON.parse(fs.readFileSync(path.join(root, 'integration/contracts/request-limits.v1.json'), 'utf8'));
const fail = (code, status) => ({ ok: false, code, status });

// Offline contract evaluator only. No controller imports this module.
export function checkJson(profileId, wire, direction = 'request') {
  const profile = policy.profiles[profileId];
  if (!profile || !['request', 'response'].includes(direction)) return fail('UNKNOWN_CONTRACT', 400);
  const invalid = () => direction === 'response' ? fail('INVALID_RESPONSE', 503) : fail('INVALID_JSON', 400);
  if (!(typeof wire === 'string' || Buffer.isBuffer(wire))) return invalid();
  if (Buffer.byteLength(wire) > profile[`${direction}Bytes`]) return direction === 'response'
    ? fail('RESPONSE_LIMIT', 503) : fail('PAYLOAD_TOO_LARGE', 413);
  let value;
  try { value = JSON.parse(Buffer.isBuffer(wire) ? new TextDecoder('utf-8', { fatal: true }).decode(wire) : wire); } catch { return invalid(); }
  function walk(item, depth) {
    if (depth > profile.depth) return false;
    if (!item || typeof item !== 'object') return true;
    const values = Array.isArray(item) ? item : Object.values(item);
    const maximum = Array.isArray(item) ? profile.arrayItems : profile.objectKeys;
    return values.length <= maximum && values.every(child => walk(child, depth + 1));
  }
  if (!walk(value, 0)) return direction === 'response' ? fail('RESPONSE_LIMIT', 503) : fail('STRUCTURE_LIMIT', 400);
  return { ok: true };
}

export function checkText(profileId, field, value) {
  const cap = policy.profiles[profileId]?.text?.[field];
  if (!cap || typeof value !== 'string' || cap.unit === 'codepoints' && !value.isWellFormed()) return fail('INVALID_TEXT', 400);
  const count = cap.unit === 'utf16' ? value.length : [...value].length;
  return count <= cap.max ? { ok: true } : fail('TEXT_TOO_LONG', 400);
}

export function checkPage(size) {
  return Number.isInteger(size) && size >= 1 && size <= policy.pagination.maxItems
    ? { ok: true } : fail('INVALID_PAGE', 400);
}

export function checkStream(events, { cancelled = false, disconnected = false, elapsedMs = 0, idleMs = 0 } = {}) {
  if (cancelled || disconnected) return fail('INCOMPLETE_STREAM', 409);
  const limits = policy.stream;
  if (!Number.isFinite(elapsedMs) || !Number.isFinite(idleMs) || elapsedMs < 0 || idleMs < 0 ||
    elapsedMs >= limits.deadlineMs || idleMs >= limits.idleMs) return fail('DEADLINE', 504);
  if (!Array.isArray(events) || !events.length || events.length > limits.maxEvents) return fail('STREAM_LIMIT', 400);
  let total = 0;
  for (const [index, event] of events.entries()) {
    if (!event || !['delta', 'complete'].includes(event.type) ||
      event.type === 'complete' && index !== events.length - 1 ||
      event.type === 'delta' && index === events.length - 1) return fail('INCOMPLETE_STREAM', 409);
    const bytes = Buffer.byteLength(JSON.stringify(event));
    // Include conservative framing allowance (event/id/data lines and delimiters).
    const frameBytes = bytes + limits.framingBytes;
    total += frameBytes;
    if (frameBytes > limits.eventBytes || total > limits.totalBytes) return fail('STREAM_LIMIT', 413);
  }
  return { ok: true, committed: false };
}

export function checkRetry({ kind, outcome, sameCommand = false, samePayload = false, reauthorized = false }) {
  if (!reauthorized) return fail('REAUTHORIZE', 403);
  if (kind === 'read') return { ok: outcome === 'transient' };
  if (kind !== 'write') return fail('UNKNOWN_CONTRACT', 400);
  if (!sameCommand || !samePayload) return fail('COMMAND_CONFLICT', 409);
  // Unknown write outcomes require a receipt/status read before a replay.
  return outcome === 'confirmed-not-committed' ? { ok: true } : fail('READ_RECEIPT_FIRST', 409);
}
