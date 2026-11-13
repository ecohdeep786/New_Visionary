import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const requireFrontend = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { load } = requireFrontend('js-yaml');

const branches = ['beta', 'dev', 'main'];
const app = 'visionary-app';
const authAction = 'google-github-actions/auth';
const identity = {
  workload_identity_provider: 'projects/174851137514/locations/global/workloadIdentityPools/visionary-github/providers/github-main',
  service_account: 'visionary-github-deployer@visionary-research.iam.gserviceaccount.com',
};
const publishGuard = [
  "github.repository == 'ecohdeep786/New_Visionary'",
  "github.ref == 'refs/heads/main'",
  "(github.event_name == 'push' || github.event_name == 'workflow_dispatch')",
  "vars.PRODUCTION_PUBLISH_ENABLED == 'true'",
].join(' && ');
const deployGuard = "vars.PRODUCTION_DEPLOY_ENABLED == 'true'";
const secretPatterns = [
  /BEGIN [A-Z ]*PRIVATE KEY/,
  /AKIA[0-9A-Z]{16}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}/,
];

const isMap = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (actual, expected) => isMap(actual) && Object.keys(actual).length === Object.keys(expected).length
  && Object.entries(expected).every(([key, value]) => actual[key] === value);
const requiredStep = (step, command) => step.run === command && step.if === undefined && step.shell === undefined
  && (step['continue-on-error'] === undefined || step['continue-on-error'] === false);
const unconditionalJob = job => job.if === undefined && job.needs === undefined
  && (job['continue-on-error'] === undefined || job['continue-on-error'] === false);
const stepDirectory = (job, step) => step['working-directory'] ?? job.defaults?.run?.['working-directory'];
const safeOrder = (job, commands) => {
  const indices = commands.map(command => {
    if (job.steps.filter(step => step.run === command).length !== 1) return -1;
    return job.steps.findIndex(step => requiredStep(step, command) && stepDirectory(job, step) === app);
  });
  return indices.every((index, position) => index >= 0 && (position === 0 || indices[position - 1] < index));
};

export function runCiAudit({
  workflow = readFileSync(new URL('../../../.github/workflows/production.yml', import.meta.url), 'utf8'),
} = {}) {
  let config;
  try {
    config = load(workflow);
  } catch {
    return [{ check: 'workflow-shape', pass: false, detail: 'workflow must be valid YAML with unique keys' }];
  }
  const jobs = Object.values(config?.jobs ?? {});
  const checks = config?.jobs?.checks;
  const production = config?.jobs?.production;
  if (!checks || !production || !jobs.every(job =>
    isMap(job) && Array.isArray(job.steps) && job.steps.every(isMap))) {
    return [{ check: 'workflow-shape', pass: false, detail: 'workflow must define checks and production jobs with valid steps' }];
  }

  const check = (name, passed, detail) => ({ check: name, pass: Boolean(passed), detail });
  const triggers = config.on ?? {};
  const actions = jobs.flatMap(job => job.steps ?? []).flatMap(step => step.uses ? [step.uses] : []);
  const authSteps = production.steps.filter(step => typeof step.uses === 'string' && step.uses.startsWith(authAction + '@'));
  const [auth] = authSteps;
  const componentCommands = [
    'npm run check',
    'npm run data:check',
    'node infrastructure/gcp/data-job/check-image.mjs',
    'node scripts/production-check.mjs',
    'node infrastructure/gcp/check-product-api-image.mjs',
    'node infrastructure/gcp/build-image.mjs',
    'node infrastructure/gcp/container-smoke.mjs',
    'node --test infrastructure/gcp/tests/*.test.mjs',
    "python3 -m unittest discover -s infrastructure/gcp/tests -p '*_test.py'",
  ];
  const auditDirectories = ['infrastructure/gcp/runtime', 'integration/contracts/v1', 'infrastructure/gcp/data-job'];
  const hasCheckStep = (command, dir = app) => checks.steps.some(step =>
    requiredStep(step, command) && stepDirectory(checks, step) === dir);
  const publish = production.steps.find(step => requiredStep(step, 'node infrastructure/gcp/release.mjs publish'));
  const deploy = production.steps.find(step => step.run === 'node infrastructure/gcp/release.mjs deploy');
  const contractInstall = checks.steps.findIndex(step =>
    requiredStep(step, 'npm ci --ignore-scripts --no-audit --no-fund')
    && stepDirectory(checks, step) === app + '/integration/contracts/v1');
  const productCheck = checks.steps.findIndex(step =>
    requiredStep(step, 'npm run check') && stepDirectory(checks, step) === app);

  return [
    check('triggers',
      Object.keys(triggers).length === 3 && Object.hasOwn(triggers, 'workflow_dispatch')
        && ['push', 'pull_request'].every(event => {
          const trigger = triggers[event];
          return trigger && Object.keys(trigger).length === 1 && Array.isArray(trigger.branches)
            && [...trigger.branches].sort().join(',') === branches.join(',');
        }),
      'push and pull request cover dev, main, and beta, with manual dispatch'),
    check('least-privilege-permissions',
      exact(config.permissions, { contents: 'read' })
        && exact(production.permissions, { contents: 'read', 'id-token': 'write' })
        && jobs.filter(job => job !== production).every(job =>
          job.permissions === undefined || exact(job.permissions, { contents: 'read' })),
      'only production receives OIDC access and all jobs are read-only for repository contents'),
    check('pinned-actions',
      actions.length > 0 && actions.every(action => /^[\w.-]+\/[\w.-]+(?:\/[\w.-]+)*@[a-f0-9]{40}$/.test(action)),
      'external actions are pinned to full commit SHAs'),
    check('component-tests-builds',
      unconditionalJob(checks) && checks.defaults?.run?.shell === undefined && config.defaults?.run?.shell === undefined
        && checks.services?.postgres?.image === 'postgres:16'
        && componentCommands.every(command => hasCheckStep(command)),
      'checks run the product, data, image, and infrastructure suites'),
    check('dependency-secret-checks',
      auditDirectories.every(dir => hasCheckStep('npm audit --omit=dev --audit-level=high', app + '/' + dir))
        && !secretPatterns.some(pattern => pattern.test(workflow))
        && authSteps.length === 1 && auth.if === undefined && exact(auth.with, identity)
        && (auth['continue-on-error'] === undefined || auth['continue-on-error'] === false)
        && jobs.flatMap(job => job.steps ?? []).filter(step => typeof step.uses === 'string'
          && step.uses.startsWith(authAction + '@')).length === 1,
      'runtime, contracts, and data-job dependency audits run with reviewed keyless production authentication'),
    check('api-schema-compatibility',
      contractInstall >= 0 && productCheck > contractInstall,
      'the integration contracts package is installed before the product check battery'),
    check('immutable-release-smoke',
      production.needs === 'checks' && typeof production.if === 'string' && production.if.replace(/\s+/g, ' ').trim() === publishGuard
        && production['continue-on-error'] === undefined
        && config.defaults?.run?.shell === undefined && production.defaults?.run?.shell === undefined
        && safeOrder(production, [
          'node infrastructure/gcp/build-image.mjs',
          'node infrastructure/gcp/container-smoke.mjs',
          'node infrastructure/gcp/release.mjs publish',
        ]) && production.defaults?.run?.['working-directory'] === app
        && publish?.id === 'publish' && stepDirectory(production, publish) === app && production.steps.indexOf(auth) < production.steps.indexOf(publish)
        && Boolean(auth) && production.steps.filter(step => step.id === 'publish').length === 1,
      'production depends on successful checks and builds and smokes the image before publishing'),
    check('canary-rollback-wiring',
      deploy?.if === deployGuard && deploy['continue-on-error'] === undefined && deploy.shell === undefined
        && production.steps.filter(step => step.run === 'node infrastructure/gcp/release.mjs deploy').length === 1
        && stepDirectory(production, deploy) === app && Boolean(publish)
        && deploy.env?.PRODUCTION_IMAGE === '${{ steps.publish.outputs.image }}'
        && deploy.env?.PRODUCTION_DEPLOY_ENABLED === '${{ vars.PRODUCTION_DEPLOY_ENABLED }}'
        && production.steps.indexOf(deploy) > production.steps.indexOf(publish)
        && exact(production.concurrency, { group: 'visionary-main-production', 'cancel-in-progress': false }),
      'production deploys the published digest through the switch-gated serialized release command'),
    check('job-bounds',
      jobs.every(job => Number.isInteger(job['timeout-minutes'])
        && job['timeout-minutes'] > 0 && job['timeout-minutes'] <= 60),
      'each job has a positive timeout of at most 60 minutes'),
  ];
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const results = runCiAudit();
  const failures = results.filter(result => !result.pass);
  for (const result of results) console.log(`${result.pass ? 'PASS' : 'REFUSE'} ${result.check}: ${result.detail}`);
  console.log(failures.length
    ? `CI AUDIT FAILED: ${failures.length} check(s) refused.`
    : 'CI AUDIT PASSED: workflow checks verified. Hosted smoke, canary, and rollback require runtime evidence.');
  if (failures.length) process.exitCode = 1;
}
