import { execFileSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const production = Object.freeze({
  project: 'visionary-fd6d2', region: 'asia-south1', service: 'visionary-product',
  origin: 'https://visionary.org.in',
  runtime: 'visionary-product-runtime@visionary-fd6d2.iam.gserviceaccount.com',
  legacyOrigin: 'https://visionary-product-1022011629348.asia-south1.run.app',
  image: 'asia-south1-docker.pkg.dev/visionary-fd6d2/visionary-product/product',
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
export function verifyRevision(revision, expectedCommit) {
  const spec = revision.spec || {}, containers = spec.containers || [], container = containers[0];
  const env = Object.fromEntries((container?.env || []).map(row => [row.name, row.value ?? row.valueFrom]));
  const annotations = revision.metadata?.annotations || {};
  if (containers.length !== 1 || spec.serviceAccountName !== production.runtime ||
      !container.image.startsWith(production.image + '@sha256:') || !/@sha256:[a-f0-9]{64}$/.test(container.image) ||
      !shaPattern.test(env.VISIONARY_RELEASE_COMMIT || '') || (expectedCommit && env.VISIONARY_RELEASE_COMMIT !== expectedCommit) ||
      env.AUTH_PUBLIC_ORIGIN !== production.origin || env.AUTH_TRUST_PROXY_HOPS !== '2' || env.NODE_ENV !== 'production' ||
      env.FIREBASE_PROJECT_ID !== production.project || env.FIRESTORE_DATABASE_ID !== 'default' || env.FIREBASE_PROJECT_KIND !== 'production' ||
      env.FIREBASE_AUTH_DOMAIN !== 'visionary-fd6d2.firebaseapp.com' || env.BILLING_MODE !== 'test' ||
      env.AUTH_RATE_LIMIT_KEY?.secretKeyRef?.name !== production.secret || env.AUTH_RATE_LIMIT_KEY?.secretKeyRef?.key !== '1' ||
      container.resources?.limits?.cpu !== '1' || container.resources?.limits?.memory !== '512Mi' || spec.containerConcurrency !== 20 || spec.timeoutSeconds !== 30 ||
      annotations['autoscaling.knative.dev/maxScale'] !== '1' || ![undefined, '0'].includes(annotations['autoscaling.knative.dev/minScale']) ||
      annotations['run.googleapis.com/cpu-throttling'] !== 'true' || annotations['run.googleapis.com/startup-cpu-boost'] !== 'false' || annotations['run.googleapis.com/execution-environment'] !== 'gen2') {
    throw Error('Revision is not a compatible, bounded canonical production release.');
  }
  return env.VISIONARY_RELEASE_COMMIT;
}
export function verifyLegacyBaseline(revision) {
  const spec = revision.spec || {}, containers = spec.containers || [], container = containers[0];
  const env = Object.fromEntries((container?.env || []).map(row => [row.name, row.value ?? row.valueFrom]));
  const annotations = revision.metadata?.annotations || {};
  if (containers.length !== 1 || spec.serviceAccountName !== production.runtime ||
      !container.image.startsWith(production.image + '@sha256:') || env.NODE_ENV !== 'production' ||
      env.AUTH_PUBLIC_ORIGIN !== production.legacyOrigin || env.AUTH_TRUST_PROXY_HOPS !== '1' ||
      env.FIREBASE_PROJECT_ID !== production.project || env.FIREBASE_PROJECT_KIND !== 'production' ||
      env.FIRESTORE_DATABASE_ID !== 'default' || env.FIREBASE_AUTH_DOMAIN !== 'visionary-fd6d2.firebaseapp.com' || env.BILLING_MODE !== 'test' ||
      env.AUTH_RATE_LIMIT_KEY?.secretKeyRef?.name !== production.secret || env.AUTH_RATE_LIMIT_KEY?.secretKeyRef?.key !== '1' ||
      spec.containerConcurrency !== 20 || spec.timeoutSeconds !== 30 || container.resources?.limits?.cpu !== '1' || container.resources?.limits?.memory !== '512Mi' ||
      annotations['autoscaling.knative.dev/maxScale'] !== '1' || annotations['run.googleapis.com/cpu-throttling'] !== 'true' ||
      annotations['run.googleapis.com/startup-cpu-boost'] !== 'false' || annotations['run.googleapis.com/execution-environment'] !== 'gen2') {
    throw Error('Current service is neither a verified main release nor the expected bounded KAN-29 legacy baseline.');
  }
  return { kind: 'legacy', revision: revision.metadata?.name };
}
export async function probe(origin, path, commit, fetcher = fetch) {
  const response = await fetcher(origin + path, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000),
    ...(path === '/__deploy-check' ? { headers: { 'X-Forwarded-For': '198.51.100.99' } } : {}) });
  const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
  if (response.status !== 200 || response.headers.get('x-visionary-revision') !== commit || response.headers.get('cache-control') !== 'no-store' ||
      body.status !== 'ok' || (path === '/__deploy-check' && body.forwardedForSanitized !== true)) throw Error('Release health/provenance/proxy-boundary check failed.');
}
export async function publicChecks(commit, fetcher = fetch) {
  await probe(production.origin, '/api/health', commit, fetcher);
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
export async function legacyChecks(fetcher = fetch) {
  for (const [path, status, type] of [['/api/health', 200, 'application/json'], ['/login', 200, 'text/html'], ['/api/auth/me', 401, 'application/json']]) {
    const response = await fetcher(production.legacyOrigin + path, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (response.status !== status || !response.headers.get('content-type')?.includes(type)) throw Error('Legacy production recovery check failed.');
    await response.arrayBuffer();
  }
}
export async function deployRelease({ commit, revision, image, readService, readRevision, ancestor, assertCurrentMain, deploy, moveTraffic, restoreLegacy, candidateProbe, canonicalChecks, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (!shaPattern.test(commit) || !revision.startsWith(production.service + '-g' + commit.slice(0, 12) + '-') || !new RegExp('^' + production.image.replaceAll('.', '\\.') + '@sha256:[a-f0-9]{64}$').test(image)) throw Error('Invalid immutable release identity.');
  await assertCurrentMain();
  const initialService = await readService();
  if (initialService.metadata?.annotations?.['run.googleapis.com/maxScale'] !== '1') throw Error('Service cost limit must be bootstrapped first.');
  const previous = currentRevision(initialService), previousRevision = await readRevision(previous);
  let previousCommit, legacyBaseline = false;
  try { previousCommit = verifyRevision(previousRevision); }
  catch (error) {
    if (initialService.metadata?.annotations?.['run.googleapis.com/ingress'] !== 'all') throw error;
    verifyLegacyBaseline(previousRevision); legacyBaseline = true;
  }
  if (!legacyBaseline) {
    if (initialService.metadata?.annotations?.['run.googleapis.com/ingress'] !== 'internal-and-cloud-load-balancing') throw Error('Canonical ingress must be bootstrapped before a main release.');
    if (!(await ancestor(previousCommit))) throw Error('Previous release must belong to main history.');
  }
  await deploy();
  try {
    verifyRevision(await readRevision(revision), commit);
    let lastError;
    for (let attempt = 0; attempt < 12; attempt++) {
      try { await candidateProbe(); lastError = undefined; break; } catch (error) { lastError = error; if (attempt < 11) await wait(5000); }
    }
    if (lastError) throw lastError;
    await assertCurrentMain();
    if (currentRevision(await readService()) !== previous) throw Error('Production traffic changed during candidate checks; refusing to overwrite it.');
  } catch (error) {
    if (legacyBaseline && currentRevision(await readService()) === previous) await restoreLegacy(previous);
    throw error;
  }
  try {
    await moveTraffic(revision);
    if (currentRevision(await readService()) !== revision) throw Error('Promotion did not pin the candidate.');
    await canonicalChecks();
  } catch (error) {
    if (currentRevision(await readService()) === revision) {
      await moveTraffic(previous);
      if (currentRevision(await readService()) !== previous) throw Error('Rollback could not be verified; operator attention required.');
      if (legacyBaseline) await restoreLegacy(previous);
      else await canonicalChecks(previousCommit);
    }
    throw error;
  }
  return { commit, image, revision, previous, previousCommit: previousCommit || null, previousIsLegacy: legacyBaseline, verified: true };
}

function command(file, args, capture = false) {
  return execFileSync(file, args, { encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', timeout: 900000 });
}
async function cli(mode) {
  const commit = trustedRun(process.env);
  const main = () => {
    const remote = command('git', ['ls-remote', 'origin', 'refs/heads/main'], true).trim().split(/\s+/)[0];
    if (remote !== commit) throw Error('Superseded run: source is no longer the current remote main.');
  };
  main();
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
  const env = { NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: production.origin, AUTH_TRUST_PROXY_HOPS: '2', FIREBASE_PROJECT_ID: production.project, FIREBASE_PROJECT_KIND: 'production', FIRESTORE_DATABASE_ID: 'default', FIREBASE_AUTH_DOMAIN: 'visionary-fd6d2.firebaseapp.com', BILLING_MODE: 'test', VISIONARY_RELEASE_COMMIT: commit };
  writeFileSync('production-env.json', JSON.stringify(env));
  const moveTraffic = name => gcloud(['run', 'services', 'update-traffic', production.service, '--to-revisions=' + name + '=100']);
  const receipt = await deployRelease({
    commit, revision, image, assertCurrentMain: main,
    readService: () => gcloud(['run', 'services', 'describe', production.service]),
    readRevision: name => gcloud(['run', 'revisions', 'describe', name]),
    ancestor: sha => { try { command('git', ['merge-base', '--is-ancestor', sha, commit], true); return true; } catch { return false; } },
    deploy: () => gcloud(['run', 'deploy', production.service, '--image=' + image, '--revision-suffix=' + suffix, '--no-traffic', '--tag=' + production.tag,
      '--ingress=internal-and-cloud-load-balancing', '--service-account=' + production.runtime, '--min=0', '--max=1', '--min-instances=0', '--max-instances=1', '--cpu=1', '--memory=512Mi', '--concurrency=20', '--timeout=30s', '--no-cpu-boost', '--cpu-throttling', '--execution-environment=gen2', '--port=8080', '--env-vars-file=production-env.json', '--set-secrets=AUTH_RATE_LIMIT_KEY=' + production.secret + ':1']),
    moveTraffic, candidateProbe: () => probe(production.origin, '/__deploy-check', commit),
    restoreLegacy: async previous => {
      if (currentRevision(await gcloud(['run', 'services', 'describe', production.service])) !== previous) throw Error('Service changed during legacy recovery; refusing to overwrite it.');
      gcloud(['run', 'services', 'update', production.service, '--ingress=all']);
      const service = gcloud(['run', 'services', 'describe', production.service]);
      if (currentRevision(service) !== previous || service.metadata?.annotations?.['run.googleapis.com/ingress'] !== 'all') throw Error('Legacy service restoration could not be verified.');
      await legacyChecks();
    },
    canonicalChecks: sha => sha === 'legacy' ? legacyChecks() : publicChecks(sha || commit),
  });
  writeFileSync('deployed-release.json', JSON.stringify(receipt, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
