import {execFileSync,spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
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
