// RELEASE-02 (KAN-125) realistic load/soak stack.
//
// Composes the real production HTTP composition (configureProductionHttp) over
// the real product controllers/services with the authorized local identity
// plane: the Firebase Auth Emulator (real token/session semantics) and the
// Firestore emulator (durable records). A real TLS terminator fronts the
// loopback product server so load arrives over the canonical
// https://visionary.org.in origin with `__Host-` secure cookies, HSTS and
// Origin/CSRF enforcement exactly as a hosted edge would present them.
//
// The controller set covers the connected non-SQL core surface plus the durable
// learning loop (the AI-run substitute), consent and privacy, and the public
// price catalog. SQL-backed projections (overview, submissions) are NOT
// composed here: a full SQL pool budget belongs to the hosted/staging capacity
// gate, and this stack never fabricates a SQL authority.
//
// Fixture-only by construction: the fictional payment provider stands in for
// Razorpay unless explicit founder-supplied test credentials are provided, no
// live project, credential file or provider is contacted, and every process
// binds loopback only. This stack never proves hosted acceptance or hosted
// capacity.

const { spawn, spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { randomBytes, createHash } = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const tls = require('node:tls');
const path = require('node:path');
const { tmpdir } = require('node:os');

const productRoot = path.resolve(__dirname, '../../../..');
const backend = path.join(productRoot, 'backend/upstream/backend');
const req = createRequire(path.join(backend, 'package.json'));

const CANONICAL_ORIGIN = 'https://visionary.org.in';
const HOSTNAME = 'visionary.org.in';
const AUTH_EMULATOR_PROJECT = 'demo-visionary-auth';
const FIREBASE_TOOLS_VERSION = '15.33.0';

const PORTS = {
  auth: Number(process.env.LOAD02_AUTH_PORT || 9099),
  firestore: Number(process.env.LOAD02_FIRESTORE_PORT || 8080),
  hub: Number(process.env.LOAD02_HUB_PORT || 4400),
  product: Number(process.env.LOAD02_PRODUCT_PORT || 3911),
  ingress: Number(process.env.LOAD02_INGRESS_PORT || 443),
  control: Number(process.env.LOAD02_CONTROL_PORT || 3913),
};

function environmentFailure(message, guidance) {
  const error = new Error(`BLOCKED_ENVIRONMENT: ${message}`);
  error.guidance = guidance;
  error.blocked = 'BLOCKED_ENVIRONMENT';
  return error;
}

function discoverJava() {
  const candidates = [];
  if (process.env.LOAD02_JAVA_HOME) candidates.push(path.join(process.env.LOAD02_JAVA_HOME, 'bin', 'java.exe'));
  if (process.env.JAVA_HOME) candidates.push(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'));
  const tools = 'C:/Users/Administrator/nv-tools';
  if (existsSync(tools)) {
    const { readdirSync } = require('node:fs');
    for (const entry of readdirSync(tools)) {
      if (/^jdk-.*-jre/.test(entry)) candidates.push(path.join(tools, entry, 'bin', 'java.exe'));
    }
  }
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

function discoverOpenssl() {
  if (process.env.LOAD02_OPENSSL && existsSync(process.env.LOAD02_OPENSSL)) return process.env.LOAD02_OPENSSL;
  for (const candidate of ['C:/Program Files/Git/usr/bin/openssl.exe', 'C:/Program Files/Git/mingw64/bin/openssl.exe']) {
    if (existsSync(candidate)) return candidate;
  }
  const probe = spawnSync('openssl', ['version'], { shell: true, windowsHide: true });
  if (probe.status === 0) return 'openssl';
  return null;
}

function assertRunnable() {
  const dist = path.join(backend, 'dist/src/main-auth.js');
  if (!existsSync(dist)) {
    throw environmentFailure('the compiled product runtime is missing', 'Run `npm run backend:build` from visionary-app before this acceptance.');
  }
  if (!discoverJava()) {
    throw environmentFailure('a Java runtime is required by the Firestore emulator', 'Install a Temurin 21+ JRE and set LOAD02_JAVA_HOME (or JAVA_HOME) to its home directory.');
  }
  if (!discoverOpenssl()) {
    throw environmentFailure('openssl is required to mint the local TLS terminator certificate', 'Install Git for Windows (ships openssl) or set LOAD02_OPENSSL to an openssl executable.');
  }
}

// --- Emulator lifecycle ------------------------------------------------ //

let emulatorProcess = null;
let emulatorLog = null;
let emulatorConfigDir = null;

async function startEmulators({ importDir, exportDir, logFile, workDir }) {
  if (emulatorProcess) throw Error('Emulators are already running.');
  for (const [name, port] of Object.entries(PORTS)) {
    if (await portBusy(port)) throw environmentFailure(`port ${port} (${name}) is already in use`, 'Free the port or override it via BILL01_*_PORT before running this acceptance.');
  }
  const java = discoverJava();
  const javaHome = path.dirname(path.dirname(java));
  // Isolated emulator configuration: never the repository firebase.json or the
  // live .firebaserc project. The demo project keeps every identity synthetic.
  // The fixture rules allow the driver's independent REST reads; the product
  // itself always uses the Admin SDK, which bypasses rules exactly as hosted.
  const configDir = path.join(workDir, 'emulator-config');
  mkdirSync(configDir, { recursive: true });
  writeFileSync(path.join(configDir, 'firebase.json'), JSON.stringify({
    firestore: { rules: path.join(configDir, 'firestore.rules') },
    emulators: { auth: { port: PORTS.auth }, firestore: { port: PORTS.firestore }, hub: { port: PORTS.hub }, singleProjectMode: true },
  }, null, 2));
  writeFileSync(path.join(configDir, 'firestore.rules'), "rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }\n");
  writeFileSync(path.join(configDir, '.firebaserc'), JSON.stringify({ projects: { default: AUTH_EMULATOR_PROJECT } }));
  const args = ['--yes', `firebase-tools@${FIREBASE_TOOLS_VERSION}`, 'emulators:start', '--only', 'auth,firestore'];
  if (importDir) args.push('--import', importDir);
  if (exportDir) args.push('--export-on-exit', exportDir);
  emulatorLog = logFile;
  emulatorConfigDir = configDir;
  emulatorProcess = spawn('npx', args, {
    shell: true, windowsHide: true, cwd: configDir,
    env: { ...process.env, JAVA_HOME: javaHome, PATH: `${path.dirname(java)};${process.env.PATH}`, FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTS.auth}` },
    stdio: ['ignore', logFile ? 'pipe' : 'ignore', logFile ? 'pipe' : 'ignore'],
  });
  if (logFile) {
    const { openSync, appendFileSync, closeSync } = require('node:fs');
    const fd = openSync(logFile, 'a');
    emulatorProcess.stdout.on('data', d => appendFileSync(fd, d));
    emulatorProcess.stderr.on('data', d => appendFileSync(fd, d));
    emulatorProcess.on('exit', code => { try { closeSync(fd); } catch {} });
  }
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (emulatorProcess.exitCode !== null) throw Error(`Firebase emulators exited early (code ${emulatorProcess.exitCode}). See ${logFile || 'emulator output'}.`);
    if (await hubReady()) return;
    await delay(1000);
  }
  throw Error('Firebase emulators did not become ready within 120 seconds.');
}

async function hubReady() {
  try {
    // The hub answers before the individual emulators bind their ports; the
    // acceptance may only proceed once every service actually accepts.
    if (!(await portBusy(PORTS.auth)) || !(await portBusy(PORTS.firestore))) return false;
    const body = await hubRequest('GET', '/emulators');
    return body && typeof body === 'object';
  } catch { return false; }
}

function hubRequest(method, pathname, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({ host: '127.0.0.1', port: PORTS.hub, path: pathname, method,
      headers: body ? { 'Content-Type': 'application/json' } : {} }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode >= 300) { reject(Error(`Hub ${method} ${pathname} failed with ${response.statusCode}: ${data.slice(0, 200)}`)); return; }
        try { resolve(data ? JSON.parse(data) : {}); } catch { resolve(data); }
      });
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function exportEmulators(exportDir) {
  if (!emulatorConfigDir) throw Error('The emulators are not running; there is nothing to export.');
  mkdirSync(exportDir, { recursive: true });
  const java = discoverJava();
  // firebase-tools 15 removed the hub export HTTP route; the CLI export
  // command performs the same durable export against the running hub.
  const result = spawnSync('npx', ['--yes', `firebase-tools@${FIREBASE_TOOLS_VERSION}`, 'emulators:export', exportDir, '--force', '--only', 'auth,firestore'], {
    shell: true, windowsHide: true, cwd: emulatorConfigDir, timeout: 120000,
    env: { ...process.env, JAVA_HOME: path.dirname(path.dirname(java)), PATH: `${path.dirname(java)};${process.env.PATH}` },
  });
  if (result.status !== 0 || !existsSync(path.join(exportDir, 'firestore_export'))) {
    throw Error(`The emulator export failed (status ${result.status}). See the acceptance run log.`);
  }
  return exportDir;
}

async function stopEmulators() {
  if (!emulatorProcess) return;
  try { await hubRequest('POST', '/emulators/stop'); } catch { /* fall through to termination */ }
  const child = emulatorProcess;
  emulatorProcess = null;
  const deadline = Date.now() + 15000;
  while (child.exitCode === null && Date.now() < deadline) await delay(500);
  if (child.exitCode === null) {
    // The npx shell wrapper parents the whole emulator tree; terminate it all.
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { windowsHide: true });
    } else {
      try { child.kill('SIGKILL'); } catch {}
    }
  }
  await delay(1000);
}

// --- Product composition over the canonical HTTPS ingress -------------- //

const FIXTURE_SECRETS = {
  rateLimit: 'release02-load-rate-limit-secret-0123456789abcdef',
  razorpay: 'release02-load-fixture-razorpay-key-secret-0123456789abcdef',
  webhook: 'release02-load-fixture-webhook-secret-0123456789abcdef',
  release: 'b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
};

let stack = null;

async function startStack({ runDir, providerMode = 'fixture', razorpay = {} } = {}) {
  if (stack) throw Error('The acceptance stack is already running.');
  if (!existsSync(path.join(backend, 'dist/src/main-auth.js'))) {
    throw environmentFailure('the compiled product runtime is missing', 'Run `npm run backend:build` from visionary-app before this acceptance.');
  }
  // The deployed API image compiles with `tsc -p tsconfig.product.json`, which
  // INCLUDES src/privacycore/privacy-preservation-policy.v1.json as a `files`
  // entry. The repo-local `nest build` used by `npm run backend:build` does not
  // emit that JSON, so this harness copies it next to the compiled controller
  // exactly where the real image places it — otherwise the policy route would
  // 503 here for a build-mode reason that does not exist in production.
  const policyAsset = path.join(backend, 'dist/src/privacycore/privacy-preservation-policy.v1.json');
  if (!existsSync(policyAsset)) {
    mkdirSync(path.dirname(policyAsset), { recursive: true });
    writeFileSync(policyAsset, readFileSync(path.join(backend, 'src/privacycore/privacy-preservation-policy.v1.json')));
  }
  req('reflect-metadata');
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `127.0.0.1:${PORTS.auth}`;
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${PORTS.firestore}`;
  // The managed Cloud Run runtime supplies K_SERVICE; the fixture simulates that
  // composition, so the local reconciliation timer stays off and jobs remain
  // explicit scheduled HTTP work, exactly as in the hosted target.
  process.env.K_SERVICE = 'release02-load-fixture';
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const { ConfigService } = req('@nestjs/config');
  const { Module } = req('@nestjs/common');
  const { NestFactory } = req('@nestjs/core');
  const { FirebaseAdminService } = req('./dist/src/auth/firebase/firebase-admin.service.js');
  const { FirebaseProductService } = req('./dist/src/auth/firebase-product/firebase-product.service.js');
  const { FirebaseProductController } = req('./dist/src/auth/firebase-product/firebase-product.controller.js');
  const { AccountController } = req('./dist/src/auth/firebase-product/account.controller.js');
  const { BillingController } = req('./dist/src/billing/billing.controller.js');
  const { BillingService } = req('./dist/src/billing/billing.service.js');
  const { BillingRepository } = req('./dist/src/billing/billing.repository.js');
  const { RazorpayProvider } = req('./dist/src/billing/razorpay.provider.js');
  const { LearningController } = req('./dist/src/learning/learning.controller.js');
  const { LearningService } = req('./dist/src/learning/learning.service.js');
  const { KnowledgeProjectionController } = req('./dist/src/learning/knowledge-projection.controller.js');
  const { KnowledgeProjectionService } = req('./dist/src/learning/knowledge-projection.service.js');
  const { FeedbackController } = req('./dist/src/feedback/feedback.controller.js');
  const { FeedbackService } = req('./dist/src/feedback/feedback.service.js');
  const { ProductConsentController } = req('./dist/src/consent/product-consent.controller.js');
  const { ProductConsentService } = req('./dist/src/consent/product-consent.service.js');
  const { PrivacyPolicyController } = req('./dist/src/privacycore/privacy-policy.controller.js');
  const { PrivacyPolicyService } = req('./dist/src/privacycore/privacy-policy.service.js');
  const { configureProductionHttp } = req('./dist/src/platform/production-http.js');

  const realProvider = providerMode === 'real';
  if (realProvider && (!razorpay.keyId || !razorpay.secret)) {
    throw environmentFailure('real test-merchant mode needs founder-supplied Razorpay test credentials', 'Set LOAD02_RAZORPAY_KEY_ID (rzp_test_...) and LOAD02_RAZORPAY_KEY_SECRET from the founder-supplied test-key CSV.');
  }
  const config = new ConfigService({
    FIREBASE_PROJECT_ID: AUTH_EMULATOR_PROJECT,
    FIREBASE_PROJECT_KIND: 'emulator',
    // The emulator exports/imports only its (default) database; the named
    // production database routing stays a hosted acceptance gate.
    FIRESTORE_DATABASE_ID: process.env.LOAD02_FIRESTORE_DATABASE_ID || '(default)',
    AUTH_PUBLIC_ORIGIN: CANONICAL_ORIGIN,
    AUTH_RATE_LIMIT_KEY: FIXTURE_SECRETS.rateLimit,
    AUTH_GLOBAL_LOGOUT_ENABLED: 'true',
    BILLING_MODE: 'test',
    RAZORPAY_KEY_ID: realProvider ? razorpay.keyId : 'rzp_test_ingressfixture',
    RAZORPAY_KEY_SECRET: realProvider ? razorpay.secret : FIXTURE_SECRETS.razorpay,
    RAZORPAY_WEBHOOK_SECRET: realProvider ? (razorpay.webhookSecret || '') : FIXTURE_SECRETS.webhook,
    RAZORPAY_PLAN_PERSONAL_MONTHLY: realProvider ? razorpay.planPersonalMonthly : 'plan_personalmonth',
    RAZORPAY_PLAN_PERSONAL_ANNUAL: realProvider ? razorpay.planPersonalAnnual : 'plan_personalyear',
    RAZORPAY_PLAN_FAMILY_MONTHLY: realProvider ? razorpay.planFamilyMonthly : 'plan_familymonth',
    RAZORPAY_PLAN_FAMILY_ANNUAL: realProvider ? razorpay.planFamilyAnnual : 'plan_familyyear',
  });

  const admin = new FirebaseAdminService(config);
  const auth = new FirebaseProductService(admin, config);
  const repo = new BillingRepository(auth);
  const provider = new RazorpayProvider(config);
  const providerState = { subscriptions: new Map(), invoices: new Map(), payments: new Map(), creates: 0 };
  if (!realProvider) {
    // Fictional provider: same request surface as Razorpay, zero network.
    provider.request = async (method, resource, body) => {
      if (method === 'POST' && resource === 'subscriptions') {
        const sub = { id: `sub_fixture${++providerState.creates}`, status: 'created', quantity: 1, plan_id: body.plan_id, notes: body.notes };
        providerState.subscriptions.set(sub.id, sub);
        return structuredClone(sub);
      }
      const id = resource.split('/')[1];
      if (method === 'POST' && resource.endsWith('/cancel')) {
        const sub = providerState.subscriptions.get(id);
        if (!body.cancel_at_cycle_end) sub.status = 'cancelled';
        return structuredClone(sub);
      }
      if (resource.startsWith('subscriptions/')) return structuredClone(providerState.subscriptions.get(id));
      if (resource.startsWith('invoices?')) return { items: structuredClone(providerState.invoices.get(new URLSearchParams(resource.split('?')[1]).get('subscription_id')) || []) };
      if (resource.startsWith('payments/')) return structuredClone(providerState.payments.get(id));
      throw Error('Unexpected isolated provider operation');
    };
  }
  const billing = new BillingService(repo, provider, auth);
  const learning = new LearningService(auth);
  const knowledge = new KnowledgeProjectionService(auth);
  const feedback = new FeedbackService(auth);
  const consent = new ProductConsentService(auth, config);
  const privacy = new PrivacyPolicyService();

  class IngressFixtureModule {}
  Module({ controllers: [FirebaseProductController, AccountController, BillingController, LearningController,
    KnowledgeProjectionController, FeedbackController, ProductConsentController, PrivacyPolicyController], providers: [
    { provide: FirebaseAdminService, useValue: admin },
    { provide: FirebaseProductService, useValue: auth },
    { provide: ConfigService, useValue: config },
    { provide: BillingService, useValue: billing },
    { provide: LearningService, useValue: learning },
    { provide: KnowledgeProjectionService, useValue: knowledge },
    { provide: FeedbackService, useValue: feedback },
    { provide: ProductConsentService, useValue: consent },
    { provide: PrivacyPolicyService, useValue: privacy },
  ] })(IngressFixtureModule);

  const publicRoot = mkdtempSync(path.join(tmpdir(), 'release02-public-'));
  writeFileSync(path.join(publicRoot, 'index.html'), '<!doctype html><html lang="en"><head><title>Visionary</title></head><body><main id="main">Visionary RELEASE-02 load fixture</main></body></html>');
  mkdirSync(path.join(publicRoot, 'assets'), { recursive: true });
  writeFileSync(path.join(publicRoot, 'assets', 'fixture.js'), 'console.log("fixture");');

  const app = await NestFactory.create(IngressFixtureModule, { logger: false, bodyParser: false });
  // The webhook route needs the exact raw bytes for HMAC; the JSON limit matches
  // the product ingress so the load profiles exercise the real wire envelope.
  app.use('/api/billing/webhooks/razorpay', req('express').raw({ type: 'application/json', limit: '256kb' }));
  configureProductionHttp(app, {
    publicRoot, origin: CANONICAL_ORIGIN, trustedProxyHops: 1,
    firebaseAuthDomain: 'visionary-research.firebaseapp.com',
    releaseCommit: FIXTURE_SECRETS.release, globalLogoutEnabled: true,
  });
  app.enableShutdownHooks();
  await app.listen(PORTS.product, '127.0.0.1');

  const { key, cert } = await ensureIngressCertificate(runDir);
  const terminator = tls.createServer({ key: readFileSync(key), cert: readFileSync(cert), ALPNProtocols: ['http/1.1'] }, socket => {
    const upstream = net.connect(PORTS.product, '127.0.0.1');
    const fail = () => { try { socket.destroy(); } catch {} try { upstream.destroy(); } catch {} };
    socket.on('error', fail); upstream.on('error', fail);
    upstream.on('connect', () => { socket.pipe(upstream); upstream.pipe(socket); });
  });
  await listen(terminator, PORTS.ingress, '127.0.0.1');

  const control = http.createServer((request, response) => controlPlane(request, response, { billing, provider, providerState, realProvider, auth }));
  await listen(control, PORTS.control, '127.0.0.1');

  stack = { app, admin, auth, billing, provider, providerState, realProvider, terminator, control, publicRoot, config, adminApp: admin.getAuth().app };
  return { ...PORTS, origin: CANONICAL_ORIGIN, hostname: HOSTNAME };
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    // A larger accept backlog keeps a burst on loopback from presenting
    // ECONNREFUSED, which would be a property of this single-process test
    // terminator, not of the product.
    server.listen({ port, host, backlog: 2048 }, () => resolve());
  });
}

async function controlPlane(request, response, context) {
  const { billing, provider, providerState, realProvider, auth } = context;
  const url = new URL(request.url, 'http://127.0.0.1');
  const send = (code, body) => { response.writeHead(code, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(body)); };
  try {
    if (url.pathname === '/fixture/complete-payment' && request.method === 'POST') {
      if (realProvider) { send(409, { error: 'Real test-merchant completion happens on the provider hosted page; see the runbook.' }); return; }
      let raw = '';
      request.on('data', chunk => { raw += chunk; if (raw.length > 4096) request.destroy(); });
      request.on('end', async () => {
        const body = JSON.parse(raw || '{}');
        const sub = providerState.subscriptions.get(body.subscriptionId);
        const db = auth.getDatabase();
        const mapping = sub ? (await db.collection('visionary_billing_test_subscriptions').doc(sub.id).get()).data() : null;
        if (!sub || !mapping) { send(404, { error: 'Unknown fixture subscription.' }); return; }
        const yearly = sub.plan_id.endsWith('year'), family = sub.plan_id.includes('family');
        const amount = family ? (yearly ? 499000 : 49900) : (yearly ? 299000 : 29900);
        const start = Math.floor(Date.now() / 1000) - 1, end = start + (yearly ? 365 : 30) * 86400;
        const invoice = { id: `inv_${sub.id.slice(4)}`, subscription_id: sub.id, status: 'paid', currency: 'INR', amount, amount_paid: amount, billing_start: start, billing_end: end, issued_at: start, paid_at: start, payment_id: `pay_${sub.id.slice(4)}` };
        providerState.invoices.set(sub.id, [invoice]);
        Object.assign(sub, { status: 'active', current_start: start, current_end: end, charge_at: end });
        providerState.payments.set(invoice.payment_id, { id: invoice.payment_id, invoice_id: invoice.id, amount, currency: 'INR', status: 'captured', captured: true, amount_refunded: 0 });
        const { createHmac } = require('node:crypto');
        const secret = provider.settings().secret;
        send(200, { razorpay_subscription_id: sub.id, razorpay_payment_id: invoice.payment_id, razorpay_signature: createHmac('sha256', secret).update(`${invoice.payment_id}|${sub.id}`).digest('hex') });
      });
      return;
    }
    if (url.pathname === '/fixture/cross-site' && request.method === 'GET') {
      // Fixture-only page: a different origin from which the browser journey
      // proves SameSite=Strict cookies are never sent on cross-site requests.
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<!doctype html><html lang="en"><body><main id="main">Fixture cross-site origin</main></body></html>');
      return;
    }
    if (url.pathname === '/fixture/state' && request.method === 'GET') {
      const db = auth.getDatabase();
      const accounts = await db.collection('visionary_accounts').get();
      const sessions = await db.collection('visionary_auth_sessions').get();
      send(200, { accounts: accounts.size, sessions: sessions.size, providerCreates: providerState.creates });
      return;
    }
    send(404, { error: 'Fixture control plane: fixture-only endpoints under /fixture.' });
  } catch (error) {
    send(500, { error: 'Fixture control plane failure.', detail: String(error && error.message || error).slice(0, 200) });
  }
}

async function ensureIngressCertificate(runDir) {
  const dir = path.join(runDir, 'tls');
  const key = path.join(dir, 'ingress-key.pem'), cert = path.join(dir, 'ingress-cert.pem');
  if (existsSync(key) && existsSync(cert)) return { key, cert };
  mkdirSync(dir, { recursive: true });
  const openssl = discoverOpenssl();
  const result = spawnSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', key, '-out', cert, '-days', '2', '-nodes',
    '-subj', `/CN=${HOSTNAME}`, '-addext', `subjectAltName=DNS:${HOSTNAME},DNS:localhost,IP:127.0.0.1`], { windowsHide: true });
  if (result.status !== 0 || !existsSync(cert)) throw Error('The local TLS terminator certificate could not be minted. See the openssl diagnostics in the run log.');
  return { key, cert };
}

async function stopStack() {
  if (!stack) return;
  const current = stack;
  stack = null;
  try { await current.app.close(); } catch { /* the emulator may already be gone */ }
  await new Promise(resolve => current.terminator.close(() => resolve()));
  await new Promise(resolve => current.control.close(() => resolve()));
  rmSync(current.publicRoot, { recursive: true, force: true });
}

// --- Driver-side HTTPS client bound to the canonical origin ------------ //

// One shared keep-alive agent for the load driver. Without connection reuse a
// naive client opens a fresh TCP+TLS connection per request and the client
// itself becomes the bottleneck (transport errors that say nothing about the
// server). A hosted load generator pools connections; so does this one.
const LOAD_AGENT = new https.Agent({ keepAlive: true, maxSockets: 256, servername: HOSTNAME, rejectUnauthorized: false });

function ingressRequest({ method = 'GET', pathname, headers = {}, body, rawBody, deviceIp = '203.0.113.10', jar, agent }) {
  return new Promise((resolve, reject) => {
    // `rawBody` sends exact bytes (provider webhooks sign the raw payload);
    // `body` is JSON-encoded as before.
    const payload = rawBody !== undefined ? rawBody : body === undefined ? null : JSON.stringify(body);
    const request = https.request({
      host: HOSTNAME, port: PORTS.ingress, path: pathname, method,
      servername: HOSTNAME,
      rejectUnauthorized: false,
      agent: agent || undefined,
      lookup: (host, options, callback) => {
        // Pin the canonical hostname to the loopback ingress without touching
        // system DNS: autoSelectFamily lookups receive the array form.
        if (options && options.all) callback(null, [{ address: '127.0.0.1', family: 4 }]);
        else callback(null, '127.0.0.1', 4);
      },
      headers: {
        host: PORTS.ingress === 443 ? HOSTNAME : `${HOSTNAME}:${PORTS.ingress}`,
        origin: CANONICAL_ORIGIN,
        'user-agent': 'release02-load/1.0',
        'x-forwarded-for': deviceIp,
        ...(jar && jar.header() ? { cookie: jar.header() } : {}),
        ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, rawHeaders: response.rawHeaders, body: data ? safeJson(data) : null, text: data }));
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }

function cookieJar() {
  const jar = new Map();
  return {
    capture(response) {
      const headers = response.rawHeaders;
      for (let index = 0; index + 1 < headers.length; index += 2) {
        if (headers[index].toLowerCase() !== 'set-cookie') continue;
        const [pair] = headers[index + 1].split(';');
        const eq = pair.indexOf('=');
        jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    },
    header() { return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; '); },
    names() { return [...jar.keys()]; },
    get(name) { return jar.get(name); },
  };
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function portBusy(port) {
  return new Promise(resolve => {
    const probe = net.connect(port, '127.0.0.1');
    probe.on('connect', () => { probe.destroy(); resolve(true); });
    probe.on('error', () => resolve(false));
  });
}

function sha256(value) { return createHash('sha256').update(value).digest('hex'); }

module.exports = {
  assertRunnable, startEmulators, stopEmulators, exportEmulators, startStack, stopStack,
  ingressRequest, cookieJar, delay, portBusy, sha256, discoverJava, discoverOpenssl,
  CANONICAL_ORIGIN, HOSTNAME, AUTH_EMULATOR_PROJECT, PORTS, environmentFailure, FIXTURE_SECRETS, LOAD_AGENT,
};
