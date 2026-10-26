// CONTENT-02 — bounded pipeline. Every bound here is a hard refusal, never a
// silent truncation: an oversized document, an over-limit chunk set or an
// over-limit section tree fails the job so incomplete ingestion cannot flow
// toward publication (CONTENT-03 relies on this).
export interface IngestionBounds {
  /** Maximum accepted source object size in bytes (scan gate). */
  maxBytes:number;
  /** Maximum decoded document characters handed to chunking. */
  maxChars:number;
  /** Maximum chunks a single job may emit. */
  maxChunks:number;
  /** Maximum characters per chunk before a bounded hard split. */
  maxChunkChars:number;
  /** Maximum heading sections parsed from one document. */
  maxSections:number;
  /** Exact-duplicate chunk text ratio tolerated by evaluation. */
  maxDuplicateRatio:number;
  /** Embedding batch size for adapters (adapters may bound further). */
  embedBatchSize:number;
}

export const DEFAULT_INGESTION_BOUNDS:IngestionBounds={
  maxBytes:2_000_000,
  maxChars:2_000_000,
  maxChunks:2_000,
  maxChunkChars:1_600,
  maxSections:5_000,
  maxDuplicateRatio:0.5,
  embedBatchSize:64,
};

/**
 * Transformation versions — bumped when the transformation code changes
 * meaningfully; stored artifacts record which version produced them, so a
 * re-ingestion with a changed version is a different input (new job), never a
 * silent overwrite of existing chunks.
 */
export const TRANSFORMATION_VERSIONS:{
  pipeline:string;
  scan:string;
  parse:string;
  chunk:string;
  embed:string;
  evaluate:string;
}={
  pipeline:'content-ingest-v1',
  scan:'scan-gate-v1',
  parse:'parse-v1',
  chunk:'chunk-v1',
  embed:'embed-v1',
  evaluate:'evaluate-v1',
};

/** Content types this pipeline honestly parses; everything else is refused. */
export const SUPPORTED_CONTENT_TYPES:readonly string[]=['text/plain','text/markdown'];
