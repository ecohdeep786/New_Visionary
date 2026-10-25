import { migrationChecksum } from './migration-registry';
import { DataTransaction, PostgresMigrationStore } from './migration-store';
import type { RegisteredMigration,ApplyingResult,VerifyResult } from './migration-types';
export class MigrationRunner {
  private readonly migrations:RegisteredMigration[];
  constructor(private readonly store:PostgresMigrationStore,migrations:readonly RegisteredMigration[]){
    this.migrations=JSON.parse(JSON.stringify(migrations));
  }
  private async issues(tx:DataTransaction):Promise<string[]>{
    const issues:string[]=[],seen=new Set<number>();
    for(const m of this.migrations){
      if(!Number.isSafeInteger(m.version)||m.version<1||seen.has(m.version))issues.push('invalid/duplicate version');
      if(!m.name||!m.statements.length||migrationChecksum(m)!==m.checksum)issues.push('artifact checksum invalid');
      if(m.reversible&&!m.down?.length)issues.push('rollback artifact missing');
      if(m.requires.some(v=>v>=m.version||!seen.has(v)))issues.push('invalid prerequisite order');
      seen.add(m.version);
    }
    const receipts=await this.store.appliedReceipts(tx),applied=new Set(receipts.map(r=>r.version));
    for(const r of await this.store.history(tx)){
      const m=this.migrations.find(x=>x.version===r.version);
      if(!m||m.name!==r.name||m.checksum!==r.checksum)issues.push('applied migration drift');
    }
    for(const r of receipts){const m=this.migrations.find(x=>x.version===r.version);
      if(m?.requires.some(v=>!applied.has(v)))issues.push('applied prerequisite missing');}
    if(receipts.length&&receipts[receipts.length-1].schemaDigest!==await this.store.schemaDigest(tx))issues.push('physical schema drift');
    return issues;
  }
  async applyAll():Promise<ApplyingResult>{
    return this.store.transaction(async tx=>{
      const issues=await this.issues(tx);if(issues.length)throw Error('MIGRATION_PREFLIGHT_FAILED: '+issues.join('; '));
      const receipts=await this.store.appliedReceipts(tx),applied=new Set(receipts.map(r=>r.version));
      const pending=this.migrations.filter(m=>!applied.has(m.version));
      // No boolean override can authorize retained-record mutation.
      if(pending.length&&!(await this.store.isDomainEmpty(tx)))throw Error('NON_EMPTY_STAGING_DENIED');
      for(const m of pending){
        if(m.requires.some(v=>!applied.has(v)))throw Error('PREREQUISITE_MISSING');
        for(const sql of m.statements)await tx.$executeRawUnsafe(sql);
        await this.store.recordReceipt(tx,m,'applied');applied.add(m.version);
      }
      return {applied:pending.length,skipped:receipts.length,receipts:await this.store.appliedReceipts(tx)};
    });
  }
  async verify():Promise<VerifyResult>{
    return this.store.transaction(async tx=>{
      const issues=await this.issues(tx),applied=new Set((await this.store.appliedReceipts(tx)).map(r=>r.version));
      for(const m of this.migrations)if(!applied.has(m.version))issues.push('migration not applied: '+m.version);
      return {consistent:!issues.length,issues};
    });
  }
  async rollbackLast(){
    return this.store.transaction(async tx=>{
      const issues=await this.issues(tx);if(issues.length)throw Error('MIGRATION_PREFLIGHT_FAILED: '+issues.join('; '));
      const receipts=await this.store.appliedReceipts(tx),latest=receipts[receipts.length-1];
      if(!latest)throw Error('NOTHING_TO_ROLLBACK');
      const m=this.migrations.find(x=>x.version===latest.version)!;
      if(!m.reversible||!m.down?.length)throw Error('ROLLBACK_DENIED');
      if(!(await this.store.isDomainEmpty(tx)))throw Error('NON_EMPTY_STAGING_DENIED');
      for(const sql of m.down)await tx.$executeRawUnsafe(sql);
      await this.store.recordReceipt(tx,m,'rolled_back');
      return {...latest,status:'rolled_back' as const};
    });
  }
}
