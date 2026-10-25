const {randomUUID}=require('node:crypto');
const {req,backend,testUrl,client}=require('../data-01/postgres-fixture.cjs');
const {PostgresMigrationStore}=req('./dist/src/data/migration-store.js');
async function stagingDatabase(){
  const base=testUrl(),admin=client(base),id=randomUUID().replaceAll('-',''),schema='data02_'+id;
  const migrationRole='data02m_'+id,runtimeRole='data02r_'+id;
  const password='synthetic-local-only';
  await admin.$executeRawUnsafe('CREATE ROLE "'+migrationRole+'" LOGIN PASSWORD '+ "'" +password+"'");
  await admin.$executeRawUnsafe('CREATE ROLE "'+runtimeRole+'" LOGIN PASSWORD '+ "'" +password+"'");
  await admin.$executeRawUnsafe('CREATE SCHEMA "'+schema+'" AUTHORIZATION "'+migrationRole+'"');
  await admin.$executeRawUnsafe('REVOKE ALL ON SCHEMA "'+schema+'" FROM PUBLIC');
  await admin.$executeRawUnsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+runtimeRole+'"');
  function url(role){const u=new URL(base);u.username=role;u.password=password;u.searchParams.set('schema',schema);u.searchParams.set('connection_limit','3');return String(u);}
  const config={migrationUrl:url(migrationRole),runtimeUrl:url(runtimeRole),migrationRole,runtimeRole,schema};
  const stores=[];function store(){const s=new PostgresMigrationStore(config);stores.push(s);return s;}
  const db=client(config.migrationUrl),runtime=client(config.runtimeUrl);
  return {admin,db,runtime,schema,migrationRole,runtimeRole,config,store,async grantRuntime(){
    await admin.$executeRawUnsafe('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA "'+schema+'" TO "'+runtimeRole+'"');
    const sequences=await admin.$queryRawUnsafe("SELECT sequencename FROM pg_sequences WHERE schemaname=$1 AND left(sequencename,11)<>'_visionary_'",schema);
    for(const sequence of sequences)await admin.$executeRawUnsafe('GRANT USAGE,SELECT ON SEQUENCE "'+schema+'"."'+sequence.sequencename+'" TO "'+runtimeRole+'"');
    // Migration/backfill receipts are not runtime-owned state.
    for(const name of ['_visionary_migrations','_visionary_backfills','_visionary_backfill_rows','_visionary_backfill_cursors'])
      await admin.$executeRawUnsafe('REVOKE ALL ON TABLE "'+schema+'"."'+name+'" FROM "'+runtimeRole+'"').catch(e=>{if(!String(e).includes('does not exist'))throw e;});
  },async close(){
    await Promise.all(stores.map(s=>s.close()));await db.$disconnect();await runtime.$disconnect();
    if(!/^data02_[a-f0-9]{32}$/.test(schema))throw Error('Cleanup boundary');
    await admin.$executeRawUnsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await admin.$executeRawUnsafe('DROP ROLE "'+migrationRole+'"');
    await admin.$executeRawUnsafe('DROP ROLE "'+runtimeRole+'"');
    await admin.$disconnect();
  }};
}
module.exports={stagingDatabase,req,backend};
