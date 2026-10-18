/** Product-owned BKT calibration policy. Pure; no HTTP DTO, datastore or model
 * authority. Calibrated parameter sets are selected by exact task/source/criteria
 * scope so every device sharing a UID converges on the same knowledge model.
 * A model version change means the projection replays receipts, never silently
 * inheriting another model's probability. Selection is server-authoritative.
 */
import { KnowledgeParameters, LearningScope, TeachingPolicyError } from './teaching-policy';
export const CALIBRATION_REFERENCE = 'doc03-reference-calib-v1';
export interface CalibratedModel extends KnowledgeParameters {
  license: 'reference';
  initial: number;
  requires: Record<'sourceVersion' | 'criteriaVersion', string>;
}
const catalog: CalibratedModel[] = [
  { version: 'a2-calib-v1', guess: 0.25, slip: 0.08, transit: 0.15, license: 'reference', initial: 0.35, requires: { sourceVersion: 'a2', criteriaVersion: 'rubric-a2' } },
  { version: CALIBRATION_REFERENCE, guess: 0.2, slip: 0.1, transit: 0.1, license: 'reference', initial: 0.4, requires: { sourceVersion: '*', criteriaVersion: '*' } },
];
const invalid = (message: string): never => { throw new TeachingPolicyError('invalid', message); };
function text(value: unknown): asserts value is string { if (typeof value !== 'string' || !value.length || value.length > 256) invalid('Invalid opaque reference.'); }
const scopeValue = (scope: LearningScope, key: 'sourceVersion' | 'criteriaVersion') => { const value = scope?.[key]; text(value); return value; };
export function selectCalibratedModel(scope: LearningScope): CalibratedModel {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) invalid('Learning scope is required.');
  const sourceVersion = scopeValue(scope, 'sourceVersion'), criteriaVersion = scopeValue(scope, 'criteriaVersion');
  for (const candidate of catalog) {
    const source = candidate.requires.sourceVersion, criteria = candidate.requires.criteriaVersion;
    if ((source === '*' || sourceVersion === source) && (criteria === '*' || criteriaVersion === criteria)) return candidate;
  }
  throw new TeachingPolicyError('scope_mismatch', 'No calibrated knowledge model matches this scope.');
}
export const definedModels = (): readonly CalibratedModel[] => catalog;
export function requireModelVersion(scope: LearningScope, version: string) {
  const model = selectCalibratedModel(scope);
  if (model.version !== version) throw new TeachingPolicyError('rebuild_required', 'Replay evidence before changing the knowledge model.');
  return model;
}
export function readCalibration() { return { reference: CALIBRATION_REFERENCE, models: catalog.map(({ license, ...model }) => ({ ...model, license })) }; }
