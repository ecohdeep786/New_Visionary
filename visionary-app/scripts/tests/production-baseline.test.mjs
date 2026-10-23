import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('dev refreshes production history, blocks stale code without changing drafts, and leaves builds offline', () => {
  const prefix = path.join(os.tmpdir(), 'visionary-baseline-');
  const fixture = fs.mkdtempSync(prefix);
  const remote = path.join(fixture, 'remote.git'), writer = path.join(fixture, 'writer'), checkout = path.join(fixture, 'checkout');
  const git = (cwd, args) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
  };
  try {
    git(fixture, ['init', '--bare', '--initial-branch=main', remote]);
    fs.mkdirSync(writer);
    git(writer, ['init', '--initial-branch=main']);
    git(writer, ['config', 'user.name', 'Synthetic baseline test']);
    git(writer, ['config', 'user.email', 'baseline@example.test']);
    fs.writeFileSync(path.join(writer, 'baseline.txt'), 'first production');
    git(writer, ['add', 'baseline.txt']); git(writer, ['commit', '-m', 'First production']);
    git(writer, ['remote', 'add', 'origin', remote]); git(writer, ['push', '-u', 'origin', 'main']);
    git(fixture, ['clone', remote, checkout]);
    const product = path.join(checkout, 'visionary-app'), scripts = path.join(product, 'scripts');
    fs.mkdirSync(scripts, { recursive: true }); fs.mkdirSync(path.join(product, 'frontend'));
    const entry = path.join(scripts, 'frontend.mjs'), stub = path.join(fixture, 'npm-stub.cjs');
    fs.copyFileSync(fileURLToPath(new URL('../frontend.mjs', import.meta.url)), entry);
    fs.writeFileSync(stub, 'console.log("FRONTEND_STARTED:" + process.argv.slice(2).join(" "));');
    const run = action => spawnSync(process.execPath, [entry, action], { cwd: product, encoding: 'utf8', windowsHide: true, env: { ...process.env, npm_execpath: stub } });
    const initial = run('dev');
    assert.equal(initial.status, 0, initial.stderr); assert.match(initial.stdout, /Production baseline verified/); assert.match(initial.stdout, /FRONTEND_STARTED:run dev/);
    const oldHead = git(checkout, ['rev-parse', 'HEAD']);
    const draft = path.join(checkout, 'draft.txt'); fs.writeFileSync(draft, 'Keep this unfinished feature');
    fs.writeFileSync(path.join(writer, 'baseline.txt'), 'new production');
    git(writer, ['add', 'baseline.txt']); git(writer, ['commit', '-m', 'New production']); git(writer, ['push']);
    const stale = run('dev');
    assert.notEqual(stale.status, 0); assert.match(stale.stderr, /missing the latest production main/); assert.doesNotMatch(stale.stdout, /FRONTEND_STARTED/);
    assert.equal(git(checkout, ['rev-parse', 'HEAD']), oldHead);
    assert.equal(fs.readFileSync(draft, 'utf8'), 'Keep this unfinished feature');
    assert.equal(git(checkout, ['rev-parse', 'origin/main']), git(writer, ['rev-parse', 'HEAD']));
    git(checkout, ['merge', '--ff-only', 'origin/main']);
    assert.equal(run('dev').status, 0);
    git(checkout, ['remote', 'set-url', 'origin', path.join(fixture, 'missing-remote.git')]);
    const unavailable = run('dev'); assert.notEqual(unavailable.status, 0); assert.match(unavailable.stderr, /Cannot verify the latest production source/);
    const build = run('build'); assert.equal(build.status, 0, build.stderr); assert.match(build.stdout, /FRONTEND_STARTED:run build/);
  } finally {
    assert.ok(path.resolve(fixture).startsWith(path.resolve(prefix)));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
