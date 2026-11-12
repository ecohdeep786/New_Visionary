import { execFileSync, execSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { currentRevision, production } from './release.mjs';

// PLAT-03 read-only identity/environment audit. The reviewed desired state is
// the one bootstrap.py creates and production.yml consumes. This tool only
// describes resource metadata in the reviewed production project. Its policy
// observations are direct grants on the named resources.

export const expected = Object.freeze({
  project: production.project, projectNumber: production.projectNumber, region: production.region, service: production.service,
  repository: 'visionary-product',
  deployer: 'visionary-github-deployer@visionary-research.iam.gserviceaccount.com',
  runtime: 'visionary-product-runtime@visionary-research.iam.gserviceaccount.com',
  secret: production.secret, secretVersion: production.secretVersion,
  runtimeProjectRoles: Object.freeze(['roles/datastore.user', 'roles/firebase.sdkAdminServiceAgent']),
  runtimeSecretRoles: Object.freeze(['roles/secretmanager.secretAccessor']),
  pool: 'visionary-github', provider: 'github-main',
  issuer: 'https://token.actions.githubusercontent.com', repositoryId: '1357462978',
  database: 'default', databaseType: 'FIRESTORE_NATIVE',
  ingress: 'internal-and-cloud-load-balancing',
});
export const reviewedPool = `projects/${expected.projectNumber}/locations/global/workloadIdentityPools/${expected.pool}`;
export const reviewedPrincipal = `principalSet://iam.googleapis.com/${reviewedPool}/attribute.repository_id/${expected.repositoryId}`;
export const reviewedMapping = Object.freeze({
  'google.subject': 'assertion.sub',
  'attribute.repository_id': 'assertion.repository_id',
  'attribute.repository_owner_id': 'assertion.repository_owner_id',
  'attribute.ref': 'assertion.ref',
});
export const reviewedCondition = "assertion.repository_id == '1357462978' && " +
  "assertion.repository_owner_id == '221676162' && " +
  "assertion.ref == 'refs/heads/main' && " +
  "assertion.workflow_ref == 'ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main' && " +
  "(assertion.event_name == 'push' || assertion.event_name == 'workflow_dispatch')";

const member = account => `serviceAccount:${account}`;
export const pass = detail => ({ pass: true, detail });
export const refuse = detail => ({ pass: false, detail });

function policyBindings(policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy) ||
      (policy.bindings === undefined && typeof policy.etag !== 'string')) throw Error('IAM policy response missing.');
  const bindings = policy.bindings ?? [];
  if (!Array.isArray(bindings) || bindings.some(row => typeof row?.role !== 'string' ||
      !Array.isArray(row.members) || row.members.length === 0 || row.members.some(id => typeof id !== 'string'))) {
    throw Error('IAM policy response malformed.');
  }
  return bindings;
}

function exactlyGrants(bindings, role, principal) {
  return bindings.length === 1 && bindings[0].role === role && !bindings[0].condition &&
    isDeepStrictEqual(bindings[0].members, [principal]);
}

// The runtime identity must hold exactly the reviewed project roles: the
// Firebase Admin service agent and datastore user. Anything broader (owner,
// editor, wildcard) or unknown refuses; least privilege is a set equality.
export function auditRuntimeProjectIam(policy) {
  const bindings = policyBindings(policy);
  const roles = bindings.filter(b => b.members.includes(member(expected.runtime)) && !b.condition).map(b => b.role);
  const extra = roles.filter(role => !expected.runtimeProjectRoles.includes(role));
  const missing = expected.runtimeProjectRoles.filter(role => !roles.includes(role));
  if (extra.length) return refuse(`runtime identity holds unreviewed project roles: ${extra.join(', ')}`);
  if (missing.length) return refuse(`runtime identity is missing reviewed project roles: ${missing.join(', ')}`);
  // A conditioned grant is outside the reviewed unconditional law even when
  // the role itself is reviewed: the desired state holds none, so any
  // conditional binding for the runtime identity refuses (fail closed).
  const conditioned = bindings.filter(b => b.condition && b.members.includes(member(expected.runtime))).map(b => b.role);
  if (conditioned.length) return refuse(`runtime identity holds unreviewed conditional project roles: ${conditioned.join(', ')}`);
  return pass(`exactly ${roles.join(', ')}`);
}

// Secret access is bound on the one product secret only, for the runtime
// identity only. A binding for any other member or role refuses.
export function auditRuntimeSecretIam(policy) {
  if (!exactlyGrants(policyBindings(policy), expected.runtimeSecretRoles[0], member(expected.runtime))) {
    return refuse('Direct secret policy differs from the single reviewed runtime accessor grant.');
  }
  return pass('Direct secret policy grants accessor to the runtime identity.');
}

// The deployer identity exists for Workload Identity Federation only: no
// user-managed keys may exist, and its bindings are exactly the four reviewed
// grants (WIF user, run developer, artifact registry writer, runtime act-as).
export function auditDeployerIdentity({ account, keys, project, deployer, service, repository, runtime }) {
  if (account?.email !== expected.deployer || account.disabled) return refuse('Deployer identity is missing, foreign or disabled.');
  if (!Array.isArray(keys) || keys.length) return refuse('Deployer user-managed key inventory is unavailable or nonempty.');
  const deployerMember = member(expected.deployer);
  const grantsToDeployer = policy => policyBindings(policy).filter(row => row.members.includes(deployerMember))
    .map(row => ({ ...row, members: [deployerMember] }));
  if (grantsToDeployer(project).length) return refuse('Deployer has an unreviewed direct project grant.');
  if (!exactlyGrants(policyBindings(deployer), 'roles/iam.workloadIdentityUser', reviewedPrincipal)) {
    return refuse('Deployer service account policy differs from the reviewed federation grant.');
  }
  if (!exactlyGrants(grantsToDeployer(service), 'roles/run.developer', deployerMember) ||
      !exactlyGrants(grantsToDeployer(repository), 'roles/artifactregistry.writer', deployerMember) ||
      !exactlyGrants(policyBindings(runtime), 'roles/iam.serviceAccountUser', deployerMember)) {
    return refuse('Deployer service, repository or runtime account grant differs from the reviewed policy.');
  }
  return pass('Reviewed direct resource grants and no user-managed deployer keys.');
}

// The GitHub OIDC provider must be ACTIVE, trust the GitHub issuer, and pin
// the trusted repository through its attribute condition.
export function auditWorkloadIdentityPool(pool, provider, providers) {
  const providerName = `${reviewedPool}/providers/${expected.provider}`;
  if (pool?.name !== reviewedPool || pool.state !== 'ACTIVE' || pool.disabled) return refuse('Reviewed workload identity pool is unavailable.');
  if (provider?.name !== providerName || provider.state !== 'ACTIVE' || provider.disabled) return refuse('Reviewed workload identity provider is unavailable.');
  if (!Array.isArray(providers) || providers.length !== 1 || providers[0]?.name !== providerName) {
    return refuse('Workload identity pool contains an unexpected provider inventory.');
  }
  if (provider.oidc?.issuerUri !== expected.issuer ||
      !isDeepStrictEqual(provider.oidc.allowedAudiences ?? [], []) ||
      provider.oidc.jwksJson || provider.oidc.discoveryUri ||
      !isDeepStrictEqual(provider.actorProviders ?? [], []) ||
      !isDeepStrictEqual(provider.attributeMapping, reviewedMapping) ||
      provider.attributeCondition !== reviewedCondition) {
    return refuse('Provider issuer, audience, mapping or full trust condition differs from bootstrap.');
  }
  return pass('Reviewed GitHub provider, mappings and main-workflow condition.');
}

// Check schedule metadata and the version pinned by release.mjs. Notification
// delivery and rotation of a live serving revision require operational evidence.
const secretResources = [expected.project, expected.projectNumber].map(project => `projects/${project}/secrets/${expected.secret}`);

export function auditSecretRotation(secret, version, now = Date.now()) {
  if (!secretResources.includes(secret?.name)) return refuse('Product secret metadata is missing or foreign.');
  if (version?.state !== 'ENABLED' || !secretResources.some(name => version?.name === name + '/versions/' + expected.secretVersion)) {
    return refuse(`Pinned product secret version ${expected.secretVersion} is unavailable.`);
  }
  const period = /^(\d+)(?:\.\d{1,9})?s$/.test(secret.rotation?.rotationPeriod ?? '') ? parseFloat(secret.rotation.rotationPeriod) : NaN;
  const next = Date.parse(secret.rotation?.nextRotationTime);
  const topic = new RegExp(`^projects/(?:${expected.project}|${expected.projectNumber})/topics/[A-Za-z][A-Za-z0-9._~+%-]{2,254}$`);
  if (!Number.isFinite(period) || period < 3600 || period > 3153600000 ||
      !Number.isFinite(next) || next <= now || !Array.isArray(secret.topics) ||
      secret.topics.length === 0 || secret.topics.some(row => !topic.test(row?.name ?? ''))) {
    return refuse('Rotation notification schedule, future time or same-project topics are incomplete.');
  }
  return pass('Rotation notification metadata and enabled pinned version verified.');
}

function matchesPinnedSecret(reference, annotation) {
  if (reference?.name !== expected.secret || reference.key !== expected.secretVersion || reference.optional || reference.localObjectReference) return false;
  if (annotation === undefined) return true;
  if (typeof annotation !== 'string') return false;
  const aliases = new Map();
  for (const entry of annotation.split(',')) {
    const match = /^([a-zA-Z0-9_-]+):(projects\/[a-z0-9-]+\/secrets\/[a-zA-Z0-9_-]+)$/.exec(entry);
    if (!match || aliases.has(match[1])) return false;
    aliases.set(match[1], match[2]);
  }
  const resource = aliases.get(reference.name);
  return resource === undefined || secretResources.includes(resource);
}

// The serving service must run as the runtime identity with the reviewed
// ingress cutover and no public invoker binding.
export function auditServiceIsolation(service, serviceIam, revision) {
  const annotations = service?.metadata?.annotations || {};
  if (service?.metadata?.name !== expected.service || annotations['run.googleapis.com/ingress'] !== expected.ingress) {
    return refuse('Service identity or ingress differs from the reviewed edge configuration.');
  }
  if (policyBindings(serviceIam).some(row => row.members.some(id => id === 'allUsers' || id === 'allAuthenticatedUsers'))) {
    return refuse('Service IAM contains a public principal.');
  }
  const name = currentRevision(service);
  const containers = revision?.spec?.containers;
  if (revision?.metadata?.name !== name || revision?.metadata?.labels?.['serving.knative.dev/service'] !== expected.service ||
      revision?.spec?.serviceAccountName !== expected.runtime || containers?.length !== 1) {
    return refuse('Serving revision is missing or does not use the reviewed runtime identity.');
  }
  const rows = containers[0].env;
  if (!Array.isArray(rows) || new Set(rows.map(row => row?.name)).size !== rows.length) return refuse('Serving revision environment is incomplete or ambiguous.');
  const env = new Map(rows.map(row => [row.name, row]));
  const settings = { FIREBASE_PROJECT_ID: expected.project, FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: expected.database };
  const secret = env.get('AUTH_RATE_LIMIT_KEY');
  const override = /^(?:GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_AUTH_EMULATOR_HOST|FIRESTORE_EMULATOR_HOST|FIREBASE_STORAGE_EMULATOR_HOST|STORAGE_EMULATOR_HOST|PUBSUB_EMULATOR_HOST)$/;
  if (Object.entries(settings).some(([key, value]) => env.get(key)?.value !== value || env.get(key)?.valueFrom) ||
      [...env.keys()].some(key => override.test(key)) || secret?.value !== undefined ||
      !matchesPinnedSecret(secret?.valueFrom?.secretKeyRef, revision.metadata.annotations?.['run.googleapis.com/secrets'])) {
    return refuse('Serving revision does not use the pinned realm, attached identity and secret version.');
  }
  const invokerCheck = annotations['run.googleapis.com/invoker-iam-disabled'] === 'true' ? 'disabled for the public edge' : 'enabled';
  return pass(`Serving revision identity, realm, version and edge ingress verified. Invoker IAM check is ${invokerCheck}.`);
}

// The CLI describes this explicit database as the attached runtime principal.
export function auditNamedDatabase(db) {
  if (!db) return refuse('named Firestore database was not resolved');
  if (db.name !== `projects/${expected.project}/databases/${expected.database}`) return refuse('Firestore returned a different database resource.');
  if (db.type !== expected.databaseType) return refuse('Firestore returned a database outside Native mode.');
  if (db.deleteTime) return refuse('database is deleted');
  return pass(`${db.name} type ${db.type}`);
}

function gcloud(args) {
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000, windowsHide: true,
    env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' } };
  if (process.platform === 'win32') {
    if (args.some(arg => typeof arg !== 'string' || /["&|<>^%!\r\n]/.test(arg) || arg.endsWith('\\'))) throw Error('Unsafe Windows gcloud argument.');
    return JSON.parse(execSync('gcloud.cmd ' + args.map(arg => `"${arg}"`).join(' '), options));
  }
  return JSON.parse(execFileSync('gcloud', args, options));
}

// Full read-only audit against the live project. Every check must pass for
// the audit to succeed. The verdict covers the resources read during this run.
export async function runAudit({ io = { gcloud }, project = expected.project, report = console.log } = {}) {
  if (project !== expected.project) throw Error('Audit is bound to the reviewed production project.');
  const results = [];
  const read = (...args) => io.gcloud([...args, '--project=' + project, '--format=json', '--quiet']);
  const accountPolicy = account => read('iam', 'service-accounts', 'get-iam-policy', account);
  const keys = account => read('iam', 'service-accounts', 'keys', 'list', '--iam-account=' + account, '--managed-by=user');
  const servicePolicy = () => read('run', 'services', 'get-iam-policy', expected.service, '--region=' + expected.region);
  let projectPolicy, runPolicy;
  const describe = (check, action) => {
    try { results.push({ check, ...action() }); }
    catch { results.push({ check, ...refuse('Read or validation failed. Verify Cloud SDK access and reviewed resource configuration.') }); }
  };

  describe('workload-identity', () => {
    const pool = read('iam', 'workload-identity-pools', 'describe', expected.pool, '--location=global');
    const scope = ['--workload-identity-pool=' + expected.pool, '--location=global'];
    const provider = read('iam', 'workload-identity-pools', 'providers', 'describe', expected.provider, ...scope);
    const providers = read('iam', 'workload-identity-pools', 'providers', 'list', ...scope);
    return auditWorkloadIdentityPool(pool, provider, providers);
  });
  describe('runtime-project-roles', () => {
    projectPolicy = read('projects', 'get-iam-policy', project);
    const runtime = read('iam', 'service-accounts', 'describe', expected.runtime);
    const runtimeKeys = keys(expected.runtime);
    if (runtime?.email !== expected.runtime || runtime.disabled || !Array.isArray(runtimeKeys) || runtimeKeys.length) {
      return refuse('Runtime account or user-managed key inventory differs from the reviewed identity.');
    }
    return auditRuntimeProjectIam(projectPolicy);
  });
  describe('runtime-secret-access', () => auditRuntimeSecretIam(read('secrets', 'get-iam-policy', expected.secret)));
  describe('deployer-federation-only', () => {
    runPolicy = servicePolicy();
    return auditDeployerIdentity({
      account: read('iam', 'service-accounts', 'describe', expected.deployer), keys: keys(expected.deployer),
      project: projectPolicy, deployer: accountPolicy(expected.deployer), service: runPolicy,
      repository: read('artifacts', 'repositories', 'get-iam-policy', expected.repository, '--location=' + expected.region),
      runtime: accountPolicy(expected.runtime),
    });
  });
  describe('secret-rotation', () => {
    const secret = read('secrets', 'describe', expected.secret);
    const version = read('secrets', 'versions', 'describe', expected.secretVersion, '--secret=' + expected.secret);
    return auditSecretRotation(secret, version);
  });
  describe('service-isolation', () => {
    const service = read('run', 'services', 'describe', expected.service, '--region=' + expected.region);
    const revision = currentRevision(service);
    if (!/^visionary-product-[a-z0-9-]{1,45}$/.test(revision)) return refuse('Serving revision name is outside the reviewed service.');
    return auditServiceIsolation(service, runPolicy ?? servicePolicy(), read('run', 'revisions', 'describe', revision, '--region=' + expected.region));
  });
  describe('named-firestore-database', () => auditNamedDatabase(read('firestore', 'databases', 'describe',
    '--database=' + expected.database, '--impersonate-service-account=' + expected.runtime)));

  const failed = results.filter(r => !r.pass);
  for (const r of results) report(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  report(failed.length ? `AUDIT FAILED: ${failed.length} check(s) refused.` : 'AUDIT PASSED: reviewed direct identity and environment metadata verified.');
  return { results, passed: failed.length === 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAudit().then(r => { if (!r.passed) process.exitCode = 1; }).catch(() => { console.error('Identity audit could not run.'); process.exitCode = 1; });
}
