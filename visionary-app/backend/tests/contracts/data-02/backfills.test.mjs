import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const local=createRequire(import.meta.url),{stagingDatabase,req,backend}=local('./postgres-fixture.cjs');
const {MigrationRunner}=req('./dist/src/data/migration-runner.js'),{canonicalMigrations}=req('./dist/src/data/migration-registry.js');
const {BackfillRunner}=req('./dist/src/data/backfill-runner.js');
const definition='a'.repeat(64),options={name:'synthetic',definition};
async function fixture(fn){const f=await stagingDatabase();try{
  await new MigrationRunner(f.store(),canonicalMigrations(backend)).applyAll();
  await f.db.$executeRawUnsafe('CREATE TABLE synthetic_target(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
  f.write=async(tx,row)=>{await tx.$executeRawUnsafe('INSERT INTO synthetic_target(key,value) VALUES($1,$2)',row.key,row.value);};
  f.rows=()=>f.db.$queryRawUnsafe('SELECT * FROM synthetic_target ORDER BY key');await fn(f);
}finally{await f.close();}}
const source=(rows)=>({async next(cursor,limit){const offset=Number(cursor??0),slice=rows.slice(offset,offset+limit);return {rows:slice,nextCursor:String(offset+slice.length),done:offset+slice.length>=rows.length};}});
const rows=Array.from({length:5},(_,i)=>({key:String(i),value:'synthetic-'+i}));
function latch(){let release;const promise=new Promise(resolve=>{release=resolve;});return {promise,release};}
async function observed(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Test phase was not reached')),8000);})]);}finally{clearTimeout(timer);}}

test('bounded invocation persists checkpoints and cold adapter resumes without duplicate writer calls',()=>fixture(async f=>{
  const r=new BackfillRunner(f.store(),source(rows),f.write);
  const first=await r.run({...options,batchSize:2,maxBatches:1});assert.equal(first.done,false);assert.equal(first.processed,2);
  const resumed=await new BackfillRunner(f.store(),source(rows),f.write).run({...options,batchSize:2,maxRows:2});
  assert.equal(resumed.done,false);assert.equal(resumed.processed,4);
  const final=await new BackfillRunner(f.store(),source(rows),f.write).run(options);assert.equal(final.done,true);assert.equal(final.processed,5);
  const replay=await new BackfillRunner(f.store(),{next(){throw Error('completed source must not run');}},f.write).run(options);
  assert.equal(replay.batches,0);assert.equal((await f.rows()).length,5);
}));

test('row writes, durable deduplication receipts and checkpoint share one transaction',()=>fixture(async f=>{
  let fail=true;
  const writer=async(tx,row)=>{await f.write(tx,row);if(row.key==='1'&&fail)throw Error('synthetic late writer outage');};
  const r=new BackfillRunner(f.store(),source(rows.slice(0,2)),writer);
  await assert.rejects(r.run({...options,batchSize:2}),/late writer outage/);assert.equal((await f.rows()).length,0);
  fail=false;const result=await new BackfillRunner(f.store(),source(rows.slice(0,2)),writer).run({...options,batchSize:2});
  assert.equal(result.processed,2);assert.equal((await f.rows()).length,2);
  assert.equal(Number((await f.db.$queryRawUnsafe('SELECT count(*) AS count FROM "_visionary_backfill_rows"'))[0].count),2);
}));

test('receipt persistence outage rolls back the actual database writer',()=>fixture(async f=>{
  await new BackfillRunner(f.store(),source([]),f.write).run({...options,name:'initialize'});
  await f.db.$executeRawUnsafe('CREATE FUNCTION fail_backfill_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION \'synthetic marker outage\'; END $$');
  await f.db.$executeRawUnsafe('CREATE TRIGGER fail_backfill BEFORE INSERT ON "_visionary_backfill_rows" FOR EACH ROW EXECUTE FUNCTION fail_backfill_receipt()');
  await assert.rejects(new BackfillRunner(f.store(),source(rows),f.write).run(options),/synthetic marker outage/);
  assert.equal((await f.rows()).length,0);
  await f.db.$executeRawUnsafe('DROP TRIGGER fail_backfill ON "_visionary_backfill_rows"');
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('oversized pages and invalid options fail without committed target writes',()=>fixture(async f=>{
  for(const o of [{batchSize:0},{maxBatches:0},{maxRows:10001},{maxDurationMs:0}])
    await assert.rejects(new BackfillRunner(f.store(),source(rows),f.write).run({...options,...o}),/BOUNDS/);
  await assert.rejects(new BackfillRunner(f.store(),{async next(){return {rows,nextCursor:'x',done:true};}},f.write).run({...options,batchSize:1}),/PAGE_BOUNDS/);
  assert.equal((await f.rows()).length,0);
}));

test('stalled and cyclic cursors are refused, including cycles across invocations',()=>fixture(async f=>{
  await assert.rejects(new BackfillRunner(f.store(),{async next(cursor){return {rows:[],nextCursor:cursor,done:false};}},f.write).run(options),/CURSOR_STALLED/);
  const cycle={async next(cursor){return {rows:[],nextCursor:cursor===null?'a':cursor==='a'?'b':'a',done:false};}};
  const r=new BackfillRunner(f.store(),cycle,f.write);
  assert.equal((await r.run({...options,maxBatches:1})).cursor,'a');
  assert.equal((await r.run({...options,maxBatches:1})).cursor,'b');
  await assert.rejects(r.run({...options,maxBatches:1}),/CURSOR_CYCLE/);
}));

test('duplicate stable keys skip the real non-idempotent writer while changed payload is rejected',()=>fixture(async f=>{
  const duplicate=source([rows[0],rows[0],rows[1]]);
  assert.equal((await new BackfillRunner(f.store(),duplicate,f.write).run({...options,batchSize:1})).processed,2);
  assert.equal((await f.rows()).length,2);
  const changed=source([{key:'same',value:'a'},{key:'same',value:'b'}]);
  await assert.rejects(new BackfillRunner(f.store(),changed,f.write).run({...options,name:'changed',batchSize:1}),/ROW_DRIFT/);
  assert.equal((await f.rows()).find(r=>r.key==='same').value,'a');
}));

test('completed runs reject a changed source/writer definition instead of silently skipping',()=>fixture(async f=>{
  await new BackfillRunner(f.store(),source([]),f.write).run(options);
  await assert.rejects(new BackfillRunner(f.store(),source(rows),f.write).run({...options,definition:'b'.repeat(64)}),/DEFINITION_DRIFT/);
}));

test('cancellation before write aborts the batch and resumes from its durable checkpoint',()=>fixture(async f=>{
  const controller=new AbortController();
  const cancelled={async next(){controller.abort();return {rows:[rows[0]],nextCursor:'1',done:true};}};
  await assert.rejects(new BackfillRunner(f.store(),cancelled,f.write).run({...options,signal:controller.signal}),/CANCELLED/);
  assert.equal((await f.rows()).length,0);
  const emptyController=new AbortController();
  await assert.rejects(new BackfillRunner(f.store(),{async next(){emptyController.abort();return {rows:[],nextCursor:null,done:true};}},f.write).run({...options,signal:emptyController.signal}),/CANCELLED/);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('a source that never resolves is bounded by deadline with no committed batch',()=>fixture(async f=>{
  const started=Date.now();
  await assert.rejects(new BackfillRunner(f.store(),{next(){return new Promise(()=>{});}},f.write).run({...options,maxDurationMs:200}),/DEADLINE/);
  assert.ok(Date.now()-started<3000);assert.equal((await f.rows()).length,0);
}));

test('a 200ms invocation does not fail prematurely during SQL setup, rolls back and cold retries',()=>fixture(async f=>{
  const store=f.store();
  // Open both role connections before measuring the invocation. The hook below
  // adds real SQL latency, rather than sleeping in a test-owned source stub.
  await store.transaction(async()=>{});
  await store.transaction(async()=>{},10000,{remainingMs:()=>10000,assertActive(){}});
  const transaction=store.transaction.bind(store);
  store.transaction=(work,...bounds)=>transaction(tx=>work(new Proxy(tx,{
    get(target,key){
      if(key==='$executeRawUnsafe')return async(sql,...args)=>{
        if(sql.includes('CREATE TABLE IF NOT EXISTS "_visionary_backfills"'))
          await target.$executeRawUnsafe('SELECT pg_sleep(0.02)');
        return target.$executeRawUnsafe(sql,...args);
      };
      const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
    },
  })),...bounds);
  let entered=false,failure;
  const started=Date.now();
  try{await new BackfillRunner(store,{next(){entered=true;return new Promise(()=>{});}},f.write)
    .run({...options,maxDurationMs:200});}catch(error){failure=error;}
  const elapsed=Date.now()-started;
  assert.ok(failure,'Hanging work must not succeed');
  assert.ok(elapsed<3000,'Invocation remains bounded');
  assert.equal((await f.rows()).length,0,'No target row committed');
  const tables=await f.db.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname=$1 AND tablename IN ('_visionary_backfills','_visionary_backfill_rows','_visionary_backfill_cursors')",f.schema);
  assert.equal(tables.length,0,'Uncommitted control/checkpoint tables roll back');
  const recovered=await new BackfillRunner(f.store(),source(rows),f.write).run(options);
  assert.equal(recovered.processed,5);assert.equal((await f.rows()).length,5);
  assert.ok(entered||elapsed>=180,`Admission/setup may exhaust the real budget, but not collapse it to 1ms (elapsed=${elapsed}ms)`);
  assert.match(String(failure),/BACKFILL_DEADLINE/);
}));

test('concurrent backfill invocations use durable completion and invoke writer exactly once per key',()=>fixture(async f=>{
  const results=await Promise.all([new BackfillRunner(f.store(),source(rows),f.write).run(options),new BackfillRunner(f.store(),source(rows),f.write).run(options)]);
  assert.ok(results.every(r=>r.done&&r.processed===5));assert.equal((await f.rows()).length,5);
}));

test('row budget limits the requested page and leaves explicit resumable state',()=>fixture(async f=>{
  const seen=[],wrapped=source(rows);
  const limited={async next(cursor,limit,signal){seen.push(limit);return wrapped.next(cursor,limit,signal);}};
  const result=await new BackfillRunner(f.store(),limited,f.write).run({...options,batchSize:2,maxRows:3});
  assert.deepEqual(seen,[2,1]);assert.equal(result.processed,3);assert.equal(result.done,false);
}));

test('lost batch commit acknowledgement resumes from durable rows and completion',()=>fixture(async f=>{
  const {PostgresMigrationStore}=req('./dist/src/data/migration-store.js');
  class LostAcknowledgementStore extends PostgresMigrationStore{
    async transaction(work,timeout,bounds){await super.transaction(work,timeout,bounds);throw Error('synthetic lost batch acknowledgement');}
  }
  const uncertain=new LostAcknowledgementStore(f.config);
  try{await assert.rejects(new BackfillRunner(uncertain,source(rows),f.write).run(options),/lost batch/);}finally{await uncertain.close();}
  const result=await new BackfillRunner(f.store(),source(rows),f.write).run(options);
  assert.equal(result.done,true);assert.equal(result.processed,5);assert.equal(result.batches,0);assert.equal((await f.rows()).length,5);
}));

test('new backfill metadata with runtime default grants rolls back its writer before commit',()=>fixture(async f=>{
  await f.db.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES IN SCHEMA "'+f.schema+'" GRANT UPDATE ON TABLES TO "'+f.runtimeRole+'"');
  await assert.rejects(new BackfillRunner(f.store(),source(rows),f.write).run(options),/RUNTIME_CONTROL_WRITE_DENIED/);
  assert.equal((await f.rows()).length,0);
  assert.equal((await f.db.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname=$1 AND tablename='_visionary_backfills'",f.schema)).length,0);
}));

test('an identity check released after the invocation deadline cannot open a migration transaction',()=>fixture(async f=>{
  const store=f.store(),gate=latch(),finished=latch();let opened=0,sourceEntered=false;
  const identity=store.runtimeIdentity.bind(store),transaction=store.migration.$transaction.bind(store.migration);
  store.runtimeIdentity=async(...args)=>{try{await gate.promise;return await identity(...args);}finally{finished.release();}};
  store.migration.$transaction=(...args)=>{opened++;return transaction(...args);};
  try{
    await assert.rejects(new BackfillRunner(store,{async next(){sourceEntered=true;return {rows:[],nextCursor:null,done:true};}},f.write).run({...options,maxDurationMs:200}),/BACKFILL_DEADLINE/);
  }finally{gate.release();}
  await observed(finished.promise);
  assert.equal(opened,0);assert.equal(sourceEntered,false);assert.equal((await f.rows()).length,0);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('a source released after cancellation cannot invoke the writer',()=>fixture(async f=>{
  const gate=latch(),entered=latch(),controller=new AbortController();let writes=0;
  const pending=new BackfillRunner(f.store(),{async next(){entered.release();await gate.promise;return {rows:[rows[0]],nextCursor:null,done:true};}},async(...args)=>{writes++;return f.write(...args);})
    .run({...options,maxDurationMs:5000,signal:controller.signal});
  const rejected=assert.rejects(pending,/BACKFILL_CANCELLED/);
  try{await observed(entered.promise);controller.abort();await rejected;}finally{controller.abort();gate.release();}
  assert.equal((await f.rows()).length,0);assert.equal(writes,0);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('a writer released after cancellation cannot submit its late SQL',()=>fixture(async f=>{
  const entered=latch(),gate=latch(),finished=latch(),controller=new AbortController();let lateError;
  const pending=new BackfillRunner(f.store(),source([rows[0]]),async(tx,row)=>{
    entered.release();await gate.promise;
    try{await f.write(tx,row);}catch(error){lateError=error;}finally{finished.release();}
  }).run({...options,maxDurationMs:5000,signal:controller.signal});
  const rejected=assert.rejects(pending,/BACKFILL_CANCELLED/);
  try{await observed(entered.promise);controller.abort();await rejected;}finally{controller.abort();gate.release();}
  await observed(finished.promise);
  assert.match(String(lateError),/BACKFILL_CANCELLED/);assert.equal((await f.rows()).length,0);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('cancellation while final privileges are suspended rolls back before commit admission',()=>fixture(async f=>{
  const store=f.store(),entered=latch(),gate=latch(),finished=latch(),controller=new AbortController();let calls=0;
  const privileges=store.runtimePrivileges.bind(store),transaction=store.transaction.bind(store);
  store.runtimePrivileges=async(...args)=>{if(++calls===2){entered.release();await gate.promise;}return privileges(...args);};
  store.transaction=async(...args)=>{try{return await transaction(...args);}finally{finished.release();}};
  const pending=new BackfillRunner(store,source([rows[0]]),f.write).run({...options,maxDurationMs:5000,signal:controller.signal});
  const rejected=assert.rejects(pending,/BACKFILL_CANCELLED/);
  try{await observed(entered.promise);controller.abort();await rejected;}finally{controller.abort();gate.release();}
  await observed(finished.promise);assert.equal((await f.rows()).length,0);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('cancellation after durable commit but before acknowledgement reports uncertainty and cold reconciles',()=>fixture(async f=>{
  const store=f.store(),committed=latch(),gate=latch(),finished=latch(),controller=new AbortController();
  const transaction=store.transaction.bind(store);
  store.transaction=async(...args)=>{try{const result=await transaction(...args);committed.release();await gate.promise;return result;}finally{finished.release();}};
  const pending=new BackfillRunner(store,source([rows[0]]),f.write).run({...options,maxDurationMs:5000,signal:controller.signal});
  const rejected=observed(assert.rejects(pending,/BACKFILL_CANCELLED_COMMIT_UNKNOWN/));
  try{await observed(committed.promise);controller.abort();await rejected;}finally{controller.abort();gate.release();}
  await observed(finished.promise);assert.equal((await f.rows()).length,1);
  const recovered=await new BackfillRunner(f.store(),source([rows[0]]),f.write).run(options);
  assert.equal(recovered.done,true);assert.equal(recovered.processed,1);assert.equal(recovered.batches,0);
  assert.equal((await f.rows()).length,1);
}));

test('long SQL work terminates at its SQL or transaction budget and rolls back the batch',()=>fixture(async f=>{
  const store=f.store(),finished=latch();let sqlFailure;
  const transaction=store.transaction.bind(store);
  store.transaction=async(...args)=>{try{return await transaction(...args);}finally{finished.release();}};
  await assert.rejects(new BackfillRunner(store,source([rows[0]]),async tx=>{
    try{await tx.$executeRawUnsafe('SELECT pg_sleep(3)');}catch(error){sqlFailure=error;throw error;}
  }).run({...options,maxDurationMs:2000}),/BACKFILL_DEADLINE/);
  await observed(finished.promise);
  assert.match(String(sqlFailure),/BACKFILL_DEADLINE_(SQL|TRANSACTION)/);
  assert.equal((await f.rows()).length,0);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));

test('an explicit server statement timeout retains its precise deadline classification',()=>fixture(async f=>{
  const store=f.store();let sqlFailure;
  await store.transaction(async()=>{},10000,{remainingMs:()=>10000,assertActive(){}});
  await assert.rejects(new BackfillRunner(store,source([rows[0]]),async tx=>{
    await tx.$queryRawUnsafe("SELECT set_config('statement_timeout','50',true)");
    try{await tx.$executeRawUnsafe('SELECT pg_sleep(0.2)');}catch(error){sqlFailure=error;throw error;}
  }).run(options),/BACKFILL_DEADLINE_SQL/);
  assert.match(String(sqlFailure),/BACKFILL_DEADLINE_SQL/);
  assert.equal((await f.rows()).length,0);
  const checkpoint=await f.db.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname=$1 AND tablename='_visionary_backfills'",f.schema);
  assert.equal(checkpoint.length,0);
  assert.equal((await new BackfillRunner(f.store(),source(rows),f.write).run(options)).processed,5);
}));
