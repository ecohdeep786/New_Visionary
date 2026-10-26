import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const local=createRequire(import.meta.url),{req,stagingDatabase,backend}=local('./postgres-fixture.cjs');
const {assertCloudSqlUrl,assertSyntheticUrl,assertSeparateIdentities}=req('./dist/src/data/migration-identities.js');
const {commandConfiguration,assertProductionAdmission,runMigrationCommand}=req('./dist/src/data/migration-command.js');
const target={environment:'production',project:'visionary-research',region:'asia-south1',instance:'visionary-product-data',database:'visionary_product'};
function url(role='visionary_runtime',t=target){const u=new URL('postgresql://localhost/'+t.database);u.username=role;u.searchParams.set('schema','product');u.searchParams.set('host','/cloudsql/'+t.project+':'+t.region+':'+t.instance);u.searchParams.set('connection_limit','2');u.searchParams.set('pool_timeout','10');u.searchParams.set('connect_timeout','10');return String(u);}
const config=()=>({migrationUrl:url('visionary_migrator'),runtimeUrl:url(),migrationRole:'visionary_migrator',runtimeRole:'visionary_runtime',schema:'product',cloudSql:{...target}});
const source='a'.repeat(40),digest='b'.repeat(64),sha=s=>createHash('sha256').update(s).digest('hex');
const receipt=()=>JSON.stringify({environment:'staging',sourceCommit:source,registryDigest:digest,project:target.project,region:target.region,instance:target.instance,database:'visionary_data_staging_kan37',schema:'product',status:'verified',appliedVersions:[1],verifiedAt:new Date().toISOString()});

test('Cloud SQL target requires exact project, region, instance socket, database and bounded pools',()=>{
  assert.doesNotThrow(()=>assertSeparateIdentities(config()));
  for(const mutate of [u=>{u.hostname='public.example';},u=>u.searchParams.set('host','/tmp/socket'),u=>u.searchParams.append('host','/tmp/other'),u=>u.searchParams.set('options','-c role=postgres'),u=>u.searchParams.set('connection_limit','100'),u=>{u.pathname='/another_database';}]){
    const u=new URL(url());mutate(u);assert.throws(()=>assertCloudSqlUrl(String(u),target));
  }
  assert.throws(()=>assertCloudSqlUrl(url(),{...target,project:'visionary-fd6d2'}));
  assert.throws(()=>assertCloudSqlUrl(url(),{...target,region:'us-central1'}));
  const long={...target,instance:'a'.repeat(63)};assert.throws(()=>assertCloudSqlUrl(url('runtime',long),long),/SOCKET_TOO_LONG/);
});

test('synthetic test guards cannot be redirected through a socket, options or duplicate query key',()=>{
  for(const suffix of ['host=/cloudsql/visionary-research:asia-south1:instance','options=-crole=postgres','schema=a&schema=b'])
    assert.throws(()=>assertSyntheticUrl('postgresql://test@localhost/visionary_data_test_local?'+suffix),/SYNTHETIC/);
});

test('Cloud SQL IAM-style role identifiers remain quoted and distinct',()=>{
  const c=config();c.migrationRole='migrator@visionary-research.iam';c.runtimeRole='runtime@visionary-research.iam';c.migrationUrl=url(c.migrationRole);c.runtimeUrl=url(c.runtimeRole);assert.doesNotThrow(()=>assertSeparateIdentities(c));
  c.runtimeRole=c.migrationRole;assert.throws(()=>assertSeparateIdentities(c),/IDENTITY/);
});

test('staging database and production database namespaces cannot be confused',()=>{
  assert.throws(()=>assertCloudSqlUrl(url(),{...target,environment:'staging'}),/STAGING/);
  const t={...target,database:'visionary_data_staging_kan37'};assert.throws(()=>assertCloudSqlUrl(url('runtime',t),t),/PRODUCTION/);
});

test('production command requires pinned exact-source verified staging receipt bytes',()=>{
  const c=config(),bytes=receipt(),env={VISIONARY_RELEASE_COMMIT:source,DATA_MIGRATION_APPROVED_SHA:source,DATA_STAGING_RECEIPT_SHA256:sha(bytes)};
  assert.doesNotThrow(()=>assertProductionAdmission(env,c,digest,bytes));
  for(const e of [{...env,DATA_MIGRATION_APPROVED_SHA:'c'.repeat(40)},{...env,DATA_STAGING_RECEIPT_SHA256:'0'.repeat(64)}])assert.throws(()=>assertProductionAdmission(e,c,digest,bytes));
  for(const fields of [{sourceCommit:'c'.repeat(40)},{registryDigest:'c'.repeat(64)},{environment:'production'},{database:target.database},{schema:'another_schema'},{instance:'different-instance'},{verifiedAt:'2000-01-01T00:00:00Z'},{appliedVersions:[]},{status:'pending'}]){
    const changed=JSON.stringify({...JSON.parse(bytes),...fields});assert.throws(()=>assertProductionAdmission({...env,DATA_STAGING_RECEIPT_SHA256:sha(changed)},c,digest,changed),/STAGING/);
  }
});

test('production process cannot select the synthetic command mode',()=>{
  assert.throws(()=>commandConfiguration({NODE_ENV:'production',DATA_DATABASE_MODE:'synthetic'}),/MODE/);
});

test('actual command executes and verifies durable canonical migration with quoted IAM-style SQL roles',async()=>{
  const f=await stagingDatabase({iam:true});
  try{
    const env={DATA_DATABASE_MODE:'synthetic',DATA_MIGRATION_DATABASE_URL:f.config.migrationUrl,DATA_RUNTIME_DATABASE_URL:f.config.runtimeUrl,
      DATA_MIGRATION_ROLE:f.migrationRole,DATA_RUNTIME_ROLE:f.runtimeRole,DATA_DATABASE_SCHEMA:f.schema,VISIONARY_RELEASE_COMMIT:source};
    const plan=await runMigrationCommand('plan',env,backend);assert.deepEqual(plan.versions,[1]);
    const result=await runMigrationCommand('apply',env,backend);assert.equal(result.status,'verified');
    const fresh=await runMigrationCommand('verify',env,backend);assert.equal(fresh.registryDigest,result.registryDigest);
    assert.equal((await f.db.$queryRawUnsafe('SELECT "appliedBy" FROM "_visionary_migrations"'))[0].appliedBy,f.migrationRole);
    await assert.rejects(runMigrationCommand('rollback',env,backend),/ROLLBACK_DENIED/);
  }finally{await f.close();}
});
