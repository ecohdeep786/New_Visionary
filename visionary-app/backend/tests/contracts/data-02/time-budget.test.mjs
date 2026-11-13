import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{req}=require('./postgres-fixture.cjs');
const {PostgresMigrationStore}=req('./dist/src/data/migration-store.js');
const {BackfillRunner}=req('./dist/src/data/backfill-runner.js');

// Policy unit test: execute the actual store's transaction configuration against
// an explicit inert Prisma interface. Real SQL rollback/recovery is separate.
test('accepted small transaction budgets retain usable SQL time without extending the transaction',async()=>{
  for(const requested of [100,200,500,15000]){
    const settings=[];
    const store=Object.create(PostgresMigrationStore.prototype);
    store.config={schema:'synthetic',migrationRole:'migration',runtimeRole:'runtime'};
    store.runtimeIdentity=async()=>{};
    store.runtimePrivileges=async()=>{};
    store.migration={$transaction:async(work,options)=>{
      assert.equal(options.timeout,requested);assert.equal(options.maxWait,requested);
      return work({
        async $queryRawUnsafe(sql,...args){
          if(sql.includes('owner.rolname AS owner'))return [{role:'migration',owner:'migration',rolsuper:false,rolcreatedb:false,rolcreaterole:false}];
          if(sql.includes("set_config('statement_timeout'"))settings.push(Number(args[0]));
          return [];
        },async $executeRawUnsafe(){return 0;},
      });
    }};
    assert.equal(await store.transaction(async()=>42,requested),42);
    assert.equal(settings.length,1);
    assert.ok(settings[0]>=requested/2,'Internal safety reserve must not consume most of an accepted budget');
    assert.ok(settings[0]<requested,'SQL must leave time for the transaction boundary');
  }
});

test('callback respects the available batch time when the global invocation budget is longer',async()=>{
  let entered=false;
  const controller=new AbortController(),fallback=setTimeout(()=>controller.abort(),2000);
  const definition='a'.repeat(64);
  const store={async transaction(work,timeout){
    assert.equal(timeout,15000);
    return work({async $executeRawUnsafe(){return 0;},async $queryRawUnsafe(){return [{definition,done:false,cursor:null,processed:0}];}},100);
  }};
  try{
    await assert.rejects(new BackfillRunner(store,{next(){entered=true;return new Promise(()=>{});}},async()=>{})
      .run({name:'synthetic',definition,maxDurationMs:30000,signal:controller.signal}),/BACKFILL_DEADLINE/);
    assert.equal(entered,true);
  }finally{clearTimeout(fallback);controller.abort();}
});

test('only the bounded SQL statement-timeout diagnostic is classified as a SQL deadline',async()=>{
  const store=Object.create(PostgresMigrationStore.prototype);
  const own={code:'P2010',meta:{code:'57014',message:'ERROR: canceling statement due to statement timeout'}};
  const user={code:'P2010',meta:{code:'57014',message:'ERROR: canceling statement due to user request'}};
  const authority=Error('RUNTIME_IDENTITY_DENIED');
  const expired={code:'P2028',meta:{error:'Transaction already closed: A query cannot be executed on an expired transaction.'}};
  const invalid={code:'P2028',meta:{error:'Transaction ID is invalid'}};
  for(const error of [own,user,authority,expired,invalid]){
    const tx=store.guardTransaction({async $executeRawUnsafe(){throw error;}},{assertActive(){},remainingMs:()=>200});
    if(error===own)await assert.rejects(tx.$executeRawUnsafe('SELECT synthetic'),/BACKFILL_DEADLINE_SQL/);
    else if(error===expired)await assert.rejects(tx.$executeRawUnsafe('SELECT synthetic'),/BACKFILL_DEADLINE_TRANSACTION/);
    else await assert.rejects(tx.$executeRawUnsafe('SELECT synthetic'),value=>value===error);
  }
});
