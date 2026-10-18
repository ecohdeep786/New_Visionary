/** Product-owned BKT calibration policy. Pure; no HTTP DTO, datastore or model
 * authority. Parameter sets are selected by exact task/source/criteria scope so
 * every device sharing a UID converges on the same knowledge model. These are
 * internal reference parameters; held-out calibration publication is a separate
 * open gate. A model version change means the projection replays evidence, never
 * silently inheriting another model's probability. Selection is server-authoritative.
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
function probability(value: unknown): void { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) invalid('Invalid calibrated parameter.'); }
export function selectCalibratedModel(scope: Pick<LearningScope, 'sourceVersion' | 'criteriaVersion'>): CalibratedModel {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) invalid('Learning scope is required.');
  const sourceVersion = scope.sourceVersion, criteriaVersion = scope.criteriaVersion;
  text(sourceVersion); text(criteriaVersion);
  for (const candidate of catalog) {
    const source = candidate.requires.sourceVersion, criteria = candidate.requires.criteriaVersion;
    if ((source === '*' || sourceVersion === source) && (criteria === '*' || criteriaVersion === criteria)) {
      probability(candidate.guess); probability(candidate.slip); probability(candidate.transit); probability(candidate.initial);
      text(candidate.version);
      return candidate;
    }
  }
  throw new TeachingPolicyError('scope_mismatch', 'No calibrated knowledge model matches this scope.');
}
export function requireModelVersion(scope: Pick<LearningScope, 'sourceVersion' | 'criteriaVersion'>, version: string) {
  text(version);
  const model = selectCalibratedModel(scope);
  if (model.version !== version) throw new TeachingPolicyError('rebuild_required', 'Replay evidence before changing the knowledge model.');
  return model;
}
