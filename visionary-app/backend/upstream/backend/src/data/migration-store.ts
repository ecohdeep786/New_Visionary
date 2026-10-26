import { PrismaClient, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { assertSeparateIdentities, quoteIdentifier, IdentityConfig } from './migration-identities';
import type { MigrationReceipt } from './migration-types';
export type DataTransaction=Prisma.TransactionClient;
/** Real PostgreSQL adapter. No labels or Map can substitute for database identity. */
export class PostgresMigrationStore {
  readonly migration:PrismaClient; readonly runtime:PrismaClient;
  readonly config:Readonly<IdentityConfig>;
  constructor(config:IdentityConfig){
    assertSeparateIdentities(config);
    this.config=Object.freeze({...config,cloudSql:config.cloudSql?Object.freeze({...config.cloudSql}):undefined});
    this.migration=new PrismaClient({datasources:{db:{url:config.migrationUrl}}});
    this.runtime=new PrismaClient({datasources:{db:{url:config.runtimeUrl}}});
  }
  async close(){await Promise.all([this.migration.$disconnect(),this.runtime.$disconnect()]);}
  private async runtimeIdentity():Promise<void>{
    const [identity]=await this.runtime.$queryRawUnsafe<{role:string}[]>('SELECT current_user AS role');
    if(identity?.role!==this.config.runtimeRole)throw Error('RUNTIME_IDENTITY_DENIED');
    await this.runtimePrivileges(this.runtime);
  }
  private async runtimePrivileges(query:Pick<DataTransaction,'$queryRawUnsafe'>):Promise<void>{
    const rows=await query.$queryRawUnsafe<any[]>(`SELECT r.rolname AS role,r.rolsuper,r.rolcreatedb,r.rolcreaterole,r.rolbypassrls,
      has_schema_privilege(r.oid,$1,'CREATE') AS ddl,pg_has_role(r.oid,$2,'MEMBER') AS migration_member
      ,has_database_privilege(r.oid,current_database(),'CREATE') AS database_ddl
      ,EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname=$1 AND pg_has_role(r.oid,c.relowner,'MEMBER')) AS owns_objects
      ,EXISTS(SELECT 1 FROM pg_roles delegated WHERE pg_has_role(r.oid,delegated.oid,'MEMBER')
        AND (delegated.rolsuper OR delegated.rolcreatedb OR delegated.rolcreaterole OR delegated.rolbypassrls
          OR has_schema_privilege(delegated.oid,$1,'CREATE')
          OR has_database_privilege(delegated.oid,current_database(),'CREATE'))) AS delegated_authority
      ,EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname=$1 AND left(c.relname,11)='_visionary_' AND EXISTS(
          SELECT 1 FROM pg_roles delegated WHERE pg_has_role(r.oid,delegated.oid,'MEMBER') AND CASE
            WHEN c.relkind IN ('r','p') THEN has_table_privilege(delegated.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
            WHEN c.relkind='S' THEN has_sequence_privilege(delegated.oid,c.oid,'USAGE,UPDATE') ELSE FALSE END)) AS control_writes
      FROM pg_roles r WHERE r.rolname=$3`,this.config.schema,this.config.migrationRole,this.config.runtimeRole);
    const r=rows[0];
    if(!r||r.role!==this.config.runtimeRole||r.rolsuper||r.rolcreatedb||r.rolcreaterole||r.rolbypassrls||r.ddl||r.database_ddl||r.migration_member||r.owns_objects||r.delegated_authority)
      throw Error('RUNTIME_IDENTITY_DENIED');
    if(r.control_writes)throw Error('RUNTIME_CONTROL_WRITE_DENIED');
  }
  async transaction<T>(work:(tx:DataTransaction)=>Promise<T>,timeout=15000):Promise<T>{
    await this.runtimeIdentity();
    return this.migration.$transaction(async tx=>{
      const rows=await tx.$queryRawUnsafe<any[]>(`SELECT current_user AS role,r.rolsuper,r.rolcreatedb,r.rolcreaterole,
        owner.rolname AS owner FROM pg_roles r JOIN pg_namespace n ON n.nspname=$1
        JOIN pg_roles owner ON owner.oid=n.nspowner WHERE r.rolname=current_user`,this.config.schema);
      const r=rows[0];
      if(!r||r.role!==this.config.migrationRole||r.owner!==r.role||r.rolsuper||r.rolcreatedb||r.rolcreaterole)
        throw Error('MIGRATION_IDENTITY_DENIED');
      await tx.$queryRawUnsafe("SELECT set_config('search_path',$1,true)",quoteIdentifier(this.config.schema));
      await tx.$queryRawUnsafe("SELECT set_config('statement_timeout',$1,true)",String(Math.max(1,timeout-1000)));
      await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended($1,0))::text",this.config.schema+':visionary-data');
      await tx.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "_visionary_migrations" (
        sequence BIGSERIAL PRIMARY KEY,version INTEGER NOT NULL,name TEXT NOT NULL,checksum TEXT NOT NULL,"schemaDigest" TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('applied','rolled_back')),"appliedBy" TEXT NOT NULL DEFAULT current_user,
        "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp())`);
      const result=await work(tx);
      // Check explicit runtime-role privileges inside this transaction: newly
      // created tables and their default grants are invisible to other sessions.
      await this.runtimePrivileges(tx);
      return result;
    },{maxWait:timeout,timeout});
  }
  async appliedReceipts(tx:DataTransaction):Promise<MigrationReceipt[]>{
    const rows=await tx.$queryRawUnsafe<any[]>(`SELECT DISTINCT ON(version) version,name,checksum,"schemaDigest",status,"appliedBy","appliedAt"
      FROM "_visionary_migrations" ORDER BY version,sequence DESC`);
    return rows.filter(r=>r.status==='applied').map(r=>({...r,appliedAt:r.appliedAt.toISOString()}));
  }
  async history(tx:DataTransaction):Promise<MigrationReceipt[]>{
    const rows=await tx.$queryRawUnsafe<any[]>(`SELECT version,name,checksum,"schemaDigest",status,"appliedBy","appliedAt" FROM "_visionary_migrations" ORDER BY sequence`);
    return rows.map(r=>({...r,appliedAt:r.appliedAt.toISOString()}));
  }
  async recordReceipt(tx:DataTransaction,m:{version:number;name:string;checksum:string},status:'applied'|'rolled_back'):Promise<void>{
    await tx.$executeRawUnsafe(`INSERT INTO "_visionary_migrations" (version,name,checksum,status,"schemaDigest") VALUES($1,$2,$3,$4,$5)`,m.version,m.name,m.checksum,status,await this.schemaDigest(tx));
  }
  async schemaDigest(tx:DataTransaction):Promise<string>{
    const columns=await tx.$queryRawUnsafe<any[]>(`SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod) AS type,
      a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS default_expression FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
      LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
      WHERE n.nspname=$1 AND c.relkind='r' AND left(c.relname,11)<>'_visionary_' AND a.attnum>0 AND NOT a.attisdropped
      ORDER BY c.relname,a.attnum`,this.config.schema);
    const constraints=await tx.$queryRawUnsafe<any[]>(`SELECT c.relname,k.conname,pg_get_constraintdef(k.oid) AS definition
      FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname=$1 AND left(c.relname,11)<>'_visionary_' ORDER BY c.relname,k.conname`,this.config.schema);
    const indexes=await tx.$queryRawUnsafe<any[]>(`SELECT tablename,indexname,indexdef FROM pg_indexes
      WHERE schemaname=$1 AND left(tablename,11)<>'_visionary_' ORDER BY tablename,indexname`,this.config.schema);
    const enums=await tx.$queryRawUnsafe<any[]>(`SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
      JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=$1 ORDER BY t.typname,e.enumsortorder`,this.config.schema);
    return createHash('sha256').update(JSON.stringify({columns,constraints,indexes,enums})).digest('hex');
  }
  async isDomainEmpty(tx:DataTransaction):Promise<boolean>{
    const tables=await tx.$queryRawUnsafe<{tablename:string}[]>(`SELECT tablename FROM pg_tables WHERE schemaname=$1 AND left(tablename,11)<>'_visionary_'`,this.config.schema);
    for(const t of tables){
      const r=await tx.$queryRawUnsafe<any[]>(`SELECT EXISTS(SELECT 1 FROM ${quoteIdentifier(t.tablename)} LIMIT 1) AS present`);
      if(r[0].present)return false;
    }
    return true;
  }
}
