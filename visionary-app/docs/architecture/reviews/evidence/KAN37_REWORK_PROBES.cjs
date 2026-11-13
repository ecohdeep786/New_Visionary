// Independent tests of the separately compiled reviewer source. Synthetic SQL only.
// Usage: DATA_TEST_DATABASE_URL=... NODE_PATH=<worker-backend>/node_modules node --test this.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const product=path.resolve(__dirname,'../../../..');
const worker=process.env.KAN37_WORKER_PRODUCT;
if(!worker)throw Error('KAN37_WORKER_PRODUCT required');
const {stagingDatabase}=require(path.join(worker,'backend/tests/contracts/data-02/postgres-fixture.cjs'));
const data=process.env.KAN37_COMPILED_DATA||path.join(product,'artifacts/qa/kan37-independent-compile/src/data');
const {MigrationRunner}=require(path.join(data,'migration-runner.js'));
const {BackfillRunner}=require(path.join(data,'backfill-runner.js'));
const {registerMigration,canonicalMigrations}=require(path.join(data,'migration-registry.js'));
const {PostgresMigrationStore}=require(path.join(data,'migration-store.js'));
const canonical=()=>canonicalMigrations(path.join(product,'backend/upstream/backend'));
async function fixture(fn){const f=await stagingDatabase(),stores=[];
  f.store=()=>{const s=new PostgresMigrationStore(f.config);stores.push(s);return s;};
  try{await fn(f);}finally{await Promise.all(stores.map(s=>s.close()));await f.close();}}
const probe=(v,name,statements,down)=>registerMigration({version:v,name,requires:[],statements,down,reversible:!!down});
const table=async(f,name)=>(await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1 AND tablename=$2',f.schema,name)).length;
test('explicit transaction escape must not leave DDL without its receipt',()=>fixture(async f=>{
  const m=probe(1,'synthetic-transaction-escape',['CREATE TABLE escape_probe(id TEXT)','COMMIT','INSERT INTO missing_probe VALUES(1)']);
  await assert.rejects(new MigrationRunner(f.store(),[m]).applyAll());
  assert.equal(await table(f,'escape_probe'),0,'failed artifact committed DDL before durable receipt');
}));
test('out-of-order independent versions cannot commit an immediately inconsistent baseline',()=>fixture(async f=>{
  const r=new MigrationRunner(f.store(),[probe(2,'second',['CREATE TABLE version_two(id TEXT)']),probe(1,'first',['CREATE TABLE version_one(id TEXT)'])]);
  await assert.rejects(r.applyAll(),/PREFLIGHT|invalid|order/);
  assert.equal(await table(f,'version_two'),0);
}));
test('a non-DDL artifact cannot change execution identity or release transactional state',()=>fixture(async f=>{
  for(const statement of ['COMMIT','ROLLBACK','SET ROLE '+f.runtimeRole,'SELECT 1','CREATE TABLE probe_multi(id TEXT); COMMIT']){
    const r=new MigrationRunner(f.store(),[probe(1,'synthetic-control',[statement])]);
    await assert.rejects(r.applyAll(),/PREFLIGHT|UNSUPPORTED|INVALID/);
  }
  assert.equal((await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1',f.schema)).length,0);
}));
test('rollback transaction control is rejected before its forward DDL can commit',()=>fixture(async f=>{
  const base=canonical();await new MigrationRunner(f.store(),base).applyAll();
  const bad=registerMigration({version:2,name:'synthetic-bad-down',requires:[1],
    statements:['ALTER TABLE persons ADD COLUMN bad_down_probe TEXT'],down:['COMMIT'],reversible:true});
  await assert.rejects(new MigrationRunner(f.store(),[...base,bad]).applyAll(),/PREFLIGHT/);
  assert.equal((await f.db.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND column_name=$2',f.schema,'bad_down_probe')).length,0);
}));
test('runtime receipt write grants are refused even when the role has no DDL or ownership',()=>fixture(async f=>{
  const base=canonical();await new MigrationRunner(f.store(),base).applyAll();
  await f.admin.$executeRawUnsafe('GRANT INSERT,UPDATE,DELETE ON TABLE "'+f.schema+'"."_visionary_migrations" TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),base).applyAll(),/RUNTIME_(?:IDENTITY|CONTROL_WRITE)_DENIED/);
}));
test('first-use default grants cannot publish runtime-mutable migration control tables',()=>fixture(async f=>{
  await f.admin.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES FOR ROLE "'+f.migrationRole+'" IN SCHEMA "'+f.schema+'" GRANT UPDATE ON TABLES TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_(?:IDENTITY|CONTROL_WRITE)_DENIED/);
  assert.equal((await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1',f.schema)).length,0);
  // Remove shared-role default ACL dependencies before this fixture drops its roles.
  await f.admin.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES FOR ROLE "'+f.migrationRole+'" IN SCHEMA "'+f.schema+'" REVOKE UPDATE ON TABLES FROM "'+f.runtimeRole+'"');
}));
test('PUBLIC control-table grants and runtime metadata sequence USAGE are denied',()=>fixture(async f=>{
  const base=canonical();await new MigrationRunner(f.store(),base).applyAll();
  await f.admin.$executeRawUnsafe('GRANT DELETE ON "'+f.schema+'"."_visionary_migrations" TO PUBLIC');
  await assert.rejects(new MigrationRunner(f.store(),base).applyAll(),/RUNTIME_CONTROL_WRITE_DENIED/);
  await f.admin.$executeRawUnsafe('REVOKE DELETE ON "'+f.schema+'"."_visionary_migrations" FROM PUBLIC');
  await f.admin.$executeRawUnsafe('GRANT USAGE ON SEQUENCE "'+f.schema+'"."_visionary_migrations_sequence_seq" TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),base).applyAll(),/RUNTIME_CONTROL_WRITE_DENIED/);
}));
test('NOINHERIT delegation cannot hide runtime-reachable metadata writes',()=>fixture(async f=>{
  const base=canonical();await new MigrationRunner(f.store(),base).applyAll();
  const group=f.runtimeRole.replace('data02r_','data02g_');
  assert.match(group,/^data02g_[a-f0-9]{32}$/);
  await f.admin.$executeRawUnsafe('CREATE ROLE "'+group+'" NOLOGIN');
  try{
    await f.admin.$executeRawUnsafe('GRANT USAGE ON SCHEMA "'+f.schema+'" TO "'+group+'"');
    await f.admin.$executeRawUnsafe('GRANT SELECT,UPDATE ON "'+f.schema+'"."_visionary_migrations" TO "'+group+'"');
    await f.admin.$executeRawUnsafe('ALTER ROLE "'+f.runtimeRole+'" NOINHERIT');
    await f.admin.$executeRawUnsafe('GRANT "'+group+'" TO "'+f.runtimeRole+'"');
    await f.runtime.$transaction(async tx=>{
      await tx.$executeRawUnsafe('SET LOCAL ROLE "'+group+'"');
      await tx.$executeRawUnsafe('UPDATE "'+f.schema+'"."_visionary_migrations" SET name=name');
    });
    await assert.rejects(new MigrationRunner(f.store(),base).applyAll(),/RUNTIME_(?:IDENTITY|CONTROL_WRITE)_DENIED/);
  }finally{
    await f.admin.$executeRawUnsafe('REVOKE SELECT,UPDATE ON "'+f.schema+'"."_visionary_migrations" FROM "'+group+'"');
    await f.admin.$executeRawUnsafe('REVOKE USAGE ON SCHEMA "'+f.schema+'" FROM "'+group+'"');
    await f.admin.$executeRawUnsafe('REVOKE "'+group+'" FROM "'+f.runtimeRole+'"');
    await f.admin.$executeRawUnsafe('DROP ROLE "'+group+'"');
  }
}));
test('actual constraint drift blocks no-op apply without changing receipt history',()=>fixture(async f=>{
  const r=new MigrationRunner(f.store(),canonical());await r.applyAll();
  await f.db.$executeRawUnsafe('ALTER TABLE command_results DROP CONSTRAINT "command_results_revision_positive"');
  await assert.rejects(r.applyAll(),/physical schema drift/);
  assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) AS n FROM "_visionary_migrations"'))[0].n),1);
}));
test('a late cancellation rolls back writer INSERT and resumes on a fresh adapter',()=>fixture(async f=>{
  await new MigrationRunner(f.store(),canonical()).applyAll();
  await f.db.$executeRawUnsafe('CREATE TABLE target_probe(key TEXT PRIMARY KEY)');
  const c=new AbortController();let cancel=true;
  const source={async next(){return {rows:[{key:'one'}],nextCursor:null,done:true};}};
  const writer=async(tx,row)=>{await tx.$executeRawUnsafe('INSERT INTO target_probe VALUES($1)',row.key);if(cancel)c.abort();};
  await assert.rejects(new BackfillRunner(f.store(),source,writer).run({name:'cancel',definition:'a'.repeat(64),signal:c.signal}),/CANCELLED/);
  assert.equal((await f.db.$queryRawUnsafe('SELECT * FROM target_probe')).length,0);
  cancel=false;const s=new PostgresMigrationStore(f.config);try{
    assert.equal((await new BackfillRunner(s,source,writer).run({name:'cancel',definition:'a'.repeat(64)})).processed,1);
  }finally{await s.close();}
}));
test('next-page failure preserves the preceding committed page and resumes its cursor',()=>fixture(async f=>{
  await new MigrationRunner(f.store(),canonical()).applyAll();await f.db.$executeRawUnsafe('CREATE TABLE target_probe(key TEXT PRIMARY KEY)');
  let fail=true;const seen=[];
  const source={async next(cursor){seen.push(cursor);if(cursor==='one'&&fail)throw Error('synthetic next-page outage');
    return cursor===null?{rows:[{key:'one'}],nextCursor:'one',done:false}:{rows:[{key:'two'}],nextCursor:null,done:true};}};
  const writer=async(tx,row)=>tx.$executeRawUnsafe('INSERT INTO target_probe VALUES($1)',row.key);
  const o={name:'resume',definition:'b'.repeat(64)};
  await assert.rejects(new BackfillRunner(f.store(),source,writer).run(o),/next-page outage/);
  assert.deepEqual((await f.db.$queryRawUnsafe('SELECT key FROM target_probe')).map(r=>r.key),['one']);
  fail=false;assert.equal((await new BackfillRunner(f.store(),source,writer).run(o)).processed,2);
  assert.deepEqual(seen,[null,'one','one']);
}));
