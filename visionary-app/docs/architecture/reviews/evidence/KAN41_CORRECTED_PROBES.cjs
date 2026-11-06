// Independent exact-source SQL review. Synthetic loopback records only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createRequire,Module}=require('node:module');
const {randomUUID,randomBytes}=require('node:crypto');
const source='4e634634783eafc08cf91757b138e64c00d0d4dd';
const appRoot=path.resolve(__dirname,'../../../..');
const backend=process.env.KAN41_REVIEW_BACKEND;
assert.ok(backend&&path.isAbsolute(backend));
const req=createRequire(path.join(backend,'package.json'));
const ts=req('typescript'),{PrismaClient}=req('@prisma/client');
const git=file=>execFileSync('git',['-C',appRoot,'show',`${source}:visionary-app/${file}`,'--'],{encoding:'utf8'});
const lock=JSON.parse(git('backend/upstream/backend/package-lock.json'));
const installed=JSON.parse(fs.readFileSync(path.join(backend,'node_modules/.package-lock.json')));
let verified=0;
for(const [key,value] of Object.entries(lock.packages)){
 if(!key||value.link)continue;
 if(value.optional&&((value.os&&!value.os.includes(process.platform))||(value.cpu&&!value.cpu.includes(process.arch))))continue;
 assert.equal(installed.packages[key]?.version,value.version,`Dependency ${key}`);
 if(value.integrity)assert.equal(installed.packages[key]?.integrity,value.integrity,`Integrity ${key}`);
 assert.ok(fs.existsSync(path.join(backend,key,'package.json')));verified++;
}
const normalized=s=>s.replace(/\/\/[^\n]*/g,'').replace(/\s+/g,'');
assert.equal(normalized(fs.readFileSync(path.join(backend,'node_modules/.prisma/client/schema.prisma'),'utf8')),normalized(git('backend/upstream/backend/prisma/schema.prisma')));
const modules=new Map();
function exact(file){
 if(modules.has(file))return modules.get(file).exports;
 const filename=path.join(backend,file),mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));modules.set(file,mod);
 mod.require=id=>id.startsWith('.')?exact(path.posix.normalize(path.posix.join(path.posix.dirname(file),id))+'.ts'):req(id);
 mod._compile(ts.transpileModule(git('backend/upstream/backend/'+file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
 return mod.exports;
}
const {WorkspaceMetadataCommands}=exact('src/commands/workspace-metadata.commands.ts');
const {MigrationRunner}=exact('src/data/migration-runner.ts');
const {PostgresMigrationStore}=exact('src/data/migration-store.ts');
const {canonicalMigrations,registerMigration,splitSql}=exact('src/data/migration-registry.ts');
const cfg=JSON.parse(fs.readFileSync(process.env.KAN41_REVIEW_TARGET,'utf8')),base=new URL(cfg.url);
assert.equal(cfg.syntheticOnly,true);assert.equal(Number(base.port),55437);
assert.ok(['localhost','127.0.0.1','[::1]'].includes(base.hostname));assert.match(base.pathname,/^\/visionary_data_test(?:_|$)/);
const connect=url=>new PrismaClient({datasources:{db:{url:String(url)}}});
const admin=connect(base),suffix=randomUUID().replaceAll('-',''),schema='qa41_'+suffix,migrationRole='qa41m_'+suffix,runtimeRole='qa41r_'+suffix,password=randomBytes(24).toString('hex');
let migration,db,runtime,secondary;
const output=extra=>console.log(JSON.stringify({source,...extra}));
(async()=>{try{
 await admin.$executeRawUnsafe(`CREATE ROLE "${migrationRole}" LOGIN PASSWORD '${password}'`);
 await admin.$executeRawUnsafe(`CREATE ROLE "${runtimeRole}" LOGIN PASSWORD '${password}'`);
 await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}" AUTHORIZATION "${migrationRole}"`);
 await admin.$executeRawUnsafe(`REVOKE ALL ON SCHEMA "${schema}" FROM PUBLIC`);
 await admin.$executeRawUnsafe(`GRANT USAGE ON SCHEMA "${schema}" TO "${runtimeRole}"`);
 const url=role=>{const u=new URL(base);u.username=role;u.password=password;u.searchParams.set('schema',schema);u.searchParams.set('connection_limit','3');return String(u);};
 const config={migrationRole,runtimeRole,schema,migrationUrl:url(migrationRole),runtimeUrl:url(runtimeRole)};
 migration=new PostgresMigrationStore(config);db=connect(config.migrationUrl);runtime=connect(config.runtimeUrl);
 const names=['20261024000001_data_01_workspaces','20261102000002_data_04_invitation_reissue','20261103000003_data_04_institution_approval','20261106000004_file_03_downloads','20261106000005_data_06_command_revision'];
 for(const name of names.slice(0,4)){
  const file='backend/upstream/backend/prisma/migrations/'+name+'/migration.sql';
  const accepted=execFileSync('git',['-C',appRoot,'show','e12de19c5af5a623a1cd3743fbba16d745ef5188:visionary-app/'+file,'--'],{encoding:'utf8'});
  assert.equal(git(file),accepted,'Accepted migration bytes must remain unchanged: '+name);
 }
 const registry=names.map((name,i)=>registerMigration({version:i+1,name:'qa41-version-'+(i+1),requires:i?[i]:[],statements:splitSql(git('backend/upstream/backend/prisma/migrations/'+name+'/migration.sql')),reversible:false}));
 await new MigrationRunner(migration,registry.slice(0,4)).applyAll();
 const history=await db.$queryRawUnsafe('SELECT * FROM "_visionary_migrations" ORDER BY version');
 const upgrade=await new MigrationRunner(migration,registry).applyAll();
 assert.equal(upgrade.applied,1);assert.equal(upgrade.skipped,4);
 assert.deepEqual(await db.$queryRawUnsafe('SELECT * FROM "_visionary_migrations" WHERE version<5 ORDER BY version'),history);
 assert.equal((await new MigrationRunner(migration,registry).verify()).consistent,true);
 output({probe:'additive_empty_staging_upgrade',acceptedMigrationsUnchanged:4,previousReceiptsUnchanged:4,applied:1,skipped:4});
 await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "${schema}" TO "${runtimeRole}"`);
 await admin.$executeRawUnsafe(`REVOKE ALL ON "${schema}"."_visionary_migrations" FROM "${runtimeRole}"`);
 const sequences=await admin.$queryRawUnsafe("SELECT sequencename FROM pg_sequences WHERE schemaname=$1 AND left(sequencename,11)<>'_visionary_'",schema);
 for(const s of sequences)await admin.$executeRawUnsafe(`GRANT USAGE,SELECT ON SEQUENCE "${schema}"."${s.sequencename}" TO "${runtimeRole}"`);
 const commands=new WorkspaceMetadataCommands(runtime,{role:runtimeRole,schema,database:base.pathname.slice(1)});
 const input=(id,value,expectedRevision)=>({commandId:randomUUID(),workspaceId:id,operation:'workspace.metadata.rename',expectedRevision,value});
 for(const erase of [false,true]){
  const owner='qa41_owner_'+randomUUID(),next='qa41_next_'+randomUUID();
  await db.person.createMany({data:[{uid:owner},{uid:next}]});
  const workspace=await db.workspace.create({data:{uid:owner,name:'Initial',slug:randomUUID()}});
  const first=input(workspace.id,'Owner A revision one',0);
  assert.equal((await commands.execute(owner,first)).revision,1);
  assert.equal((await commands.execute(owner,first)).replayed,true);
  await db.workspace.update({where:{id:workspace.id},data:{uid:next}});
  await assert.rejects(commands.execute(owner,first),{code:'unauthorized'});
  if(erase)await db.person.delete({where:{uid:owner}});
  await assert.rejects(commands.execute(next,input(workspace.id,'Stale zero must be denied',0)),{code:'stale_revision'});
  const second=await commands.execute(next,input(workspace.id,'Current revision two',1));
  assert.equal(second.revision,2);assert.equal(second.replayed,false);
  assert.equal((await db.workspace.findUnique({where:{id:workspace.id}})).name,'Current revision two');
  assert.equal((await db.workspaceCommandRevision.findUnique({where:{workspaceId:workspace.id}})).revision,2);
  await assert.rejects(db.$executeRawUnsafe('UPDATE workspace_command_revisions SET revision=-1 WHERE "workspaceId"=$1',workspace.id));
  assert.equal((await db.workspaceCommandRevision.findUnique({where:{workspaceId:workspace.id}})).revision,2);
  output({probe:erase?'revision_survives_previous_owner_erasure':'revision_survives_owner_transfer',previousRevision:1,staleZeroDenied:true,newRevision:second.revision,nativeNonnegativeCheck:true});
 }
 output({probe:'dependency_and_model_verification',dependencyRecords:verified,generatedModelMatched:true});
 const erasedOwner='qa41_erased_'+randomUUID(),newOwner='qa41_adopter_'+randomUUID();
 await db.person.createMany({data:[{uid:erasedOwner},{uid:newOwner}]});
 const erased=await db.workspace.create({data:{uid:erasedOwner,name:'Retained erased workspace',slug:randomUUID()}});
 await db.deletionTombstone.create({data:{uid:erasedOwner,resourceType:'workspace',resourceId:erased.id,expiresAt:new Date(0)}});
 await assert.rejects(commands.execute(erasedOwner,input(erased.id,'Should remain blocked',0)),{code:'unauthorized'});
 await db.workspace.update({where:{id:erased.id},data:{uid:newOwner}});
 await assert.rejects(commands.execute(newOwner,input(erased.id,'Erased workspace must remain denied',0)),{code:'unauthorized'});
 assert.equal(await db.deletionTombstone.count({where:{resourceType:'workspace',resourceId:erased.id}}),1);
 output({probe:'workspace_tombstone_survives_owner_transfer',retainedMarker:true,newOwnerWriteDenied:true});
 const actor='qa41_atomic_'+randomUUID();await db.person.create({data:{uid:actor}});
 const atomic=await db.workspace.create({data:{uid:actor,name:'Initial atomic',slug:randomUUID()}}),first=input(atomic.id,'Committed atomic',0);
 const faulty=new Proxy(runtime,{get(client,key){
  if(key==='$transaction')return (work,options)=>client.$transaction(tx=>work(new Proxy(tx,{get(store,field){
   if(field==='outboxEvent')return {create:async()=>{throw Error('synthetic private failure');}};
   const value=Reflect.get(store,field);return typeof value==='function'?value.bind(store):value;
  }})),options);
  const value=Reflect.get(client,key);return typeof value==='function'?value.bind(client):value;
 }});
 const target={role:runtimeRole,schema,database:base.pathname.slice(1)};
 await assert.rejects(new WorkspaceMetadataCommands(faulty,target).execute(actor,first),e=>e.code==='unavailable'&&!e.message.includes('private'));
 assert.equal((await db.workspace.findUnique({where:{id:atomic.id}})).name,'Initial atomic');
 assert.equal(await db.workspaceCommandRevision.findUnique({where:{workspaceId:atomic.id}}),null);
 for(const model of ['commandResult','auditEvent','outboxEvent'])assert.equal(await db[model].count({where:{workspaceId:atomic.id}}),0);
 assert.equal((await commands.execute(actor,first)).revision,1);
 secondary=connect(url(runtimeRole));const independent=new WorkspaceMetadataCommands(secondary,target);
 const outcomes=await Promise.allSettled([commands.execute(actor,input(atomic.id,'Concurrent one',1)),independent.execute(actor,input(atomic.id,'Concurrent two',1))]);
 const accepted=outcomes.filter(r=>r.status==='fulfilled'),denied=outcomes.filter(r=>r.status==='rejected');
 assert.equal(accepted.length,1);assert.equal(denied.length,1);assert.equal(denied[0].reason.code,'stale_revision');
 assert.equal(accepted[0].value.revision,2);assert.equal((await db.workspace.findUnique({where:{id:atomic.id}})).name,accepted[0].value.result.name);
 assert.equal((await independent.execute(actor,first)).replayed,true);
 for(const model of ['commandResult','auditEvent','outboxEvent'])assert.equal(await db[model].count({where:{workspaceId:atomic.id}}),2);
 assert.equal((await db.workspaceCommandRevision.findUnique({where:{workspaceId:atomic.id}})).revision,2);
 output({probe:'real_writer_counter_receipt_audit_outbox_atomicity_and_concurrency',outageRolledBackAll:true,independentConnectionsAdmitOne:true,coldReplayRecovered:true,revision:2});
}finally{
 if(migration)await migration.close();if(db)await db.$disconnect();if(runtime)await runtime.$disconnect();if(secondary)await secondary.$disconnect();
 assert.match(schema,/^qa41_[a-f0-9]{32}$/);
 await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
 await admin.$executeRawUnsafe(`DROP ROLE IF EXISTS "${migrationRole}"`);
 await admin.$executeRawUnsafe(`DROP ROLE IF EXISTS "${runtimeRole}"`);
 await admin.$disconnect();
}})().catch(error=>{console.error(error.name+': '+error.message);process.exitCode=1;});
