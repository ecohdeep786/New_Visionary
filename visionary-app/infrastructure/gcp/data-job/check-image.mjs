import {execFileSync,spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const commit=process.env.GITHUB_SHA;
if(!/^[a-f0-9]{40}$/.test(commit??''))throw Error('Exact source SHA required.');
const image='visionary-data-job-check:'+commit;
execFileSync('docker',['build','--file','infrastructure/gcp/data-job/Dockerfile','--build-arg','VISIONARY_RELEASE_COMMIT='+commit,'--tag',image,'.'],{stdio:'inherit',timeout:600000});
const target={DATA_DATABASE_MODE:'staging',DATA_GCP_PROJECT:'visionary-research',DATA_GCP_REGION:'asia-south1',DATA_CLOUD_SQL_INSTANCE:'synthetic-image-check',
  DATA_DATABASE_NAME:'visionary_data_staging_image',DATA_DATABASE_SCHEMA:'product',DATA_MIGRATION_ROLE:'migration_check',DATA_RUNTIME_ROLE:'runtime_check'};
function url(role){const u=new URL('postgresql://localhost/'+target.DATA_DATABASE_NAME);u.username=role;
  for(const [k,v] of Object.entries({schema:'product',host:'/cloudsql/visionary-research:asia-south1:synthetic-image-check',connection_limit:'2',pool_timeout:'10',connect_timeout:'10'}))u.searchParams.set(k,v);return String(u);}
target.DATA_MIGRATION_DATABASE_URL=url(target.DATA_MIGRATION_ROLE);target.DATA_RUNTIME_DATABASE_URL=url(target.DATA_RUNTIME_ROLE);
const envArgs=Object.entries(target).flatMap(([k,v])=>['--env',k+'='+v]);
// No socket/network is supplied: plan must load the real compiled artifact without connecting.
const plan=JSON.parse(execFileSync('docker',['run','--rm','--network=none',...envArgs,image,'plan'],{encoding:'utf8',timeout:20000}));
assert.equal(plan.command,'plan');assert.deepEqual(plan.versions,[1]);assert.match(plan.registryDigest,/^[a-f0-9]{64}$/);
const denied=spawnSync('docker',['run','--rm','--network=none',...envArgs,image,'apply'],{encoding:'utf8',timeout:20000});
assert.notEqual(denied.status,0);assert.match(denied.stderr,/Migration command failed/);
assert.ok(!denied.stderr.includes(target.DATA_MIGRATION_DATABASE_URL));
console.log('PASS: migration image compiles, reads canonical artifact and denies unapproved execution without credentials or network.');

// Exercise the compiled production entrypoint over a real PostgreSQL Unix
// socket. This disposable fixture uses no cloud resources or user records.
const id='kan37-'+randomUUID(),volume=id+'-socket',server=id+'-postgres';
const socket='/cloudsql/visionary-research:asia-south1:synthetic-image-check';
const evidence=mkdtempSync(join(tmpdir(),'kan37-image-'));
const postgres='postgres:16-bookworm';
function docker(args,options={}){return execFileSync('docker',args,{encoding:'utf8',timeout:60000,...options});}
function run(command,environment,extra=[]){return docker(['run','--rm','--network=none','--mount','type=volume,source='+volume+',target='+socket,
  ...extra,...Object.entries(environment).flatMap(([k,v])=>['--env',k+'='+v]),image,command]);}
try{
  docker(['volume','create',volume]);
  docker(['run','--rm','--network=none','--mount','type=volume,source='+volume+',target=/socket','--entrypoint','sh',postgres,'-c','chmod 1777 /socket']);
  docker(['run','--detach','--name',server,'--network=none','--mount','type=volume,source='+volume+',target='+socket,
    '--env','POSTGRES_PASSWORD=synthetic-image-only',postgres,'-c','unix_socket_directories='+socket]);
  let ready=false;
  for(let attempt=0;attempt<45;attempt++){
    const r=spawnSync('docker',['exec',server,'pg_isready','-h',socket,'-U','postgres'],{encoding:'utf8',timeout:5000});
    if(r.status===0){ready=true;break;}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert.ok(ready,'Disposable PostgreSQL must become ready.');
  const psql=(database,sql)=>docker(['exec','-i',server,'psql','-h',socket,'-U','postgres','-d',database,'-v','ON_ERROR_STOP=1'],{input:sql});
  psql('postgres',`CREATE ROLE migration_check LOGIN; CREATE ROLE runtime_check LOGIN;
    CREATE DATABASE visionary_data_staging_image; CREATE DATABASE visionary_product_image;`);
  for(const database of ['visionary_data_staging_image','visionary_product_image']){
    psql(database,'CREATE SCHEMA product AUTHORIZATION migration_check; REVOKE ALL ON SCHEMA product FROM PUBLIC; GRANT USAGE ON SCHEMA product TO runtime_check;');
  }
  const staging={...target,DATA_MIGRATION_APPROVED_SHA:commit};
  const receiptBytes=run('apply',staging),receipt=JSON.parse(receiptBytes);
  assert.equal(receipt.status,'verified');assert.equal(receipt.environment,'staging');assert.equal(receipt.sourceCommit,commit);
  assert.deepEqual(receipt.appliedVersions,[1]);assert.equal(receipt.registryDigest,plan.registryDigest);
  assert.equal(JSON.parse(run('verify',staging)).status,'verified');
  assert.equal(JSON.parse(run('apply',staging)).status,'verified','Repeated apply reconciles existing ledger.');
  writeFileSync(join(evidence,'staging.json'),receiptBytes);
  const production={...staging,DATA_DATABASE_MODE:'production',DATA_DATABASE_NAME:'visionary_product_image',
    DATA_MIGRATION_DATABASE_URL:target.DATA_MIGRATION_DATABASE_URL.replace('/visionary_data_staging_image?','/visionary_product_image?'),
    DATA_RUNTIME_DATABASE_URL:target.DATA_RUNTIME_DATABASE_URL.replace('/visionary_data_staging_image?','/visionary_product_image?'),
    DATA_STAGING_RECEIPT_PATH:'/evidence/staging.json',DATA_STAGING_RECEIPT_SHA256:createHash('sha256').update(receiptBytes).digest('hex')};
  const mount=['--mount','type=bind,source='+evidence+',target=/evidence,readonly'];
  assert.equal(JSON.parse(run('apply',production,mount)).status,'verified');
  assert.equal(JSON.parse(run('verify',production,mount)).status,'verified');
  // The canonical baseline is deliberately irreversible, even while empty.
  assert.throws(()=>run('rollback',production,mount));
  assert.equal(JSON.parse(run('verify',production,mount)).status,'verified','Denied rollback preserves the applied state.');
  const versions=psql('visionary_product_image','SELECT version FROM product._visionary_migrations WHERE status=\'applied\';');
  assert.match(versions,/1/);
  console.log('PASS: actual image staging apply/verify/replay and pinned-receipt production apply/verify over isolated PostgreSQL Unix socket; irreversible rollback denied.');
}finally{
  spawnSync('docker',['rm','--force','--volumes',server],{stdio:'ignore',timeout:20000});
  spawnSync('docker',['volume','rm',volume],{stdio:'ignore',timeout:20000});
  rmSync(evidence,{recursive:true,force:true});
}
