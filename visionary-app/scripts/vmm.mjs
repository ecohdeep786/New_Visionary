import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!['test', 'inventory'].includes(process.argv[2])) throw Error('Use vmm.mjs test|inventory; this library has no serving/training entrypoint.');
const python = process.env.VISIONARY_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const env = { ...process.env, PYTHONPATH: path.join(root, 'ml'), PYTHONIOENCODING: 'utf-8' };
function run(args) {
  const result = spawnSync(python, args, { cwd: root, stdio: 'inherit', env });
  if (result.error) throw Error('Set VISIONARY_PYTHON to a Python 3.11+ interpreter: ' + result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (process.argv[2] === 'test') {
  run(['-m', 'unittest', 'discover', '-s', 'ml/vmm/tests', '-p', 'test_*.py']);
} else {
  // Exposure inventory: evidence JSON only; credential contents never read/recorded.
  run(['-c', "from vmm.exposure import write_inventory; print(write_inventory('.', 'ml/vmm/evidence/exposure-inventory-latest.json'))"]);
  console.log('Inventory written to ml/vmm/evidence/exposure-inventory-latest.json');
}
