import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tests = join(root, 'ml/vats/research-gate/research-gate.test.mjs');
const result = spawnSync(process.execPath, ['--test', tests], { cwd: root, env: process.env, stdio: 'inherit', windowsHide: true });
if (result.error || result.status !== 0) throw Error('ResearchGate verification failed (' + (result.status ?? result.error?.code) + ').');
