// Exact-source independent KAN-58 probes. Uses only the approved local synthetic
// target and candidate's verified dependencies read-only. Never generates Prisma.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createRequire, Module } = require('node:module');
const { randomUUID, randomBytes } = require('node:crypto');
const source = 'b27b5493ec41e8954ad17b93d995a11205216915';
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
const output=(probe,extra={})=>console.log(JSON.stringify({source,probe,...extra}));
(async()=>{try{
 const f=await fixture();
 const names=['20261024000001_data_01_workspaces','20261102000002_data_04_invitation_reissue','20261103000003_data_04_institution_approval','20261106000004_file_03_downloads'];
 const versions=names.map((name,i)=>registerMigration({version:i+1,name:'qa-version-'+(i+1),requires:i?[i]:[],statements:splitSql(git(source,'backend/upstream/backend/prisma/migrations/'+name+'/migration.sql')),reversible:false}));
 await new MigrationRunner(f.migration,versions).applyAll();await f.grant();await f.db.person.create({data:{uid:'qa58_owner'}});
 const object={objectId:'qa58_counter_object',generation:1,digest:'a'.repeat(64),size:4,type:'text/plain',bytes:Uint8Array.of(1,2,3,4)},resolver={requireReady:async()=>object};
 const store=new PostgresDownloadStore(f.runtime),gateway=new DownloadGateway(store,resolver),exports=new ExportService(store,resolver);
 const grant=await gateway.issueGrant({ownerUid:'qa58_owner',objectId:object.objectId,generation:1,channel:'gateway'});
 assert.equal(grant.remainingReads,2147483647);assert.equal((await gateway.read(grant.id,'qa58_owner')).deliveredBytes,4);
 const record=await exports.createExport({ownerUid:'qa58_owner',objects:[{objectId:object.objectId,generation:1}]});assert.equal((await exports.readExport(record.id,'qa58_owner')).deliveredBytes,4);
 for(const kind of ['grant','export']){
  const table=kind==='grant'?'download_grants':'download_exports',field=kind==='grant'?'bytesDelivered':'deliveredBytes',id=kind==='grant'?grant.id:record.id;
  const read=()=>kind==='grant'?gateway.read(id,'qa58_owner'):exports.readExport(id,'qa58_owner');
  await f.db.$executeRawUnsafe(`UPDATE "${table}" SET "${field}"=2147483646 WHERE id=$1`,id);assert.equal((await read()).deliveredBytes,4);
  let rows=await f.db.$queryRawUnsafe(`SELECT "${field}" AS bytes FROM "${table}" WHERE id=$1`,id);assert.equal(rows[0].bytes,2147483650n);
  await f.db.$executeRawUnsafe(`UPDATE "${table}" SET "${field}"=$1 WHERE id=$2`,BigInt(Number.MAX_SAFE_INTEGER)-4n,id);assert.equal((await read()).deliveredBytes,4);
  await assert.rejects(read(),{code:'state_conflict'});
  rows=await f.db.$queryRawUnsafe(`SELECT "${field}" AS bytes FROM "${table}" WHERE id=$1`,id);assert.equal(rows[0].bytes,BigInt(Number.MAX_SAFE_INTEGER));
  for(const delta of [-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])await assert.rejects(kind==='grant'?store.consumeGrant(id,'qa58_owner',delta):store.recordExportDelivery(id,'qa58_owner',delta),/invalid byte count/);
  for(const invalid of [-1n,BigInt(Number.MAX_SAFE_INTEGER)+1n])await assert.rejects(f.db.$executeRawUnsafe(`UPDATE "${table}" SET "${field}"=$1 WHERE id=$2`,invalid,id),e=>e.code==='P2010'&&e.meta.code==='23514');
  rows=await f.db.$queryRawUnsafe(`SELECT "${field}" AS bytes FROM "${table}" WHERE id=$1`,id);assert.equal(rows[0].bytes,BigInt(Number.MAX_SAFE_INTEGER));
  output(kind+'-counter',{crossedInt32:true,reachedExactSafeMaximum:true,excessDeniedWithoutMutation:true,nativeBounds:true});
 }
 const expired=await gateway.issueGrant({ownerUid:'qa58_owner',objectId:object.objectId,generation:1,channel:'gateway'});
 await f.db.$executeRawUnsafe('UPDATE download_grants SET "expiresAt"=timezone(\'UTC\',clock_timestamp())-interval \'1 second\' WHERE id=$1',expired.id);
 await gateway.expire();assert.equal((await store.grant(expired.id)).revokedAt,null);await assert.rejects(gateway.read(expired.id,'qa58_owner'),{code:'expired'});output('expiry-error-parity',{passed:true});
 const {DEFAULT_DOWNLOAD_POLICY}=exact('src/file/download-types.ts');
 const boundPolicy={...DEFAULT_DOWNLOAD_POLICY,maxDeliverableBytes:4};
 const huge={...object,size:8,bytes:new Uint8Array(8)},oversized=new ExportService(store,{requireReady:async()=>huge},boundPolicy);
 await assert.rejects(oversized.createExport({ownerUid:'qa58_owner',objects:[{objectId:object.objectId,generation:1}]}),{code:'out_of_bounds'});
 const bounded=new ExportService(store,resolver,boundPolicy);
 await assert.rejects(bounded.createExport({ownerUid:'qa58_owner',objects:[{objectId:object.objectId,generation:1},{objectId:object.objectId,generation:1}]}),{code:'out_of_bounds'});
 const legacy=await exports.createExport({ownerUid:'qa58_owner',objects:[{objectId:object.objectId,generation:1},{objectId:object.objectId,generation:1}]});let callbacks=0;
 await assert.rejects(bounded.readExport(legacy.id,'qa58_owner'),{code:'out_of_bounds'});await assert.rejects(bounded.readExport(legacy.id,'qa58_owner',()=>{callbacks++;}),{code:'out_of_bounds'});assert.equal(callbacks,0);assert.equal((await store.exportById(legacy.id)).deliveredBytes,0);
 output('export-bounds',{perObjectDenied:true,aggregateDenied:true,legacyBufferedDenied:true,legacyCallbackDenied:true,zeroAccounting:true});
 // Source invariants: v1-3 are byte-for-byte accepted artifacts.
 for(const name of names.slice(0,3)){const file='backend/upstream/backend/prisma/migrations/'+name+'/migration.sql';assert.equal(git(source,file),git('3850433bb0d1f061aaeae5ed7e849d949c75b2da',file));}
 output('historical-migration-bytes',{unchanged:true});
 for(const kind of ['grant','export']){
  const row=kind==='grant'?await gateway.issueGrant({ownerUid:'qa58_owner',objectId:object.objectId,generation:1,channel:'gateway'}):await exports.createExport({ownerUid:'qa58_owner',objects:[{objectId:object.objectId,generation:1}]});
  const table=kind==='grant'?'download_grants':'download_exports';let ready,release,expiresAt;
  const locked=new Promise(r=>{ready=r;}),gate=new Promise(r=>{release=r;});
  const blocker=f.locker.$transaction(async tx=>{const rows=await tx.$queryRawUnsafe(`UPDATE "${table}" SET "expiresAt"=timezone('UTC',clock_timestamp())+interval '2 seconds' WHERE id=$1 RETURNING "expiresAt"`,row.id);expiresAt=rows[0].expiresAt;ready();await gate;},{timeout:15000});
  let pending;
  try{
   await locked;pending=kind==='grant'?store.consumeGrant(row.id,'qa58_owner',4):store.recordExportDelivery(row.id,'qa58_owner',4);
   let observed=false;for(let n=0;n<100;n++){const rows=await admin.$queryRawUnsafe("SELECT query_start FROM pg_stat_activity WHERE usename=$1 AND wait_event_type='Lock'",f.runtimeRole);if(rows.length){assert.ok(rows[0].query_start<expiresAt,'Actual consuming SQL must begin before lease expiry');observed=true;break;}await new Promise(r=>setTimeout(r,20));}assert.equal(observed,true,'Must observe actual PostgreSQL lock wait');
   await admin.$queryRawUnsafe('SELECT 1 AS waited FROM pg_sleep(2.5)');release();await blocker;assert.deepEqual(await pending,{ok:false,reason:'expired'});
   const saved=kind==='grant'?await store.grant(row.id):await store.exportById(row.id);assert.equal(kind==='grant'?saved.bytesDelivered:saved.deliveredBytes,0);output(kind+'-unchanged-row-expiry',{actualPreExpiryLockWaitObserved:true,deliveryRefusedAfterExpiry:true,zeroAccounting:true});
  }finally{release();await blocker;if(pending)await pending;}
 }
 output('complete',{dormantFoundationProbePassed:true,productAcceptance:false});
}finally{for(const f of fixtures.reverse())await f.close();await admin.$disconnect();}})().catch(e=>{console.error(JSON.stringify({failure:e.code||e.name,detail:e instanceof assert.AssertionError?e.message:'Unexpected setup/runtime failure; inspect privately'}));process.exitCode=1;});


