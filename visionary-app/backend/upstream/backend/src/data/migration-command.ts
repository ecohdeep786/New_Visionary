import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertSeparateIdentities,IdentityConfig } from './migration-identities';
import { canonicalMigrations } from './migration-registry';
import { MigrationRunner } from './migration-runner';
import { PostgresMigrationStore } from './migration-store';

type Environment=Record<string,string|undefined>;
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const required=(env:Environment,key:string)=>{const v=env[key];if(!v)throw Error('MIGRATION_CONFIGURATION_REQUIRED');return v;};

export function commandConfiguration(env:Environment):IdentityConfig {
  const mode=required(env,'DATA_DATABASE_MODE');
  if(!['synthetic','staging','production'].includes(mode))throw Error('MIGRATION_MODE_DENIED');
  if(mode==='synthetic'&&env.NODE_ENV==='production')throw Error('MIGRATION_MODE_DENIED');
  const config:IdentityConfig={
    migrationUrl:required(env,'DATA_MIGRATION_DATABASE_URL'),runtimeUrl:required(env,'DATA_RUNTIME_DATABASE_URL'),
    migrationRole:required(env,'DATA_MIGRATION_ROLE'),runtimeRole:required(env,'DATA_RUNTIME_ROLE'),schema:required(env,'DATA_DATABASE_SCHEMA'),
  };
  if(mode!=='synthetic')config.cloudSql={environment:mode as 'staging'|'production',project:required(env,'DATA_GCP_PROJECT') as 'visionary-research',
    region:required(env,'DATA_GCP_REGION') as 'asia-south1',instance:required(env,'DATA_CLOUD_SQL_INSTANCE'),database:required(env,'DATA_DATABASE_NAME')};
  assertSeparateIdentities(config);return config;
}

export function assertProductionAdmission(env:Environment,config:IdentityConfig,registryDigest:string,receiptBytes?:string):void {
  if(!/^[a-f0-9]{40}$/.test(env.VISIONARY_RELEASE_COMMIT??''))throw Error('MIGRATION_SOURCE_REQUIRED');
  if(!config.cloudSql)return;
  if(env.DATA_MIGRATION_APPROVED_SHA!==env.VISIONARY_RELEASE_COMMIT)throw Error('MIGRATION_SOURCE_NOT_APPROVED');
  if(config.cloudSql.environment!=='production')return;
  if(!receiptBytes||!env.DATA_STAGING_RECEIPT_SHA256||sha(receiptBytes)!==env.DATA_STAGING_RECEIPT_SHA256)throw Error('STAGING_RECEIPT_REQUIRED');
  const receipt=JSON.parse(receiptBytes),age=Date.now()-Date.parse(receipt.verifiedAt);
  if(receipt.environment!=='staging'||receipt.sourceCommit!==env.VISIONARY_RELEASE_COMMIT||receipt.registryDigest!==registryDigest
    ||receipt.project!==config.cloudSql.project||receipt.region!==config.cloudSql.region||receipt.instance!==config.cloudSql.instance
    ||receipt.database===config.cloudSql.database||!/^visionary_data_staging(?:_|$)/.test(receipt.database??'')
    ||receipt.schema!==config.schema||receipt.status!=='verified'||!Array.isArray(receipt.appliedVersions)||receipt.appliedVersions.length!==1||receipt.appliedVersions[0]!==1
    ||!Number.isFinite(age)||age<0||age>7*24*60*60*1000)throw Error('STAGING_RECEIPT_INVALID');
}

/** Separate job entrypoint; never imported by the product HTTP process. */
export async function runMigrationCommand(command:string,env:Environment,backendRoot:string,receiptBytes?:string){
  if(!['plan','apply','verify','rollback'].includes(command))throw Error('MIGRATION_COMMAND_DENIED');
  const config=commandConfiguration(env),registry=canonicalMigrations(backendRoot),registryDigest=sha(JSON.stringify(registry));
  if(command==='plan')return {command,registryDigest,versions:registry.map(m=>m.version),target:config.cloudSql??{environment:'synthetic'},schema:config.schema};
  assertProductionAdmission(env,config,registryDigest,receiptBytes);
  const store=new PostgresMigrationStore(config),runner=new MigrationRunner(store,registry);
  try{
    if(command==='apply')await runner.applyAll();
    const rollback=command==='rollback'?await runner.rollbackLast():undefined;
    const result=await runner.verify(rollback?.remainingVersions);
    if(!result.consistent)throw Error('MIGRATION_VERIFICATION_FAILED');
    // Receipt is useful only after actual database verification. The release
    // operator retains and pins its exact bytes; this is not a signature.
    return {status:'verified',environment:config.cloudSql?.environment??'synthetic',sourceCommit:env.VISIONARY_RELEASE_COMMIT,
      registryDigest,...config.cloudSql,schema:config.schema,appliedVersions:rollback?.remainingVersions??registry.map(m=>m.version),verifiedAt:new Date().toISOString()};
  }finally{await store.close();}
}

if(require.main===module){
  Promise.resolve().then(()=>{
    const receiptPath=process.env.DATA_STAGING_RECEIPT_PATH;
    const receipt=receiptPath?readFileSync(receiptPath,'utf8'):undefined;
    return runMigrationCommand(process.argv[2]??'plan',process.env,resolve(__dirname,'../..' ,'..'),receipt);
  })
    .then(result=>console.log(JSON.stringify(result)))
    .catch(()=>{console.error('Migration command failed. Check approved target, identities, receipt and database state.');process.exitCode=1;});
}
