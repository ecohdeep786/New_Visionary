import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCiAudit } from '../ci-audit.mjs';

const workflow = readFileSync(new URL('../../../../.github/workflows/production.yml', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n');

test('the committed workflow passes the nine CI checks', () => {
  const results = runCiAudit({ workflow });
  assert.deepEqual(results.filter(result => !result.pass), []);
  assert.equal(results.length, 9);
});

const mutations = [
  ['an unpinned action', 'pinned-actions', /actions\/checkout@[a-f0-9]{40}/, 'actions/checkout@v6'],
  ['an action with a suffix after its SHA', 'pinned-actions', /actions\/checkout@[a-f0-9]{40}/, '$&-fake'],
  ['an unreviewed branch', 'triggers', '[dev, main, beta]', '[dev, main, beta, extra]'],
  ['a missing reviewed branch', 'triggers', '[dev, main, beta]', '[dev, beta]'],
  ['write permissions in production', 'least-privilege-permissions', '      id-token: write', '$&\n      issues: write'],
  ['write permissions at workflow level', 'least-privilege-permissions', '  contents: read\n\njobs:', '  contents: read\n  issues: write\n\njobs:'],
  ['commented product checks', 'component-tests-builds', '      - run: npm run check', '      # - run: npm run check'],
  ['conditional product checks', 'component-tests-builds', '      - run: npm run check', '      - if: false\n        run: npm run check'],
  ['non-blocking product checks', 'component-tests-builds', '      - run: npm run check', '$&\n        continue-on-error: true'],
  ['disabled dependency audits', 'dependency-secret-checks', /- run: npm audit/g, '- if: false\n        run: npm audit'],
  ['a hardcoded private key', 'dependency-secret-checks', 'permissions:', '# BEGIN PRIVATE KEY\npermissions:'],
  ['a static GCP credentials input', 'dependency-secret-checks', '          workload_identity_provider:', '          credentials_json: ${{ secrets.STATIC_KEY }}\n          workload_identity_provider:'],
  ['a different WIF provider', 'dependency-secret-checks', 'providers/github-main', 'providers/github-other'],
  ['a missing contracts install', 'api-schema-compatibility',
    /      - run: npm ci [^\n]+\n        working-directory: visionary-app\/integration\/contracts\/v1\n/, ''],
  ['a production job without checks', 'immutable-release-smoke', '    needs: checks\n', ''],
  ['a production job on dev', 'immutable-release-smoke', "github.ref == 'refs/heads/main'", "github.ref == 'refs/heads/dev'"],
  ['a production job without its smoke', 'immutable-release-smoke',
    /(^  production:[\s\S]*?)      - run: node infrastructure\/gcp\/container-smoke\.mjs\n/m, '$1'],
  ['a publish step after failed smoke', 'immutable-release-smoke', '      - id: publish', '$&\n        if: always()'],
  ['a deploy step without its switch', 'canary-rollback-wiring',
    "      - if: vars.PRODUCTION_DEPLOY_ENABLED == 'true'\n        run:", '      - run:'],
  ['a deploy using a different image', 'canary-rollback-wiring', 'steps.publish.outputs.image', 'steps.other.outputs.image'],
  ['cancellable deployments', 'canary-rollback-wiring', 'cancel-in-progress: false', 'cancel-in-progress: true'],
  ['a production job with only a step timeout', 'job-bounds', '    timeout-minutes: 25\n', ''],
];

for (const [name, expected, original, replacement] of mutations) {
  test(`refuses ${name}`, () => {
    const changed = workflow.replace(original, replacement);
    assert.notEqual(changed, workflow);
    const result = runCiAudit({ workflow: changed }).find(entry => entry.check === expected);
    assert.equal(result?.pass, false);
  });
}
