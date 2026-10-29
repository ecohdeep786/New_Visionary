#!/usr/bin/env node
// VMM-R0 — reproducible local research-environment smoke and deny suite.
//
// Dependency-free. Runs the gate's environment smoke and the deny suite against
// the frozen manifest/matrix/measurement plan, then writes evidence (including
// the exact git HEAD) to artifacts/research/private/gate-evidence/ — which is
// outside public Git. Exits non-zero on any smoke or deny failure.
//
// Deny suite (fail closed):
//   D1 no credential markers in any gate artifact
//   D2 no production credential file references (.env, serviceAccount keys)
//   D3 every research source carries an authored/rights_cleared license —
//      public availability is never a training license
//   D4 private artifact locations are declared outside public Git
//   D5 the claims ledger contains no forbidden claims (retention/transfer
//      gains, AGI/omniscience/zero-error/launch claims)
//   D6 checkpoint inventory honesty: trainedOwnedWeights is false until real
//      owned weights exist
//   D7 no learner-record or production-account references in gate artifacts
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const gateRoot = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(gateRoot, '../../..');
const evidenceDir = resolve(appRoot, 'artifacts/research/private/gate-evidence');

/** The whole deny suite, importable for negative tests. Fail closed. */
export function evaluateGate({ manifest, matrix, plan }) {
  const checks = [];
  const deny = (id, pass, detail) => checks.push({ kind: 'deny', id, pass, detail });

  const gateText = JSON.stringify({ manifest, matrix, plan });
  const credentialMarkers = ['password', 'api_key', 'private_key', 'secret_value', 'begin private key'];
  deny('D1-no-credential-markers', !credentialMarkers.some((m) => gateText.toLowerCase().includes(m)), 'gate artifacts scanned');
  const productionCredentialRefs = ['.env', 'service-account', 'serviceaccountkey', 'credentials.json'];
  deny('D2-no-production-credential-references', !productionCredentialRefs.some((r) => gateText.toLowerCase().includes(r)), 'no production credential file references');
  const licensesAllowed = manifest.dataLicensePolicy.allowed;
  deny(
    'D3-license-policy',
    matrix.sources.every((s) => licensesAllowed.includes(s.license)) && !matrix.sources.some((s) => s.license === 'public_availability'),
    'every source is authored or rights_cleared; public availability is not a license',
  );
  deny('D4-private-locations-outside-git', manifest.privateArtifactLocations.outsidePublicGit === true && manifest.privateArtifactLocations.researchData.startsWith('artifacts/'), 'private artifacts declared under gitignored artifacts/');
  const forbiddenClaims = ['retention gain', 'transfer gain', 'omniscien', 'zero-error', 'launch-ready'];
  const claimedText = JSON.stringify(matrix.claimsLedger.claimed).toLowerCase();
  deny('D5-no-forbidden-claims', !forbiddenClaims.some((c) => claimedText.includes(c)), 'claims ledger carries only bounded R0 claims');
  deny('D6-checkpoint-honesty', manifest.checkpointInventory.trainedOwnedWeights === false, 'a baseline/configuration is not trained owned weights');
  // D7 scans the INPUT/LOCATION surfaces (not the policy sentence that forbids
  // these things) for actual learner-record or production-account references.
  const inputSurfaces = JSON.stringify({
    sources: matrix.sources,
    locations: manifest.privateArtifactLocations,
    environment: manifest.approvedLocalEnvironment,
  }).toLowerCase();
  const learnerMarkers = ['learner_uid', 'learneruid', 'firestore://', 'production_account', 'service_account_file'];
  deny('D7-no-learner-or-production-references', !learnerMarkers.some((m) => inputSurfaces.includes(m)), 'no learner records or production accounts referenced in inputs/locations');
  return checks;
}

function environmentSmoke() {
  const checks = [];
  const smoke = (id, pass, detail) => checks.push({ kind: 'smoke', id, pass, detail });
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  smoke('S1-node-version', nodeMajor >= 20, `node ${process.versions.node}`);
  let pythonOk = false;
  let pythonVersion = '';
  try {
    const runner = process.platform === 'win32' ? 'python' : 'python3';
    pythonVersion = execFileSync(runner, ['--version'], { encoding: 'utf8' }).trim();
    pythonOk = /Python 3\.\d+/.test(pythonVersion);
  } catch {
    pythonOk = false;
  }
  smoke('S2-python-version', pythonOk, pythonVersion || 'python not found');
  return checks;
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const read = (p) => JSON.parse(readFileSync(join(gateRoot, p), 'utf8'));
  const manifest = read('manifest.json');
  const matrix = read('capability-matrix.json');
  const plan = read('measurement-plan.json');
  const checks = [...environmentSmoke(), ...evaluateGate({ manifest, matrix, plan })];
  const passed = checks.every((c) => c.pass);
  const artifactHashes = Object.fromEntries(
    ['manifest.json', 'capability-matrix.json', 'measurement-plan.json'].map((f) => [
      f,
      createHash('sha256').update(readFileSync(join(gateRoot, f))).digest('hex'),
    ]),
  );
  const evidence = {
    evidenceId: `r0-smoke-${new Date().toISOString()}`,
    gitHead: gitHead(),
    passed,
    checks,
    artifactHashes,
  };
  mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = join(evidenceDir, 'research-smoke-evidence.json');
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ passed, evidencePath, failed: checks.filter((c) => !c.pass) }, null, 2));
  process.exit(passed ? 0 : 1);
}
