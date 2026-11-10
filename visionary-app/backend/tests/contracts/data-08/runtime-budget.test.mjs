import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseDeployArgs, deployRelease, production } from '../../../../infrastructure/gcp/release.mjs';
const source = fileURLToPath(new URL('../../../upstream/backend/src/', import.meta.url));

test('pool inventory follows the selected product graph and includes every actual SQL client', () => {
  const visited = new Set(), pools = [];
  function walk(file) {
    if (visited.has(file)) return; visited.add(file);
    const text = readFileSync(file, 'utf8');
    const count = [...text.matchAll(/new PrismaClient\(/g)].length;
    if (count) { assert.equal(count, 1); pools.push(relative(source, file).replaceAll('\\', '/')); }
    for (const match of text.matchAll(/from\s+['"]([.][^'"]+)['"]/g)) {
      const child = resolve(dirname(file), match[1] + '.ts'); if (existsSync(child)) walk(child);
    }
  }
  walk(join(source, 'auth/firebase-product/firebase-product.module.ts'));
  assert.deepEqual(pools.sort(), ['consent/product-consent.service.ts', 'invitations/product-invitation.service.ts',
    'overview/product-overview.store.ts', 'workspaces/personal-workspace.service.ts']);
  for (const file of pools) assert.match(readFileSync(join(source, file), 'utf8'), /\['connection_limit',\s*3\]/);
  assert.match(readFileSync(join(source, 'data/migration-identities.ts'), 'utf8'), /\['connection_limit',\s*3\]/);
});

test('release bounds revision instances and refuses a service whose shared instance cap drifted', async () => {
  const commit = 'a'.repeat(40), image = production.image + '@sha256:' + 'b'.repeat(64);
  assert.ok(releaseDeployArgs({ commit, image, suffix: 'data08', globalSignOut: false }).includes('--max-instances=1'));
  await assert.rejects(deployRelease({ commit, image, revision: production.service + '-g' + commit.slice(0, 12) + '-data08',
    assertCurrentMain: async () => {}, readService: async () => ({ metadata: { annotations: { 'run.googleapis.com/maxScale': '2' } } }),
  }), /Service cost limit must be bootstrapped/);
});
