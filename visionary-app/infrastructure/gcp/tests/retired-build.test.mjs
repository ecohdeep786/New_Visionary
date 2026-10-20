import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync, chmodSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('retired task publication refuses exact-source arguments without calling cloud tools', t => {
  const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
  if (process.platform === 'win32' && !existsSync(bash)) return t.skip('Git Bash is unavailable; Linux CI executes this test.');
  const temporary = mkdtempSync(join(tmpdir(), 'kan29-retired-build-'));
  const marker = join(temporary, 'cloud-called');
  try {
    for (const name of ['gcloud', 'docker']) {
      const stub = join(temporary, name);
      writeFileSync(stub, '#!/usr/bin/env bash\nprintf called > "$CLOUD_CALL_MARKER"\nexit 99\n');
      chmodSync(stub, 0o755);
    }
    const config = join(temporary, 'public.json');
    writeFileSync(config, JSON.stringify({ VITE_FIREBASE_PROJECT_ID: 'visionary-research' }));
    const script = resolve(dirname(fileURLToPath(import.meta.url)), '../build-reviewed.sh');
    const result = spawnSync(bash, [script, 'a'.repeat(40), config], {
      encoding: 'utf8', windowsHide: true, timeout: 10000,
      env: { ...process.env, PATH: temporary + (process.platform === 'win32' ? ';' : ':') + process.env.PATH, CLOUD_CALL_MARKER: marker },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /manual publication flow is retired/);
    assert.match(result.stderr, /GitHub main workflow/);
    assert.equal(existsSync(marker), false);
  } finally {
    const actual = realpathSync(temporary);
    if (dirname(actual) !== realpathSync(tmpdir()) || !basename(actual).startsWith('kan29-retired-build-')) throw Error('Temporary cleanup boundary mismatch.');
    rmSync(actual, { recursive: true, force: true });
  }
});
