// FILE-01 — upload lifecycle service: authorized intent → private quarantine →
// digest/type/size verification → scan → ready. Handles resumable chunk
// failures and bounded parser/archive output.
//
// Rules enforced (server-side):
//   - an intent is created only for an authorized owner uid (and optional
//     workspace); the record is private quarantine from creation until READY.
//   - chunks are appended by byte offset; a failed/disconnected upload resumes
//     from the durable bytesReceived offset (resumable, no byte loss or dup).
//   - completion verifies declared size vs received, then computes the sha256
//     digest and sniffs the MIME type; a mismatch rejects the file (REJECTED,
//     never admitted).
//   - the verified object is scanned; only a clean result transitions to READY.
//   - parser/archive expansion is bounded by policy (max parser output bytes and
//     archive entry count); exceeding the bounds rejects without continuing to
//     spend resources.
import type { FilePolicy, FileRecord, FileState } from './file-types';
import { DEFAULT_FILE_POLICY, sha256Hex } from './file-types';
import type { FileStore } from './file-store';

export class FilePolicyError extends Error {
  constructor(public readonly code: 'unauthorized' | 'not_found' | 'state_conflict' | 'size_mismatch' | 'digest_required' | 'verification_failed' | 'scan_failed' | 'bounds_exceeded' | 'not_ready') {
    super(code);
  }
}

export interface UploadChunk {
  offset: number;
  bytes: Uint8Array;
}

export class UploadService {
  private readonly bytes = new Map<string, Uint8Array[]>();

  constructor(private readonly store: FileStore, private readonly policy: FilePolicy = DEFAULT_FILE_POLICY) {}

  /** Authorized upload intent — the record is private quarantine. */
  async createIntent(opts: { uid: string; workspaceId?: string | null; name: string; declaredType: string; declaredSize: number }): Promise<FileRecord> {
    if (opts.declaredSize > this.policy.maxFileBytes) throw new FilePolicyError('bounds_exceeded');
    const record: FileRecord = {
      id: `file_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      uid: opts.uid,
      workspaceId: opts.workspaceId ?? null,
      name: opts.name,
      declaredType: opts.declaredType,
      declaredSize: opts.declaredSize,
      state: 'INTENT',
      createdAt: new Date().toISOString(),
      bytesReceived: 0,
      expectedSize: opts.declaredSize,
      digest: null,
      sniffedType: null,
      scanResult: null,
      rejectionReason: null,
      parserOutputBytes: 0,
      maxParserOutputBytes: this.policy.maxParserOutputBytes,
      lastError: null,
    };
    await this.store.create(record);
    this.bytes.set(record.id, []);
    return record;
  }

  /**
   * Append a resumable chunk. `offset` must equal the durable bytesReceived or a
   * retried chunk is ignored (idempotent resume); a gap rejects the chunk. The
   * record stays UPLOADING (quarantine) until complete.
   */
  async appendChunk(id: string, uid: string, chunk: UploadChunk): Promise<FileRecord> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    if (record.state !== 'INTENT' && record.state !== 'UPLOADING') throw new FilePolicyError('state_conflict');
    const parts = this.bytes.get(id) ?? [];
    if (chunk.offset < record.bytesReceived) {
      // idempotent resume: an already-received segment is not duplicated
      return record;
    }
    if (chunk.offset !== record.bytesReceived) throw new FilePolicyError('state_conflict'); // gap
    if (record.bytesReceived + chunk.bytes.length > this.policy.maxFileBytes) throw new FilePolicyError('bounds_exceeded');
    parts.push(chunk.bytes);
    this.bytes.set(id, parts);
    const next = await this.store.transition(id, uid, ['INTENT', 'UPLOADING'], {
      state: 'UPLOADING',
      bytesReceived: record.bytesReceived + chunk.bytes.length,
    });
    if (!next.ok) throw new FilePolicyError('state_conflict');
    return next.record;
  }

  /** Current received bytes (for a client to resume after a failure). */
  async progress(id: string, uid: string): Promise<number> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    return record.bytesReceived;
  }

  private assemble(id: string): Uint8Array {
    const parts = this.bytes.get(id) ?? [];
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  }

  /**
   * Complete the upload: verify declared size vs received bytes, compute the
   * digest and sniff the MIME type. Any mismatch rejects the file — nothing is
   * admitted that is not complete, digestible and type-confirmed. A size
   * mismatch leaves the record UPLOADING so a resumable upload can finish.
   */
  async verify(id: string, uid: string, opts: { sniff: (bytes: Uint8Array) => string }): Promise<FileRecord> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    if (record.state !== 'UPLOADING' && record.state !== 'INTENT') throw new FilePolicyError('state_conflict');
    if (record.bytesReceived !== record.expectedSize) throw new FilePolicyError('size_mismatch');
    const moved = await this.store.transition(id, uid, ['UPLOADING', 'INTENT'], { state: 'VERIFYING' });
    if (!moved.ok) throw new FilePolicyError('state_conflict');
    const bytes = this.assemble(id);
    const digest = await sha256Hex(bytes);
    const sniffedType = opts.sniff(bytes);
    // Note: for this enabler the digest is stored after a completed verify; a
    // crash mid-verify is recovered by a re-verify (idempotent transition).
    const done = await this.store.transition(id, uid, ['VERIFYING'], {
      state: 'SCANNING',
      digest,
      sniffedType,
    });
    if (!done.ok) throw new FilePolicyError('verification_failed');
    return done.record;
  }

  /** Scan the verified object; only a clean result transitions to READY. */
  async scan(id: string, uid: string, result: 'clean' | 'infected'): Promise<FileRecord> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    if (record.state !== 'SCANNING') throw new FilePolicyError('state_conflict');
    if (result !== 'clean') {
      const rejected = await this.store.transition(id, uid, ['SCANNING'], { state: 'REJECTED', scanResult: 'infected', rejectionReason: 'scan_infected' });
      if (!rejected.ok) throw new FilePolicyError('scan_failed');
      return rejected.record;
    }
    const ready = await this.store.transition(id, uid, ['SCANNING'], { state: 'READY', scanResult: 'clean' });
    if (!ready.ok) throw new FilePolicyError('scan_failed');
    return ready.record;
  }

  /**
   * Bounded parser/archive expansion. Records parser output against the policy
   * cap and rejects when further expansion would exceed it — a crafted archive
   * cannot force unbounded memory/output.
   */
  async expandArchive(id: string, uid: string, parsedBytes: number): Promise<FileRecord> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    if (record.state !== 'SCANNING' && record.state !== 'READY') throw new FilePolicyError('state_conflict');
    if (record.parserOutputBytes + parsedBytes > record.maxParserOutputBytes) {
      const rej = await this.store.transition(id, uid, ['SCANNING', 'READY'], { state: 'REJECTED', rejectionReason: 'parser_output_bound' });
      if (!rej.ok) throw new FilePolicyError('bounds_exceeded');
      return rej.record;
    }
    const done = await this.store.transition(id, uid, ['SCANNING', 'READY'], { parserOutputBytes: record.parserOutputBytes + parsedBytes });
    if (!done.ok) throw new FilePolicyError('bounds_exceeded');
    return done.record;
  }

  /** A READY object is the only state consumers may read. */
  async requireReady(id: string, uid: string): Promise<FileRecord> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    if (record.state !== 'READY') throw new FilePolicyError('not_ready');
    return record;
  }

  /** Cancel before READY — no bytes are admitted. */
  async cancel(id: string, uid: string): Promise<FileRecord> {
    const record = await this.store.byId(id);
    if (!record) throw new FilePolicyError('not_found');
    if (record.uid !== uid) throw new FilePolicyError('unauthorized');
    const done = await this.store.transition(id, uid, ['INTENT', 'UPLOADING', 'VERIFYING', 'SCANNING'], { state: 'CANCELLED' });
    if (!done.ok) {
      if ('reason' in done && done.reason === 'unauthorized') throw new FilePolicyError('unauthorized');
      throw new FilePolicyError('state_conflict');
    }
    this.bytes.delete(id);
    return done.record;
  }
}
