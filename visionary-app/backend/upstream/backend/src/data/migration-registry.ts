import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RegisteredMigration } from './migration-types';
export function migrationChecksum(m:Omit<RegisteredMigration,'checksum'>):string {
  return createHash('sha256').update(JSON.stringify({version:m.version,name:m.name,requires:m.requires,
    statements:m.statements,down:m.down??[],reversible:m.reversible})).digest('hex');
}
export function registerMigration(m:Omit<RegisteredMigration,'checksum'>):RegisteredMigration {
  return {...m,checksum:migrationChecksum(m)};
}
/** Split without splitting quoted identifiers, strings, comments or dollar bodies. */
export function splitSql(sql:string):string[] {
  const out:string[]=[];let start=0,i=0,quote='',dollar='',block=0,line=false;
  while(i<sql.length){
    const c=sql[i],n=sql[i+1];
    if(line){if(c==='\n')line=false;i++;continue;}
    if(block){if(c==='/'&&n==='*'){block++;i+=2;}else if(c==='*'&&n==='/'){block--;i+=2;}else i++;continue;}
    if(dollar){if(sql.startsWith(dollar,i)){i+=dollar.length;dollar='';}else i++;continue;}
    if(quote){if(c===quote){if(n===quote)i+=2;else{quote='';i++;}}else i++;continue;}
    if(c==='-'&&n==='-'){line=true;i+=2;continue;}
    if(c==='/'&&n==='*'){block=1;i+=2;continue;}
    if(c==="'"||c==='"'){quote=c;i++;continue;}
    if(c==='$'){const tag=/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));if(tag){dollar=tag[0];i+=dollar.length;continue;}}
    if(c===';'){if(sql.slice(start,i).trim())out.push(sql.slice(start,i).trim());start=i+1;}i++;
  }
  if(quote||dollar||block)throw Error('INVALID_SQL_ARTIFACT');
  if(sql.slice(start).trim())out.push(sql.slice(start).trim());
  return out;
}
export function canonicalMigrations(backendRoot:string):readonly RegisteredMigration[] {
  const sql=readFileSync(resolve(backendRoot,'prisma/migrations/20261024000001_data_01_workspaces/migration.sql'),'utf8');
  return [registerMigration({version:1,name:'data-01-workspace-domain',requires:[],statements:splitSql(sql),reversible:false})];
}
