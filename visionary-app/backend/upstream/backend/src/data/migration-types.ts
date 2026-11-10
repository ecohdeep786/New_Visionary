export interface MigrationReceipt {
  version:number; name:string; checksum:string; schemaDigest:string; appliedAt:string; appliedBy:string; status:'applied'|'rolled_back';
}
export interface RegisteredMigration {
  version:number; name:string; checksum:string; requires:readonly number[];
  statements:readonly string[]; down?:readonly string[]; reversible:boolean;
}
export interface ApplyingResult { applied:number; skipped:number; receipts:MigrationReceipt[] }
export interface VerifyResult { consistent:boolean; issues:string[] }
