import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [component = 'doctor', action = 'build', ...extra] = process.argv.slice(2);
const windows = process.platform === 'win32';
const nodeDirectory = path.dirname(process.execPath);
const backendNode = process.execPath;
const backendNpm = process.env.npm_execpath;
const backendNodeSupported = [22, 24].includes(Number(process.versions.node.split('.')[0]));
const go = windows ? path.join(root, '.tools/go125/go/bin/go.exe') : 'go';

function run(executable, args, cwd, additions = {}) {
  const result = spawnSync(executable, args, { cwd, stdio: 'inherit', env: { ...process.env, ...additions } });
  if (result.error) throw new Error(`${executable}: ${result.error.message}. See integration/README.md for setup.`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (component === 'doctor') {
  const imports = JSON.parse(fs.readFileSync(path.join(root, 'integration/upstream-lock.json'), 'utf8'));
  for (const source of imports.sources) console.log(`${source.name}: ${source.commit.slice(0, 12)}; ${source.files.length} source files; ${source.files.filter(file => file.sanitized).length} sanitized`);
  console.log(`Frontend / REA Node: ${process.version}`);
  console.log('Frontend: frontend/ (source, assets, configs, dependencies and tests)');
  console.log('Local infrastructure: infrastructure/local/compose.yml');
  console.log(`Backend Node: ${process.version}; ${backendNodeSupported ? 'supported for Firebase Admin' : 'use supported Node 22 or 24 LTS; Node 24 recommended'}`);
  console.log(`ML Go 1.25: ${!windows || fs.existsSync(go) ? 'available; verify with ml:build' : 'missing; run scripts/setup-toolchains.ps1'}`);
  console.log('Live frontend/backend/ML connection: pending authenticated API and workspace integration.');
} else if (component === 'backend') {
  if (!backendNodeSupported) throw new Error('Firebase Admin requires a supported backend runtime. Use Node 22 or 24 LTS (24 recommended).');
  if (!backendNpm) throw new Error('Run this task through npm.');
  const cwd = path.join(root, 'backend/upstream/backend');
  const env = windows ? { PATH: `${nodeDirectory};${process.env.PATH}` } : {};
  if (action === 'auth-dev') {
    run(backendNode, ['--watch', '-r', 'ts-node/register', 'src/main-auth.ts'], cwd, env);
    process.exit(0);
  }
  if (action === 'firebase-check') {
    run(backendNode, [path.join(root, 'scripts/firebase-check.cjs'), ...extra], cwd, env);
    process.exit(0);
  }
  const args = action === 'install' ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund'] : action === 'generate' ? ['run', 'prisma:generate'] : action === 'build' ? ['run', 'build'] : action === 'dev' ? ['run', 'start:dev'] : null;
  if (!args) throw new Error(`Unknown backend action: ${action}`);
  if (action === 'install') {
    run(backendNode, [backendNpm, ...args], cwd, env);
    // Explicitly rebuild the reviewed native password library, rather than running every lifecycle hook.
    run(backendNode, [backendNpm, 'rebuild', 'bcrypt'], cwd, env);
    run(backendNode, [backendNpm, 'run', 'prisma:generate'], cwd, env);
  } else run(backendNode, [backendNpm, ...args, ...extra], cwd, env);
} else if (component === 'ml') {
  const modules = ['services/api-gateway', 'services/embedding-service', 'services/vector-search-service', 'services/query-understanding-service'];
  const libraries = ['pkg/circuitbreaker', 'pkg/contextkeys', 'pkg/httperrors', 'pkg/types', 'shared/go'];
  const targets = action === 'test' ? libraries : action === 'build' || action === 'install' ? [...libraries, ...modules] : null;
  if (!targets) throw new Error(`Unknown ML action: ${action}`);
  for (const target of targets) {
    console.log(`ML ${action}: ${target}`);
    const args = action === 'install' ? ['mod', 'download'] : action === 'test' ? ['test', './...'] : ['build', './...'];
    run(go, args, path.join(root, 'ml/upstream', target), { GOTOOLCHAIN: 'local', GOMAXPROCS: process.env.GOMAXPROCS ?? '2' });
  }
} else if (component === 'rea') {
  const cwd = path.join(root, 'reverse-engineering/upstream');
  if (action === 'cli') run(process.execPath, ['scripts/rea.mjs', ...extra], cwd);
  else {
    if (!process.env.npm_execpath) throw new Error('Run this task through npm.');
    const args = action === 'install' ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund'] : action === 'build' ? ['run', 'build:cached'] : null;
    if (!args) throw new Error(`Unknown REA action: ${action}`);
    run(process.execPath, [process.env.npm_execpath, ...args], cwd, { HUSKY: '0', DO_NOT_TRACK: '1', TURBO_TELEMETRY_DISABLED: '1' });
  }
} else throw new Error(`Unknown component: ${component}`);
