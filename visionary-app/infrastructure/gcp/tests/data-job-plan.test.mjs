import test from 'node:test';
import assert from 'node:assert/strict';
import {migrationJobPlan} from '../data-job/plan.mjs';
const input=()=>({environment:'staging',instance:'visionary-product-data',database:'visionary_data_staging_kan37',schema:'product',source:'a'.repeat(40),
  image:'asia-south1-docker.pkg.dev/visionary-research/visionary-product/data-job@sha256:'+'b'.repeat(64),migrationRole:'staging_migrator',runtimeRole:'staging_runtime',
  migrationSecret:'visionary-data-staging-migration-url:1',runtimeSecret:'visionary-data-staging-runtime-url:1'});
test('migration job deploy plan is bounded, immutable and separate from product runtime',()=>{
  const p=migrationJobPlan(input());assert.equal(p.job,'visionary-data-staging');
  assert.ok(p.deploy.includes('--tasks=1'));assert.ok(p.deploy.includes('--max-retries=0'));assert.ok(p.deploy.includes('--parallelism=1'));
  assert.ok(p.deploy.includes('--set-cloudsql-instances=visionary-research:asia-south1:visionary-product-data'));
  assert.ok(!p.identity.includes('visionary-product-runtime'));assert.equal(p.execute[2],'execute');
});
test('production requires pinned staging evidence and environment-specific secret versions',()=>{
  const p={...input(),environment:'production',database:'visionary_product',migrationSecret:'visionary-data-production-migration-url:2',runtimeSecret:'visionary-data-production-runtime-url:3',receiptSecret:'visionary-data-production-staging-receipt:1',receiptSha:'c'.repeat(64)};
  assert.doesNotThrow(()=>migrationJobPlan(p));
  for(const bad of [{receiptSha:undefined},{receiptSecret:undefined},{runtimeSecret:'visionary-data-staging-runtime-url:1'},{migrationSecret:'visionary-data-production-migration-url:latest'},{runtimeSecret:p.migrationSecret},{image:p.image.replace('@sha256:',':')}])assert.throws(()=>migrationJobPlan({...p,...bad}));
});
test('job target refuses unintended database, schema, source or SQL identity',()=>{
  for(const bad of [{database:'visionary_product'},{schema:'public;drop schema public'},{source:'main'},{runtimeRole:'postgres;SET ROLE owner'},{runtimeRole:'staging_migrator'},{instance:'a'.repeat(63)}])assert.throws(()=>migrationJobPlan({...input(),...bad}));
});
