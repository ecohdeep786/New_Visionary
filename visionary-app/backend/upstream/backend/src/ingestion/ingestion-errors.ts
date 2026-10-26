// CONTENT-02 — explicit failure taxonomy. Callers branch on `code`, never on
// message text. Codes starting with AUTHORITY_/CONSENT_ are policy denies;
// the rest are bounded pipeline failures.
export type IngestionErrorCode =
  |'AUTHORITY_DENIED'
  |'CONSENT_DENIED'
  |'OBJECT_UNVERIFIED'
  |'SCAN_NOT_CLEAN'
  |'MALFORMED_PROVENANCE'
  |'UNSUPPORTED_TYPE'
  |'INPUT_TOO_LARGE'
  |'SECTION_LIMIT'
  |'CHUNK_LIMIT'
  |'PARSE_DECODE_FAILED'
  |'EMBEDDER_UNAVAILABLE'
  |'EMBEDDING_DIMENSION_MISMATCH'
  |'EVALUATION_FAILED'
  |'JOB_NOT_FOUND'
  |'DUPLICATE_ACTIVE_JOB'
  |'JOB_CANCELLED'
  |'ALREADY_COMPLETED'
  |'STALE_ATTEMPT'
  |'CONCURRENT_COMPLETION_CONFLICT'
  |'RUNNER_CONTEXT_LOST';

export class IngestionError extends Error {
  readonly code:IngestionErrorCode;
  readonly stage:import('./ingestion-types').IngestionStage|null;
  constructor(code:IngestionErrorCode,message:string,stage:import('./ingestion-types').IngestionStage|null=null){
    super(message);
    this.name='IngestionError';
    this.code=code;
    this.stage=stage;
  }
}
