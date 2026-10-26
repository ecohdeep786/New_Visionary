// FILE-01 — file/upload store contract + in-memory synthetic implementation.
// The Cloud SQL/private-object adapter implements the same surface over
// FILE/DATA-01 private-object rows. Durable progress, digest and state let the
// enabler reproduce upload → quarantine → verify → scan → ready without a live
// object store.
import type { FileRecord, FileState } from './file-types';

export type FileWriteResult = { ok: true; record: FileRecord } | { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' };

export type FilePatch = Partial<
  Pick<FileRecord, 'state' | 'bytesReceived' | 'digest' | 'sniffedType' | 'scanResult' | 'rejectionReason' | 'parserOutputBytes' | 'lastError'>
>;

export interface FileStore {
  create(record: FileRecord): Promise<void>;
  byId(id: string): Promise<FileRecord | null>;
  /** Fenced transition: apply `patch` when the row is in `from` and owned by `uid`. */
  transition(id: string, uid: string, from: FileState[], patch: FilePatch): Promise<FileWriteResult>;
  recordsFor(uid: string): Promise<FileRecord[]>;
  recordsInStates(states: FileState[]): Promise<FileRecord[]>;
}

export class InMemoryFileStore implements FileStore {
  readonly records = new Map<string, FileRecord>();

  async create(record: FileRecord): Promise<void> { this.records.set(record.id, record); }
  async byId(id: string): Promise<FileRecord | null> { return this.records.get(id) ?? null; }
  async transition(id: string, uid: string, from: FileState[], patch: FilePatch): Promise<FileWriteResult> {
    const cur = this.records.get(id);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.uid !== uid) return { ok: false, reason: 'unauthorized' };
    if (!from.includes(cur.state)) return { ok: false, reason: 'conflict' };
    const next = { ...cur, ...patch } as FileRecord;
    this.records.set(id, next);
    return { ok: true, record: next };
  }
  async recordsFor(uid: string): Promise<FileRecord[]> {
    return [...this.records.values()].filter((r) => r.uid === uid);
  }
  async recordsInStates(states: FileState[]): Promise<FileRecord[]> {
    return [...this.records.values()].filter((r) => states.includes(r.state));
  }
}
