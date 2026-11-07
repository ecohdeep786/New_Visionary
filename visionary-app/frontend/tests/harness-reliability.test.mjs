import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BlockedEnvironmentError, resolveLaunchOptions, openEvidenceDir, authModeLabel, receiptMeta, betaSha } from '../scripts/qa-env.mjs';

/* F-02 harness-reliability self-tests: the test infrastructure must prove its
 * own laws — S02 broken expectations fail, S03 missing browser binaries are
 * BLOCKED_ENVIRONMENT (never false PASS), S04 preview is never labeled hosted,
 * S05 evidence directories are never silently overwritten. */

const withEnv = (values, run) => {
  const saved = {};
  for (const [key, value] of Object.entries(values)) { saved[key] = process.env[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  try { run(); } finally { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
};

test('S03: a missing explicit browser binary is BLOCKED_ENVIRONMENT before any run starts', () => {
  withEnv({ QA_BROWSER_EXECUTABLE: path.join(os.tmpdir(), 'definitely-missing-browser-binary') }, () => {
    assert.throws(() => resolveLaunchOptions(), error => error instanceof BlockedEnvironmentError && error.code === 'BLOCKED_ENVIRONMENT'
      && /missing browser binary/.test(error.message));
  });
});

test('S03: an installed explicit browser binary resolves to executablePath without a channel', () => {
  const fake = path.join(os.tmpdir(), `qa-env-fake-browser-${process.pid}`);
  fs.writeFileSync(fake, '#!/bin/sh\nexit 0\n');
  try {
    withEnv({ QA_BROWSER_EXECUTABLE: fake, QA_BROWSER_CHANNEL: 'msedge' }, () => {
      const options = resolveLaunchOptions();
      assert.equal(options.executablePath, fake);
      assert.equal(options.channel, undefined, 'playwright forbids combining channel and executablePath');
    });
  } finally { fs.rmSync(fake, { force: true }); }
});

test('browser resolution defaults to the documented channel strategy, not a Windows-only path', () => {
  withEnv({ QA_BROWSER_EXECUTABLE: undefined }, () => {
    const options = resolveLaunchOptions();
    assert.equal(options.channel, 'msedge');
    assert.equal(options.executablePath, undefined);
    assert.equal(options.headless, true);
    assert.deepEqual(options.args, ['--no-proxy-server']);
  });
});

test('S05: a run refuses to write into a non-empty evidence directory without the override', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-evidence-guard-'));
  try {
    fs.writeFileSync(path.join(dir, 'recorded-artifact.json'), '{"recorded": true}\n');
    await assert.rejects(() => openEvidenceDir(dir), /already holds 1 artifacts.*ALLOW_EVIDENCE_OVERWRITE=1/s);
    assert.equal(fs.readFileSync(path.join(dir, 'recorded-artifact.json'), 'utf8'), '{"recorded": true}\n', 'the guard must not touch existing artifacts when refusing');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('S05: an allowed overwrite is a deliberate clean slate with no stale artifacts', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-evidence-clean-'));
  try {
    fs.writeFileSync(path.join(dir, 'stale-screenshot.png'), 'stale bytes');
    withEnv({ ALLOW_EVIDENCE_OVERWRITE: '1' }, async () => {
      await openEvidenceDir(dir);
      assert.deepEqual(fs.readdirSync(dir), [], 'stale artifacts must not survive an allowed overwrite');
      fs.writeFileSync(path.join(dir, 'fresh-artifact.json'), '{}\n');
    });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('S05: a fresh evidence directory is simply created', async () => {
  const dir = path.join(os.tmpdir(), `qa-evidence-fresh-${process.pid}-${Date.now()}`);
  try {
    assert.equal(await openEvidenceDir(dir), dir);
    assert.ok(fs.statSync(dir).isDirectory());
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('S04: the auth-mode label never describes preview as hosted acceptance', () => {
  assert.match(authModeLabel(undefined), /^preview \(local preview repository — NOT hosted acceptance\)/);
  assert.match(authModeLabel('preview'), /^preview \(local preview repository — NOT hosted acceptance\)/);
  const firebase = authModeLabel('firebase');
  assert.match(firebase, /^firebase \(hosted identity provider/);
  assert.match(firebase, /only where a run explicitly verifies it/, 'firebase mode must still not claim blanket hosted acceptance');
});

test('receipt metadata carries the full provenance law: sha, timestamp, browser, viewport, route, role, locale, honest auth mode', () => {
  withEnv({ QA_BETA_SHA: 'abc123test' }, () => {
    const meta = receiptMeta({ route: '/research', viewport: { width: 390, height: 844 }, browser: 'Edge/138', role: 'student', locale: 'hi' });
    assert.equal(meta.betaSha, 'abc123test');
    assert.ok(!Number.isNaN(Date.parse(meta.timestamp)), 'timestamp must be ISO');
    assert.equal(meta.browser, 'Edge/138');
    assert.deepEqual(meta.viewport, { width: 390, height: 844 });
    assert.equal(meta.route, '/research');
    assert.equal(meta.role, 'student');
    assert.equal(meta.locale, 'hi');
    assert.match(meta.authMode, /^preview \(local preview repository/);
  });
});

test('S02: a deliberately broken expectation fails the runner nonzero and the failure log is kept', { timeout: 60000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-controlled-failure-'));
  const evidence = path.join(dir, 'controlled-failure-logs');
  fs.mkdirSync(evidence, { recursive: true });
  try {
    const brokenTest = path.join(dir, 'deliberately-broken.test.mjs');
    fs.writeFileSync(brokenTest, [
      "import test from 'node:test';",
      "import assert from 'node:assert/strict';",
      "test('intentionally broken expectation (F-02 controlled failure proof)', () => {",
      "  assert.equal(1 + 1, 3);",
      '});',
    ].join('\n'));
    /* Nested node --test inherits NODE_TEST_CONTEXT from this runner and then
     * SKIPS all files while exiting 0 — a false green (found by the F-02
     * controlled-failure proof itself). A harness must sanitize that variable
     * before spawning a nested test run. */
    const childEnv = { ...process.env };
    delete childEnv.NODE_TEST_CONTEXT;
    let failed = false;
    let output = '';
    try {
      output = execFileSync(process.execPath, ['--test', brokenTest], { encoding: 'utf8', env: childEnv });
    } catch (error) {
      failed = true;
      output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    }
    const logPath = path.join(evidence, 'controlled-failure-node-test.log');
    fs.writeFileSync(logPath, output);
    assert.ok(failed, 'a broken expectation MUST fail the harness (S02)');
    assert.match(output, /intentionally broken expectation/, 'the failure log must name the broken test');
    assert.match(output, /# fail 1/, 'the runner must count the failure');
    assert.ok(fs.existsSync(logPath), 'the failure log must be kept as evidence');
    const syntaxBroken = path.join(dir, 'syntax-broken.mjs');
    fs.writeFileSync(syntaxBroken, 'const x = {;,,,');
    let syntaxFailed = false;
    try { execFileSync(process.execPath, ['--check', syntaxBroken], { stdio: 'ignore' }); } catch { syntaxFailed = true; }
    assert.ok(syntaxFailed, 'broken source syntax MUST fail the check (S02)');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('betaSha prefers the explicit override and records the checkout otherwise', () => {
  withEnv({ QA_BETA_SHA: 'override-sha' }, () => assert.equal(betaSha(), 'override-sha'));
  withEnv({ QA_BETA_SHA: undefined }, () => {
    const sha = betaSha();
    assert.match(sha, /^[0-9a-f]{40}$|^unknown/, 'the recorded SHA is either the checkout HEAD or an explicit unknown');
  });
});
