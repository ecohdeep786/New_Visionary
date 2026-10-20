import test from 'node:test';
import assert from 'node:assert/strict';
import { production, trustedRun, releaseEnvironment, environmentFlag, verifyRevision, deployRelease, probe, currentRevision } from '../release.mjs';

const commit = 'a'.repeat(40), previousCommit = 'b'.repeat(40);
const revision = production.service + '-g' + commit.slice(0, 12) + '-1-1', previous = production.service + '-previous';
const image = production.image + '@sha256:' + 'c'.repeat(64);
const run = { GITHUB_REPOSITORY: 'ecohdeep786/New_Visionary', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'push', GITHUB_WORKFLOW_REF: 'ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main', GITHUB_SHA: commit, GITHUB_RUN_ID: '1', GITHUB_RUN_ATTEMPT: '1' };
function compatible(source = previousCommit) {
  return { metadata: { annotations: { 'autoscaling.knative.dev/maxScale': '1', 'run.googleapis.com/cpu-throttling': 'true', 'run.googleapis.com/startup-cpu-boost': 'false', 'run.googleapis.com/execution-environment': 'gen2' } }, spec: { serviceAccountName: production.runtime, containerConcurrency: 20, timeoutSeconds: 30, containers: [{ image, resources: { limits: { cpu: '1', memory: '512Mi' } }, env: Object.entries({ ...releaseEnvironment(source), AUTH_RATE_LIMIT_KEY: undefined }).filter(([, value]) => value !== undefined).map(([name, value]) => ({ name, value })).concat([{ name: 'AUTH_RATE_LIMIT_KEY', valueFrom: { secretKeyRef: { name: production.secret, key: '1' } } }]) }] } };
}
function fixture(overrides = {}) {
  const calls = []; let current = previous;
  const options = { commit, revision, image,
    readService: async () => ({ metadata: { annotations: { 'run.googleapis.com/ingress': 'internal-and-cloud-load-balancing', 'run.googleapis.com/maxScale': '1' } }, status: { traffic: [{ revisionName: current, percent: 100 }] } }),
    readRevision: async name => compatible(name === previous ? previousCommit : commit),
    ancestor: async () => true, assertCurrentMain: async () => { calls.push('main'); },
    deploy: async () => { calls.push('deploy'); },
    moveTraffic: async name => { calls.push('traffic:' + name); current = name; },
    candidateProbe: async () => { calls.push('candidate'); },
    canonicalChecks: async sha => { calls.push('check:' + (sha || commit)); }, wait: async () => {},
    ...overrides,
  };
  return { options, calls, setCurrent: name => { current = name; }, getCurrent: () => current };
}
test('only the exact main workflow push/manual identity is accepted', () => {
  assert.equal(trustedRun(run), commit);
  for (const change of [{ GITHUB_REF: 'refs/heads/dev' }, { GITHUB_EVENT_NAME: 'pull_request_target' }, { GITHUB_REPOSITORY: 'someone/fork' }, { GITHUB_SHA: 'a'.repeat(7) }, { GITHUB_WORKFLOW_REF: run.GITHUB_WORKFLOW_REF.replace('production.yml', 'other.yml') }]) assert.throws(() => trustedRun({ ...run, ...change }));
});
test('release environment is pinned to the new Firebase project and database', () => {
  const env = releaseEnvironment(commit);
  assert.equal(env.FIREBASE_PROJECT_ID, 'visionary-research');
  assert.equal(env.FIREBASE_AUTH_DOMAIN, 'visionary-research.firebaseapp.com');
  assert.equal(env.FIRESTORE_DATABASE_ID, 'default');
  assert.equal(env.VISIONARY_RELEASE_COMMIT, commit);
  assert.throws(() => releaseEnvironment('a'.repeat(7)));
  assert.equal(environmentFlag({ A: '1', B: 'https://visionary.org.in' }), '--set-env-vars=A=1,B=https://visionary.org.in');
  assert.throws(() => environmentFlag({ A: 'x,y' }));
});
test('candidate is checked without moving traffic, then main is rechecked before promotion', async () => {
  const f = fixture(), receipt = await deployRelease(f.options);
  assert.deepEqual(f.calls, ['main', 'deploy', 'candidate', 'main', 'traffic:' + revision, 'check:' + commit]);
  assert.equal(receipt.previous, previous); assert.equal(receipt.previousCommit, previousCommit); assert.equal(receipt.verified, true);
});
test('unhealthy candidate exhausts bounded retries and never receives product traffic', async () => {
  let probes = 0; const f = fixture({ candidateProbe: async () => { probes++; throw Error('unhealthy'); } });
  await assert.rejects(deployRelease(f.options), /unhealthy/);
  assert.equal(probes, 12); assert.equal(f.getCurrent(), previous); assert.equal(f.calls.filter(x => x.startsWith('traffic:')).length, 0);
});
test('candidate deploy that unexpectedly moves traffic is rolled back before promotion checks', async () => {
  const f = fixture(); f.options.deploy = async () => { f.calls.push('deploy'); f.setCurrent(revision); };
  await assert.rejects(deployRelease(f.options), /traffic changed/);
  assert.equal(f.getCurrent(), previous);
  assert.deepEqual(f.calls.filter(x => x.startsWith('traffic:')), ['traffic:' + previous]);
});
test('failed candidate probe restores unexpected candidate traffic before rethrowing', async () => {
  const f = fixture();
  f.options.deploy = async () => { f.calls.push('deploy'); f.setCurrent(revision); };
  f.options.candidateProbe = async () => { f.calls.push('candidate'); throw Error('unhealthy candidate'); };
  await assert.rejects(deployRelease(f.options), /unhealthy candidate/);
  assert.equal(f.getCurrent(), previous);
  assert.deepEqual(f.calls.filter(x => x.startsWith('traffic:')), ['traffic:' + previous]);
});
test('failed revision verification restores unexpected candidate traffic before rethrowing', async () => {
  const f = fixture();
  f.options.deploy = async () => { f.calls.push('deploy'); f.setCurrent(revision); };
  f.options.readRevision = async name => {
    if (name === revision) throw Error('bad candidate revision');
    return compatible(previousCommit);
  };
  await assert.rejects(deployRelease(f.options), /bad candidate revision/);
  assert.equal(f.getCurrent(), previous);
  assert.deepEqual(f.calls.filter(x => x.startsWith('traffic:')), ['traffic:' + previous]);
});
test('post-promotion failure restores and verifies only the compatible previous release', async () => {
  const f = fixture({ canonicalChecks: async sha => { if (!sha) throw Error('canonical failure'); assert.equal(sha, previousCommit); } });
  await assert.rejects(deployRelease(f.options), /canonical failure/);
  assert.equal(f.getCurrent(), previous); assert.deepEqual(f.calls.filter(x => x.startsWith('traffic:')), ['traffic:' + revision, 'traffic:' + previous]);
});
test('ambiguous promotion CLI failure rolls back if it actually moved traffic', async () => {
  const f = fixture(); const move = f.options.moveTraffic;
  f.options.moveTraffic = async name => { await move(name); if (name === revision) throw Error('CLI connection lost'); };
  await assert.rejects(deployRelease(f.options), /CLI connection lost/); assert.equal(f.getCurrent(), previous);
});
test('stale main, an operator traffic change or incompatible rollback baseline prevents promotion', async () => {
  const stale = fixture(); let checks = 0; stale.options.assertCurrentMain = async () => { if (++checks === 2) throw Error('stale'); };
  await assert.rejects(deployRelease(stale.options), /stale/); assert.equal(stale.getCurrent(), previous);
  const operator = fixture(); operator.options.candidateProbe = async () => operator.setCurrent('operator-release');
  await assert.rejects(deployRelease(operator.options), /traffic changed/); assert.equal(operator.getCurrent(), 'operator-release');
  const incompatible = fixture({ readRevision: async () => { const r = compatible(); r.spec.containers[0].env.find(x => x.name === 'AUTH_PUBLIC_ORIGIN').value = 'https://old.run.app'; return r; } });
  await assert.rejects(deployRelease(incompatible.options), /compatible/); assert.equal(incompatible.calls.includes('deploy'), false);
  const nonMain = fixture({ ancestor: async () => false }); await assert.rejects(deployRelease(nonMain.options), /main history/);
  const wrongIngress = fixture({ readService: async () => ({ metadata: { annotations: { 'run.googleapis.com/ingress': 'all', 'run.googleapis.com/maxScale': '1' } }, status: { traffic: [{ revisionName: previous, percent: 100 }] } }) });
  await assert.rejects(deployRelease(wrongIngress.options), /ingress/); assert.equal(wrongIngress.calls.includes('deploy'), false);
});
test('recovery never overwrites another operator release', async () => {
  const f = fixture(); f.options.canonicalChecks = async () => { f.setCurrent('operator-release'); throw Error('failed'); };
  await assert.rejects(deployRelease(f.options)); assert.equal(f.getCurrent(), 'operator-release'); assert.equal(f.calls.filter(x => x.startsWith('traffic:')).length, 1);
});
test('rollback validation rejects wrong project/auth domain/origin/proxy/identity/secrets/image and cost expansion', () => {
  assert.equal(verifyRevision(compatible(), previousCommit, image), previousCommit);
  assert.throws(() => verifyRevision(compatible(), previousCommit, production.image + '@sha256:' + 'd'.repeat(64)));
  for (const mutate of [r => r.spec.containers[0].env.find(x => x.name === 'AUTH_TRUST_PROXY_HOPS').value = '1', r => r.spec.containers[0].env.find(x => x.name === 'FIREBASE_PROJECT_ID').value = 'visionary-fd6d2', r => r.spec.containers[0].env.find(x => x.name === 'FIREBASE_AUTH_DOMAIN').value = 'visionary-fd6d2.firebaseapp.com', r => r.spec.serviceAccountName = 'owner@example.test', r => r.spec.containers[0].resources.limits.memory = '1Gi', r => r.spec.containers[0].image = production.image + ':latest', r => r.spec.containers[0].env.at(-1).valueFrom.secretKeyRef.key = 'latest']) { const r = compatible(); mutate(r); assert.throws(() => verifyRevision(r)); }
  assert.throws(() => currentRevision({ status: { traffic: [{ revisionName: previous, percent: 50 }, { revisionName: revision, percent: 50 }] } }));
});
test('health requires expected source, JSON success and no-store and refuses redirects', async () => {
  const response = (status = 200, sha = commit, cache = 'no-store', sanitized = true) => new Response(JSON.stringify({ status: 'ok', forwardedForSanitized: sanitized }), { status, headers: { 'content-type': 'application/json', 'cache-control': cache, 'x-visionary-revision': sha } });
  await probe(production.origin, '/__deploy-check', commit, async (_url, options) => { assert.equal(options.redirect, 'manual'); assert.equal(options.headers['X-Forwarded-For'], '198.51.100.99'); return response(); });
  for (const fake of [response(302), response(200, previousCommit), response(200, commit, 'public'), response(200, commit, 'no-store', false)]) await assert.rejects(probe(production.origin, '/__deploy-check', commit, async () => fake));
});
