export interface CloudSqlTarget {
  environment:'staging'|'production';
  project:'visionary-research';
  region:'asia-south1';
  instance:string;
  database:string;
}
export interface IdentityConfig {
  migrationUrl:string; runtimeUrl:string; migrationRole:string; runtimeRole:string; schema:string;
  cloudSql?:CloudSqlTarget;
}
export function quoteIdentifier(value:string):string {
  // Quoted SQL roles include Cloud SQL IAM names. Quotes/control characters are
  // never accepted; schema/table identifiers use the same safe quoted form.
  if(!/^[a-zA-Z_][a-zA-Z0-9_.@-]{0,62}$/.test(value))throw Error('INVALID_DATABASE_IDENTIFIER');
  return '"'+value+'"';
}
export function assertSyntheticUrl(raw:string):URL {
  const u=new URL(raw);
  if(!['postgres:','postgresql:'].includes(u.protocol)||!['localhost','127.0.0.1','[::1]'].includes(u.hostname)
    ||!/^\/visionary_data_test(?:_|$)[a-zA-Z0-9_]*$/.test(u.pathname)
    ||[...u.searchParams.keys()].some(k=>!['schema','connection_limit','pool_timeout','connect_timeout'].includes(k))
    ||[...new Set(u.searchParams.keys())].some(k=>u.searchParams.getAll(k).length!==1))throw Error('SYNTHETIC_DATABASE_REQUIRED');
  return u;
}
export function assertCloudSqlUrl(raw:string,target:CloudSqlTarget):URL {
  const u=new URL(raw);
  if(!['staging','production'].includes(target.environment)||target.project!=='visionary-research'||target.region!=='asia-south1'
    ||!/^[-a-z][a-z0-9-]{0,61}[a-z0-9]$/.test(target.instance)||!/^[a-z][a-z0-9_]{0,62}$/.test(target.database))
    throw Error('CLOUD_SQL_TARGET_INVALID');
  const socket='/cloudsql/'+target.project+':'+target.region+':'+target.instance;
  if(Buffer.byteLength(socket+'/.s.PGSQL.5432','utf8')>107)throw Error('CLOUD_SQL_SOCKET_TOO_LONG');
  const allowed=new Set(['host','schema','connection_limit','pool_timeout','connect_timeout']);
  if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='localhost'||(u.port&&u.port!=='5432')||u.hash
    ||u.pathname!=='/'+target.database||u.searchParams.get('host')!==socket
    ||[...u.searchParams.keys()].some(k=>!allowed.has(k))
    ||[...new Set(u.searchParams.keys())].some(k=>u.searchParams.getAll(k).length!==1))throw Error('CLOUD_SQL_TRANSPORT_DENIED');
  if(target.environment==='staging'&&!/^visionary_data_staging(?:_|$)/.test(target.database))throw Error('STAGING_DATABASE_REQUIRED');
  if(target.environment==='production'&&/^visionary_data_(?:test|staging)(?:_|$)/.test(target.database))throw Error('PRODUCTION_DATABASE_REQUIRED');
  for(const [key,max] of [['connection_limit',3],['pool_timeout',15],['connect_timeout',15]] as const){
    const n=Number(u.searchParams.get(key));if(!Number.isInteger(n)||n<1||n>max)throw Error('CLOUD_SQL_CONNECTION_BOUNDS');
  }
  return u;
}
export function assertSeparateIdentities(c:IdentityConfig):void {
  const parse=(raw:string)=>c.cloudSql?assertCloudSqlUrl(raw,c.cloudSql):assertSyntheticUrl(raw);
  const m=parse(c.migrationUrl),r=parse(c.runtimeUrl);
  for(const name of [c.migrationRole,c.runtimeRole,c.schema])quoteIdentifier(name);
  if(c.migrationRole===c.runtimeRole||decodeURIComponent(m.username)!==c.migrationRole
    ||decodeURIComponent(r.username)!==c.runtimeRole||m.hostname!==r.hostname||(m.port||'5432')!==(r.port||'5432')
    ||m.pathname!==r.pathname||m.searchParams.get('schema')!==c.schema||r.searchParams.get('schema')!==c.schema)
    throw Error('IDENTITY_CONFLICT');
}
