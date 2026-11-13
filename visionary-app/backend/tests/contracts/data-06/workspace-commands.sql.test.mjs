import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fixture from '../data-02/postgres-fixture.cjs';
const {req,backend,stagingDatabase}=fixture;
const {MigrationRunner}=req('./dist/src/data/migration-runner.js');
const {canonicalMigrations}=req('./dist/src/data/migration-registry.js');
const {WorkspaceMetadataCommands}=req('./dist/src/commands/workspace-metadata.commands.js');
const {PrismaClient}=req('@prisma/client');
let f,second,target,commands,otherConnection;
before(async()=>{
  f=await stagingDatabase();
  await new MigrationRunner(f.store(),canonicalMigrations(backend)).applyAll();
  await f.grantRuntime();
  target={role:f.runtimeRole,schema:f.schema,database:new URL(f.config.runtimeUrl).pathname.slice(1)};
  second=new PrismaClient({datasources:{db:{url:f.config.runtimeUrl}}});
  commands=new WorkspaceMetadataCommands(f.runtime,target);
  otherConnection=new WorkspaceMetadataCommands(second,target);
});
after(async()=>{if(second)await second.$disconnect();if(f)await f.close();});
async function workspace(owner){
  const uid=owner??'owner_'+randomUUID();
  await f.db.person.upsert({where:{uid},create:{uid},update:{}});
  const row=await f.db.workspace.create({data:{uid,name:'Before',slug:randomUUID()}});
  return {uid,id:row.id};
}
const input=(w,overrides={})=>({commandId:randomUUID(),workspaceId:w.id,operation:'workspace.metadata.rename',expectedRevision:0,value:'After',...overrides});
async function counts(w){return {
  receipt:await f.db.commandResult.count({where:{workspaceId:w.id}}),
  audit:await f.db.auditEvent.count({where:{workspaceId:w.id}}),
  outbox:await f.db.outboxEvent.count({where:{workspaceId:w.id}}),
};}

test('real metadata writer commits one canonical receipt/audit/outbox with trusted SQL timestamps',async()=>{
  const w=await workspace(),c=input(w),started=Date.now();
  const result=await commands.execute(w.uid,c);
  assert.equal(result.result.name,'After');assert.equal(result.revision,1);assert.equal(result.replayed,false);
  assert.equal((await f.db.workspace.findUnique({where:{id:w.id}})).name,'After');
  assert.deepEqual(await counts(w),{receipt:1,audit:1,outbox:1});
  const stored=await f.db.commandResult.findUnique({where:{commandId:c.commandId}});
  assert.ok(stored.attemptedAt.getTime()>=started-1000);assert.ok(stored.committedAt>=stored.attemptedAt);
  assert.equal(stored.status,'COMMITTED');
  const event=await f.db.outboxEvent.findFirst({where:{workspaceId:w.id}});
  assert.equal(event.status,'PENDING');assert.equal(event.dispatchedAt,null);
  assert.equal(JSON.stringify(event.payload).includes('After'),false);
});

test('same key cannot replay a different workspace, operation, expected revision or value',async()=>{
  const w=await workspace(),other=await workspace(w.uid),c=input(w);
  await commands.execute(w.uid,c);
  for(const change of [{workspaceId:other.id},{operation:'workspace.metadata.describe'},{expectedRevision:1},{value:'Changed'}]) {
    await assert.rejects(commands.execute(w.uid,{...c,...change}),{code:'conflict'});
  }
  const replay=await otherConnection.execute(w.uid,c);
  assert.equal(replay.replayed,true);assert.equal(replay.revision,1);
  assert.deepEqual(await counts(w),{receipt:1,audit:1,outbox:1});
  assert.equal((await f.db.workspace.findUnique({where:{id:other.id}})).name,'Before');
});

test('independent connections admit one of two commands with the same expected revision',async()=>{
  const w=await workspace(),a=input(w,{value:'Winner A'}),b=input(w,{value:'Winner B'});
  const results=await Promise.allSettled([commands.execute(w.uid,a),otherConnection.execute(w.uid,b)]);
  const accepted=results.filter(r=>r.status==='fulfilled'),denied=results.filter(r=>r.status==='rejected');
  assert.equal(accepted.length,1);assert.equal(denied.length,1);assert.equal(denied[0].reason.code,'stale_revision');
  assert.equal(accepted[0].value.revision,1);
  assert.equal((await f.db.workspace.findUnique({where:{id:w.id}})).name,accepted[0].value.result.name);
  assert.deepEqual(await counts(w),{receipt:1,audit:1,outbox:1});
});

test('simultaneous retries converge durably and a cold client recovers a lost acknowledgement',async()=>{
  const w=await workspace(),c=input(w);
  const results=await Promise.all([commands.execute(w.uid,c),otherConnection.execute(w.uid,c)]);
  assert.deepEqual(results.map(r=>r.replayed).sort(),[false,true]);
  const cold=new PrismaClient({datasources:{db:{url:f.config.runtimeUrl}}});
  try{assert.equal((await new WorkspaceMetadataCommands(cold,target).execute(w.uid,c)).replayed,true);}finally{await cold.$disconnect();}
  assert.deepEqual(await counts(w),{receipt:1,audit:1,outbox:1});
});

test('metadata revision spans its operations and stays scoped to the actual workspace',async()=>{
  const w=await workspace(),other=await workspace(w.uid);
  await commands.execute(w.uid,input(w));
  const next=await commands.execute(w.uid,input(w,{operation:'workspace.metadata.describe',value:'Description',expectedRevision:1}));
  assert.equal(next.revision,2);assert.equal(next.result.description,'Description');
  assert.equal((await commands.execute(w.uid,input(other))).revision,1);
});

test('resource revision survives owner transfer and erasure of the original actor receipts',async()=>{
  const w=await workspace(),nextOwner=await workspace(),c=input(w);
  await commands.execute(w.uid,c);
  await f.db.workspace.update({where:{id:w.id},data:{uid:nextOwner.uid}});
  await assert.rejects(otherConnection.execute(nextOwner.uid,input(w)),{code:'stale_revision'});
  await f.db.person.delete({where:{uid:w.uid}});
  assert.equal(await f.db.commandResult.count({where:{workspaceId:w.id}}),0);
  assert.equal((await f.db.workspaceCommandRevision.findUnique({where:{workspaceId:w.id}})).revision,1);
  await assert.rejects(otherConnection.execute(nextOwner.uid,input(w)),{code:'stale_revision'});
  const next=await otherConnection.execute(nextOwner.uid,input(w,{expectedRevision:1}));
  assert.equal(next.revision,2);
  assert.equal((await f.db.workspaceCommandRevision.findUnique({where:{workspaceId:w.id}})).revision,2);
  await assert.rejects(f.db.workspaceCommandRevision.update({where:{workspaceId:w.id},data:{revision:-1}}));
});

test('workspace erasure marker follows the resource across ownership changes',async()=>{
  const w=await workspace(),nextOwner=await workspace();
  await f.db.deletionTombstone.create({data:{uid:w.uid,resourceType:'workspace',resourceId:w.id,expiresAt:new Date(0)}});
  await f.db.workspace.update({where:{id:w.id},data:{uid:nextOwner.uid}});
  await assert.rejects(commands.execute(nextOwner.uid,input(w)),{code:'unauthorized'});
  assert.equal((await f.db.workspace.findUnique({where:{id:w.id}})).name,'Before');
  assert.deepEqual(await counts(w),{receipt:0,audit:0,outbox:0});
  assert.equal(await f.db.workspaceCommandRevision.findUnique({where:{workspaceId:w.id}}),null);
});

test('wrong owner and forged OWNER membership cannot mutate or recover another account receipt',async()=>{
  const w=await workspace(),foreign=await workspace();
  await f.db.workspaceMembership.create({data:{uid:foreign.uid,workspaceId:w.id,role:'OWNER',source:'synthetic-forgery'}});
  const c=input(w);await commands.execute(w.uid,c);
  await assert.rejects(commands.execute(foreign.uid,c),{code:'unauthorized'});
  await assert.rejects(commands.execute(foreign.uid,input(w)),{code:'unauthorized'});
  assert.deepEqual(await counts(w),{receipt:1,audit:1,outbox:1});
});

test('replay rechecks current ownership and permanently retained tombstones',async()=>{
  const w=await workspace(),foreign=await workspace(),c=input(w);
  await commands.execute(w.uid,c);
  await f.db.workspace.update({where:{id:w.id},data:{uid:foreign.uid}});
  await assert.rejects(commands.execute(w.uid,c),{code:'unauthorized'});
  const blocked=await workspace(),saved=input(blocked);await commands.execute(blocked.uid,saved);
  await f.db.deletionTombstone.create({data:{uid:blocked.uid,resourceType:'workspace',resourceId:blocked.id,expiresAt:new Date(0)}});
  await assert.rejects(commands.execute(blocked.uid,saved),{code:'unauthorized'});
  await assert.rejects(commands.execute(blocked.uid,input(blocked,{expectedRevision:1})),{code:'unauthorized'});
  assert.deepEqual(await counts(blocked),{receipt:1,audit:1,outbox:1});
});

test('outbox outage rolls back the real metadata and audit writes, then retry commits once',async()=>{
  const w=await workspace(),c=input(w);
  const faulty=new Proxy(f.runtime,{get(db,key){
    if(key==='$transaction')return (work,options)=>db.$transaction(tx=>work(new Proxy(tx,{get(store,field){
      if(field==='outboxEvent')return {create:async()=>{throw Error('synthetic outbox outage with private details');}};
      const value=Reflect.get(store,field);return typeof value==='function'?value.bind(store):value;
    }})),options);
    const value=Reflect.get(db,key);return typeof value==='function'?value.bind(db):value;
  }});
  await assert.rejects(new WorkspaceMetadataCommands(faulty,target).execute(w.uid,c),e=>e.code==='unavailable' && !e.message.includes('private'));
  assert.equal((await f.db.workspace.findUnique({where:{id:w.id}})).name,'Before');
  assert.deepEqual(await counts(w),{receipt:0,audit:0,outbox:0});
  assert.equal(await f.db.workspaceCommandRevision.findUnique({where:{workspaceId:w.id}}),null);
  assert.equal((await commands.execute(w.uid,c)).revision,1);
  assert.deepEqual(await counts(w),{receipt:1,audit:1,outbox:1});
});

test('invalid commands and forged timestamps produce no owning-store writes',async()=>{
  const w=await workspace(),c=input(w);
  for(const change of [{expectedRevision:-1},{expectedRevision:NaN},{expectedRevision:0.5},{expectedRevision:2147483647},{operation:'delete.anything'},{value:''},{committedAt:'2000-01-01'}]) {
    await assert.rejects(commands.execute(w.uid,{...c,...change}),{code:'invalid_command'});
  }
  assert.deepEqual(await counts(w),{receipt:0,audit:0,outbox:0});
});

test('actual runtime target mismatch and privileged adapters fail before mutation',async()=>{
  const w=await workspace(),c=input(w);
  await assert.rejects(new WorkspaceMetadataCommands(f.runtime,{...target,database:'wrong_database'}).execute(w.uid,c),{code:'unavailable'});
  await assert.rejects(new WorkspaceMetadataCommands(f.db,{...target,role:f.migrationRole}).execute(w.uid,c),{code:'unavailable'});
  assert.deepEqual(await counts(w),{receipt:0,audit:0,outbox:0});
});
