// CONTENT-02 (KAN-61) — bounded scan/parse/chunk/embed/evaluate ingestion jobs
// with provenance and page/section offsets; preserved embedding model/dimension
// and transformation versions.
//
// Ownership boundaries this module keeps (see docs/architecture/BACKEND_LAUNCH_CHECKLIST.md):
//   - The protected file lifecycle (FILE-01/02) owns upload → quarantine → scan →
//     ready. Ingestion STARTS only from a clean, digest-verified, manifest-verified
//     object generation receipt; it never rescans or trusts unscanned bytes.
//   - The durable job platform (JOB-01/02/03) owns outbox dispatch, leases and
//     deadlines. This module keeps its own durable job record, attempt fencing,
//     idempotent completion and cancellation so a pipeline run is restart-safe on
//     its own, and exposes the seams (store interface + stage order) the platform
//     will drive when wired.
//   - The catalog (CONTENT-01) owns stable content IDs and source-version
//     approval. Provenance here mirrors the source identity (provider/edition/
//     version) without importing it; integration maps the released pointer.
//   - Publication (CONTENT-03) and retrieval gating (CONTENT-05) are separate:
//     a successful evaluation is "ready for review", never "published".

/** Ordered pipeline stages; a job advances strictly in this order. */
export type IngestionStage = 'scan'|'parse'|'chunk'|'embed'|'evaluate';
export const INGESTION_STAGE_ORDER:readonly IngestionStage[]=['scan','parse','chunk','embed','evaluate'];

/** Which code version produced each artifact; recorded on jobs, chunks and results. */
export type TransformationVersions=Readonly<Record<IngestionStage,string>>;

/**
 * Source-version provenance carried on every job and every chunk. Mirrors the
 * catalog source identity without importing CONTENT-01 types, so the modules
 * integrate by shape, not by shared mutable code.
 */
export interface SourceProvenance {
  provider:string;
  edition:string;
  version:string;
  /** Stable public content id from the catalog, when the source is registered. */
  contentPublicId:string|null;
}

/** Rights/consent assertion presented by the caller for processing this source. */
export interface SourceAuthorization {
  /** Owning uid the object and source belong to (server-authoritative later). */
  ownerUid:string;
  /** Workspace scope when the source is workspace-scoped; null otherwise. */
  workspaceId:string|null;
  /** Non-empty rights assertion for ingestion ("owner", "license:<id>", ...). */
  rightsGrant:string;
  /** True only when the rights holder consented to processing for learning delivery. */
  processingConsent:boolean;
}

/**
 * Receipt from the protected file lifecycle. Ingestion accepts only
 * clean, scanned, manifest-verified object generations; every other verdict is
 * a hard deny so unscanned bytes can never enter the learning corpus.
 */
export interface SourceObjectReceipt {
  /** Immutable object generation reference (FILE-02 manifest). */
  objectRef:string;
  /** Verified content digest (sha-256 hex) bound into job idempotency. */
  digest:string;
  byteSize:number;
  contentType:string;
  ownerUid:string;
  scanVerdict:'clean'|'infected'|'unscanned'|'failed';
  scannedAt:string|null;
  /** Reference verified before database commit (FILE-02); false is a deny. */
  manifestVerified:boolean;
}

/** Embedding model identity preserved verbatim on every chunk and result. */
export interface EmbeddingModelDescriptor {
  model:string;
  dimension:number;
}

/** 1-based page markers preserved from parsing (page N starts at charStart). */
export interface PageMarker { page:number; charStart:number }

/** Heading-derived section span over the normalized document text. */
export interface SectionSpan { path:string; level:number; charStart:number; charEnd:number }

export interface ParsedDocument {
  text:string;
  pages:readonly PageMarker[];
  sections:readonly SectionSpan[];
  parseWarnings:readonly string[];
}

/**
 * A stored chunk: bounded text with provenance, page/section offsets and the
 * embedding identity that produced its vector. Offsets index the normalized
 * document text; they are the citation offsets downstream retrieval must use.
 */
export interface ChunkRecord {
  chunkId:string;
  index:number;
  text:string;
  charStart:number;
  charEnd:number;
  page:number|null;
  sectionPath:string|null;
  embedding:readonly number[]|null;
  embeddingModel:string|null;
  embeddingDimension:number|null;
  transformationVersions:TransformationVersions;
  provenance:SourceProvenance;
}

/** Durable per-stage completion receipt (what ran, which code, what output). */
export interface StageReceipt {
  stage:IngestionStage;
  transformationVersion:string;
  startedAt:string;
  finishedAt:string;
  /** Digest of the stage output; identical replays are no-ops, changes conflict. */
  outputDigest:string;
  notes:readonly string[];
}

export type IngestionJobStatus='pending'|'running'|'succeeded'|'failed'|'cancelled';

export interface IngestionFailure {
  stage:IngestionStage;
  code:string;
  message:string;
  at:string;
}

export interface IngestionCancellation {
  requestedBy:string;
  at:string;
  /** The stage the job was in when cancellation landed (null before any claim). */
  stage:IngestionStage|null;
}

export interface IngestionJob {
  jobId:string;
  ownerUid:string;
  workspaceId:string|null;
  status:IngestionJobStatus;
  /** Fencing token: each stage claim increments it; completions must match it. */
  attempt:number;
  /** Content digest + bounds + model identity; idempotent start key. */
  inputDigest:string;
  completedStages:readonly IngestionStage[];
  stageReceipts:readonly StageReceipt[];
  failure:IngestionFailure|null;
  cancellation:IngestionCancellation|null;
  createdAt:string;
  updatedAt:string;
}

/** Deterministic quality gates; only a passed evaluation yields a usable result. */
export interface EvaluationReceipt {
  passed:boolean;
  checks:readonly { id:string; passed:boolean; detail:string }[];
  failedReasons:readonly string[];
}

export interface IngestionResult {
  jobId:string;
  inputDigest:string;
  provenance:SourceProvenance;
  model:EmbeddingModelDescriptor;
  transformationVersions:TransformationVersions;
  chunks:readonly ChunkRecord[];
  evaluation:EvaluationReceipt;
  finishedAt:string;
}

/** Durable observation event (JOB-03 replay/refetch semantics alignment). */
export interface IngestionEvent {
  /** Monotonic sequence number; opaque cursor for refetch. */
  seq:number;
  at:string;
  jobId:string;
  type:'job.started'|'stage.claimed'|'stage.completed'|'stage.failed'|'job.cancelled'|'job.succeeded';
  stage:IngestionStage|null;
  detail:string;
}

export interface IngestionEventPage {
  events:readonly IngestionEvent[];
  nextCursor:number|null;
}
