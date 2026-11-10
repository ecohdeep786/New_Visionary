import test from 'node:test';
import assert from 'node:assert/strict';
import { production, trustedRun, releaseEnvironment, environmentFlag, verifyRevision, deployRelease, baselineRelease, command, probe, currentRevision, revisionAuthPolicy, releaseDeployArgs } from '../release.mjs';

const commit = 'a'.repeat(40), previousCommit = 'b'.repeat(40);
const revision = production.service + '-g' + commit.slice(0, 12) + '-1-1', previous = production.service + '-previous';
const image = production.image + '@sha256:' + 'c'.repeat(64);
const run = { GITHUB_REPOSITORY: 'ecohdeep786/New_Visionary', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'push', GITHUB_WORKFLOW_REF: 'ecohdeep786/New_Visionary/.github/workflows/production.yml@refs/heads/main', GITHUB_SHA: commit, GITHUB_RUN_ID: '1', GITHUB_RUN_ATTEMPT: '1' };
function compatible(source = previousCommit, enabled = false) {
  return { metadata: { annotations: { 'autoscaling.knative.dev/maxScale': '1', 'run.googleapis.com/cpu-throttling': 'true', 'run.googleapis.com/startup-cpu-boost': 'false', 'run.googleapis.com/execution-environment': 'gen2' } }, spec: { serviceAccountName: production.runtime, containerConcurrency: 20, timeoutSeconds: 30, containers: [{ image, resources: { limits: { cpu: '1', memory: '512Mi' } }, env: Object.entries({ ...releaseEnvironment(source, enabled), AUTH_RATE_LIMIT_KEY: undefined }).filter(([, value]) => value !== undefined).map(([name, value]) => ({ name, value })).concat([{ name: 'AUTH_RATE_LIMIT_KEY', valueFrom: { secretKeyRef: { name: production.secret, key: '1' } } }]) }] } };
}
function fixture(overrides = {}) {
  const calls = []; let current = previous;
  const options = { commit, revision, image,
    readService: async () => ({ metadata: { annotations: { 'run.googleapis.com/ingress': 'internal-and-cloud-load-balancing', 'run.googleapis.com/maxScale': '1' } }, status: { traffic: [{ revisionName: current, percent: 100 }] } }),
    readRevision: async name => compatible(name === previous ? previousCommit : commit, name !== previous),
    ancestor: async () => true, assertCurrentMain: async () => { calls.push('main'); },
    deploy: async () => { calls.push('deploy'); },
    moveTraffic: async name => { calls.push('traffic:' + name); current = name; },
    baselineProbe: async () => ({ authPolicy: { version: 1, globalSignOut: false } }),
    candidateProbe: async () => { calls.push('candidate'); return { authPolicy: { version: 1, globalSignOut: true } }; },
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
  assert.equal(env.AUTH_PHONE_SIGNIN_ENABLED, 'true');
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

test('legacy rollback target forces compatibility stage with global sign-out disabled', async () => {
  const old = compatible();
  old.spec.containers[0].env = old.spec.containers[0].env.filter(row => !['AUTH_SESSION_POLICY_VERSION', 'AUTH_GLOBAL_LOGOUT_ENABLED'].includes(row.name));
  const f = fixture({
    readRevision: async name => name === previous ? old : compatible(commit, false),
    baselineProbe: async () => ({ status: 'ok' }),
    deploy: async flags => assert.equal(flags.globalSignOut, false),
    candidateProbe: async () => ({ authPolicy: { version: 1, globalSignOut: false } }),
  });
  const result = await deployRelease(f.options);
  assert.deepEqual(result.previousAuthPolicy, { version: 0, globalSignOut: false });
  assert.deepEqual(result.authPolicy, { version: 1, globalSignOut: false });
});

test('feature activation has a policy-aware disabled rollback and verifies its state on fallback', async () => {
  const f = fixture({ canonicalChecks: async (sha, policy) => {
    if (!sha) { assert.deepEqual(policy, { version: 1, globalSignOut: true }); throw Error('failed after activation'); }
    assert.equal(sha, previousCommit);
    assert.deepEqual(policy, { version: 1, globalSignOut: false });
  } });
  f.options.deploy = async flags => assert.equal(flags.globalSignOut, true);
  await assert.rejects(deployRelease(f.options), /failed after activation/);
  assert.equal(f.getCurrent(), previous);
});

test('the production CLI command carries the derived rollout policy into pinned GCP environment', async () => {
  for (const enabled of [false, true]) {
    const old = compatible();
    if (!enabled) old.spec.containers[0].env = old.spec.containers[0].env.filter(row => !['AUTH_SESSION_POLICY_VERSION', 'AUTH_GLOBAL_LOGOUT_ENABLED'].includes(row.name));
    let actual;
    const f = fixture({
      readRevision: async name => name === previous ? old : compatible(commit, enabled),
      baselineProbe: async () => enabled ? { authPolicy: { version: 1, globalSignOut: false } } : {},
      candidateProbe: async () => ({ authPolicy: { version: 1, globalSignOut: enabled } }),
      deploy: policy => { actual = releaseDeployArgs({ commit, image, suffix: 'g' + commit.slice(0, 12) + '-1-1', ...policy }); },
    });
    await deployRelease(f.options);
    assert.ok(actual.includes('--image=' + image));
    assert.ok(actual.includes('--no-traffic'));
    assert.ok(actual.includes('--ingress=internal-and-cloud-load-balancing'));
    const environment = actual.find(arg => arg.startsWith('--set-env-vars='));
    assert.match(environment, /AUTH_SESSION_POLICY_VERSION=1/);
    assert.match(environment, new RegExp('AUTH_GLOBAL_LOGOUT_ENABLED=' + enabled + '(,|$)'));
    assert.match(environment, /AUTH_PHONE_SIGNIN_ENABLED=true/);
  }
  assert.throws(() => releaseDeployArgs({ commit, image, suffix: 'fixture' }), /explicit rollout policy/);
});

test('configuration alone cannot attest epoch enforcement or enable revocation', async () => {
  for (const body of [{}, { authPolicy: { version: 0, globalSignOut: false } }, { authPolicy: { version: 1, globalSignOut: true } }]) {
    const f = fixture({ baselineProbe: async () => body });
    await assert.rejects(deployRelease(f.options), /attestation/);
    assert.equal(f.calls.includes('deploy'), false);
  }
  const malformed = compatible();
  malformed.spec.containers[0].env.find(row => row.name === 'AUTH_GLOBAL_LOGOUT_ENABLED').value = 'TRUE';
  assert.throws(() => revisionAuthPolicy(malformed), /configuration/);
  const candidate = fixture({ candidateProbe: async () => ({ authPolicy: { version: 1, globalSignOut: false } }) });
  await assert.rejects(deployRelease(candidate.options), /attestation/);
  assert.equal(candidate.getCurrent(), previous);
  const incorrectEnv = fixture({ readRevision: async name => compatible(name === previous ? previousCommit : commit, false) });
  await assert.rejects(deployRelease(incorrectEnv.options), /attestation/);
  assert.equal(incorrectEnv.getCurrent(), previous);
});

test('traffic changes during baseline attestation stop deployment', async () => {
  const f = fixture();
  f.options.baselineProbe = async () => { f.setCurrent('operator-release'); return { authPolicy: { version: 1, globalSignOut: false } }; };
  await assert.rejects(deployRelease(f.options), /traffic changed/);
  assert.equal(f.calls.includes('deploy'), false);
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
  const operator = fixture(); operator.options.candidateProbe = async () => { operator.setCurrent('operator-release'); return { authPolicy: { version: 1, globalSignOut: true } }; };
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

function baselineFixture() {
  let current = previous, latest = true, deployed = false;
  const calls = [], baselineRevision = production.service + '-baseline-' + commit.slice(0, 12) + '-test';
  const placeholder = compatible();
  placeholder.spec.containers[0].image = 'us-docker.pkg.dev/cloudrun/container/hello@sha256:' + 'd'.repeat(64);
  placeholder.spec.containers[0].env = [];
  const options = { commit, image, revision: baselineRevision,
    readService: async () => ({ metadata: { annotations: { 'run.googleapis.com/ingress': 'all', 'run.googleapis.com/maxScale': '1' } }, status: { url: 'https://placeholder.run.app', traffic: [{ revisionName: current, percent: 100, latestRevision: latest }, ...(deployed ? [{ revisionName: baselineRevision, tag: production.tag, url: 'https://candidate.run.app' }] : [])] } }),
    readRevision: async name => name === previous ? placeholder : compatible(commit),
    assertCurrentMain: async () => calls.push('main'),
    deploy: async () => { calls.push('deploy'); deployed = true; },
    moveTraffic: async name => { calls.push('traffic:' + name); current = name; latest = false; },
    health: async (url, sha) => { assert.ok(['https://placeholder.run.app', 'https://candidate.run.app'].includes(url)); assert.equal(sha, commit); calls.push(url.includes('candidate') ? 'candidate-health' : 'health'); },
  };
  return { options, calls, placeholder, current: () => current, setCurrent: name => { current = name; latest = false; } };
}

test('first baseline resolves placeholder LATEST, verifies candidate, then pins and probes the release', async () => {
  const f = baselineFixture(), receipt = await baselineRelease(f.options);
  assert.equal(receipt.verified, true); assert.equal(receipt.revision, f.options.revision);
  assert.deepEqual(f.calls, ['main', 'traffic:' + previous, 'main', 'deploy', 'candidate-health', 'main', 'traffic:' + f.options.revision, 'health']);
});

test('baseline retry verifies the same image/source and pins traffic without redeploying', async () => {
  const f = baselineFixture(); f.options.readRevision = async () => compatible(commit);
  const receipt = await baselineRelease(f.options);
  assert.equal(receipt.resumed, true); assert.equal(f.calls.includes('deploy'), false);
  assert.deepEqual(f.calls, ['main', 'traffic:' + previous, 'health']);
  f.options.readRevision = async () => compatible(previousCommit);
  await assert.rejects(baselineRelease(f.options), /different canonical/);
});

test('baseline rejects foreign images, stale main, unrelated services and invalid placeholder bounds', async () => {
  const foreign = baselineFixture(); foreign.options.image = image.replace(production.project, 'other-project');
  await assert.rejects(baselineRelease(foreign.options), /identity/); assert.deepEqual(foreign.calls, []);
  const stale = baselineFixture(); stale.options.assertCurrentMain = async () => { throw Error('stale main'); };
  await assert.rejects(baselineRelease(stale.options), /stale/); assert.equal(stale.calls.includes('deploy'), false);
  for (const mutate of [r => { r.spec.serviceAccountName = 'other@example.test'; }, r => { r.spec.containers[0].image = production.image + ':latest'; }, r => { r.spec.containerConcurrency = 80; }, r => { r.metadata.annotations['autoscaling.knative.dev/maxScale'] = '10'; }]) {
    const f = baselineFixture(); mutate(f.placeholder);
    await assert.rejects(baselineRelease(f.options), /placeholder/); assert.equal(f.calls.includes('deploy'), false);
  }
});

test('baseline health or ambiguous promotion failure restores placeholder without overwriting an operator', async () => {
  const f = baselineFixture(); f.options.health = async url => { if (url.includes('placeholder')) throw Error('health failed'); };
  await assert.rejects(baselineRelease(f.options), /health failed/); assert.equal(f.current(), previous);
  const ambiguous = baselineFixture(), move = ambiguous.options.moveTraffic;
  ambiguous.options.moveTraffic = async name => { await move(name); if (name === ambiguous.options.revision) throw Error('connection lost'); };
  await assert.rejects(baselineRelease(ambiguous.options), /connection lost/); assert.equal(ambiguous.current(), previous);
  const operator = baselineFixture(); operator.options.health = async () => { operator.setCurrent('operator-release'); throw Error('health failed'); };
  await assert.rejects(baselineRelease(operator.options), /health failed/); assert.equal(operator.current(), 'operator-release');
});

test('Windows gcloud uses the cmd shim with quoted arguments and rejects shell expansion', () => {
  const calls = [], shell = (line, options) => { calls.push(line); assert.equal(options.windowsHide, true); return 'ok'; };
  assert.equal(command('gcloud', ['run', '--set-env-vars=A=1,B=https://visionary.org.in'], true, 'win32', () => assert.fail(), shell), 'ok');
  assert.equal(calls[0], 'gcloud.cmd "run" "--set-env-vars=A=1,B=https://visionary.org.in"');
  for (const arg of ['a&b', '%PATH%', 'a|b', 'a"b', 'a\nb']) assert.throws(() => command('gcloud', [arg], true, 'win32', () => assert.fail(), shell), /Unsafe/);
  command('gcloud', ['version'], true, 'linux', (file, args) => { assert.equal(file, 'gcloud'); assert.deepEqual(args, ['version']); }, () => assert.fail());
});
