// Restricted to disposable synthetic staging; hosted identities remain a separate gate.
export interface IdentityConfig {
  migrationUrl:string; runtimeUrl:string; migrationRole:string; runtimeRole:string; schema:string;
}
export function quoteIdentifier(value:string):string {
  if(!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(value))throw Error('INVALID_DATABASE_IDENTIFIER');
  return '"'+value+'"';
}
export function assertSyntheticUrl(raw:string):URL {
  const u=new URL(raw);
  if(!['postgres:','postgresql:'].includes(u.protocol)||!['localhost','127.0.0.1','[::1]'].includes(u.hostname)
    ||!/^\/visionary_data_test(?:_|$)[a-zA-Z0-9_]*$/.test(u.pathname))throw Error('SYNTHETIC_DATABASE_REQUIRED');
  return u;
}
export function assertSeparateIdentities(c:IdentityConfig):void {
  const m=assertSyntheticUrl(c.migrationUrl),r=assertSyntheticUrl(c.runtimeUrl);
  for(const name of [c.migrationRole,c.runtimeRole,c.schema])quoteIdentifier(name);
  if(c.migrationRole===c.runtimeRole||decodeURIComponent(m.username)!==c.migrationRole
    ||decodeURIComponent(r.username)!==c.runtimeRole||m.hostname!==r.hostname||(m.port||'5432')!==(r.port||'5432')
    ||m.pathname!==r.pathname||m.searchParams.get('schema')!==c.schema||r.searchParams.get('schema')!==c.schema)
    throw Error('IDENTITY_CONFLICT');
}
