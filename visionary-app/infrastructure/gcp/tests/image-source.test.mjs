import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createImageSource, imageInputs } from '../image-source.mjs';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'visionary-image-fixture-')), root = join(directory, 'visionary-app');
  mkdirSync(root);
  const git = args => execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  git(['init', '--quiet']); git(['config', 'user.name', 'Synthetic image test']); git(['config', 'user.email', 'image@example.invalid']);
  git(['config', 'commit.gpgsign', 'false']); git(['config', 'core.autocrlf', 'false']);
  const put = (path, value = 'reviewed source\n') => { mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), value); };
  for (const input of imageInputs.filter(p => !p.endsWith('/'))) put(input, input.endsWith('.json') ? '{}' : 'reviewed source\n');
  put('frontend/src/main.jsx'); put('frontend/public/logo.svg'); put('backend/upstream/backend/src/main-product.ts');
  const commit = () => { git(['add', '.']); git(['commit', '--quiet', '-m', 'Synthetic reviewed inputs']); return git(['rev-parse', 'HEAD']); };
  const head = commit();
  t.after(() => {
    const actual = realpathSync(directory);
    if (dirname(actual) !== realpathSync(tmpdir()) || !basename(actual).startsWith('visionary-image-fixture-')) throw Error('Fixture cleanup boundary');
    rmSync(actual, { recursive: true });
  });
  return { root, put, git, commit, head };
}

test('image snapshot uses exact reviewed bytes and excludes mutable, ignored and unrelated content', t => {
  const f = fixture(t);
  f.put('frontend/src/main.jsx', 'uncommitted replacement');
  f.put('frontend/src/untracked-settings.json', '{"type":"service_account","private_key":"synthetic-only"}');
  f.put('backend/upstream/backend/not-approved.txt', 'synthetic canary');
  f.put('research/private-notes.txt', 'synthetic canary');
  const source = createImageSource({ root: f.root, commit: f.head });
  try {
    assert.equal(readFileSync(join(source.context, 'frontend/src/main.jsx'), 'utf8'), 'reviewed source\n');
    assert.equal(existsSync(join(source.context, 'frontend/src/untracked-settings.json')), false);
    assert.equal(existsSync(join(source.context, 'backend/upstream/backend/not-approved.txt')), false);
    assert.equal(existsSync(join(source.context, 'research')), false);
    assert.equal(source.manifest.commit, f.head);
    assert.equal(source.digest, createHash('sha256').update(JSON.stringify(source.manifest)).digest('hex'));
    assert.ok(source.manifest.files.every(x => /^[a-f0-9]{64}$/.test(x.sha256)));
  } finally { source.cleanup(); }
});

test('commit labels cannot claim another head and required build inputs cannot disappear', t => {
  const f = fixture(t);
  assert.throws(() => createImageSource({ root: f.root, commit: 'a'.repeat(40) }), /must equal/);
  assert.throws(() => createImageSource({ root: f.root, commit: '--source' }), /exact source/);
  f.git(['rm', '--quiet', 'visionary-app/backend/upstream/backend/prisma/schema.prisma']);
  const head = f.commit();
  assert.throws(() => createImageSource({ root: f.root, commit: head }), /Missing image input/);
});

test('tracked credentials are denied before a Docker build can receive the context', t => {
  for (const [path, value] of [
    ['frontend/public/settings.json', '{"type":"authorized_user","refresh_token":"synthetic-only"}'],
    ['backend/upstream/backend/src/config.json', '{"type":"service_account","private_key":"synthetic-only"}'],
    ['frontend/public/key.txt', '-----BEGIN PRIVATE KEY-----\nsynthetic-only'],
    ['frontend/public/.env.production', 'SYNTHETIC_ONLY=yes'],
  ]) {
    const f = fixture(t); f.put(path, value); const head = f.commit();
    assert.throws(() => createImageSource({ root: f.root, commit: head }), /Credential material/);
  }
});

test('symlink source entries cannot escape the snapshot boundary', t => {
  const f = fixture(t);
  const object = execFileSync('git', ['hash-object', '-w', '--stdin'], { cwd: f.root, input: '../outside', encoding: 'utf8' }).trim();
  f.git(['update-index', '--add', '--cacheinfo', '120000,' + object + ',visionary-app/frontend/src/link']);
  f.git(['commit', '--quiet', '-m', 'Synthetic link boundary']);
  assert.throws(() => createImageSource({ root: f.root, commit: f.git(['rev-parse', 'HEAD']) }), /Unsupported image source/);
});

test('checkout and export attributes cannot transform attested source bytes', t => {
  const f = fixture(t);
  f.put('frontend/src/main.jsx', '$Format:%H$');
  f.put('frontend/src/.gitattributes', 'main.jsx export-subst\n');
  const head = f.commit();
  const source = createImageSource({ root: f.root, commit: head });
  try { assert.equal(readFileSync(join(source.context, 'frontend/src/main.jsx'), 'utf8'), '$Format:%H$'); }
  finally { source.cleanup(); }
});

test('case aliases cannot attest two inputs for one filesystem path', t => {
  const f = fixture(t);
  f.git(['config', 'core.ignorecase', 'false']);
  const object = f.git(['rev-parse', 'HEAD:visionary-app/frontend/src/main.jsx']);
  f.git(['update-index', '--add', '--cacheinfo', '100644,' + object + ',visionary-app/frontend/src/MAIN.jsx']);
  f.git(['commit', '--quiet', '-m', 'Synthetic case collision']);
  assert.throws(() => createImageSource({ root: f.root, commit: f.git(['rev-parse', 'HEAD']) }), /Colliding image source paths/);
});
