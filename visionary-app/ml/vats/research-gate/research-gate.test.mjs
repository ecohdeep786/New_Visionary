/**
 * VMM-R0 (KAN-207) — research gate manifest/matrix/measurement-plan/smoke:
 *   - the manifest is versioned, names accountable reviewer ROLES whose
 *     signoffs are PENDING (implementer cannot self-sign), pins a CPU-only
 *     bounded environment, declares private artifact locations outside public
 *     Git, and honestly reports that no trained owned weights exist;
 *   - the capability matrix covers all five roles and four modes, requires the
 *     English/Hindi/Bengali languages with explicit unqualified OCR slices,
 *     specifies both first reference journeys, and carries a claims ledger
 *     with no forbidden claims (KAN-172 owns deferred numerics);
 *   - the measurement plan separates independent review labels from observed
 *     outcomes and causal benefit, records engineering acceptance as
 *     PROPOSALS (not results), and defers dataset-specific numerics;
 *   - the smoke/deny suite runs reproducibly, passes on the frozen gate, and
 *     provably FAILS on injected violations (public-license source, forbidden
 *     claim, trained-weights claim, embedded credential).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const gateRoot = resolve(dirname(fileURLToPath(import.meta.url)), '.');
const appRoot = resolve(gateRoot, '../../..');
const python = process.platform === 'win32' ? 'python' : 'python3';

const read = (f) => JSON.parse(readFileSync(join(gateRoot, f), 'utf8'));
const manifest = read('manifest.json');
const matrix = read('capability-matrix.json');
const plan = read('measurement-plan.json');
const { evaluateGate } = await import('./smoke.mjs');

const gateFiles = { manifest, matrix, plan };

// ---------------------------------------------------------------------------

test('MANIFEST: versioned gate with PENDING named signoffs (no self-approval) and honest checkpoint inventory', () => {
  assert.equal(manifest.gate, 'R0');
  assert.ok(Number.isInteger(manifest.version) && manifest.version >= 1);
  for (const role of manifest.accountableSignoffs.roles) {
    assert.ok(role.role.length > 0);
    assert.equal(role.namedSignatory, null, 'implementer cannot name a signatory');
    assert.equal(role.signedAt, null);
  }
  assert.ok(manifest.accountableSignoffs.policy.includes('cannot self-sign'));
  assert.equal(manifest.approvedLocalEnvironment.compute.includes('CPU-only'), true);
  assert.equal(manifest.privateArtifactLocations.outsidePublicGit, true);
  assert.equal(manifest.checkpointInventory.trainedOwnedWeights, false);
});

test('CAPABILITY MATRIX: all five roles, four modes, required languages, explicit unqualified OCR slices', () => {
  assert.deepEqual(matrix.roles, ['student', 'teacher', 'parent_guardian', 'professional', 'organization']);
  assert.deepEqual(matrix.modes, ['teach_learn', 'ask', 'practice', 'build']);
  const requiredLanguages = matrix.languages.filter((l) => l.status === 'required').map((l) => l.code);
  assert.deepEqual(requiredLanguages.sort(), ['bn', 'en-IN', 'hi']);
  assert.ok(matrix.ocrSlices.length >= 4);
  assert.ok(matrix.ocrSlices.every((s) => s.qualified === false), 'OCR slices stay explicitly unqualified');
  // Every source is licensed authored/rights_cleared (public availability is not a license).
  for (const source of matrix.sources) {
    assert.ok(['authored', 'rights_cleared'].includes(source.license));
  }
  // Both first reference journeys are specified without narrowing scope.
  assert.equal(matrix.firstReferenceJourneys.length, 2);
  assert.deepEqual(matrix.firstReferenceJourneys[0].steps,
    ['permitted_photographed_work', 'ocr_with_correction_and_provenance', 'supported_explanation', 'independent_practice', 'persisted_evidence', 'next_session_guidance']);
  assert.deepEqual(matrix.firstReferenceJourneys[1].steps,
    ['standalone_brief', 'bounded_plan', 'document_or_data_or_code_artifact', 'isolated_tests_or_preview', 'user_approved_save_export_publication', 'recovery_and_later_correction']);
});

test('CLAIMS LEDGER: bounded claims only; forbidden claims absent; numerics deferred to KAN-172', () => {
  const claimed = JSON.stringify(matrix.claimsLedger.claimed).toLowerCase();
  for (const forbidden of ['retention gain', 'transfer gain', 'omniscien', 'zero-error', 'launch-ready']) {
    assert.ok(!claimed.includes(forbidden), `claims ledger must not claim ${forbidden}`);
  }
  assert.ok(matrix.claimsLedger.notClaimed.length >= 5);
  assert.equal(matrix.claimsLedger.deferred[0].owner, 'KAN-172');
});

test('MEASUREMENT PLAN: label taxonomy separated; engineering acceptance marked as proposals; custodian rule present', () => {
  const taxonomy = plan.labelTaxonomy;
  assert.ok(taxonomy.independentReviewLabels.length > 0);
  assert.ok(taxonomy.separationRule.includes('separately'));
  assert.equal(plan.engineeringAcceptanceProposals.status.includes('design proposals'), true);
  assert.ok(plan.engineeringAcceptanceProposals.denySuite.includes('zero unauthorized effects'));
  assert.ok(plan.engineeringAcceptanceProposals.underpoweredRule.includes('not a pass'));
  assert.equal(plan.hiddenDataGovernance.deferredNumerics.includes('KAN-172'), true);
  assert.ok(plan.hiddenDataGovernance.custodian.includes('independent custodian'));
  // Promotion rule + slice degradation are recorded as proposals with concrete bounds.
  assert.ok(plan.engineeringAcceptanceProposals.promotionRule.includes('95% confidence bound'));
  assert.ok(plan.engineeringAcceptanceProposals.sliceDegradation.includes('2 percentage points'));
});

test('SMOKE + DENY: the frozen gate passes reproducibly and writes evidence outside public Git', () => {
  const runner = process.platform === 'win32' ? 'node' : 'node';
  const out = JSON.parse(execFileSync(runner, [join(gateRoot, 'smoke.mjs')], { encoding: 'utf8' }));
  assert.equal(out.passed, true);
  assert.ok(existsSync(out.evidencePath));
  assert.ok(out.evidencePath.replace(/\\/g, '/').includes('artifacts/research/private/gate-evidence'));
  const evidence = JSON.parse(readFileSync(out.evidencePath, 'utf8'));
  assert.ok(evidence.gitHead && evidence.gitHead !== 'unknown');
  assert.equal(evidence.checks.every((c) => c.pass), true);
  assert.ok(evidence.checks.some((c) => c.id === 'D6-checkpoint-honesty'));
});

test('DENY SUITE NEGATIVES: injected violations provably fail', () => {
  // Public availability used as a license -> D3 refuses.
  const publicLicense = structuredClone(gateFiles);
  publicLicense.matrix.sources.push({ sourceRef: 'web/scraped', license: 'public_availability' });
  let checks = evaluateGate(publicLicense);
  assert.equal(checks.find((c) => c.id === 'D3-license-policy').pass, false);
  // A forbidden claim sneaks into the ledger -> D5 refuses.
  const forbiddenClaim = structuredClone(gateFiles);
  forbiddenClaim.matrix.claimsLedger.claimed.push('proves retention gain');
  checks = evaluateGate(forbiddenClaim);
  assert.equal(checks.find((c) => c.id === 'D5-no-forbidden-claims').pass, false);
  // Trained owned weights claimed -> D6 refuses.
  const trainedWeights = structuredClone(gateFiles);
  trainedWeights.manifest.checkpointInventory.trainedOwnedWeights = true;
  checks = evaluateGate(trainedWeights);
  assert.equal(checks.find((c) => c.id === 'D6-checkpoint-honesty').pass, false);
  // Embedded credential -> D1 refuses.
  const credentialed = structuredClone(gateFiles);
  credentialed.plan.ownership.note = 'api_key=hunter2';
  checks = evaluateGate(credentialed);
  assert.equal(checks.find((c) => c.id === 'D1-no-credential-markers').pass, false);
});
