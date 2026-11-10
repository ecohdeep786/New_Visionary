import { createHash } from 'node:crypto';
export interface ProvisionResult { personalWorkspaceId: string; name: string; slug: string; replay: boolean; recovered: boolean; }
export interface ProvisionTarget {
  environment: 'local' | 'staging' | 'production'; environmentId: string;
  firebaseProject: string; firebaseDatabase: string; firestoreMode: 'live' | 'emulator';
  sqlProject: string; region: string; instance: string; database: string; schema: string;
}
export interface ProvisionIdentity { uid: string; key: string; digest: string; targetKey: string; target: Readonly<ProvisionTarget>; }
export class ProvisionError extends Error {
  constructor(readonly code: 'INVALID_COMMAND' | 'WRONG_OWNER' | 'CONFLICT' | 'UNAVAILABLE', readonly status: number) { super(code); }
}
export const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function canonicalProvisionTarget(target: ProvisionTarget): Readonly<ProvisionTarget> {
  if (!target || ['environment','environmentId','firebaseProject','firebaseDatabase','firestoreMode','sqlProject','region','instance','database','schema'].some(k => typeof (target as any)[k] !== 'string') ||
    !['local', 'staging', 'production'].includes(target.environment) || !['live','emulator'].includes(target.firestoreMode) ||
    !/^(?:\(default\)|[a-z][a-z0-9-]{0,62})$/.test(target.firebaseDatabase) ||
    !/^[a-z][a-z0-9-]{0,62}$/.test(target.environmentId) || !/^[a-z][a-z0-9-]{0,62}$/.test(target.firebaseProject) ||
    !/^[a-z][a-z0-9-]{0,62}$/.test(target.sqlProject) || !/^[a-z][a-z0-9-]{0,62}$/.test(target.region) ||
    !/^[a-z][a-z0-9-]{0,62}$/.test(target.instance) || !/^[a-z][a-z0-9_]{0,62}$/.test(target.database) ||
    !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(target.schema)) throw new ProvisionError('INVALID_COMMAND', 400);
  if (target.environment === 'production' && (target.environmentId !== 'production' || target.firebaseProject !== 'visionary-research' ||
    target.firestoreMode !== 'live' || target.sqlProject !== 'visionary-research' || target.region !== 'asia-south1' || /^visionary_data_(?:test|staging)(?:_|$)/.test(target.database))) throw new ProvisionError('INVALID_COMMAND', 400);
  if (target.environment !== 'production' && target.environmentId === 'production') throw new ProvisionError('INVALID_COMMAND', 400);
  return Object.freeze({ environment: target.environment, environmentId: target.environmentId, firebaseProject: target.firebaseProject, firebaseDatabase: target.firebaseDatabase, firestoreMode: target.firestoreMode,
    sqlProject: target.sqlProject, region: target.region, instance: target.instance, database: target.database, schema: target.schema });
}
export function provisionIdentity(uid: string, input: unknown, target: ProvisionTarget): ProvisionIdentity {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid) || /^__.*__$/.test(uid)) throw new ProvisionError('WRONG_OWNER', 403);
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ProvisionError('INVALID_COMMAND', 400);
  const c = input as Record<string, unknown>;
  if (Object.keys(c).some(k => !['commandId', 'payload'].includes(k)) || typeof c.commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(c.commandId)) throw new ProvisionError('INVALID_COMMAND', 400);
  const p = c.payload ?? {};
  if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).some(k => k !== 'source')) throw new ProvisionError('INVALID_COMMAND', 400);
  const source = (p as Record<string, unknown>).source ?? 'manual';
  if (typeof source !== 'string' || !['manual', 'onboarding'].includes(source)) throw new ProvisionError('INVALID_COMMAND', 400);
  const canonical = canonicalProvisionTarget(target), targetKey = hash(canonical);
  return { uid, key: 'personal-v1-' + hash([targetKey, uid, c.commandId]), targetKey, target: canonical,
    digest: hash({ version: 1, operation: 'personal-workspace.provision', targetKey, uid, source }) };
}
