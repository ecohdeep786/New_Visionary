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
    async transaction(work,timeout){await super.transaction(work,timeout);throw Error('synthetic lost batch acknowledgement');}
  }
  const uncertain=new LostAcknowledgementStore(f.config);
  try{await assert.rejects(new BackfillRunner(uncertain,source(rows),f.write).run(options),/lost batch/);}finally{await uncertain.close();}
  const result=await new BackfillRunner(f.store(),source(rows),f.write).run(options);
  assert.equal(result.done,true);assert.equal(result.processed,5);assert.equal(result.batches,0);assert.equal((await f.rows()).length,5);
}));
