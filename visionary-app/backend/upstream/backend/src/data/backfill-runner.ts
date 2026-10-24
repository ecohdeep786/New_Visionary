// DATA-02 — bounded, resumable backfill with an idempotent cursor ledger.
//
// Backfills (e.g. projecting legacy rows into the domain schema) run in small
// bounded batches so a single Cloud SQL instance is not saturated and costs
// stay predictable. A checkpoint is persisted after every batch, so a crash or
// cancel resumes exactly where it stopped and never double-applies a processed
// key. This is the pattern a Cloud Tasks / durable-worker dispatcher needs.
export interface BackfillSource {
  /** Advance to the next page; returns rows with `cursor` continuing from the
   *  previous value. `done` signals the source is exhausted. */
  next(cursor: string | null, limit: number): Promise<{ rows: BackfillRow[]; nextCursor: string | null; done: boolean }>;
}

export interface BackfillRow {
  /** Stable identity used for idempotency (e.g. `uid:resourceId`). */
  key: string;
  [field: string]: unknown;
}

export interface BackfillCheckpoint {
  runId: string;
  name: string;
  cursor: string | null;
  processed: number;
  done: boolean;
  updatedAt: string;
}

export interface BackfillCheckpointStore {
  read(name: string): Promise<BackfillCheckpoint | null>;
  write(checkpoint: BackfillCheckpoint): Promise<void>;
}

export interface BackfillOptions {
  name: string;
  appliedBy: string;
  batchSize?: number;
}

export interface BackfillResult {
  runId: string;
  name: string;
  processed: number;
  batches: number;
  done: boolean;
  startedAt: string;
  finishedAt: string;
}

const now = () => new Date().toISOString();
export const MIN_BATCH = 1;
export const MAX_BATCH = 5000;
export const DEFAULT_BATCH = 500;

export class InMemoryCheckpointStore implements BackfillCheckpointStore {
  readonly records = new Map<string, BackfillCheckpoint>();
  async read(name: string) { return this.records.get(name) ?? null; }
  async write(c: BackfillCheckpoint) { this.records.set(c.name, c); }
}

export class BackfillRunner {
  constructor(
    private readonly source: BackfillSource,
    private readonly checkpoints: BackfillCheckpointStore,
    /** Idempotent writer for a processed row; safe to call repeatedly. */
    private readonly mark: (row: BackfillRow, processedAt: string) => Promise<void>,
  ) {}

  /** Run all batches until `done`, or stop at the failure bound. */
  async run(options: BackfillOptions): Promise<BackfillResult> {
    const batchSize = options.batchSize ?? DEFAULT_BATCH;
    if (!Number.isSafeInteger(batchSize) || batchSize < MIN_BATCH || batchSize > MAX_BATCH) {
      throw new Error(`BACKFILL_BOUNDS: batch size must be between ${MIN_BATCH} and ${MAX_BATCH}.`);
    }
    const startedAt = now();
    const prior = await this.checkpoints.read(options.name);
    if (prior && prior.done) {
      return {
        runId: prior.runId, name: options.name, processed: prior.processed, batches: 0,
        done: true, startedAt: prior.updatedAt, finishedAt: prior.updatedAt,
      };
    }

    const runId = prior?.runId ?? `bf-${options.appliedBy}-${Date.now()}`;
    let cursor = prior?.cursor ?? null;
    let processed = prior?.processed ?? 0;
    let batches = 0;
    let finishedAt = startedAt;

    for (;;) {
      const page = await this.source.next(cursor, batchSize);
      if (page.rows.length > 0) {
        const at = now();
        for (const row of page.rows) await this.mark(row, at);
        processed += page.rows.length;
      }
      batches += 1;
      cursor = page.nextCursor;
      finishedAt = now();
      const done = page.done;
      await this.checkpoints.write({ runId, name: options.name, cursor, processed, done, updatedAt: finishedAt });
      if (done) break;
    }

    return { runId, name: options.name, processed, batches, done: true, startedAt, finishedAt };
  }
}
