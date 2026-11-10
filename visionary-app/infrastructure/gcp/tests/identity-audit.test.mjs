import test from 'node:test';
import assert from 'node:assert/strict';
import { expected, auditRuntimeProjectIam, auditRuntimeSecretIam, auditDeployerIdentity, auditWorkloadIdentityPool, auditSecretRotation, auditServiceIsolation, auditNamedDatabase, fetchNamedDatabase, runAudit } from '../identity-audit.mjs';

const runtimeMember = `serviceAccount:${expected.runtime}`;
const deployerMember = `serviceAccount:${expected.deployer}`;
const principal = `principalSet://iam.googleapis.com/projects/${expected.project}/locations/global/workloadIdentityPools/${expected.pool}/attribute.repository_id/${expected.repositoryId}`;

test('runtime project roles must equal the reviewed set exactly', () => {
  assert.equal(auditRuntimeProjectIam({ bindings: expected.runtimeProjectRoles.map(role => ({ role, members: [runtimeMember] })) }).pass, true);
  assert.match(auditRuntimeProjectIam({ bindings: [...expected.runtimeProjectRoles.map(role => ({ role, members: [runtimeMember] })), { role: 'roles/editor', members: [runtimeMember] }] }).detail, /unreviewed project roles: roles\/editor/);
  assert.match(auditRuntimeProjectIam({ bindings: [{ role: 'roles/datastore.user', members: [runtimeMember] }] }).detail, /missing reviewed project roles: roles\/firebase\.sdkAdminServiceAgent/);
  // a conditional binding grants nothing unconditionally and must not satisfy the audit
  assert.match(auditRuntimeProjectIam({ bindings: expected.runtimeProjectRoles.map(role => ({ role, members: [runtimeMember], condition: { title: 'x' } })) }).detail, /missing reviewed project roles/);
  // an EXTRA conditioned role is outside the reviewed unconditional law even
  // when every reviewed role is already held unconditionally
  assert.match(
    auditRuntimeProjectIam({ bindings: [...expected.runtimeProjectRoles.map(role => ({ role, members: [runtimeMember] })), { role: 'roles/editor', members: [runtimeMember], condition: { title: 'temp' } }] }).detail,
    /unreviewed conditional project roles: roles\/editor/,
  );
});

test('secret policy admits only the runtime identity with the accessor role', () => {
  assert.equal(auditRuntimeSecretIam({ bindings: [{ role: 'roles/secretmanager.secretAccessor', members: [runtimeMember] }] }).pass, true);
  assert.match(auditRuntimeSecretIam({ bindings: [{ role: 'roles/secretmanager.secretAccessor', members: [runtimeMember, 'serviceAccount:someone@visionary-research.iam.gserviceaccount.com'] }] }).detail, /outside the runtime identity/);
  assert.match(auditRuntimeSecretIam({ bindings: [{ role: 'roles/secretmanager.viewer', members: [runtimeMember] }] }).detail, /unreviewed roles: roles\/secretmanager\.viewer/);
  assert.match(auditRuntimeSecretIam({ bindings: [] }).detail, /missing: roles\/secretmanager\.secretAccessor/);
});

test('deployer must be a federation-only identity with exactly the four reviewed bindings', () => {
  const good = { account: { email: expected.deployer, disabled: false }, keys: [],
    projectBindings: [{ role: 'roles/iam.workloadIdentityUser', members: [principal] }],
    serviceBindings: [{ role: 'roles/run.developer', members: [deployerMember] }],
    repositoryBindings: [{ role: 'roles/artifactregistry.writer', members: [deployerMember] }],
    runtimeBindings: [{ role: 'roles/iam.serviceAccountUser', members: [deployerMember] }] };
  assert.equal(auditDeployerIdentity(good.account, good.keys, good.projectBindings, good.serviceBindings, good.repositoryBindings, good.runtimeBindings).pass, true);
  assert.match(auditDeployerIdentity({ email: expected.deployer, disabled: true }, [], [], [], [], []).detail, /disabled/);
  assert.match(auditDeployerIdentity(good.account, [{ name: 'key1' }], good.projectBindings, good.serviceBindings, good.repositoryBindings, good.runtimeBindings).detail, /1 key\(s\); federation only/);
  const wrongRepo = good.projectBindings.map(b => ({ ...b, members: [principal.replace(expected.repositoryId, '999')] }));
  assert.match(auditDeployerIdentity(good.account, [], wrongRepo, good.serviceBindings, good.repositoryBindings, good.runtimeBindings).detail, /lacks Workload Identity User/);
  assert.match(auditDeployerIdentity(good.account, [], good.projectBindings, [], good.repositoryBindings, good.runtimeBindings).detail, /lacks roles\/run\.developer/);
  assert.match(auditDeployerIdentity(good.account, [], good.projectBindings, good.serviceBindings, [], good.runtimeBindings).detail, /lacks roles\/artifactregistry\.writer/);
  assert.match(auditDeployerIdentity(good.account, [], good.projectBindings, good.serviceBindings, good.repositoryBindings, []).detail, /lacks roles\/iam\.serviceAccountUser/);
});

test('workload identity pool and provider must be ACTIVE, GitHub-issued and repository-pinned', () => {
  const pool = { state: 'ACTIVE' };
  const provider = { state: 'ACTIVE', oidc: { issuerUri: expected.issuer }, attributeCondition: `assertion.repository_id == '${expected.repositoryId}'` };
  assert.equal(auditWorkloadIdentityPool(pool, provider).pass, true);
  assert.match(auditWorkloadIdentityPool({ state: 'REOPERATION_REQUIRED' }, provider).detail, /not ACTIVE/);
  assert.match(auditWorkloadIdentityPool(pool, { ...provider, state: 'ACTIVE', oidc: { issuerUri: 'https://evil.example' } }).detail, /provider issuer is/);
  assert.match(auditWorkloadIdentityPool(pool, { ...provider, attributeCondition: `assertion.repository == 'other/repo'` }).detail, /does not pin repository_id/);
  // the exact conjunction bootstrap.py writes and the live provider carries
  // must pass: repository pin + owner + ref + workflow + parenthesised event
  // disjunction (the only || lives inside parentheses)
  const reviewedCondition = "assertion.repository_id == '1357462978' && " +
    "assertion.repository_owner_id == '221676162' && " +
    "assertion.ref == 'refs/heads/main' && " +
    "assertion.workflow_ref == 'ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main' && " +
    "(assertion.event_name == 'push' || assertion.event_name == 'workflow_dispatch')";
  assert.equal(auditWorkloadIdentityPool(pool, { ...provider, attributeCondition: reviewedCondition }).pass, true);
  // a second repository disjunct widens trust beyond the reviewed repository
  assert.match(
    auditWorkloadIdentityPool(pool, { ...provider, attributeCondition: `assertion.repository_id == '${expected.repositoryId}' || assertion.repository_id == '9999999'` }).detail,
    /does not pin repository_id 1357462978 exclusively/,
  );
  // a top-level disjunction could bypass the pin entirely (the second arm
  // alone grants tokens), even though the reviewed pin also appears
  assert.match(
    auditWorkloadIdentityPool(pool, { ...provider, attributeCondition: `assertion.repository_id == '${expected.repositoryId}' || assertion.repository_owner_id == '221676162'` }).detail,
    /top-level disjunction/,
  );
  // a parenthesised repository disjunct is still a widening: two repository_id
  // equalities of different values must refuse even when nested
  assert.match(
    auditWorkloadIdentityPool(pool, { ...provider, attributeCondition: `(assertion.repository_id == '${expected.repositoryId}' || assertion.repository_id == '9999999') && assertion.ref == 'refs/heads/main'` }).detail,
    /does not pin repository_id 1357462978 exclusively/,
  );
});

test('secret rotation is required and a missing schedule refuses with the owner remedy', () => {
  assert.equal(auditSecretRotation({ rotation: { rotationPeriod: '2592000s' } }, [{ state: 'ENABLED', name: `projects/p/secrets/${expected.secret}/versions/1` }]).pass, true);
  const refused = auditSecretRotation({}, [{ state: 'ENABLED', name: `projects/p/secrets/${expected.secret}/versions/1` }]);
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /rotation schedule is not configured; owner remedy: gcloud secrets update/);
  assert.match(auditSecretRotation({ rotation: { rotationPeriod: '2592000s' } }, [{ state: 'DISABLED', name: 'v1' }]).detail, /no enabled version/);
});

test('service isolation requires the runtime identity, cutover ingress and no public invoker', () => {
  const service = { metadata: { annotations: { 'run.googleapis.com/ingress': expected.ingress } }, spec: { serviceAccountName: expected.runtime } };
  assert.equal(auditServiceIsolation(service, {}).pass, true);
  assert.match(auditServiceIsolation({ ...service, spec: { serviceAccountName: 'other@visionary-research.iam.gserviceaccount.com' } }, {}).detail, /service runs as other@/);
  assert.match(auditServiceIsolation({ metadata: { annotations: { 'run.googleapis.com/ingress': 'all' } }, spec: { serviceAccountName: expected.runtime } }, {}).detail, /ingress is all/);
  assert.match(auditServiceIsolation(service, { bindings: [{ role: 'roles/run.invoker', members: ['allUsers'] }] }).detail, /public invoker binding/);
});

test('the named Firestore database must be the reviewed native database, never a guess', () => {
  assert.equal(auditNamedDatabase({ name: `projects/${expected.project}/databases/default`, type: 'FIRESTORE_NATIVE' }).pass, true);
  assert.match(auditNamedDatabase({ name: 'projects/other-project/databases/default', type: 'FIRESTORE_NATIVE' }).detail, /database name is/);
  assert.match(auditNamedDatabase({ name: `projects/${expected.project}/databases/default`, type: 'DATASTORE_MODE' }).detail, /database type is DATASTORE_MODE/);
  assert.match(auditNamedDatabase({ name: `projects/${expected.project}/databases/default`, type: 'FIRESTORE_NATIVE', deleteTime: '2026-01-01T00:00:00Z' }).detail, /deleted/);
  assert.equal(auditNamedDatabase(undefined).pass, false);
});

test('the database read uses the product credential chain and read-only datastore scope', async () => {
  // keyPath stays undefined -> explicit refusal, never a guessed identity
  await assert.rejects(fetchNamedDatabase({ fetchImpl: async () => { throw new Error('should not fetch'); } }), /GOOGLE_APPLICATION_CREDENTIALS is not configured/);

  // Full offline contract with a real RSA key: the tool must build an RS256
  // JWT for the key's service account with the read-only datastore scope and
  // a one-minute expiry, exchange it at the token endpoint, and present the
  // resulting bearer token to the reviewed Firestore metadata URL only.
  const { generateKeyPairSync } = await import('node:crypto');
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const dir = mkdtempSync(join(tmpdir(), 'identity-audit-test-'));
  const keyPath = join(dir, 'sa.json');
  writeFileSync(keyPath, JSON.stringify({ client_email: expected.runtime, private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }));
  try {
    const now = 1_700_000_000;
    const tokenCalls = [];
    const readCalls = [];
    const fetchImpl = async (url, options = {}) => {
      if (url === 'https://token.test/') {
        tokenCalls.push({ url, body: options.body });
        return { ok: true, json: async () => ({ access_token: 'issued-token' }) };
      }
      readCalls.push({ url, authorization: options.headers && options.headers.Authorization });
      return { ok: true, json: async () => ({ name: `projects/${expected.project}/databases/${expected.database}`, type: 'FIRESTORE_NATIVE' }) };
    };
    const db = await fetchNamedDatabase({ keyPath, now, tokenUrl: 'https://token.test/', endpoint: 'https://firestore.test/v1/read', fetchImpl });
    assert.equal(db.name, `projects/${expected.project}/databases/${expected.database}`);
    assert.equal(tokenCalls.length, 1);
    const assertion = new URLSearchParams(tokenCalls[0].body).get('assertion');
    const [headB64, claimsB64] = assertion.split('.');
    assert.equal(JSON.parse(Buffer.from(headB64, 'base64url').toString()).alg, 'RS256');
    const claims = JSON.parse(Buffer.from(claimsB64, 'base64url').toString());
    assert.equal(claims.iss, expected.runtime);
    assert.equal(claims.scope, 'https://www.googleapis.com/auth/datastore');
    assert.equal(claims.aud, 'https://token.test/');
    assert.equal(claims.exp - claims.iat, 60);
    assert.equal(claims.iat, now);
    // the assertion must carry a verifiable RS256 signature over head.claims
    const verifier = (await import('node:crypto')).createVerify('RSA-SHA256');
    verifier.update(`${headB64}.${claimsB64}`);
    assert.equal(verifier.verify(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), Buffer.from(assertion.split('.')[2], 'base64url')), true);
    assert.deepEqual(readCalls, [{ url: 'https://firestore.test/v1/read', authorization: 'Bearer issued-token' }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  // a failed token exchange refuses and never reads the database
  const secondKey = join(mkdtempSync(join(tmpdir(), 'identity-audit-test-')), 'sa.json');
  writeFileSync(secondKey, JSON.stringify({ client_email: expected.runtime, private_key: (generateKeyPairSync('rsa', { modulusLength: 2048 })).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }));
  try {
    await assert.rejects(
      fetchNamedDatabase({ keyPath: secondKey, now: 1_700_000_000, tokenUrl: 'https://token.test/', fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({}) }) }),
      /identity token exchange failed with status 400/,
    );
  } finally {
    rmSync(join(secondKey, '..'), { recursive: true, force: true });
  }
});

test('full audit fails closed when any check refuses and passes when all agree', async () => {
  const gcloudOk = () => { throw new Error('unused'); };
  const passing = {
    gcloud: args => {
      const a = args.join(' ');
      if (a.includes('workload-identity-pools providers describe')) return { state: 'ACTIVE', oidc: { issuerUri: expected.issuer }, attributeCondition: "assertion.repository_id == '1357462978' && assertion.repository_owner_id == '221676162' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main' && (assertion.event_name == 'push' || assertion.event_name == 'workflow_dispatch')" };
      if (a.includes('workload-identity-pools describe')) return { state: 'ACTIVE' };
      if (a.includes('projects get-iam-policy') && a.includes('get-iam-policy')) return { bindings: [...expected.runtimeProjectRoles.map(role => ({ role, members: [runtimeMember] })), { role: 'roles/iam.workloadIdentityUser', members: [principal] }] };
      if (a.includes('secrets get-iam-policy')) return { bindings: [{ role: 'roles/secretmanager.secretAccessor', members: [runtimeMember] }] };
      if (a.includes('service-accounts describe')) return { email: expected.deployer, disabled: false };
      if (a.includes('keys list')) return [];
      if (a.includes('run services get-iam-policy')) return { bindings: [{ role: 'roles/run.developer', members: [deployerMember] }] };
      if (a.includes('artifacts repositories get-iam-policy')) return { bindings: [{ role: 'roles/artifactregistry.writer', members: [deployerMember] }] };
      if (a.includes('service-accounts get-iam-policy')) return { bindings: [{ role: 'roles/iam.serviceAccountUser', members: [deployerMember] }] };
      if (a.includes('secrets describe')) return { rotation: { rotationPeriod: '2592000s' } };
      if (a.includes('versions list')) return [{ state: 'ENABLED', name: `projects/p/secrets/${expected.secret}/versions/1` }];
      if (a.includes('run services describe')) return { metadata: { annotations: { 'run.googleapis.com/ingress': expected.ingress } }, spec: { serviceAccountName: expected.runtime } };
      throw new Error('unexpected gcloud call: ' + a);
    },
    fetchNamedDatabase: async () => ({ name: `projects/${expected.project}/databases/${expected.database}`, type: 'FIRESTORE_NATIVE' }),
  };
  const ok = await runAudit({ io: passing });
  assert.equal(ok.passed, true, JSON.stringify(ok.results));
  assert.equal(ok.results.length, 7);
  void gcloudOk;

  const failing = { ...passing, fetchNamedDatabase: async () => ({ name: `projects/${expected.project}/databases/other`, type: 'FIRESTORE_NATIVE' }) };
  const bad = await runAudit({ io: failing });
  assert.equal(bad.passed, false);
  assert.equal(bad.results.find(r => r.check === 'named-firestore-database').pass, false);

  const unauthenticated = { ...passing, gcloud: () => { throw new Error('Reauthentication failed. cannot prompt during non-interactive execution.'); } };
  const refused = await runAudit({ io: unauthenticated });
  assert.equal(refused.passed, false);
  assert.equal(refused.results.filter(r => !r.pass && /read failed/.test(r.detail)).length >= 6, true);
});
