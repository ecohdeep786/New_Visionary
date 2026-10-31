// Independent reviewer reproductions. Successful assertions demonstrate defects,
// not accepted product behavior. Source is read from the exact Git revisions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const repository = cp.execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const reviewApp = path.resolve(__dirname, '../../../..');
const compilerPath = process.argv[2] || 'C:/Users/Administrator/New_Visionary/visionary-app/backend/upstream/backend/node_modules/typescript/lib/typescript.js';
const ts = require(compilerPath);
const dependencyRoot = path.resolve(path.dirname(compilerPath), '../..');
const candidates = [
  ['principal', '8316a3b0e7b1353f61737b8b50a5ec370c00576a'],
  ['deepseek', '18d6ec4c1ca6b8be56399a15431a805830a1d57c'],
];
const sourceAt = (sha, file) => cp.execFileSync('git', ['show', `${sha}:visionary-app/${file}`], { cwd: repository, encoding: 'utf8' });
const files = ['catalog.service.ts', 'content-store.ts', 'content-types.ts', 'index.ts'];

async function run(label, sha) {
  const root = path.resolve(reviewApp, 'artifacts/qa/kan60-candidate-review', label);
  const backend = path.join(root, 'backend/upstream/backend');
  const sourceDir = path.join(backend, 'src/content');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"commonjs"}\n');
  fs.writeFileSync(path.join(backend, 'package.json'), '{"type":"commonjs"}\n');
  const hashes = {};
  for (const name of files) {
    const source = sourceAt(sha, `backend/upstream/backend/src/content/${name}`);
    fs.writeFileSync(path.join(sourceDir, name), source);
    hashes[name] = crypto.createHash('sha256').update(source).digest('hex');
  }
  const program = ts.createProgram(files.map(name => path.join(sourceDir, name)), {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    strict: true,
    skipLibCheck: true,
    esModuleInterop: true,
    types: ['node'],
    typeRoots: [path.join(dependencyRoot, '@types')],
    rootDir: backend,
    outDir: path.join(backend, 'dist'),
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => repository, getCanonicalFileName: x => x, getNewLine: () => '\n' }));
  assert.equal(program.emit().emitSkipped, false);
  console.log(JSON.stringify({ label, sha, compiled: 'actual exact content service/store/types; strict TypeScript; no source edits', hashes }));

  const testDir = path.join(root, 'backend/tests/contracts/data-content');
  fs.mkdirSync(testDir, { recursive: true });
  const officialTest = path.join(testDir, 'content.test.mjs');
  fs.writeFileSync(officialTest, sourceAt(sha, 'backend/tests/contracts/data-content/content.test.mjs'));
  const ordinary = cp.spawnSync(process.execPath, ['--test', officialTest], { encoding: 'utf8' });
  fs.writeFileSync(path.join(root, 'official-suite.log'), ordinary.stdout + ordinary.stderr);
  assert.equal(ordinary.status, 0, ordinary.stdout + ordinary.stderr);
  console.log(ordinary.stdout.split('\n').filter(line => /(?:tests |pass |fail )\d+/.test(line)).join('\n'));

  const req = createRequire(path.join(backend, 'package.json'));
  const { CatalogService } = req('./dist/src/content/catalog.service.js');
  const { InMemoryCatalogStore } = req('./dist/src/content/content-store.js');
  const pub = { provider: 'synthetic-publisher', edition: 'synthetic-edition', version: '1' };
  const make = () => { const store = new InMemoryCatalogStore(); return { store, service: new CatalogService(store) }; };
  const register = (service, kind, name, parentId = null, ownerUid = 'owner') => service.register({ kind, name, parentId, ownerUid, source: pub, license: 'synthetic-only' });
  const publish = async (service, node) => { await service.approveSource(node.publicId, 'owner', 'approved'); await service.publish(node.publicId, 'owner'); };
  const findings = [];
  {
    const { service } = make();
    const curriculum = await register(service, 'curriculum', 'Synthetic curriculum');
    const book = await register(service, 'book', 'Synthetic book', curriculum.publicId);
    const first = await register(service, 'chapter', 'Chapter 1: integers', book.publicId);
    const second = await register(service, 'chapter', 'Chapter 2: fractions', book.publicId);
    assert.equal(first.publicId, second.publicId);
    assert.equal(second.name, first.name);
    assert.equal((await service.children(book.publicId)).length, 1);
    findings.push('R1 distinct sibling chapters collapse to same ID; second silently returns first');
  }
  {
    const { service } = make();
    const curriculum = await register(service, 'curriculum', 'Synthetic curriculum');
    const book = await register(service, 'book', 'Synthetic book', curriculum.publicId);
    await publish(service, curriculum); await publish(service, book);
    await service.rejectSource(curriculum.publicId, 'owner');
    assert.equal((await service.lineage(book.publicId))[0].source.approval, 'rejected');
    assert.deepEqual(await service.eligibleForRetrieval(book.publicId), { ok: true, reason: 'ok' });
    findings.push('R2 rejected ancestor source still allows child retrieval');
  }
  {
    const { service } = make();
    const node = await register(service, 'curriculum', 'Synthetic curriculum');
    await service.updateMetadata(node.publicId, 'owner', {
      rights: { ownerUid: 'owner', visibility: 'public', license: 'synthetic-only' },
      source: { ...pub, approval: 'released', approvedAt: null, releasedAt: null },
      publication: 'published',
    });
    assert.deepEqual(await service.eligibleForRetrieval(node.publicId), { ok: true, reason: 'ok' });
    findings.push('R3 metadata update bypasses approval and publish transitions with typed allowed patch');
  }
  {
    const { service } = make();
    const node = await register(service, 'curriculum', 'Synthetic curriculum');
    await service.updateMetadata(node.publicId, 'owner', { rights: { ownerUid: 'other-owner', visibility: 'private', license: null } });
    const changed = await service.updateMetadata(node.publicId, 'other-owner', { name: 'Changed after owner transfer' });
    assert.equal(changed.rights.ownerUid, 'other-owner');
    findings.push('R4 metadata rights patch mutates supposedly immutable owner identity');
  }
  {
    // Hold both real missing-row reads before either insert. This controls a
    // valid concurrent interleaving without changing the store write logic.
    class BarrierStore extends InMemoryCatalogStore {
      constructor() { super(); this.misses = 0; this.gate = new Promise(resolve => { this.release = resolve; }); }
      async byPublicId(id) {
        const value = await super.byPublicId(id);
        if (value === null && this.misses < 2) { this.misses++; if (this.misses === 2) this.release(); await this.gate; }
        return value;
      }
    }
    const store = new BarrierStore();
    const service = new CatalogService(store);
    const results = await Promise.all([
      register(service, 'curriculum', 'Owner one curriculum', null, 'owner-one'),
      register(service, 'curriculum', 'Owner two curriculum', null, 'owner-two'),
    ]);
    assert.equal(results.length, 2);
    assert.equal(store.nodes.size, 1);
    const final = [...store.nodes.values()][0];
    assert.equal(final.rights.ownerUid, 'owner-two');
    findings.push('R5 concurrent foreign owners both succeed; latter insert replaces first ownership');
  }
  {
    const { service } = make();
    const curriculum = await register(service, 'curriculum', 'Synthetic curriculum');
    const foreign = await register(service, 'book', 'Unapproved foreign child', curriculum.publicId, 'other-owner');
    assert.equal(foreign.rights.ownerUid, 'other-owner');
    assert.equal(foreign.parentId, curriculum.publicId);
    findings.push('R6 arbitrary caller owner can attach child beneath another owner private parent');
  }
  console.log(JSON.stringify({ label, sha, reproducedDefects: findings }, null, 2));
  fs.writeFileSync(path.join(root, 'reproductions.json'), JSON.stringify({ label, sha, compilerVersion: ts.version, hashes, findings }, null, 2) + '\n');
}

(async () => { for (const [label, sha] of candidates) await run(label, sha); })().catch(error => { console.error(error); process.exitCode = 1; });
