// Executes the real physical domain verifier with temporary reviewer-owned
// migration-artifact weakening. Exact original bytes are restored in finally.
const assert = require('node:assert/strict');
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const root = resolve(__dirname, '../../../..');
const expected = process.env.KAN39_REVIEW_SOURCE;
if (!/^[a-f0-9]{40}$/.test(expected || '')) throw Error('Explicit exact reviewed source required');
const artifact = 'backend/upstream/backend/prisma/migrations/20261102000002_data_04_invitation_reissue/migration.sql';
execFileSync('git', ['diff', '--exit-code', expected, '--', artifact, 'scripts/domain-ddl.mjs', 'backend/upstream/backend/prisma/schema.prisma'], { cwd: root, stdio: 'pipe' });
const file = resolve(root, artifact), original = readFileSync(file), sql = original.toString('utf8');
const evidence = resolve(process.env.KAN39_NATIVE_EVIDENCE || '');
if (!evidence.toLowerCase().startsWith('c:\\users\\administrator\\visionary-local\\kan39-independent-review-20261102\\')) throw Error('Explicit reviewer-local evidence directory required');
mkdirSync(evidence, { recursive: true });
const strict = process.env.KAN39_NATIVE_EXPECT_STRICT === '1';
function run(name, source) {
  writeFileSync(file, source);
  const result = spawnSync(process.execPath, ['scripts/domain-ddl.mjs'], { cwd: root, env: process.env, encoding: 'utf8', timeout: 120000, windowsHide: true });
  writeFileSync(resolve(evidence, name + '.log'), (result.stdout || '') + (result.stderr || ''));
  if (result.error) throw result.error;
  console.log(JSON.stringify({ case: name, exit: result.status }));
  return result.status;
}
try {
  assert.equal(run('baseline', original), 0);
  assert.notEqual(run('physical-model-drift', sql + '\nALTER TABLE "invitations" ADD COLUMN "reviewUnexpected" TEXT;\n'), 0);
  for (const [name, weakened] of [
    ['case-sensitive-key', sql.replace('lower("email")', '"email"')],
    ['role-added-to-key', sql.replace('lower("email"))', 'lower("email"), "role")')],
    ['accepted-in-active-predicate', sql.replace("('PENDING', 'ISSUED')", "('PENDING', 'ISSUED', 'ACCEPTED')")],
    ...(strict ? [['positive-revision-tautology', sql + '\nALTER TABLE "command_results" DROP CONSTRAINT "command_results_revision_positive";\nALTER TABLE "command_results" ADD CONSTRAINT "command_results_revision_positive" CHECK ("revision">0 OR true);\n']] : []),
  ]) {
    assert.notEqual(weakened, sql);
    const status = run(name, weakened);
    if (strict) assert.notEqual(status, 0, 'Native invariant weakening must be rejected: ' + name);
    else assert.equal(status, 0, 'Expected original verifier false acceptance to reproduce: ' + name);
  }
} finally {
  writeFileSync(file, original);
  assert.deepEqual(readFileSync(file), original);
}
