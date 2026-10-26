// Independent offline admission/plan probes. No cloud API or hosted database access.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createHash}=require('node:crypto');
const product=path.resolve(__dirname,'../../../..');
const compiled=process.env.KAN37_COMPILED_DATA||path.join(product,'artifacts/qa/kan37-independent-compile/src/data');
const {assertCloudSqlUrl,assertSeparateIdentities}=require(path.join(compiled,'migration-identities.js'));
const {assertProductionAdmission,runMigrationCommand}=require(path.join(compiled,'migration-command.js'));
const source='a'.repeat(40),digest='b'.repeat(64);
const target={environment:'production',project:'visionary-research',region:'asia-south1',instance:'visionary-product-data',database:'visionary_product'};
function url(role,t=target){const u=new URL('postgresql://localhost/'+t.database);u.username=role;
  for(const[k,v]of Object.entries({schema:'product',host:'/cloudsql/'+t.project+':'+t.region+':'+t.instance,connection_limit:'2',pool_timeout:'10',connect_timeout:'10'}))u.searchParams.set(k,v);
  return String(u);}
const config=t=>({migrationUrl:url('migration',t),runtimeUrl:url('runtime',t),migrationRole:'migration',runtimeRole:'runtime',schema:'product',cloudSql:t});
const receipt=fields=>JSON.stringify({environment:'staging',sourceCommit:source,registryDigest:digest,...target,
  environment:'staging',database:'visionary_data_staging_kan37',schema:'product',status:'verified',appliedVersions:[1],verifiedAt:new Date().toISOString(),...fields});
function admit(fields){const bytes=receipt(fields);return assertProductionAdmission({VISIONARY_RELEASE_COMMIT:source,DATA_MIGRATION_APPROVED_SHA:source,
  DATA_STAGING_RECEIPT_SHA256:createHash('sha256').update(bytes).digest('hex')},config(target),digest,bytes);}
test('production admission requires the staged schema to match the production schema',()=>{
  assert.doesNotThrow(()=>admit({}));
  assert.throws(()=>admit({schema:'different_schema'}),/STAGING/);
  assert.throws(()=>admit({schema:undefined}),/STAGING/);
});
test('Cloud SQL socket validation rejects an instance whose full PostgreSQL socket path exceeds Linux limit',()=>{
  const oversized={...target,instance:'a'.repeat(63)};
  assert.ok(Buffer.byteLength('/cloudsql/'+oversized.project+':'+oversized.region+':'+oversized.instance+'/.s.PGSQL.5432')>=108);
  assert.throws(()=>assertCloudSqlUrl(url('runtime',oversized),oversized),/TARGET|SOCKET|TRANSPORT/);
});
test('deploy plan rejects that same impossible socket target',async()=>{
  const {migrationJobPlan}=await import(require('node:url').pathToFileURL(path.join(product,'infrastructure/gcp/data-job/plan.mjs')).href);
  assert.throws(()=>migrationJobPlan({environment:'staging',instance:'a'.repeat(63),database:'visionary_data_staging_kan37',schema:'product',
    source,image:'asia-south1-docker.pkg.dev/visionary-research/visionary-product/data-job@sha256:'+'b'.repeat(64),
    migrationRole:'migration',runtimeRole:'runtime',migrationSecret:'visionary-data-staging-migration-url:1',runtimeSecret:'visionary-data-staging-runtime-url:1'}));
});
test('offline command plan omits credential bytes and does not connect',async()=>{
  const c=config(target),env={DATA_DATABASE_MODE:'production',DATA_GCP_PROJECT:target.project,DATA_GCP_REGION:target.region,
    DATA_CLOUD_SQL_INSTANCE:target.instance,DATA_DATABASE_NAME:target.database,DATA_DATABASE_SCHEMA:'product',
    DATA_MIGRATION_ROLE:c.migrationRole,DATA_RUNTIME_ROLE:c.runtimeRole,DATA_MIGRATION_DATABASE_URL:c.migrationUrl,DATA_RUNTIME_DATABASE_URL:c.runtimeUrl};
  const result=await runMigrationCommand('plan',env,path.join(product,'backend/upstream/backend'));
  assert.equal(result.target.environment,'production');assert.equal(result.schema,'product');
  assert.ok(!JSON.stringify(result).includes('postgresql://'));
  await assert.rejects(runMigrationCommand('apply',env,path.join(product,'backend/upstream/backend')),/SOURCE_REQUIRED/);
});
test('URL overrides, fragment and duplicate timeout keys fail before database clients exist',()=>{
  for(const mutate of [u=>u.searchParams.set('sslmode','disable'),u=>u.searchParams.set('options','-crole=postgres'),u=>u.searchParams.append('pool_timeout','1'),u=>{u.hash='#discard';}]){
    const c=config(target),u=new URL(c.migrationUrl);mutate(u);c.migrationUrl=String(u);assert.throws(()=>assertSeparateIdentities(c));
  }
});
