import { execFileSync, execSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const production = Object.freeze({
  project: 'visionary-research', projectNumber: '174851137514', region: 'asia-south1', service: 'visionary-product',
  origin: 'https://visionary.org.in',
  authDomain: 'visionary-research.firebaseapp.com',
  runtime: 'visionary-product-runtime@visionary-research.iam.gserviceaccount.com',
  image: 'asia-south1-docker.pkg.dev/visionary-research/visionary-product/product',
  tag: 'ci-candidate', secret: 'visionary-product-auth-rate-limit',
});
const shaPattern = /^[a-f0-9]{40}$/;
export function trustedRun(env) {
  if (env.GITHUB_REPOSITORY !== 'ecohdeep786/New_Visionary' || env.GITHUB_REF !== 'refs/heads/main' ||
      !['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) ||
      env.GITHUB_WORKFLOW_REF !== 'ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main' ||
      !shaPattern.test(env.GITHUB_SHA || '') || !/^\d+$/.test(env.GITHUB_RUN_ID || '') || !/^\d+$/.test(env.GITHUB_RUN_ATTEMPT || '')) {
    throw Error('Only the trusted main workflow can publish or deploy.');
  }
  return env.GITHUB_SHA;
}
export function currentRevision(service) {
  const traffic = (service.status?.traffic || []).filter(row => row.percent > 0);
  if (traffic.length !== 1 || traffic[0].percent !== 100 || !traffic[0].revisionName || traffic[0].latestRevision) throw Error('Expected one explicitly pinned production revision.');
  return traffic[0].revisionName;
}
export function releaseEnvironment(commit, globalSignOut = false) {
  if (!shaPattern.test(commit || '')) throw Error('A full source commit is required.');
  return {
    NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: production.origin, AUTH_TRUST_PROXY_HOPS: '2',
    FIREBASE_PROJECT_ID: production.project, FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: 'default',
    FIREBASE_AUTH_DOMAIN: production.authDomain, BILLING_MODE: 'test', VISIONARY_RELEASE_COMMIT: commit,
    AUTH_SESSION_POLICY_VERSION: '1', AUTH_GLOBAL_LOGOUT_ENABLED: globalSignOut === true ? 'true' : 'false',
  };
}
export function revisionAuthPolicy(revision) {
  const env = Object.fromEntries((revision.spec?.containers?.[0]?.env || []).map(row => [row.name, row.value]));
  const version = env.AUTH_SESSION_POLICY_VERSION, enabled = env.AUTH_GLOBAL_LOGOUT_ENABLED;
  if (version === undefined && enabled === undefined) return { version: 0, globalSignOut: false };
  if (version !== '1' || !['true', 'false'].includes(enabled)) throw Error('Invalid auth rollback capability configuration.');
  return { version: 1, globalSignOut: enabled === 'true' };
}
export function verifyAuthPolicy(body, expected) {
  if (expected.version === 0 && body?.authPolicy === undefined) return;
  if (body?.authPolicy?.version !== expected.version || body.authPolicy.globalSignOut !== expected.globalSignOut) throw Error('Compiled auth policy attestation does not match the pinned revision.');
}
export function environmentFlag(environment) {
  const pairs = Object.entries(environment).map(([name, value]) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || typeof value !== 'string' || /[,=\n\r]/.test(value)) throw Error('Release environment contains an unsupported value.');
    return `${name}=${value}`;
  });
  return '--set-env-vars=' + pairs.join(',');
}
export function releaseDeployArgs({ commit, image, suffix, globalSignOut }) {
  if (typeof globalSignOut !== 'boolean') throw Error('An explicit rollout policy is required.');
  return ['run', 'deploy', production.service, '--image=' + image, '--revision-suffix=' + suffix, '--no-traffic', '--tag=' + production.tag,
    '--ingress=internal-and-cloud-load-balancing', '--service-account=' + production.runtime, '--min-instances=0', '--max-instances=1', '--cpu=1', '--memory=512Mi', '--concurrency=20', '--timeout=30s', '--no-cpu-boost', '--cpu-throttling', '--execution-environment=gen2', '--port=8080', environmentFlag(releaseEnvironment(commit, globalSignOut)), '--set-secrets=AUTH_RATE_LIMIT_KEY=' + production.secret + ':1'];
}
export function verifyRevision(revision, expectedCommit, expectedImage) {
  revisionAuthPolicy(revision);
  const spec = revision.spec || {}, containers = spec.containers || [], container = containers[0];
  const env = Object.fromEntries((container?.env || []).map(row => [row.name, row.value ?? row.valueFrom]));
  const annotations = revision.metadata?.annotations || {};
  if (containers.length !== 1 || spec.serviceAccountName !== production.runtime ||
      !container.image.startsWith(production.image + '@sha256:') || !/@sha256:[a-f0-9]{64}$/.test(container.image) ||
      (expectedImage && container.image !== expectedImage) ||
      !shaPattern.test(env.VISIONARY_RELEASE_COMMIT || '') || (expectedCommit && env.VISIONARY_RELEASE_COMMIT !== expectedCommit) ||
      env.AUTH_PUBLIC_ORIGIN !== production.origin || env.AUTH_TRUST_PROXY_HOPS !== '2' || env.NODE_ENV !== 'production' ||
      env.FIREBASE_PROJECT_ID !== production.project || env.FIRESTORE_DATABASE_ID !== 'default' || env.FIREBASE_PROJECT_KIND !== 'production' ||
      env.FIREBASE_AUTH_DOMAIN !== production.authDomain || env.BILLING_MODE !== 'test' ||
      env.AUTH_RATE_LIMIT_KEY?.secretKeyRef?.name !== production.secret || env.AUTH_RATE_LIMIT_KEY?.secretKeyRef?.key !== '1' ||
      container.resources?.limits?.cpu !== '1' || container.resources?.limits?.memory !== '512Mi' || spec.containerConcurrency !== 20 || spec.timeoutSeconds !== 30 ||
      annotations['autoscaling.knative.dev/maxScale'] !== '1' || ![undefined, '0'].includes(annotations['autoscaling.knative.dev/minScale']) ||
      annotations['run.googleapis.com/cpu-throttling'] !== 'true' || annotations['run.googleapis.com/startup-cpu-boost'] !== 'false' || annotations['run.googleapis.com/execution-environment'] !== 'gen2') {
    throw Error('Revision is not a compatible, bounded canonical production release.');
  }
  return env.VISIONARY_RELEASE_COMMIT;
}
export async function probe(origin, path, commit, fetcher = fetch) {
  const response = await fetcher(origin + path, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000),
    ...(path === '/__deploy-check' ? { headers: { 'X-Forwarded-For': '198.51.100.99' } } : {}) });
  const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
  if (response.status !== 200 || response.headers.get('x-visionary-revision') !== commit || response.headers.get('cache-control') !== 'no-store' ||
      body.status !== 'ok' || (path === '/__deploy-check' && body.forwardedForSanitized !== true)) throw Error('Release health/provenance/proxy-boundary check failed.');
  return body;
}
export async function publicChecks(commit, fetcher = fetch, expectedPolicy) {
  const health = await probe(production.origin, '/api/health', commit, fetcher);
  if (expectedPolicy) verifyAuthPolicy(health, expectedPolicy);
  for (const [path, status, type] of [['/login', 200, 'text/html'], ['/api/auth/me', 401, 'application/json'], ['/api/account/overview', 401, 'application/json'], ['/api/__unknown-release-probe', 404, 'application/json']]) {
    const response = await fetcher(production.origin + path, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (response.status !== status || response.headers.get('x-visionary-revision') !== commit || !response.headers.get('content-type')?.includes(type) ||
        (path.startsWith('/api/') && response.headers.get('cache-control') !== 'no-store')) throw Error('Canonical product boundary verification failed.');
    await response.arrayBuffer();
  }
  const csrf = await fetcher(production.origin + '/api/auth/csrf', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const cookie = csrf.headers.get('set-cookie'), token = (await csrf.json()).token;
  if (csrf.status !== 200 || !/^[a-f0-9]{64}$/.test(token || '') || !cookie?.startsWith('__Host-visionary-csrf=') || !/; Secure/i.test(cookie) || !/; HttpOnly/i.test(cookie) || !/; SameSite=Strict/i.test(cookie)) throw Error('Secure CSRF cookie check failed.');
  for (const [origin, status] of [[production.origin, 401], ['https://invalid.example', 403]]) {
    const response = await fetcher(production.origin + '/api/auth/onboarding', { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { Origin: origin, Cookie: cookie.split(';')[0], 'X-CSRF-Token': token, 'Content-Type': 'application/json' }, body: '{}' });
    if (response.status !== status || response.headers.get('cache-control') !== 'no-store' || response.headers.get('x-visionary-revision') !== commit) throw Error('Canonical origin / CSRF / anonymous authority check failed.');
    await response.arrayBuffer();
  }
}
export async function deployRelease({ commit, revision, image, readService, readRevision, ancestor, assertCurrentMain, deploy, moveTraffic, baselineProbe, candidateProbe, canonicalChecks, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (!shaPattern.test(commit) || !revision.startsWith(production.service + '-g' + commit.slice(0, 12) + '-') || !new RegExp('^' + production.image.replaceAll('.', '\\.') + '@sha256:[a-f0-9]{64}$').test(image)) throw Error('Invalid immutable release identity.');
  await assertCurrentMain();
  const initialService = await readService();
  if (initialService.metadata?.annotations?.['run.googleapis.com/maxScale'] !== '1') throw Error('Service cost limit must be bootstrapped first.');
  if (initialService.metadata?.annotations?.['run.googleapis.com/ingress'] !== 'internal-and-cloud-load-balancing') throw Error('Canonical ingress must be bootstrapped before a main release.');
  const previous = currentRevision(initialService), previousRevision = await readRevision(previous);
  const previousCommit = verifyRevision(previousRevision);
  if (!(await ancestor(previousCommit))) throw Error('Previous release must belong to main history.');
  const previousAuthPolicy = revisionAuthPolicy(previousRevision);
  // Prove actual serving code before making this revision the rollback target.
  // The first policy-aware deployment keeps global revocation disabled. A later
  // deployment can enable it with this compatible image as the fallback.
  verifyAuthPolicy(await baselineProbe(previousCommit), previousAuthPolicy);
  if (currentRevision(await readService()) !== previous) throw Error('Production traffic changed during baseline checks.');
  const authPolicy = { version: 1, globalSignOut: previousAuthPolicy.version === 1 };
  try {
    await deploy({ globalSignOut: authPolicy.globalSignOut });
    const candidate = await readRevision(revision);
    verifyRevision(candidate, commit, image);
    verifyAuthPolicy({ authPolicy: revisionAuthPolicy(candidate) }, authPolicy);
    let lastError;
    for (let attempt = 0; attempt < 12; attempt++) {
      try { verifyAuthPolicy(await candidateProbe(), authPolicy); lastError = undefined; break; } catch (error) { lastError = error; if (attempt < 11) await wait(5000); }
    }
    if (lastError) throw lastError;
    await assertCurrentMain();
    const afterCandidate = currentRevision(await readService());
    if (afterCandidate !== previous) throw Error('Production traffic changed during candidate checks; refusing to overwrite it.');
  } catch (error) {
    let current;
    try {
      current = currentRevision(await readService());
    } catch (readError) {
      throw Error(`${error.message}; candidate traffic state could not be read: ${readError.message}`);
    }
    if (current === revision) {
      try {
        await moveTraffic(previous);
        if (currentRevision(await readService()) !== previous) throw Error('rollback verification failed');
      } catch (rollbackError) {
        throw Error(`${error.message}; candidate cleanup failed: ${rollbackError.message}; operator attention required.`);
      }
    }
    throw error;
  }
  try {
    await moveTraffic(revision);
    if (currentRevision(await readService()) !== revision) throw Error('Promotion did not pin the candidate.');
    await canonicalChecks(undefined, authPolicy);
  } catch (error) {
    if (currentRevision(await readService()) === revision) {
      await moveTraffic(previous);
      if (currentRevision(await readService()) !== previous) throw Error('Rollback could not be verified; operator attention required.');
      await canonicalChecks(previousCommit, previousAuthPolicy);
    }
    throw error;
  }
  return { commit, image, revision, authPolicy, previous, previousCommit, previousAuthPolicy, verified: true };
}

export function command(file, args, capture = false, platform = process.platform, execute = execFileSync, shell = execSync) {
  const options = { encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', timeout: 900000, windowsHide: true };
  if (platform === 'win32' && file === 'gcloud') {
    // The SDK is a .cmd shim on Windows. Only fixed release arguments are
    // accepted; refuse cmd expansion/operators before using its shell.
    if (args.some(arg => typeof arg !== 'string' || /["&|<>^%!\r\n]/.test(arg) || arg.endsWith('\\'))) throw Error('Unsafe Windows gcloud argument.');
    return shell('gcloud.cmd ' + args.map(arg => '"' + arg + '"').join(' '), options);
  }
  return execute(file, args, options);
}
async function currentMain() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return command('git', ['ls-remote', 'origin', 'refs/heads/main'], true).trim().split(/\s+/)[0];
  const response = await fetch('https://api.github.com/repos/ecohdeep786/New_Visionary/git/ref/heads/main', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error('GitHub main ref check failed with status ' + response.status + '.');
  const sha = (await response.json()).object?.sha;
  if (!shaPattern.test(sha || '')) throw Error('GitHub main ref returned an invalid commit.');
  return sha;
}
async function waitForHealth(origin, path, commit) {
  let lastError;
  for (let attempt = 0; attempt < 12; attempt++) {
    try { await probe(origin, path, commit); return; } catch (error) { lastError = error; if (attempt < 11) await new Promise(resolve => setTimeout(resolve, 5000)); }
  }
  throw lastError;
}
export async function baselineRelease({ commit, image, revision, readService, readRevision, assertCurrentMain, deploy, moveTraffic, health }) {
  if (!shaPattern.test(commit || '') || !new RegExp('^' + production.image.replaceAll('.', '\\.') + '@sha256:[a-f0-9]{64}$').test(image || '') ||
      !revision.startsWith(production.service + '-baseline-' + commit.slice(0, 12) + '-')) throw Error('Invalid baseline identity.');
  await assertCurrentMain();
  const service = await readService();
  if (service.metadata?.annotations?.['run.googleapis.com/maxScale'] !== '1' || service.metadata?.annotations?.['run.googleapis.com/ingress'] !== 'all') throw Error('The bounded foundation and public ingress are required before the first baseline.');
  const traffic = (service.status?.traffic || []).filter(row => row.percent > 0);
  if (traffic.length !== 1 || traffic[0].percent !== 100 || !traffic[0].revisionName) throw Error('Baseline requires one resolved serving revision.');
  const previous = traffic[0].revisionName, prior = await readRevision(previous);
  let priorCommit;
  try { priorCommit = verifyRevision(prior); } catch {}
  if (priorCommit) {
    if (priorCommit !== commit || prior.spec.containers[0].image !== image) throw Error('A different canonical production baseline already exists; use the main workflow release path.');
    await moveTraffic(previous);
    if (currentRevision(await readService()) !== previous) throw Error('Baseline traffic pin failed.');
    await health(service.status.url, commit);
    return { commit, image, revision: previous, serviceUrl: service.status.url, verified: true, resumed: true };
  }
  const spec = prior.spec || {}, container = spec.containers?.[0], annotations = prior.metadata?.annotations || {};
  if (spec.containers?.length !== 1 || !/^us-docker\.pkg\.dev\/cloudrun\/container\/hello@sha256:[a-f0-9]{64}$/.test(container?.image || '') ||
      spec.serviceAccountName !== production.runtime || spec.containerConcurrency !== 20 || spec.timeoutSeconds !== 30 ||
      container.resources?.limits?.cpu !== '1' || container.resources?.limits?.memory !== '512Mi' ||
      annotations['autoscaling.knative.dev/maxScale'] !== '1' || annotations['run.googleapis.com/cpu-throttling'] !== 'true' ||
      annotations['run.googleapis.com/startup-cpu-boost'] !== 'false' || annotations['run.googleapis.com/execution-environment'] !== 'gen2') throw Error('Existing release is not the bounded foundation placeholder.');
  // Resolve LATEST before deploying: a no-traffic deploy must not inherit it.
  await moveTraffic(previous);
  if (currentRevision(await readService()) !== previous) throw Error('Placeholder traffic pin failed.');
  try {
    await assertCurrentMain();
    await deploy();
    verifyRevision(await readRevision(revision), commit, image);
    const candidate = (await readService()).status?.traffic?.find(row => row.revisionName === revision && row.tag === production.tag)?.url;
    if (!candidate || !candidate.startsWith('https://') || !new URL(candidate).hostname.endsWith('.run.app')) throw Error('Baseline candidate URL is missing.');
    await health(candidate, commit);
    await assertCurrentMain();
    if (currentRevision(await readService()) !== previous) throw Error('Production traffic changed during baseline preparation.');
    await moveTraffic(revision);
    const deployed = await readService();
    if (currentRevision(deployed) !== revision) throw Error('Baseline promotion did not pin the candidate.');
    await health(deployed.status.url, commit);
    return { commit, image, revision, serviceUrl: deployed.status.url, verified: true };
  } catch (error) {
    if (currentRevision(await readService()) === revision) {
      await moveTraffic(previous);
      if (currentRevision(await readService()) !== previous) throw Error('Baseline rollback failed; operator attention required.');
    }
    throw error;
  }
}
async function baseline() {
  if (process.env.PRODUCTION_BASELINE_CONFIRM !== production.project) throw Error('Set PRODUCTION_BASELINE_CONFIRM to the production project before creating the first baseline.');
  const commit = process.env.PRODUCTION_BASELINE_COMMIT, image = process.env.PRODUCTION_BASELINE_IMAGE;
  if (!shaPattern.test(commit || '') || !new RegExp('^' + production.image.replaceAll('.', '\\.') + '@sha256:[a-f0-9]{64}$').test(image || '')) throw Error('Baseline requires the published immutable image and its full main commit.');
  if (await currentMain() !== commit) throw Error('Baseline must use the current remote main commit.');
  const flags = ['--project=' + production.project, '--region=' + production.region, '--quiet'];
  const gcloud = args => JSON.parse(command('gcloud', [...args, ...flags, '--format=json'], true));
  const suffix = 'baseline-' + commit.slice(0, 12) + '-' + Date.now().toString(36);
  const receipt = await baselineRelease({ commit, image, revision: production.service + '-' + suffix,
    readService: () => gcloud(['run', 'services', 'describe', production.service]),
    readRevision: name => gcloud(['run', 'revisions', 'describe', name]),
    assertCurrentMain: async () => { if (await currentMain() !== commit) throw Error('Baseline must use the current remote main commit.'); },
    // A LATEST tag is merged into status traffic even when spec traffic is
    // explicitly pinned. Resolve the foundation tag as well as its percentage.
    moveTraffic: name => gcloud(['run', 'services', 'update-traffic', production.service, '--to-revisions=' + name + '=100', '--update-tags=' + production.tag + '=' + name]),
    health: (url, sha) => waitForHealth(url, '/api/health', sha),
    deploy: () => gcloud(['run', 'deploy', production.service, '--image=' + image, '--revision-suffix=' + suffix, '--no-traffic', '--tag=' + production.tag,
    '--ingress=all', '--no-invoker-iam-check', '--service-account=' + production.runtime,
    '--min-instances=0', '--max-instances=1', '--cpu=1', '--memory=512Mi', '--concurrency=20', '--timeout=30s',
    '--no-cpu-boost', '--cpu-throttling', '--execution-environment=gen2', '--port=8080',
    environmentFlag(releaseEnvironment(commit)), '--set-secrets=AUTH_RATE_LIMIT_KEY=' + production.secret + ':1']),
  });
  writeFileSync('baseline-release.json', JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt));
}
async function cli(mode) {
  if (mode === 'baseline') return baseline();
  const commit = trustedRun(process.env);
  const main = async () => {
    const remote = await currentMain();
    if (remote !== commit) throw Error('Superseded run: source is no longer the current remote main.');
  };
  await main();
  const flags = ['--project=' + production.project, '--region=' + production.region, '--quiet'];
  const gcloud = args => JSON.parse(command('gcloud', [...args, ...flags, '--format=json'], true));
  if (mode === 'publish') {
    const tag = production.image + ':' + commit;
    const label = command('docker', ['image', 'inspect', tag, '--format={{ index .Config.Labels "org.opencontainers.image.revision" }}'], true).trim();
    if (label !== commit) throw Error('Built image source label mismatch.');
    command('gcloud', ['auth', 'configure-docker', 'asia-south1-docker.pkg.dev', '--quiet']);
    command('docker', ['push', tag]);
    const description = JSON.parse(command('gcloud', ['artifacts', 'docker', 'images', 'describe', tag, '--project=' + production.project, '--format=json'], true));
    const digest = description.image_summary?.digest;
    if (!/^sha256:[a-f0-9]{64}$/.test(digest || '')) throw Error('Published digest could not be verified.');
    const image = production.image + '@' + digest;
    appendFileSync(process.env.GITHUB_OUTPUT, `image=${image}\n`);
    writeFileSync('published-release.json', JSON.stringify({ commit, image }, null, 2) + '\n');
    return;
  }
  if (mode !== 'deploy' || process.env.PRODUCTION_DEPLOY_ENABLED !== 'true') throw Error('Automatic deployment is not activated.');
  const image = process.env.PRODUCTION_IMAGE;
  const suffix = `g${commit.slice(0, 12)}-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`;
  const revision = production.service + '-' + suffix;
  const moveTraffic = name => gcloud(['run', 'services', 'update-traffic', production.service, '--to-revisions=' + name + '=100']);
  const receipt = await deployRelease({
    commit, revision, image, assertCurrentMain: main,
    readService: () => gcloud(['run', 'services', 'describe', production.service]),
    readRevision: name => gcloud(['run', 'revisions', 'describe', name]),
    ancestor: sha => { try { command('git', ['merge-base', '--is-ancestor', sha, commit], true); return true; } catch { return false; } },
    deploy: policy => gcloud(releaseDeployArgs({ commit, image, suffix, ...policy })),
    baselineProbe: sha => probe(production.origin, '/api/health', sha),
    moveTraffic, candidateProbe: () => probe(production.origin, '/__deploy-check', commit),
    canonicalChecks: (sha, policy) => publicChecks(sha || commit, fetch, policy),
  });
  writeFileSync('deployed-release.json', JSON.stringify(receipt, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
