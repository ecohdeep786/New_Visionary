import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const local=createRequire(import.meta.url);
const {stagingDatabase,req,backend}=local('./postgres-fixture.cjs');
const {MigrationRunner}=req('./dist/src/data/migration-runner.js');
const {PostgresMigrationStore}=req('./dist/src/data/migration-store.js');
const {canonicalMigrations,registerMigration,splitSql}=req('./dist/src/data/migration-registry.js');
const {WorkspaceRepository}=req('./dist/src/workspaces/workspace.repository.js');
const canonical=()=>canonicalMigrations(backend);
const extra=(base,overrides={})=>registerMigration({version:2,name:'synthetic-additive',requires:[1],statements:['ALTER TABLE "workspaces" ADD COLUMN "syntheticOnly" TEXT'],down:['ALTER TABLE "workspaces" DROP COLUMN "syntheticOnly"'],reversible:true,...overrides});
const fixture=async fn=>{const f=await stagingDatabase();try{await fn(f);}finally{await f.close();}};
const column=async(f,name)=>(await f.db.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND column_name=$2',f.schema,name)).length;

test('canonical registry executes all ten domain tables with real repository compatibility',()=>fixture(async f=>{
  const registry=canonical(),s=f.store(),r=new MigrationRunner(s,registry);
  assert.deepEqual(registry[0].statements,splitSql(readFileSync(resolve(backend,'prisma/migrations/20261024000001_data_01_workspaces/migration.sql'),'utf8')));
  assert.equal((await r.applyAll()).applied,1);
  const tables=await f.db.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname=$1 AND left(tablename,11)<>'_visionary_'",f.schema);
  assert.equal(tables.length,10);assert.equal(await column(f,'workspaceId')>0,true);
  const repository=new WorkspaceRepository(f.db);
  const ws=await repository.createWorkspace('synthetic-owner',{name:'Synthetic',slug:'synthetic',isPersonal:true,commandId:'synthetic-create'});
  assert.ok(ws.id);await assert.rejects(repository.assertOwnership(ws.id,'wrong-owner'));
  assert.equal((await r.applyAll()).applied,0);
  assert.equal((await r.verify()).consistent,true);
  assert.equal((await f.db.$queryRawUnsafe('SELECT "appliedBy" FROM "_visionary_migrations"'))[0].appliedBy,f.migrationRole);
}));

test('actual runtime permits domain DML and denies DDL and migration receipts',()=>fixture(async f=>{
  await new MigrationRunner(f.store(),canonical()).applyAll();await f.grantRuntime();
  await f.runtime.$executeRawUnsafe('INSERT INTO persons(uid,"updatedAt") VALUES($1,now())','synthetic-runtime');
  assert.equal((await f.runtime.person.findMany()).length,1);
  await assert.rejects(f.runtime.$executeRawUnsafe('CREATE TABLE runtime_must_not_create(id TEXT)'));
  await assert.rejects(f.runtime.$executeRawUnsafe('ALTER TABLE persons ADD COLUMN forbidden TEXT'));
  await assert.rejects(f.runtime.$executeRawUnsafe('DELETE FROM "_visionary_migrations"'));
}));

test('runner rejects disguised runtime identity and runtime DDL privilege before canonical SQL',()=>fixture(async f=>{
  assert.throws(()=>new PostgresMigrationStore({...f.config,migrationUrl:f.config.runtimeUrl}),/IDENTITY_CONFLICT/);
  await f.admin.$executeRawUnsafe('GRANT CREATE ON SCHEMA "'+f.schema+'" TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_IDENTITY_DENIED/);
  assert.equal((await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1',f.schema)).length,0);
}));

test('runtime membership in migration role is refused even without inherited CREATE',()=>fixture(async f=>{
  await f.admin.$executeRawUnsafe('ALTER ROLE "'+f.runtimeRole+'" NOINHERIT');
  await f.admin.$executeRawUnsafe('GRANT "'+f.migrationRole+'" TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_IDENTITY_DENIED/);
}));

test('non-synthetic or colliding connection identities are rejected without connecting',()=>{
  const c={migrationUrl:'postgresql://m:x@127.0.0.1/production?schema=test',runtimeUrl:'postgresql://r:x@127.0.0.1/production?schema=test',migrationRole:'m',runtimeRole:'r',schema:'test'};
  assert.throws(()=>new PostgresMigrationStore(c),/SYNTHETIC_DATABASE_REQUIRED/);
});

test('all SQL and ledger creation roll back after a middle statement failure',()=>fixture(async f=>{
  const m=registerMigration({version:1,name:'synthetic-failure',requires:[],statements:['CREATE TABLE synthetic_probe(id TEXT)','INSERT INTO synthetic_probe VALUES (\'once\')','INSERT INTO missing_table VALUES (1)'],reversible:false});
  await assert.rejects(new MigrationRunner(f.store(),[m]).applyAll());
  assert.equal((await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1',f.schema)).length,0);
  const valid=registerMigration({...m,statements:m.statements.slice(0,2)});
  await new MigrationRunner(f.store(),[valid]).applyAll();
  assert.equal((await f.db.$queryRawUnsafe('SELECT * FROM synthetic_probe')).length,1);
}));

test('failure between DDL and receipt persistence rolls back DDL and is safely retried',()=>fixture(async f=>{
  const s=f.store();await s.transaction(async()=>{});
  await f.db.$executeRawUnsafe('CREATE FUNCTION deny_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'synthetic receipt outage\'; END $$');
  await f.db.$executeRawUnsafe('CREATE TRIGGER deny_receipt BEFORE INSERT ON "_visionary_migrations" FOR EACH ROW EXECUTE FUNCTION deny_receipt()');
  await assert.rejects(new MigrationRunner(s,canonical()).applyAll(),/synthetic receipt outage/);
  assert.equal((await f.db.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname=$1 AND tablename='persons'",f.schema)).length,0);
  await f.db.$executeRawUnsafe('DROP TRIGGER deny_receipt ON "_visionary_migrations"');
  assert.equal((await new MigrationRunner(f.store(),canonical()).applyAll()).applied,1);
}));

test('concurrent connections serialize and restart reads durable history',()=>fixture(async f=>{
  const results=await Promise.all([new MigrationRunner(f.store(),canonical()).applyAll(),new MigrationRunner(f.store(),canonical()).applyAll()]);
  assert.deepEqual(results.map(r=>r.applied).sort(),[0,1]);
  const modulePath=resolve(backend,'dist/src/data');
  const child=spawnSync(process.execPath,['-e',`const {PostgresMigrationStore}=require(process.env.DATA_MODULE+'/migration-store.js');const {MigrationRunner}=require(process.env.DATA_MODULE+'/migration-runner.js');const {canonicalMigrations}=require(process.env.DATA_MODULE+'/migration-registry.js');(async()=>{const s=new PostgresMigrationStore(JSON.parse(process.env.DATA_CONFIG));try{const r=await new MigrationRunner(s,canonicalMigrations(process.env.DATA_BACKEND)).applyAll();if(r.applied!==0||r.skipped!==1)process.exitCode=1;console.log(JSON.stringify({applied:r.applied,skipped:r.skipped}));}finally{await s.close();}})().catch(()=>{process.exitCode=1;});`],
    {env:{...process.env,DATA_CONFIG:JSON.stringify(f.config),DATA_MODULE:modulePath,DATA_BACKEND:backend},encoding:'utf8',timeout:20000,windowsHide:true});
  assert.equal(child.status,0,child.stderr);assert.match(child.stdout,/"applied":0/);
}));

test('stale checksum, renamed history, removed prerequisites and changed down SQL fail closed',()=>fixture(async f=>{
  const base=canonical(),v2=extra(base);await new MigrationRunner(f.store(),[...base,v2]).applyAll();
  for(const altered of [
    [{...base[0],statements:[...base[0].statements,'SELECT 1']},v2],
    [registerMigration({...base[0],name:'renamed'}),v2],
    [...base,{...v2,down:['DROP TABLE persons']}],
    [v2]
  ]){
    const r=new MigrationRunner(f.store(),altered);
    assert.equal((await r.verify()).consistent,false);
    await assert.rejects(r.applyAll(),/PREFLIGHT/);await assert.rejects(r.rollbackLast(),/PREFLIGHT/);
  }
  assert.equal(await column(f,'syntheticOnly'),1);
}));

test('physical reversible rollback restores baseline and immutable history survives reapply',()=>fixture(async f=>{
  const base=canonical(),v2=extra(base);
  await new MigrationRunner(f.store(),[...base,v2]).applyAll();assert.equal(await column(f,'syntheticOnly'),1);
  const rolled=await new MigrationRunner(f.store(),[...base,v2]).rollbackLast();assert.equal(await column(f,'syntheticOnly'),0);
  assert.deepEqual(rolled.remainingVersions,[1]);assert.equal((await new MigrationRunner(f.store(),[...base,v2]).verify(rolled.remainingVersions)).consistent,true);
  const changed=registerMigration({...v2,name:'mutated-after-rollback'});
  await assert.rejects(new MigrationRunner(f.store(),[...base,changed]).applyAll(),/PREFLIGHT/);
  assert.equal((await new MigrationRunner(f.store(),[...base,v2]).applyAll()).applied,1);
}));

test('retained rows forbid pending DDL and destructive rollback despite obsolete confirmation flags',()=>fixture(async f=>{
  const base=canonical(),v2=extra(base);await new MigrationRunner(f.store(),[...base,v2]).applyAll();
  await f.db.$executeRawUnsafe('INSERT INTO persons(uid,"updatedAt") VALUES($1,now())','retained-synthetic');
  await assert.rejects(new MigrationRunner(f.store(),[...base,v2]).rollbackLast({stagingConfirmed:true}),/NON_EMPTY/);
  const v3=registerMigration({version:3,name:'synthetic-pending',requires:[2],statements:['CREATE TABLE should_not_exist(id TEXT)'],reversible:false});
  await assert.rejects(new MigrationRunner(f.store(),[...base,v2,v3]).applyAll({stagingConfirmed:true}),/NON_EMPTY/);
  assert.equal(await column(f,'syntheticOnly'),1);
}));

test('canonical baseline is never declared reversible',()=>fixture(async f=>{
  const r=new MigrationRunner(f.store(),canonical());await r.applyAll();await assert.rejects(r.rollbackLast(),/ROLLBACK_DENIED/);
}));

test('SQL splitter preserves literals, quoted names and dollar function bodies',()=>{
  assert.equal(splitSql('CREATE TABLE "a;b"(x TEXT); INSERT INTO "a;b" VALUES (\'x;y\'); -- note;\n SELECT 1').length,3);
  assert.equal(splitSql('CREATE FUNCTION t() RETURNS void AS $$ BEGIN PERFORM 1; END $$ LANGUAGE plpgsql; SELECT 1').length,2);
  assert.throws(()=>splitSql("SELECT 'unfinished"),/INVALID_SQL/);
});

test('lost commit acknowledgement reconciles durable outcome on a new connection',()=>fixture(async f=>{
  class LostAcknowledgementStore extends PostgresMigrationStore{
    async transaction(work,timeout){await super.transaction(work,timeout);throw Error('synthetic lost commit acknowledgement');}
  }
  const uncertain=new LostAcknowledgementStore(f.config);
  try{await assert.rejects(new MigrationRunner(uncertain,canonical()).applyAll(),/lost commit/);}finally{await uncertain.close();}
  const result=await new MigrationRunner(f.store(),canonical()).applyAll();
  assert.equal(result.applied,0);assert.equal(result.skipped,1);
  assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) AS count FROM "_visionary_migrations"'))[0].count),1);
}));

test('compatibility verification rejects physical schema drift before apply or rollback',()=>fixture(async f=>{
  const base=canonical();await new MigrationRunner(f.store(),base).applyAll();
  await f.db.$executeRawUnsafe('ALTER TABLE workspaces DROP COLUMN description');
  const r=new MigrationRunner(f.store(),base);
  assert.ok((await r.verify()).issues.includes('physical schema drift'));
  await assert.rejects(r.applyAll(),/physical schema drift/);await assert.rejects(r.rollbackLast(),/physical schema drift/);
}));

test('transaction/session control and multi-command escape artifacts fail before any DDL',()=>fixture(async f=>{
  for(const escape of ['COMMIT','END','ROLLBACK','SET ROLE '+f.runtimeRole,'DO $$ BEGIN COMMIT; END $$','CREATE TABLE escaped_more(id TEXT); COMMIT','/* lead */ COMMIT','-- lead\nCOMMIT']){
    const m=registerMigration({version:1,name:'synthetic-escape',requires:[],statements:['CREATE TABLE escape_probe(id TEXT)',escape,'INSERT INTO missing_probe VALUES(1)'],reversible:false});
    await assert.rejects(new MigrationRunner(f.store(),[m]).applyAll(),/PREFLIGHT/);
    assert.equal((await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1',f.schema)).length,0);
  }
  const base=canonical(),v2=registerMigration({version:2,name:'synthetic-independent',requires:[],statements:['CREATE TABLE order_probe(id TEXT)'],reversible:false});
  await assert.rejects(new MigrationRunner(f.store(),[v2,...base]).applyAll(),/ascending/);
  await assert.rejects(new MigrationRunner(f.store(),[]).applyAll(),/no migrations/);
}));

test('runtime control-table writes and sequence mutation privileges fail closed',()=>fixture(async f=>{
  await new MigrationRunner(f.store(),canonical()).applyAll();
  await f.admin.$executeRawUnsafe('GRANT INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON "'+f.schema+'"."_visionary_migrations" TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_CONTROL_WRITE_DENIED/);
  await f.admin.$executeRawUnsafe('REVOKE ALL ON "'+f.schema+'"."_visionary_migrations" FROM "'+f.runtimeRole+'"');
  await f.admin.$executeRawUnsafe('GRANT UPDATE ON SEQUENCE "'+f.schema+'"."_visionary_migrations_sequence_seq" TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_CONTROL_WRITE_DENIED/);
}));

test('first-use runtime default control-table grants are seen before commit and roll back DDL',()=>fixture(async f=>{
  await f.db.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES IN SCHEMA "'+f.schema+'" GRANT INSERT ON TABLES TO "'+f.runtimeRole+'"');
  await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_CONTROL_WRITE_DENIED/);
  assert.equal((await f.admin.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE schemaname=$1',f.schema)).length,0);
}));

test('NOINHERIT delegated role cannot bypass runtime control-table or DDL checks with SET ROLE',()=>fixture(async f=>{
  await new MigrationRunner(f.store(),canonical()).applyAll();
  const delegated='data02d_'+f.schema.slice(7);
  await f.admin.$executeRawUnsafe('CREATE ROLE "'+delegated+'" NOLOGIN');
  try{
    await f.admin.$executeRawUnsafe('ALTER ROLE "'+f.runtimeRole+'" NOINHERIT');
    await f.admin.$executeRawUnsafe('GRANT "'+delegated+'" TO "'+f.runtimeRole+'"');
    await f.admin.$executeRawUnsafe('GRANT USAGE ON SCHEMA "'+f.schema+'" TO "'+delegated+'"');
    await f.admin.$executeRawUnsafe('GRANT UPDATE ON "'+f.schema+'"."_visionary_migrations" TO "'+delegated+'"');
    assert.equal((await f.runtime.$queryRawUnsafe("SELECT has_table_privilege(current_user,'_visionary_migrations','UPDATE') AS allowed"))[0].allowed,false);
    await f.runtime.$transaction(async tx=>{await tx.$executeRawUnsafe('SET LOCAL ROLE "'+delegated+'"');await tx.$executeRawUnsafe('UPDATE "_visionary_migrations" SET status=$1','applied');});
    await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_CONTROL_WRITE_DENIED/);
    await f.admin.$executeRawUnsafe('REVOKE ALL ON "'+f.schema+'"."_visionary_migrations" FROM "'+delegated+'"');
    await f.admin.$executeRawUnsafe('GRANT CREATE ON SCHEMA "'+f.schema+'" TO "'+delegated+'"');
    await assert.rejects(new MigrationRunner(f.store(),canonical()).applyAll(),/RUNTIME_IDENTITY_DENIED/);
  }finally{
    await f.admin.$executeRawUnsafe('REVOKE ALL ON "'+f.schema+'"."_visionary_migrations" FROM "'+delegated+'"');
    await f.admin.$executeRawUnsafe('REVOKE ALL ON SCHEMA "'+f.schema+'" FROM "'+delegated+'"');
    await f.admin.$executeRawUnsafe('DROP ROLE "'+delegated+'"');
  }
}));
