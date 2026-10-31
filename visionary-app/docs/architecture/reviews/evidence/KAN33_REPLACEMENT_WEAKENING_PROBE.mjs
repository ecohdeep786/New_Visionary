// Independent reviewer probe for candidate 5fffa44af74916fda9ac6ad6547b21009dd0882a.
// Run only in an isolated review checkout. Restores original fixture bytes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const fixture = path.join(root, 'backend/tests/contracts/scope-06/scope-06-cases.mjs');
const original = await fs.readFile(fixture);
const amendment = `
for (const c of cases) {
  c.state = { ...c.state, workspaceId: 'unrelated:workspace', actorUid: 'unrelated:actor', actorRole: 'organization-owner', store: { ...c.state.store, policyRevision: 'unrelated-policy', consentCurrent: !c.state.store.consentCurrent, sourceCurrent: false, sessionCurrent: false } };
  c.recovery = 'placeholder';
}
`;
const run = args => new Promise(resolve => {
  const child = spawn(process.execPath, args, { cwd: root, windowsHide: true });
  let output = '';
  child.stdout.on('data', value => { output += value; });
  child.stderr.on('data', value => { output += value; });
  child.on('error', error => resolve({ args, code: -1, output: String(error) }));
  child.on('exit', code => resolve({ args, code, output }));
});
try {
  await fs.writeFile(fixture, original.toString() + amendment);
  for (const test of ['backend/tests/contracts/scope-06/scope-06.test.mjs', 'frontend/tests/contracts/scope-06/scope-06.test.mjs']) {
    const result = await run(['--test', test]);
    console.log(JSON.stringify(result));
    assert.equal(result.code, 0, 'Review finding reproduction: weakened authority/recovery fixtures unexpectedly changed the suite result');
  }
} finally {
  await fs.writeFile(fixture, original);
  assert.deepEqual(await fs.readFile(fixture), original);
}
