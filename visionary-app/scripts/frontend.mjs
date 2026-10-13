import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [task = 'dev', ...extra] = process.argv.slice(2);
if (!process.env.npm_execpath) throw new Error('Use a root npm command or run the frontend package directly.');
const args = task === 'install' ? ['ci', ...extra] : ['run', task, ...(extra.length ? ['--', ...extra] : [])];
const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
  cwd: path.join(root, 'frontend'), stdio: 'inherit', env: process.env,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
