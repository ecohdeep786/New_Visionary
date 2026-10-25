import { createHash } from 'node:crypto';
import { DataTransaction,PostgresMigrationStore } from './migration-store';
export interface BackfillRow { key:string; [field:string]:unknown }
export interface BackfillSource {
  next(cursor:string|null,limit:number,signal:AbortSignal):Promise<{rows:BackfillRow[];nextCursor:string|null;done:boolean}>;
}
export interface BackfillOptions {
  name:string; definition:string; batchSize?:number; maxRows?:number; maxBatches?:number; maxDurationMs?:number; signal?:AbortSignal;
}
export interface BackfillResult { name:string;processed:number;batches:number;done:boolean;cursor:string|null }
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
function stable(value:unknown):unknown{
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number'&&Number.isFinite(value))return value;
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype)
    return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable((value as Record<string,unknown>)[k])]));
  throw Error('BACKFILL_ROW_INVALID');
}
function bounded(n:number,min:number,max:number):number{
  if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('BACKFILL_BOUNDS');return n;
}
async function deadline<T>(work:(signal:AbortSignal)=>Promise<T>,until:number,parent?:AbortSignal):Promise<T>{
  const controller=new AbortController(); let timer:ReturnType<typeof setTimeout>,rejectAbort:(e:Error)=>void;
  const cancel=()=>{controller.abort();rejectAbort?.(Error('BACKFILL_CANCELLED'));};
  if(parent?.aborted)throw Error('BACKFILL_CANCELLED');
  const guard=new Promise<never>((_,reject)=>{rejectAbort=reject;timer=setTimeout(()=>{controller.abort();reject(Error('BACKFILL_DEADLINE'));},Math.max(1,until-Date.now()));});
  parent?.addEventListener('abort',cancel,{once:true});
  try{return await Promise.race([work(controller.signal),guard]);}
  finally{clearTimeout(timer!);parent?.removeEventListener('abort',cancel);}
}
/** Writer MUST use the supplied transaction only; external side effects are not covered. */
export class BackfillRunner {
  constructor(private readonly store:PostgresMigrationStore,private readonly source:BackfillSource,
    private readonly write:(tx:DataTransaction,row:BackfillRow,signal:AbortSignal)=>Promise<void>){}
  async run(o:BackfillOptions):Promise<BackfillResult>{
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(o.name)||!/^[a-f0-9]{64}$/.test(o.definition))throw Error('BACKFILL_DEFINITION_REQUIRED');
    const size=bounded(o.batchSize??100,1,500),maxRows=bounded(o.maxRows??1000,1,10000),
      maxBatches=bounded(o.maxBatches??10,1,100),duration=bounded(o.maxDurationMs??10000,100,30000);
    const until=Date.now()+duration;let batches=0,invocationRows=0,result:BackfillResult;
    while(batches<maxBatches&&invocationRows<maxRows&&Date.now()<until){
      if(o.signal?.aborted)throw Error('BACKFILL_CANCELLED');
      const budget=Math.min(15000,Math.max(100,until-Date.now()));
      const batch=await this.store.transaction(tx=>deadline(async signal=>{
        await tx.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "_visionary_backfills" (
          name TEXT PRIMARY KEY,definition TEXT NOT NULL,cursor TEXT,processed INTEGER NOT NULL DEFAULT 0,
          done BOOLEAN NOT NULL DEFAULT FALSE,"updatedAt" TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp())`);
        await tx.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "_visionary_backfill_rows" (
          name TEXT NOT NULL REFERENCES "_visionary_backfills"(name),key TEXT NOT NULL,digest TEXT NOT NULL,
          PRIMARY KEY(name,key))`);
        await tx.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "_visionary_backfill_cursors" (
          name TEXT NOT NULL REFERENCES "_visionary_backfills"(name),cursor TEXT NOT NULL,PRIMARY KEY(name,cursor))`);
        await tx.$executeRawUnsafe(`INSERT INTO "_visionary_backfills"(name,definition) VALUES($1,$2) ON CONFLICT DO NOTHING`,o.name,o.definition);
        const [checkpoint]=await tx.$queryRawUnsafe<any[]>(`SELECT * FROM "_visionary_backfills" WHERE name=$1 FOR UPDATE`,o.name);
        if(checkpoint.definition!==o.definition)throw Error('BACKFILL_DEFINITION_DRIFT');
        if(checkpoint.done)return {result:{name:o.name,processed:checkpoint.processed,batches,done:true,cursor:checkpoint.cursor},rows:0,executed:false};
        const limit=Math.min(size,maxRows-invocationRows),page=await this.source.next(checkpoint.cursor,limit,signal);
        if(signal.aborted||o.signal?.aborted)throw Error('BACKFILL_CANCELLED');
        if(!page||!Array.isArray(page.rows)||page.rows.length>limit||typeof page.done!=='boolean')throw Error('BACKFILL_PAGE_BOUNDS');
        if(page.nextCursor!==null&&(typeof page.nextCursor!=='string'||!page.nextCursor||page.nextCursor.length>2048))throw Error('BACKFILL_CURSOR_INVALID');
        if(!page.done){
          if(page.nextCursor===null||page.nextCursor===checkpoint.cursor)throw Error('BACKFILL_CURSOR_STALLED');
          const seen=await tx.$queryRawUnsafe<any[]>(`SELECT 1 FROM "_visionary_backfill_cursors" WHERE name=$1 AND cursor=$2`,o.name,page.nextCursor);
          if(seen.length)throw Error('BACKFILL_CURSOR_CYCLE');
          await tx.$executeRawUnsafe(`INSERT INTO "_visionary_backfill_cursors"(name,cursor) VALUES($1,$2)`,o.name,page.nextCursor);
        }
        let added=0;
        for(const row of page.rows){
          if(signal.aborted||o.signal?.aborted||Date.now()>=until)throw Error('BACKFILL_CANCELLED_OR_DEADLINE');
          if(!row||Object.getPrototypeOf(row)!==Object.prototype||typeof row.key!=='string'||!row.key||row.key.length>200)throw Error('BACKFILL_ROW_INVALID');
          const payload=JSON.stringify(stable(row));if(payload.length>65536)throw Error('BACKFILL_ROW_INVALID');
          const digest=hash(payload);
          const [prior]=await tx.$queryRawUnsafe<any[]>(`SELECT digest FROM "_visionary_backfill_rows" WHERE name=$1 AND key=$2`,o.name,row.key);
          if(prior){if(prior.digest!==digest)throw Error('BACKFILL_ROW_DRIFT');continue;}
          await this.write(tx,row,signal);
          if(signal.aborted||o.signal?.aborted)throw Error('BACKFILL_CANCELLED');
          await tx.$executeRawUnsafe(`INSERT INTO "_visionary_backfill_rows"(name,key,digest) VALUES($1,$2,$3)`,o.name,row.key,digest);added++;
        }
        if(signal.aborted||o.signal?.aborted||Date.now()>=until)throw Error('BACKFILL_CANCELLED_OR_DEADLINE');
        await tx.$executeRawUnsafe(`UPDATE "_visionary_backfills" SET cursor=$2,processed=processed+$3,done=$4,"updatedAt"=clock_timestamp() WHERE name=$1`,
          o.name,page.nextCursor,added,page.done);
        return {result:{name:o.name,processed:checkpoint.processed+added,batches:batches+1,done:page.done,cursor:page.nextCursor},rows:page.rows.length,executed:true};
      },Math.min(until,Date.now()+Math.max(1,budget-500)),o.signal),budget);
      result=batch.result;invocationRows+=batch.rows;if(batch.executed)batches++;
      if(result.done)return result;
    }
    if(!result)throw Error('BACKFILL_DEADLINE');
    return result!;
  }
}
