import { spawnSync } from 'node:child_process';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const args of [[join(root, 'backend/upstream/backend/node_modules/typescript/bin/tsc'), '-p', 'backend/upstream/backend/tsconfig.privacycore.json'], [join(root, 'scripts/provision-check.mjs'), '--suite', 'privacycore']]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw Error('Privacy verification failed (' + (result.status ?? result.error?.code) + ').');
}
