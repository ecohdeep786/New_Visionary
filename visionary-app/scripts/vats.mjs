import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv[2] !== 'test') throw Error('Use vats.mjs test; this library has no serving/training entrypoint.');
const python = process.env.VISIONARY_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
for (const directory of ['ml/vats/tests', 'ml/evaluation']) {
  const result = spawnSync(python, ['-m', 'unittest', 'discover', '-s', directory, '-p', 'test_*.py'], { cwd: root, stdio: 'inherit', env: { ...process.env, PYTHONPATH: path.join(root, 'ml'), PYTHONIOENCODING: 'utf-8' } });
  if (result.error) throw Error('Set VISIONARY_PYTHON to a Python 3.11+ interpreter: ' + result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
