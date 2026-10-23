import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [task = 'dev', ...extra] = process.argv.slice(2);
if (!process.env.npm_execpath) throw new Error('Use a root npm command or run the frontend package directly.');
if (task === 'dev') {
  const refresh = spawnSync('git', ['fetch', '--no-tags', 'origin', 'main'], { cwd: root, encoding: 'utf8', timeout: 30000, windowsHide: true });
  if (refresh.status !== 0) throw new Error('Cannot verify the latest production source. Check GitHub access, then retry npm run dev.');
  const current = spawnSync('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], { cwd: root, windowsHide: true });
  if (current.status !== 0) throw new Error('This checkout is missing the latest production main. Merge origin/main into your task branch, review any conflicts, then retry. Your files have not been changed.');
  const revision = spawnSync('git', ['rev-parse', '--short', 'origin/main'], { cwd: root, encoding: 'utf8', windowsHide: true });
  console.log(`Production baseline verified: origin/main ${revision.stdout.trim()}`);
}
const args = task === 'install' ? ['ci', ...extra] : ['run', task, ...(extra.length ? ['--', ...extra] : [])];
const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
  cwd: path.join(root, 'frontend'), stdio: 'inherit', env: process.env,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
