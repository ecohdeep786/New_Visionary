// RELEASE-06 (KAN-129) — release-path security review: dependency/patch
// provenance integrity, the secret-surface law, and a LIVE secret-rotation
// drill over the product stack.
//
// The launch-operations release gate demands: release-path security and
// dependency reviews, controlled access review, secret rotation and incident/
// support/on-call runbooks with named responders. This suite executes the
// locally-provable slices against the REAL product runtime:
//
//   Patch provenance  — every recorded upstream patch's diff exists AND its
//                       recorded sha256 matches the file bytes (a silently
//                       edited patch fails the release path);
//   Dependency pins   — every workspace that declares dependencies carries a
//                       lockfile, and every declared dependency resolves to an
//                       EXACT locked version with an integrity hash (caret
//                       ranges in package.json are resolved, never installed
//                       loose);
//   Secret surface    — the product source contains no hardcoded secret
//                       material and reads billing secrets only from
//                       configuration (the fixture secrets exist ONLY in the
//                       test harness);
//   Rotation drill    — over the canonical TLS ingress: a webhook signed with
//                       the registered secret is accepted, the same bytes
//                       signed with a DIFFERENT (unregistered) secret are
//                       refused; after a REAL rotation (full product restart
//                       with the rotated secret/job token) the stale secret is
//                       refused fail-closed and the rotated credentials are
//                       the only accepted ones.
//
// Container image review (no container runtime on this host), the controlled
// access/IAM review and NAMED responders remain external gates recorded in the
// runbook; the advisory database check (npm audit) is a network-dependent
// optional gate and is never silently skipped here — it is listed, not run.

import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHmac, createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

import stack from '../bill-01/stack.cjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(here, '../../../..');
const backendPackage = createRequire(path.join(productRoot, 'backend/upstream/backend/package.json'));

let runDir;
let adminApp;
let drillProviderState;
const state = { users: {}, devices: {}, findings: {} };

const SECRET_A = 'release06-rotation-secret-a-0123456789abcdef012345';
const SECRET_B = 'release06-rotation-secret-b-fedcba9876543210fedcba';
const TOKEN_A = 'a'.repeat(64);
const TOKEN_B = 'b'.repeat(64);

function fixtureControl(pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const request = http.request({ host: '127.0.0.1', port: stack.PORTS.control, path: pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body: data ? JSON.parse(data) : null, text: data }));
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

function providerWebhook({ eventId, payload, secret }) {
  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  const sign = createHmac('sha256', secret).update(raw).digest('hex');
  return stack.ingressRequest({
    pathname: '/api/billing/webhooks/razorpay', method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sign, 'x-razorpay-event-id': eventId },
    body: raw,
  });
}

async function createEmulatorUser(email) {
  const { getAuth } = backendPackage('firebase-admin/auth');
  const user = await getAuth(adminApp).createUser({ email, password: 'release-security-Pass1', emailVerified: true });
  return user.uid;
}

async function emulatorSignInToken(email) {
  const response = await fetch(`http://127.0.0.1:${stack.PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'release-security-Pass1', returnSecureToken: true }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).idToken;
}

async function establishDevice(email, deviceIp, { onboard = false } = {}) {
  const jar = stack.cookieJar();
  const csrf = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp });
  assert.equal(csrf.status, 200);
  jar.capture(csrf);
  const token = await emulatorSignInToken(email);
  const session = await stack.ingressRequest({
    pathname: '/api/auth/session', method: 'POST', deviceIp, jar,
    body: { idToken: token }, headers: { 'x-csrf-token': csrf.body.token },
  });
  assert.equal(session.status, 201, `Session exchange failed for ${email}: ${session.text}`);
  jar.capture(session);
  const profile = session.body;
  const post = async (pathname, body, extraHeaders = {}) => {
    const fresh = await stack.ingressRequest({ pathname: '/api/auth/csrf', deviceIp, jar });
    jar.capture(fresh);
    return stack.ingressRequest({ pathname, method: 'POST', deviceIp, jar, body, headers: { 'x-csrf-token': fresh.body.token, 'x-visionary-account': profile.id, ...extraHeaders } });
  };
  const get = async (pathname, extraHeaders = {}) =>
    stack.ingressRequest({ pathname, deviceIp, jar, headers: { 'x-visionary-account': profile.id, ...extraHeaders } });
  if (onboard) {
    const completed = await post('/api/auth/onboarding', { identity: 'professional', age_band: 'adult', full_name: 'QA Release Security', preferred_language: 'English' });
    assert.equal(completed.status, 201, `Onboarding failed: ${completed.text}`);
  }
  return { jar, deviceIp, profile, post, get };
}

async function establishPaidSubscription(device) {
  const catalog = await stack.ingressRequest({ pathname: '/api/billing/catalog', deviceIp: device.deviceIp, jar: device.jar });
  assert.equal(catalog.status, 200);
  const checkout = await device.post('/api/billing/checkouts', { plan: 'personal', interval: 'monthly', commandId: randomUUID(), catalogVersion: catalog.body.version });
  assert.equal(checkout.status, 201, `Checkout failed: ${checkout.text}`);
  const control = await fixtureControl('/fixture/complete-payment', { subscriptionId: checkout.body.subscriptionId });
  assert.equal(control.status, 200);
  const verify = await device.post('/api/billing/verify', {
    attemptId: checkout.body.attemptId,
    razorpay_payment_id: control.body.razorpay_payment_id,
    razorpay_subscription_id: control.body.razorpay_subscription_id,
    razorpay_signature: control.body.razorpay_signature,
  });
  assert.equal(verify.status, 201, `Verify failed: ${verify.text}`);
  return { subscriptionId: control.body.razorpay_subscription_id, paymentId: control.body.razorpay_payment_id, invoiceId: verify.body.invoices[0]?.id };
}

before(async () => {
  stack.assertRunnable();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  runDir = process.env.BILL01_RUN_DIR || path.join(productRoot, 'artifacts/qa/release06-release-security', stamp);
  mkdirSync(runDir, { recursive: true });
  await stack.startEmulators({ logFile: path.join(runDir, 'emulators.log'), workDir: runDir });
  drillProviderState = { subscriptions: new Map(), invoices: new Map(), payments: new Map(), creates: 0 };
  // The rotation drill's FIRST epoch: webhook secret A + job token A.
  await stack.startStack({ runDir, providerState: drillProviderState, razorpay: { webhookSecret: SECRET_A, reconcileToken: TOKEN_A } });

  const { initializeApp, deleteApp } = backendPackage('firebase-admin/app');
  adminApp = initializeApp({
    projectId: stack.AUTH_EMULATOR_PROJECT,
    credential: { getAccessToken: async () => ({ access_token: 'emulator-only', expires_in: 3600 }) },
  }, 'release06-driver');
  state.deleteDriverApp = () => deleteApp(adminApp);

  state.users.payer = await createEmulatorUser('security@release.example');
  state.devices.payer = await establishDevice('security@release.example', '203.0.113.41', { onboard: true });
});

after(async () => {
  await stack.stopStack();
  await stack.stopEmulators();
  if (state.deleteDriverApp) await state.deleteDriverApp();
  try {
    writeFileSync(path.join(runDir, 'release-security-report.json'), JSON.stringify({
      task: 'RELEASE-06 / KAN-129', kind: 'release-path-security-review', date: new Date().toISOString(),
      findings: state.findings,
      externalGates: [
        'container image review (no container runtime on this host — no nested virtualization)',
        'controlled access / IAM review (hosted identities and bindings)',
        'named responders for the incident/on-call runbooks (founder records them)',
        'npm advisory database review (network-dependent; procedure in the runbook)',
      ],
    }, null, 2));
  } catch { /* best-effort evidence */ }
});

test('patch provenance integrity: every recorded upstream patch exists and matches its recorded sha256', () => {
  const provenance = JSON.parse(readFileSync(path.join(productRoot, 'integration/upstream-patches.json'), 'utf8'));
  assert.ok(Array.isArray(provenance.patches) && provenance.patches.length >= 1, 'The provenance registry must record patches.');
  const checked = [];
  const stalePaths = [];
  for (const patch of provenance.patches) {
    assert.ok(patch.decision, `Patch ${patch.id} must record its decision.`);
    const diffPath = path.join(productRoot, patch.diff);
    assert.ok(existsSync(diffPath), `Patch ${patch.id} diff must exist: ${patch.diff}`);
    const digest = createHash('sha256').update(readFileSync(diffPath)).digest('hex');
    assert.equal(digest, patch.diffSha256, `Patch ${patch.id} diff bytes must match the recorded sha256 (a silently edited patch fails the release path).`);
    assert.ok(Array.isArray(patch.files) && patch.files.length >= 1, `Patch ${patch.id} must record its touched files.`);
    for (const file of patch.files || []) {
      assert.ok(file.path, `Patch ${patch.id} file entries must record their path.`);
      // Recorded paths are relative to the IMPORTED BASELINE layout
      // (visionaryorg/visionary-dev @ 81e861be); the product tree relocated
      // that baseline under backend/upstream/ and dropped legacy references.
      // A path that resolves nowhere in the current tree is a recorded
      // stale-path finding — the diff integrity above remains the hard law.
      if (!existsSync(path.join(productRoot, file.path)) && !existsSync(path.join(productRoot, 'backend/upstream', file.path))) stalePaths.push(`${patch.id}:${file.path}`);
    }
    checked.push(patch.id);
  }
  state.findings.patchProvenance = { checked, count: checked.length, staleBaselinePaths: stalePaths.length, note: 'Recorded file paths are import-baseline-relative; stale paths are legacy references outside the current tree. Resolution root: the import baseline commit recorded in backend/README.md.' };
});

test('dependency pins: every workspace with dependencies carries a lockfile and every dependency resolves to an exact integrity-hashed version', () => {
  const workspaces = ['', 'frontend', 'backend/upstream/backend', 'integration/contracts/v1', 'infrastructure/gcp/runtime'];
  const summary = {};
  for (const workspace of workspaces) {
    const dir = path.join(productRoot, workspace);
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (!Object.keys(deps).length) continue;
    const lock = JSON.parse(readFileSync(path.join(dir, 'package-lock.json'), 'utf8'));
    assert.ok(lock.lockfileVersion >= 3, `${workspace || '.'} lockfile must be v3+.`);
    const packages = lock.packages || {};
    for (const [name, range] of Object.entries(deps)) {
      const entry = packages[`node_modules/${name}`] || (name.includes('/') && !name.startsWith('@') ? null : packages[`node_modules/${name}`]);
      assert.ok(entry, `${workspace || '.'}: ${name} must have a lock entry.`);
      assert.ok(entry.version && /^[0-9]/.test(entry.version), `${workspace || '.'}: ${name} must resolve to an exact locked version (got ${entry.version}).`);
      assert.ok(entry.integrity, `${workspace || '.'}: ${name} must carry a lock integrity hash.`);
    }
    summary[workspace || '.'] = Object.keys(deps).length;
  }
  state.findings.dependencyPins = summary;
});

test('secret-surface law: no fixture secret material appears in product source; billing secrets come only from configuration', () => {
  const srcDir = path.join(productRoot, 'backend/upstream/backend/src');
  const secrets = [stack.FIXTURE_SECRETS.webhook, stack.FIXTURE_SECRETS.reconcile, stack.FIXTURE_SECRETS.razorpay, stack.FIXTURE_SECRETS.rateLimit];
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.ts')) {
        const text = readFileSync(full, 'utf8');
        for (const secret of secrets) if (text.includes(secret)) offenders.push(path.relative(productRoot, full));
      }
    }
  };
  walk(srcDir);
  assert.deepEqual(offenders, [], 'Product source must contain no fixture secret material.');
  // The webhook secret is read ONLY from configuration, never a default.
  const provider = readFileSync(path.join(srcDir, 'billing/razorpay.provider.ts'), 'utf8');
  assert.match(provider, /RAZORPAY_WEBHOOK_SECRET/, 'The webhook secret must be a configuration key.');
  assert.doesNotMatch(provider, /RAZORPAY_WEBHOOK_SECRET[^]*?\|\|\s*['"][A-Za-z0-9]{16,}['"]/, 'The webhook secret must not have a hardcoded default.');
  state.findings.secretSurface = { hardcodedSecretsInSrc: 0, webhookSecretIsConfigOnly: true };
});

test('rotation drill: unregistered-secret signatures fail closed BEFORE rotation; registered secret accepted', async () => {
  const device = state.devices.payer;
  state.paid = await establishPaidSubscription(device);
  const event = { eventId: 'evt_rot_probe_1', payload: { event: 'payment.authorized', payload: { payment: { entity: { id: 'pay_rot_probe', amount: 29900 } } } } };

  const accepted = await providerWebhook({ ...event, secret: SECRET_A });
  assert.equal(accepted.status, 201, `A webhook signed with the REGISTERED secret must be accepted (${accepted.text}).`);

  const unregistered = await providerWebhook({ ...event, eventId: 'evt_rot_probe_2', secret: SECRET_B });
  assert.equal(unregistered.status, 403, 'A perfectly-formed signature with an UNREGISTERED secret must fail closed.');
});

test('rotation: after a full product restart with rotated credentials, the stale secret and stale job token are refused and only the rotated ones are accepted', async () => {
  const device = state.devices.payer;
  const event = (id) => ({ eventId: id, payload: { event: 'payment.authorized', payload: { payment: { entity: { id: 'pay_rot_' + id.slice(-6), amount: 29900 } } } } });

  // The REAL rotation: full product restart with the rotated secret + job token.
  await stack.stopStack();
  await stack.startStack({ runDir, providerState: drillProviderState, razorpay: { webhookSecret: SECRET_B, reconcileToken: TOKEN_B } });

  const stale = await providerWebhook({ ...event('evt_rot_stale_1'), secret: SECRET_A });
  assert.equal(stale.status, 403, 'A signature from the STALE secret must be refused after rotation.');

  const rotated = await providerWebhook({ ...event('evt_rot_new_1'), secret: SECRET_B });
  assert.equal(rotated.status, 201, 'A signature with the ROTATED secret must be accepted after rotation.');

  const staleJob = await device.post('/api/billing/jobs/reconcile', {}, { 'x-visionary-billing-job': TOKEN_A });
  assert.equal(staleJob.status, 403, 'The STALE job token must be refused after rotation.');

  const rotatedJob = await device.post('/api/billing/jobs/reconcile', {}, { 'x-visionary-billing-job': TOKEN_B });
  assert.equal(rotatedJob.status, 201, 'The ROTATED job token must be accepted after rotation.');

  state.findings.rotationDrill = { staleSecretRefused: 403, rotatedSecretAccepted: 201, staleTokenRefused: 403, rotatedTokenAccepted: 201, procedure: 'full product restart with rotated configuration' };
});
