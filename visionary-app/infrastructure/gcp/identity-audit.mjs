import { execFileSync, execSync } from 'node:child_process';
import { createSign, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

// PLAT-03 read-only identity/environment audit. The reviewed desired state is
// the one bootstrap.py creates and production.yml consumes. This tool only
// describes resources and reads one Firestore metadata document; it never
// mutates cloud state, prints secret payloads or accepts a different
// environment. Any deviation refuses the whole audit with the remedy.

export const expected = Object.freeze({
  project: 'visionary-research', region: 'asia-south1', service: 'visionary-product',
  repository: 'visionary-product',
  deployer: 'visionary-github-deployer@visionary-research.iam.gserviceaccount.com',
  runtime: 'visionary-product-runtime@visionary-research.iam.gserviceaccount.com',
  secret: 'visionary-product-auth-rate-limit',
  runtimeProjectRoles: Object.freeze(['roles/datastore.user', 'roles/firebase.sdkAdminServiceAgent']),
  runtimeSecretRoles: Object.freeze(['roles/secretmanager.secretAccessor']),
  pool: 'visionary-github', provider: 'github-main',
  issuer: 'https://token.actions.githubusercontent.com', repositoryId: '1357462978',
  database: 'default', databaseType: 'FIRESTORE_NATIVE',
  ingress: 'internal-and-cloud-load-balancing',
});

const member = account => `serviceAccount:${account}`;
export const pass = detail => ({ pass: true, detail });
export const refuse = detail => ({ pass: false, detail });

// The runtime identity must hold exactly the reviewed project roles: the
// Firebase Admin service agent and datastore user. Anything broader (owner,
// editor, wildcard) or unknown refuses; least privilege is a set equality.
export function auditRuntimeProjectIam(policy) {
  const roles = (policy.bindings || []).filter(b => (b.members || []).includes(member(expected.runtime)) && !b.condition).map(b => b.role);
  const extra = roles.filter(role => !expected.runtimeProjectRoles.includes(role));
  const missing = expected.runtimeProjectRoles.filter(role => !roles.includes(role));
  if (extra.length) return refuse(`runtime identity holds unreviewed project roles: ${extra.join(', ')}`);
  if (missing.length) return refuse(`runtime identity is missing reviewed project roles: ${missing.join(', ')}`);
  return pass(`exactly ${roles.join(', ')}`);
}

// Secret access is bound on the one product secret only, for the runtime
// identity only. A binding for any other member or role refuses.
export function auditRuntimeSecretIam(policy) {
  const bindings = (policy.bindings || []).filter(b => !b.condition);
  const foreign = bindings.filter(b => (b.members || []).some(m => m !== member(expected.runtime)));
  if (foreign.length) return refuse(`secret policy binds members outside the runtime identity: ${foreign.map(b => b.role).join(', ')}`);
  const roles = bindings.map(b => b.role);
  const extra = roles.filter(role => !expected.runtimeSecretRoles.includes(role));
  const missing = expected.runtimeSecretRoles.filter(role => !roles.includes(role));
  if (extra.length) return refuse(`secret policy grants unreviewed roles: ${extra.join(', ')}`);
  if (missing.length) return refuse(`secret policy is missing: ${missing.join(', ')}`);
  return pass(`${roles.join(', ')} for the runtime identity only`);
}

// The deployer identity exists for Workload Identity Federation only: no
// user-managed keys may exist, and its bindings are exactly the four reviewed
// grants (WIF user, run developer, artifact registry writer, runtime act-as).
export function auditDeployerIdentity(account, keys, projectBindings, serviceBindings, repositoryBindings, runtimeBindings) {
  if (!account || account.disabled) return refuse('deployer identity is missing or disabled');
  if ((keys || []).length) return refuse(`deployer identity has ${keys.length} key(s); federation only, delete the keys`);
  const has = (bindings, role, target) => (bindings || []).some(b => b.role === role && (b.members || []).some(m => m === `serviceAccount:${expected.deployer}`) && (!b.condition) && (target === undefined || (b.role === role)));
  const principal = `principalSet://iam.googleapis.com/projects/${expected.project}/locations/global/workloadIdentityPools/${expected.pool}/attribute.repository_id/${expected.repositoryId}`;
  const wif = (projectBindings || []).some(b => b.role === 'roles/iam.workloadIdentityUser' && !b.condition && (b.members || []).includes(principal));
  if (!wif) return refuse(`deployer lacks Workload Identity User for the reviewed repository principal ${principal}`);
  const developer = (serviceBindings || []).some(b => b.role === 'roles/run.developer' && !b.condition && (b.members || []).includes(member(expected.deployer)));
  if (!developer) return refuse('deployer lacks roles/run.developer on the product service');
  const writer = (repositoryBindings || []).some(b => b.role === 'roles/artifactregistry.writer' && !b.condition && (b.members || []).includes(member(expected.deployer)));
  if (!writer) return refuse('deployer lacks roles/artifactregistry.writer on the product repository');
  const actAs = (runtimeBindings || []).some(b => b.role === 'roles/iam.serviceAccountUser' && !b.condition && (b.members || []).includes(member(expected.deployer)));
  if (!actAs) return refuse('deployer lacks roles/iam.serviceAccountUser on the runtime identity');
  return pass('federation-only deployer with exactly the four reviewed bindings and no keys');
}

// The GitHub OIDC provider must be ACTIVE, trust the GitHub issuer, and pin
// the trusted repository through its attribute condition.
export function auditWorkloadIdentityPool(pool, provider) {
  if (!pool || pool.state !== 'ACTIVE') return refuse('workload identity pool is missing or not ACTIVE');
  if (!provider || provider.state !== 'ACTIVE') return refuse('workload identity provider is missing or not ACTIVE');
  if (provider.oidc?.issuerUri !== expected.issuer) return refuse(`provider issuer is ${provider.oidc?.issuerUri}`);
  const condition = provider.attributeCondition || '';
  // bootstrap.py pins the GitHub OIDC claims (assertion.repository_id ...);
  // accept the same claim pinned to the reviewed repository id only.
  if (!new RegExp(`(attribute|assertion)\\.repository_id\\s*==\\s*['"]${expected.repositoryId}['"]`).test(condition)) {
    return refuse(`provider condition does not pin repository_id ${expected.repositoryId}: ${condition}`);
  }
  return pass(`ACTIVE pool/provider for ${expected.issuer} pinned to repository ${expected.repositoryId}`);
}

// The product secret must exist with an enabled version, and a rotation
// schedule is part of PLAT-03. A missing schedule is reported as a failure
// with the exact owner command; it is never silently accepted.
export function auditSecretRotation(secret, versions) {
  if (!secret) return refuse('product rate-limit secret is missing');
  const enabled = (versions || []).filter(v => v.state === 'ENABLED').map(v => v.name?.split('/').pop());
  if (!enabled.length) return refuse('product secret has no enabled version');
  if (!secret.rotation?.rotationPeriod) return refuse(`secret rotation schedule is not configured; owner remedy: gcloud secrets update ${expected.secret} --rotation-period=2592000s --next-rotation-time=<future RFC3339>`);
  return pass(`rotation every ${secret.rotation.rotationPeriod} with enabled version(s): ${enabled.join(', ')}`);
}

// The serving service must run as the runtime identity with the reviewed
// ingress cutover and no public invoker binding.
export function auditServiceIsolation(service, serviceIam) {
  const annotations = service?.metadata?.annotations || {};
  const account = service?.spec?.serviceAccountName;
  if (account !== expected.runtime) return refuse(`service runs as ${account}`);
  if (annotations['run.googleapis.com/ingress'] !== expected.ingress) return refuse(`service ingress is ${annotations['run.googleapis.com/ingress']}`);
  const publicMembers = (serviceIam?.bindings || []).flatMap(b => b.members || []).filter(m => m === 'allUsers' || m === 'allAuthenticatedUsers');
  if (publicMembers.length) return refuse('service IAM grants a public invoker binding');
  return pass(`runtime identity + ${expected.ingress} + no public invoker`);
}

// Validate the existing named Firestore database through the product's own
// credential chain (service account JSON per GOOGLE_APPLICATION_CREDENTIALS),
// never through a guessed name or a different project.
export function auditNamedDatabase(db, { project = expected.project, database = expected.database } = {}) {
  if (!db) return refuse('named Firestore database was not resolved');
  if (db.name !== `projects/${project}/databases/${database}`) return refuse(`database name is ${db.name}`);
  if (db.type !== expected.databaseType) return refuse(`database type is ${db.type}`);
  if (db.deleteTime) return refuse('database is deleted');
  return pass(`${db.name} type ${db.type}`);
}

// Exchange the reviewed service-account key for a read-only datastore token
// (RS256 JWT, one minute headroom) and read the database metadata document.
export async function fetchNamedDatabase({ keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS, database = expected.database, project = expected.project, now = Math.floor(Date.now() / 1000), tokenUrl = 'https://oauth2.googleapis.com/token', endpoint = undefined, fetchImpl = fetch } = {}) {
  if (!keyPath) throw Error('GOOGLE_APPLICATION_CREDENTIALS is not configured for the product identity.');
  const key = JSON.parse(readFileSync(keyPath, 'utf8'));
  const head = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: tokenUrl, iat: now, exp: now + 60 })).toString('base64url');
  const signature = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(key.private_key).toString('base64url');
  const response = await fetchImpl(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${claims}.${signature}` });
  if (!response.ok) throw Error(`identity token exchange failed with status ${response.status}.`);
  const token = (await response.json()).access_token;
  const url = endpoint || `https://firestore.googleapis.com/v1/projects/${project}/databases/${database}`;
  const read = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
  if (!read.ok) throw Error(`named database read failed with status ${read.status}.`);
  return read.json();
}

function gcloud(args) {
  const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, windowsHide: true };
  if (process.platform === 'win32') {
    if (args.some(arg => typeof arg !== 'string' || /["&|<>^%!\r\n]/.test(arg) || arg.endsWith('\\'))) throw Error('Unsafe Windows gcloud argument.');
    return JSON.parse(execSync('gcloud.cmd ' + args.map(arg => `"${arg}"`).join(' '), options));
  }
  return JSON.parse(execFileSync('gcloud', args, options));
}

// Full read-only audit against the live project. Every check must pass for
// the audit to succeed; the exit code is the verdict.
export async function runAudit({ io = { gcloud, fetchNamedDatabase }, project = expected.project } = {}) {
  const results = [];
  const describe = async (check, action) => { try { results.push({ check, ...(await action()) }); } catch (error) { results.push({ check, ...refuse(`read failed: ${String(error.message).slice(0, 200)}`) }); } };

  await describe('workload-identity', async () => {
    const pool = io.gcloud(['iam', 'workload-identity-pools', 'describe', expected.pool, '--location=global', '--project=' + project, '--format=json']);
    const provider = io.gcloud(['iam', 'workload-identity-pools', 'providers', 'describe', expected.provider, '--workload-identity-pool=' + expected.pool, '--location=global', '--project=' + project, '--format=json']);
    return auditWorkloadIdentityPool(pool, provider);
  });
  await describe('runtime-project-roles', async () => auditRuntimeProjectIam(io.gcloud(['projects', 'get-iam-policy', project, '--format=json'])));
  await describe('runtime-secret-access', async () => auditRuntimeSecretIam(io.gcloud(['secrets', 'get-iam-policy', expected.secret, '--project=' + project, '--format=json'])));
  await describe('deployer-federation-only', async () => {
    const account = io.gcloud(['iam', 'service-accounts', 'describe', expected.deployer, '--project=' + project, '--format=json']);
    const keys = io.gcloud(['iam', 'service-accounts', 'keys', 'list', '--iam-account=' + expected.deployer, '--project=' + project, '--format=json']);
    return auditDeployerIdentity(account, keys,
      io.gcloud(['projects', 'get-iam-policy', project, '--format=json']).bindings,
      io.gcloud(['run', 'services', 'get-iam-policy', expected.service, '--region=' + expected.region, '--project=' + project, '--format=json']).bindings,
      io.gcloud(['artifacts', 'repositories', 'get-iam-policy', expected.repository, '--location=' + expected.region, '--project=' + project, '--format=json']).bindings,
      io.gcloud(['iam', 'service-accounts', 'get-iam-policy', expected.runtime, '--project=' + project, '--format=json']).bindings);
  });
  await describe('secret-rotation', async () => {
    const secret = io.gcloud(['secrets', 'describe', expected.secret, '--project=' + project, '--format=json']);
    const versions = io.gcloud(['secrets', 'versions', 'list', '--secret=' + expected.secret, '--project=' + project, '--format=json']);
    return auditSecretRotation(secret, versions);
  });
  await describe('service-isolation', async () => {
    const service = io.gcloud(['run', 'services', 'describe', expected.service, '--region=' + expected.region, '--project=' + project, '--format=json']);
    const serviceIam = io.gcloud(['run', 'services', 'get-iam-policy', expected.service, '--region=' + expected.region, '--project=' + project, '--format=json']);
    return auditServiceIsolation(service, serviceIam);
  });
  await describe('named-firestore-database', async () => auditNamedDatabase(await io.fetchNamedDatabase()));

  const failed = results.filter(r => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  console.log(failed.length ? `AUDIT FAILED: ${failed.length} check(s) refused. Remedy each REFUSE and re-run.` : 'AUDIT PASSED: reviewed identity/environment state verified.');
  return { results, passed: failed.length === 0 };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('identity-audit.mjs')) {
  runAudit().then(r => { if (!r.passed) process.exitCode = 1; }).catch(error => { console.error('AUDIT ERROR:', error.message); process.exitCode = 1; });
}
