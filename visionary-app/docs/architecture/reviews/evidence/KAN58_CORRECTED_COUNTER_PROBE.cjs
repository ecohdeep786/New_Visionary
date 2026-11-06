// Exact-source independent KAN-58 probes. Uses only the approved local synthetic
// target and candidate's verified dependencies read-only. Never generates Prisma.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createRequire, Module } = require('node:module');
const { randomUUID, randomBytes } = require('node:crypto');
const source = '6d2d8e88680d0e961f750edb9b5c61ff16b38f70';
const accepted = '65dee5af76d0ccaa3ee7d8bf52155b64108ac13c';
// Optional review-only mutation checks whether replacing CURRENT_TIMESTAMP
// alone repairs a conditional UPDATE that already evaluated before a lock wait.
// It changes no candidate file, dependency, Prisma schema or persistent source.
const wallClockOnly = process.argv.includes('--wall-clock-only');
const appRoot = path.resolve(__dirname, '../../../..');
const candidate = process.env.KAN58_REVIEW_BACKEND;
assert.ok(candidate && path.isAbsolute(candidate), 'Explicit reviewed dependency backend required');
const req = createRequire(path.join(candidate, 'package.json'));
const ts = req('typescript');
const { PrismaClient } = req('@prisma/client');
const git = (ref, file) => execFileSync('git', ['-C', appRoot, 'show', `${ref}:visionary-app/${file}`], { encoding: 'utf8' });
const lock = JSON.parse(git(source, 'backend/upstream/backend/package-lock.json'));
const installed = JSON.parse(fs.readFileSync(path.join(candidate, 'node_modules/.package-lock.json')));
let dependencyRecords = 0;
for (const [key, value] of Object.entries(lock.packages)) {
  if (!key || value.link) continue;
  if (value.optional && ((value.os && !value.os.includes(process.platform)) || (value.cpu && !value.cpu.includes(process.arch)))) continue;
  assert.equal(installed.packages[key]?.version, value.version, `Dependency version mismatch: ${key}`);
  if (value.integrity) assert.equal(installed.packages[key]?.integrity, value.integrity, `Dependency integrity mismatch: ${key}`);
  assert.ok(fs.existsSync(path.join(candidate, key, 'package.json')), `Missing installed manifest: ${key}`);
  dependencyRecords++;
}
const normalize = value => value.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
assert.equal(normalize(fs.readFileSync(path.join(candidate, 'node_modules/.prisma/client/schema.prisma'), 'utf8')),
  normalize(git(source, 'backend/upstream/backend/prisma/schema.prisma')), 'Generated Prisma model mismatch');

const modules = new Map();
function exact(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const filename = path.join(candidate, file);
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  modules.set(file, mod);
  mod.require = id => id.startsWith('.') ? exact(path.posix.normalize(path.posix.join(path.posix.dirname(file), id)) + '.ts') : req(id);
  let input = git(source, `backend/upstream/backend/${file}`);
  if (wallClockOnly && file === 'src/file/download-store.sql.ts') {
    assert.ok(input.includes('CURRENT_TIMESTAMP AT TIME ZONE'));
    input = input.replace('CURRENT_TIMESTAMP AT TIME ZONE', 'clock_timestamp() AT TIME ZONE');
  }
  mod._compile(ts.transpileModule(input, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText, filename);
  return mod.exports;
}
const { MigrationRunner } = exact('src/data/migration-runner.ts');
const { PostgresMigrationStore } = exact('src/data/migration-store.ts');
const { registerMigration, splitSql } = exact('src/data/migration-registry.ts');
const { PostgresDownloadStore } = exact('src/file/download-store.sql.ts');
const { DownloadGateway, ExportService } = exact('src/file/download.service.ts');
const cfg = JSON.parse(fs.readFileSync(process.env.KAN58_REVIEW_TARGET, 'utf8'));
const base = new URL(cfg.url);
assert.equal(cfg.syntheticOnly, true);
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname));
assert.equal(Number(base.port), 55437);
assert.match(base.pathname, /^\/visionary_data_test(?:_|$)/);
const connect = url => new PrismaClient({ datasources: { db: { url: String(url) } } });
const admin = connect(base);
const sqlFile = 'backend/upstream/backend/prisma/migrations/20261024000001_data_01_workspaces/migration.sql';
const registry = ref => [registerMigration({ version: 1, name: 'data-01-workspace-domain', requires: [],
  statements: splitSql(git(ref, sqlFile)), reversible: false })];
const fixtures = [];
async function fixture() {
  const suffix = randomUUID().replaceAll('-', '');
  const schema = 'qa58_' + suffix, migrationRole = 'qa58m_' + suffix, runtimeRole = 'qa58r_' + suffix;
  const password = randomBytes(24).toString('hex');
  await admin.$executeRawUnsafe(`CREATE ROLE "${migrationRole}" LOGIN PASSWORD '${password}'`);
  await admin.$executeRawUnsafe(`CREATE ROLE "${runtimeRole}" LOGIN PASSWORD '${password}'`);
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}" AUTHORIZATION "${migrationRole}"`);
  await admin.$executeRawUnsafe(`REVOKE ALL ON SCHEMA "${schema}" FROM PUBLIC`);
  await admin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA "${schema}" TO "${runtimeRole}"`);
  const url = role => { const value = new URL(base); value.username = role; value.password = password;
    value.searchParams.set('schema', schema); value.searchParams.set('connection_limit', '3'); return String(value); };
  const config = { migrationRole, runtimeRole, schema, migrationUrl: url(migrationRole), runtimeUrl: url(runtimeRole) };
  const migration = new PostgresMigrationStore(config), db = connect(config.migrationUrl), runtime = connect(config.runtimeUrl), locker = connect(config.runtimeUrl);
  const f = { schema, migrationRole, runtimeRole, migration, db, runtime, locker, async grant() {
    await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${runtimeRole}"`);
    await admin.$executeRawUnsafe(`REVOKE ALL ON "${schema}"."_visionary_migrations" FROM "${runtimeRole}"`);
    const seqs = await admin.$queryRawUnsafe('SELECT sequencename FROM pg_sequences WHERE schemaname=$1 AND left(sequencename,11)<>\'_visionary_\'', schema);
    for (const row of seqs) await admin.$executeRawUnsafe(`GRANT USAGE,SELECT ON SEQUENCE "${schema}"."${row.sequencename}" TO "${runtimeRole}"`);
  }, async close() {
    await Promise.all([migration.close(), db.$disconnect(), runtime.$disconnect(), locker.$disconnect()]);
    assert.match(schema, /^qa58_[a-f0-9]{32}$/);
    await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.$executeRawUnsafe(`DROP ROLE "${migrationRole}"`);
    await admin.$executeRawUnsafe(`DROP ROLE "${runtimeRole}"`);
  } };
  fixtures.push(f); return f;
}
(async()=>{
 try {
  const f=await fixture();
  const names=['20261024000001_data_01_workspaces','20261102000002_data_04_invitation_reissue','20261103000003_data_04_institution_approval','20261106000004_file_03_downloads'];
  const versions=names.map((name,i)=>registerMigration({version:i+1,name:'qa-version-'+(i+1),requires:i?[i]:[],statements:splitSql(git(source,'backend/upstream/backend/prisma/migrations/'+name+'/migration.sql')),reversible:false}));
  await new MigrationRunner(f.migration,versions).applyAll();await f.grant();
  await f.db.person.create({data:{uid:'qa58_owner'}});
  const object={objectId:'qa58_counter_object',generation:1,digest:'a'.repeat(64),size:4,type:'text/plain',bytes:Uint8Array.of(1,2,3,4)};
  const resolver={requireReady:async()=>object};
  const store=new PostgresDownloadStore(f.runtime), gateway=new DownloadGateway(store,resolver), exports=new ExportService(store,resolver);
  const grant=await gateway.issueGrant({ownerUid:'qa58_owner',objectId:object.objectId,generation:1,channel:'gateway'});
  assert.equal((await gateway.read(grant.id,'qa58_owner')).deliveredBytes,4);
  const record=await exports.createExport({ownerUid:'qa58_owner',objects:[{objectId:object.objectId,generation:1}]});
  assert.equal((await exports.readExport(record.id,'qa58_owner')).deliveredBytes,4);
  for(const kind of ['grant','export']) {
   const table=kind==='grant'?'download_grants':'download_exports', field=kind==='grant'?'bytesDelivered':'deliveredBytes', id=kind==='grant'?grant.id:record.id;
   await f.db.$executeRawUnsafe(`UPDATE "${table}" SET "${field}"=2147483646 WHERE id=$1`,id);
   let error;try{if(kind==='grant')await gateway.read(id,'qa58_owner');else await exports.readExport(id,'qa58_owner');}catch(e){error=e;}
   assert.ok(error,'Valid read must reproduce counter overflow');assert.equal(error.code,'P2010');assert.equal(error.meta.code,'22003');
   const rows=await f.db.$queryRawUnsafe(`SELECT "${field}" AS bytes FROM "${table}" WHERE id=$1`,id);assert.equal(rows[0].bytes,2147483646);
   console.log(JSON.stringify({source,probe:kind+'-cumulative-bytes',validOwnedReadyReadRejected:true,sqlState:error.meta.code,counterRetained:rows[0].bytes}));
  }
 }finally{for(const f of fixtures.reverse())await f.close();await admin.$disconnect();}
})().catch(e=>{console.error(JSON.stringify({failure:e.code||e.name,detail:e instanceof assert.AssertionError?e.message:'Unexpected setup/runtime failure; inspect privately'}));process.exitCode=1;});
