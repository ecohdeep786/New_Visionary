import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendRuntimeArgs } from '../backend-runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const backend = path.join(root, 'backend/upstream/backend');

test('default development and the existing auth alias select the connected product API', () => {
  for (const action of ['dev', 'auth-dev']) {
    assert.deepEqual(backendRuntimeArgs(action), ['--watch', '-r', 'ts-node/register', 'src/main-auth.ts']);
    assert.ok(fs.existsSync(path.join(backend, backendRuntimeArgs(action).at(-1))));
  }
});

test('production uses the actual TypeScript output path and has no legacy fallback', () => {
  assert.deepEqual(backendRuntimeArgs('start'), ['dist/src/main-auth.js']);
  const config = JSON.parse(fs.readFileSync(path.join(backend, 'tsconfig.json'), 'utf8'));
  assert.equal(config.compilerOptions.outDir, './dist');
  for (const action of ['legacy-dev', 'start:dev', 'start:debug', 'main', '']) {
    assert.equal(backendRuntimeArgs(action), null);
  }
});

test('selected module graph cannot import legacy identity, data or model modules', () => {
  const visited = new Set();
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /(?:AppModule|PrismaModule|OrchestratorModule|AuthModule)\b/, file);
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
      if (!match[1].startsWith('.')) continue;
      const candidate = path.resolve(path.dirname(file), match[1]);
      const target = [candidate + '.ts', path.join(candidate, 'index.ts')].find(p => fs.existsSync(p));
      assert.ok(target, `Unresolved product import: ${match[1]} in ${file}`);
      visit(target);
    }
  }
  visit(path.join(backend, 'src/main-auth.ts'));
  assert.ok(visited.has(path.join(backend, 'src/billing/billing.service.ts')));
  assert.ok(visited.has(path.join(backend, 'src/auth/firebase-product/account.controller.ts')));
});
