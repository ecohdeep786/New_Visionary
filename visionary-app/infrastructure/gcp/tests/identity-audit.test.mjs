import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  expected, reviewedPool, reviewedPrincipal, reviewedMapping, reviewedCondition,
  auditRuntimeProjectIam, auditRuntimeSecretIam, auditDeployerIdentity,
  auditWorkloadIdentityPool, auditSecretRotation, auditServiceIsolation, auditNamedDatabase, runAudit,
} from '../identity-audit.mjs';

const runtime = 'serviceAccount:' + expected.runtime;
const deployer = 'serviceAccount:' + expected.deployer;
const bind = (role, ...members) => ({ role, members });
const policy = (...bindings) => ({ bindings });
const runtimeRoles = policy(...expected.runtimeProjectRoles.map(role => bind(role, runtime)));
const secretPolicy = policy(bind('roles/secretmanager.secretAccessor', runtime));
const deployerPolicy = policy(bind('roles/iam.workloadIdentityUser', reviewedPrincipal));
const runtimePolicy = policy(bind('roles/iam.serviceAccountUser', deployer));
const servicePolicy = policy(bind('roles/run.developer', deployer));
const repositoryPolicy = policy(bind('roles/artifactregistry.writer', deployer));
const pool = { name: reviewedPool, state: 'ACTIVE' };
const provider = { name: reviewedPool + '/providers/' + expected.provider, state: 'ACTIVE',
  oidc: { issuerUri: expected.issuer }, attributeCondition: reviewedCondition, attributeMapping: reviewedMapping };
const rotationTime = Date.now() + 86400_000;
const secretName = `projects/${expected.projectNumber}/secrets/${expected.secret}`;
const secret = { name: secretName, topics: [{ name: `projects/${expected.project}/topics/product-secret-rotation` }],
  rotation: { rotationPeriod: '2592000s', nextRotationTime: new Date(rotationTime).toISOString() } };
const version = { name: secretName + '/versions/1', state: 'ENABLED' };
const revisionName = expected.service + '-reviewed';
const service = { metadata: { name: expected.service, annotations: {
  'run.googleapis.com/ingress': expected.ingress, 'run.googleapis.com/invoker-iam-disabled': 'true',
} }, status: { traffic: [{ revisionName, percent: 100 }] } };
const revision = { metadata: { name: revisionName, labels: { 'serving.knative.dev/service': expected.service } },
  spec: { serviceAccountName: expected.runtime, containers: [{ env: [
    { name: 'FIREBASE_PROJECT_ID', value: expected.project },
    { name: 'FIREBASE_PROJECT_KIND', value: 'production' },
    { name: 'FIRESTORE_DATABASE_ID', value: 'default' },
    { name: 'AUTH_RATE_LIMIT_KEY', valueFrom: { secretKeyRef: { name: expected.secret, key: '1' } } },
  ] }] } };
const database = { name: `projects/${expected.project}/databases/${expected.database}`, type: 'FIRESTORE_NATIVE' };

test('runtime direct project grants match reviewed roles and refuse extra conditional grants', () => {
  assert.equal(auditRuntimeProjectIam(runtimeRoles).pass, true);
  for (const extra of [bind('roles/editor', runtime), { ...bind('roles/editor', runtime), condition: { title: 'synthetic' } }]) {
    assert.equal(auditRuntimeProjectIam(policy(...runtimeRoles.bindings, extra)).pass, false);
  }
  assert.equal(auditRuntimeProjectIam(policy(runtimeRoles.bindings[0])).pass, false);
  assert.throws(() => auditRuntimeProjectIam({ bindings: 'invalid' }), /malformed/);
});

test('secret policy refuses extra access even under conditional bindings', () => {
  assert.equal(auditRuntimeSecretIam(secretPolicy).pass, true);
  const foreign = bind('roles/secretmanager.secretAccessor', 'allAuthenticatedUsers');
  for (const candidate of [policy(), policy(...secretPolicy.bindings, foreign), policy(...secretPolicy.bindings, { ...foreign, condition: {} })]) {
    assert.equal(auditRuntimeSecretIam(candidate).pass, false);
  }
});

test('deployer must have the numeric pool grant on its own account and no extra grants or keys', () => {
  const good = { account: { email: expected.deployer }, keys: [], project: runtimeRoles,
    deployer: deployerPolicy, service: servicePolicy, repository: repositoryPolicy, runtime: runtimePolicy };
  assert.equal(auditDeployerIdentity(good).pass, true);
  for (const change of [
    { keys: null }, { keys: [{}] }, { account: { email: expected.runtime } },
    { project: policy(bind('roles/editor', deployer)) },
    { project: deployerPolicy, deployer: policy() },
    { deployer: policy(bind('roles/iam.workloadIdentityUser', reviewedPrincipal.replace(expected.projectNumber, expected.project))) },
    { deployer: policy(...deployerPolicy.bindings, bind('roles/iam.serviceAccountTokenCreator', 'allAuthenticatedUsers')) },
    { repository: policy(...repositoryPolicy.bindings, bind('roles/artifactregistry.admin', deployer)) },
    { runtime: policy() },
  ]) assert.equal(auditDeployerIdentity({ ...good, ...change }).pass, false);
});

test('provider verifies complete bootstrap trust configuration and excludes sibling providers', () => {
  assert.equal(auditWorkloadIdentityPool(pool, provider, [provider]).pass, true);
  assert.equal(auditWorkloadIdentityPool({ ...pool, disabled: true }, provider, [provider]).pass, false);
  assert.equal(auditWorkloadIdentityPool(pool, provider, [provider, { name: 'another-provider' }]).pass, false);
  for (const change of [
    { disabled: true }, { oidc: { issuerUri: expected.issuer, allowedAudiences: ['foreign'] } },
    { attributeMapping: { ...reviewedMapping, 'attribute.repository_id': "'1357462978'" } },
    { attributeCondition: "assertion.repository_id == '1357462978'" },
    { attributeCondition: reviewedCondition.replace("'refs/heads/main'", "'refs/heads/dev'") },
  ]) assert.equal(auditWorkloadIdentityPool(pool, { ...provider, ...change }, [provider]).pass, false);
  const bootstrap = readFileSync(new URL('../bootstrap.py', import.meta.url), 'utf8');
  for (const claim of reviewedCondition.split(/ && | \|\| /).map(part => part.replace(/^\(|\)$/g, ''))) {
    const declaration = claim.replace('ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main', '{WORKFLOW}');
    assert.ok(bootstrap.includes(declaration));
  }
});

test('rotation metadata requires a same-project topic, valid future schedule and pinned enabled version', () => {
  assert.equal(auditSecretRotation(secret, version).pass, true);
  assert.equal(auditSecretRotation(secret, { ...version, name: secretName + '/versions/2' }).pass, false);
  assert.equal(auditSecretRotation(secret, { ...version, state: 'DISABLED' }).pass, false);
  for (const candidate of [
    { ...secret, topics: [] }, { ...secret, topics: [{ name: 'projects/foreign/topics/rotation' }] },
    { ...secret, rotation: { rotationPeriod: '2592000s' } },
    { ...secret, rotation: { ...secret.rotation, rotationPeriod: '60s' } },
  ]) assert.equal(auditSecretRotation(candidate, version).pass, false);
  assert.equal(auditSecretRotation(secret, version, rotationTime).pass, false);
});

test('the active serving revision uses attached identity, pinned realm and pinned secret metadata', () => {
  assert.equal(auditServiceIsolation(service, servicePolicy, revision).pass, true);
  assert.equal(auditServiceIsolation(service, policy(bind('roles/run.invoker', 'allUsers')), revision).pass, false);
  assert.equal(auditServiceIsolation(service, servicePolicy, { ...revision, spec: { ...revision.spec, serviceAccountName: expected.deployer } }).pass, false);
  for (const name of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIRESTORE_EMULATOR_HOST', 'FIRESTORE_DATABASE_ID']) {
    const drift = structuredClone(revision);
    drift.spec.containers[0].env.push({ name, value: 'synthetic-drift' });
    assert.equal(auditServiceIsolation(service, servicePolicy, drift).pass, false);
  }
  const latest = { ...service, status: { traffic: [{ revisionName, percent: 100, latestRevision: true }] } };
  assert.throws(() => auditServiceIsolation(latest, servicePolicy, revision), /explicitly pinned/);
});

test('Firestore metadata must identify the exact existing named Native database', () => {
  assert.equal(auditNamedDatabase(database).pass, true);
  for (const changed of [
    { name: `projects/${expected.project}/databases/(default)` }, { name: 'projects/foreign/databases/default' },
    { type: 'DATASTORE_MODE' }, { deleteTime: '2026-01-01T00:00:00Z' },
  ]) assert.equal(auditNamedDatabase({ ...database, ...changed }).pass, false);
});

const readResponses = new Map([
  ['iam workload-identity-pools describe ' + expected.pool, pool],
  ['iam workload-identity-pools providers describe ' + expected.provider, provider],
  ['iam workload-identity-pools providers list', [provider]],
  ['projects get-iam-policy ' + expected.project, runtimeRoles],
  ['iam service-accounts describe ' + expected.runtime, { email: expected.runtime }],
  ['iam service-accounts describe ' + expected.deployer, { email: expected.deployer }],
  ['iam service-accounts keys list --iam-account=' + expected.runtime + ' --managed-by=user', []],
  ['iam service-accounts keys list --iam-account=' + expected.deployer + ' --managed-by=user', []],
  ['iam service-accounts get-iam-policy ' + expected.deployer, deployerPolicy],
  ['iam service-accounts get-iam-policy ' + expected.runtime, runtimePolicy],
  ['secrets get-iam-policy ' + expected.secret, secretPolicy],
  ['secrets describe ' + expected.secret, secret],
  ['secrets versions describe 1 --secret=' + expected.secret, version],
  ['run services describe ' + expected.service, service],
  ['run revisions describe ' + revisionName, revision],
  ['run services get-iam-policy ' + expected.service, servicePolicy],
  ['artifacts repositories get-iam-policy ' + expected.repository, repositoryPolicy],
  ['firestore databases describe --database=default --impersonate-service-account=' + expected.runtime, database],
]);

test('full audit calls reviewed metadata reads in the pinned project and impersonates only for Firestore', async () => {
  const called = new Set();
  const result = await runAudit({ report() {}, io: { gcloud(args) {
    assert.deepEqual(args.slice(-3), ['--project=' + expected.project, '--format=json', '--quiet']);
    if (args[1] === 'workload-identity-pools') assert.ok(args.includes('--location=global'));
    if (args[2] === 'providers') assert.ok(args.includes('--workload-identity-pool=' + expected.pool));
    if (args[0] === 'run') assert.ok(args.includes('--region=' + expected.region));
    if (args[0] === 'artifacts') assert.ok(args.includes('--location=' + expected.region));
    const key = args.slice(0, -3).filter(arg => !/^--(?:region|location|workload-identity-pool)=/.test(arg)).join(' ');
    assert.ok(readResponses.has(key), key);
    called.add(key);
    return readResponses.get(key);
  } } });
  assert.equal(result.passed, true, JSON.stringify(result.results));
  assert.equal(result.results.length, 7);
  assert.deepEqual(called, new Set(readResponses.keys()));
});

test('unavailable SDK access fails every check without printing provider errors', async () => {
  const lines = [];
  const result = await runAudit({ report: line => lines.push(line), io: { gcloud() { throw Error('synthetic sensitive error'); } } });
  assert.equal(result.passed, false);
  assert.ok(result.results.every(row => !row.pass && /Read or validation failed/.test(row.detail)));
  assert.doesNotMatch(lines.join('\n'), /synthetic sensitive error/);
  await assert.rejects(runAudit({ project: 'foreign' }), /bound to the reviewed production project/);
});
