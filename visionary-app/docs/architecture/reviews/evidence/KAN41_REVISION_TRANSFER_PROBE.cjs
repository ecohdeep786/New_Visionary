// Independent exact-source SQL review. Synthetic loopback records only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createRequire,Module}=require('node:module');
const {randomUUID,randomBytes}=require('node:crypto');
const source='a757c65ccec6a5a39ed8af1c6ab952f878fbb358';
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
let migration,db,runtime;
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
 const names=['20261024000001_data_01_workspaces','20261102000002_data_04_invitation_reissue','20261103000003_data_04_institution_approval','20261106000004_file_03_downloads'];
 const registry=names.map((name,i)=>registerMigration({version:i+1,name:'qa41-version-'+(i+1),requires:i?[i]:[],statements:splitSql(git('backend/upstream/backend/prisma/migrations/'+name+'/migration.sql')),reversible:false}));
 await new MigrationRunner(migration,registry).applyAll();
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
  const second=await commands.execute(next,input(workspace.id,'Stale zero was accepted',0));
  assert.equal(second.revision,1);assert.equal(second.replayed,false);
  assert.equal((await db.workspace.findUnique({where:{id:workspace.id}})).name,'Stale zero was accepted');
  output({probe:erase?'revision_reset_after_previous_owner_erasure':'revision_reset_after_owner_transfer',previousRevision:1,acceptedExpectedRevision:0,newRevision:second.revision,staleWriteCommitted:true});
 }
 output({probe:'dependency_and_model_verification',dependencyRecords:verified,generatedModelMatched:true});
 const erasedOwner='qa41_erased_'+randomUUID(),newOwner='qa41_adopter_'+randomUUID();
 await db.person.createMany({data:[{uid:erasedOwner},{uid:newOwner}]});
 const erased=await db.workspace.create({data:{uid:erasedOwner,name:'Retained erased workspace',slug:randomUUID()}});
 await db.deletionTombstone.create({data:{uid:erasedOwner,resourceType:'workspace',resourceId:erased.id,expiresAt:new Date(0)}});
 await assert.rejects(commands.execute(erasedOwner,input(erased.id,'Should remain blocked',0)),{code:'unauthorized'});
 await db.workspace.update({where:{id:erased.id},data:{uid:newOwner}});
 const revived=await commands.execute(newOwner,input(erased.id,'Erased workspace was writable',0));
 assert.equal(revived.revision,1);
 assert.equal(await db.deletionTombstone.count({where:{resourceType:'workspace',resourceId:erased.id}}),1);
 output({probe:'workspace_tombstone_bypassed_by_owner_transfer',retainedMarker:true,newOwnerWriteCommitted:true});
}finally{
 if(migration)await migration.close();if(db)await db.$disconnect();if(runtime)await runtime.$disconnect();
 assert.match(schema,/^qa41_[a-f0-9]{32}$/);
 await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
 await admin.$executeRawUnsafe(`DROP ROLE IF EXISTS "${migrationRole}"`);
 await admin.$executeRawUnsafe(`DROP ROLE IF EXISTS "${runtimeRole}"`);
 await admin.$disconnect();
}})().catch(error=>{console.error(error.name+': '+error.message);process.exitCode=1;});
