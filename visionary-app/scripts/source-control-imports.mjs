import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'integration/upstream-lock.json'), 'utf8'));
const files = manifest.sources.flatMap(source => source.files.map(file => `${source.path}/${file.path}`));
const input = Buffer.from(`${files.join('\0')}\0`);
const stage = process.argv.includes('--stage');
if (stage) await import('./verify-imports.mjs');
const result = spawnSync('git', stage
  ? ['add', '--force', '--pathspec-from-file=-', '--pathspec-file-nul']
  : ['check-ignore', '-z', '--stdin'], { cwd: root, input, encoding: 'utf8', maxBuffer: 4_000_000 });
if (result.error || (stage ? result.status !== 0 : ![0, 1].includes(result.status))) throw new Error(result.error?.message ?? result.stderr);
if (stage) console.log(`Staged exactly ${files.length} manifest-listed imported source files. Other product edits were not staged.`);
else {
  const ignored = result.stdout.split('\0').filter(Boolean);
  console.log(`${ignored.length} imported files match original upstream ignore rules.`);
  for (const filename of ignored.slice(0, 12)) console.log(filename);
  console.log('To save the complete reviewed snapshots, use npm run product:stage-imports. It stages only manifest-listed source, including original tracked fixtures/templates; it never adds local .env or node_modules.');
}
