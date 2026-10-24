import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createHash } from 'node:crypto';
import { schema, manifest, limits } from './definitions.mjs';

const ajv = new Ajv2020({ strict: true, allErrors: false, coerceTypes: false, useDefaults: false, removeAdditional: false });
addFormats(ajv);
ajv.addSchema(schema);
const validators = new Map(Object.keys(schema.$defs).map(name => [name, ajv.compile({ $ref: `${schema.$id}#/$defs/${name}` })]));

function bounded(value, profile, depth = 0) {
  if (depth > profile.depth) return false;
  if (typeof value === 'string') {
    // JSON Schema counts codepoints; lone surrogates are not Unicode scalar values.
    for (const character of value) if (character.length === 1 && /[\uD800-\uDFFF]/u.test(character)) return false;
  }
  if (Array.isArray(value)) return value.length <= profile.arrayItems && value.every(item => bounded(item, profile, depth + 1));
  if (value !== null && typeof value === 'object') return Object.keys(value).length <= profile.objectKeys && Object.values(value).every(item => bounded(item, profile, depth + 1));
  return true;
}

// Wire input only. This intentionally does not authenticate or persist anything.
export function validateWire(name, wire) {
  const validator = validators.get(name);
  if (!validator || !manifest.operations[name]) return { ok: false, code: 'UNSUPPORTED_OPERATION' };
  const response = ['ResourcePage','PackManifest','StageMapping','ProfileSnapshot','ActivityProposal','CommitReceipt','AcceptedRun','Error','ChangeEvent','StreamEvent','VoiceTranscript'].includes(name);
  const invalid = response ? 'UNAVAILABLE' : 'INVALID_REQUEST';
  if (typeof wire !== 'string') return { ok: false, code: invalid };
  const profile = limits.profiles[manifest.operations[name]];
  const cap = name === 'StreamEvent' ? limits.stream.eventBytes - limits.stream.framingBytes : response ? profile.responseBytes : profile.requestBytes;
  if (Buffer.byteLength(wire, 'utf8') > cap) return { ok: false, code: response ? 'UNAVAILABLE' : 'PAYLOAD_TOO_LARGE' };
  let value;
  try { value = JSON.parse(wire); } catch { return { ok: false, code: invalid }; }
  if (!bounded(value, profile) || !validator(value)) return { ok: false, code: invalid };
  return { ok: true, value };
}

function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]));
  return value;
}
export function fingerprint(name, wire) {
  const result = validateWire(name, wire);
  if (!result.ok || !Object.hasOwn(result.value, 'mutationId')) throw new TypeError('Expected a valid draft mutation DTO');
  // Domain and every validated field are included. No trimming or Unicode normalization.
  return createHash('sha256').update(JSON.stringify([name, ordered(result.value)])).digest('hex');
}
export function replayComparison(previousHash, name, wire) {
  if (!/^[a-f0-9]{64}$/.test(previousHash)) throw new TypeError('Invalid stored hash');
  return previousHash === fingerprint(name, wire) ? 'same-payload' : 'command-conflict';
}
export function compareRevision(expected, current) {
  if (![expected, current].every(n => Number.isSafeInteger(n) && n >= 0)) throw new TypeError('Invalid revision');
  return expected === current ? 'matches' : 'stale';
}
