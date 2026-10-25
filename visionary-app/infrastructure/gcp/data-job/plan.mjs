import {production} from '../release.mjs';

/** Pure, reviewable deployment plan. Does not create resources or grant access. */
export function migrationJobPlan({environment,instance,database,schema,source,image,migrationRole,runtimeRole,migrationSecret,runtimeSecret,receiptSecret,receiptSha}){
  if(!['staging','production'].includes(environment)||!/^[-a-z][a-z0-9-]{0,61}[a-z0-9]$/.test(instance??'')
    ||!/^visionary_[a-z0-9_]{1,50}$/.test(database??'')||!/^[a-z][a-z0-9_]{0,50}$/.test(schema??'')
    ||!/^[a-f0-9]{40}$/.test(source??'')
    ||!new RegExp('^asia-south1-docker\\.pkg\\.dev/visionary-research/visionary-product/data-job@sha256:[a-f0-9]{64}$').test(image??''))throw Error('Invalid migration deployment target.');
  if(environment==='staging'&&!/^visionary_data_staging(?:_|$)/.test(database))throw Error('Staging must use synthetic staging database.');
  if(environment==='production'&&/^visionary_data_(test|staging)(_|$)/.test(database))throw Error('Production database required.');
  for(const role of [migrationRole,runtimeRole])if(!/^[a-zA-Z_][a-zA-Z0-9_.@-]{0,62}$/.test(role??''))throw Error('Explicit SQL roles required.');
  if(migrationRole===runtimeRole)throw Error('Distinct SQL roles required.');
  for(const secret of [migrationSecret,runtimeSecret,...(environment==='production'?[receiptSecret]:[])])
    if(!/^visionary-data-(staging|production)-[a-z-]+:[1-9][0-9]*$/.test(secret??'')||!secret.startsWith('visionary-data-'+environment+'-'))throw Error('Environment-qualified immutable secret versions required.');
  if(migrationSecret===runtimeSecret)throw Error('Distinct credential secrets required.');
  if(environment==='production'&&!/^[a-f0-9]{64}$/.test(receiptSha??''))throw Error('Pinned staging receipt hash required.');
  const connection=production.project+':'+production.region+':'+instance;
  const env={DATA_DATABASE_MODE:environment,DATA_GCP_PROJECT:production.project,DATA_GCP_REGION:production.region,
    DATA_CLOUD_SQL_INSTANCE:instance,DATA_DATABASE_NAME:database,DATA_DATABASE_SCHEMA:schema,
    DATA_MIGRATION_ROLE:migrationRole,DATA_RUNTIME_ROLE:runtimeRole,DATA_MIGRATION_APPROVED_SHA:source};
  if(environment==='production'){env.DATA_STAGING_RECEIPT_PATH='/evidence/staging.json';env.DATA_STAGING_RECEIPT_SHA256=receiptSha;}
  const secrets=['DATA_MIGRATION_DATABASE_URL='+migrationSecret,'DATA_RUNTIME_DATABASE_URL='+runtimeSecret];
  if(environment==='production')secrets.push('/evidence/staging.json='+receiptSecret);
  const job='visionary-data-'+environment;
  return {job,connection,identity:'visionary-data-'+environment+'@'+production.project+'.iam.gserviceaccount.com',
    deploy:['run','jobs','deploy',job,'--project='+production.project,'--region='+production.region,'--image='+image,
      '--service-account=visionary-data-'+environment+'@'+production.project+'.iam.gserviceaccount.com',
      '--set-cloudsql-instances='+connection,'--tasks=1','--parallelism=1','--max-retries=0','--task-timeout=300s','--cpu=1','--memory=512Mi',
      '--args=apply','--set-env-vars='+Object.entries(env).map(([k,v])=>k+'='+v).join(','),'--set-secrets='+secrets.join(',')],
    execute:['run','jobs','execute',job,'--project='+production.project,'--region='+production.region,'--wait'],
    prerequisite:'Approved instance/database/schema, separate database roles and job IAM/secret grants, backup/recovery plan and staged verification; deploy/execute are separate reviewed actions.'};
}
