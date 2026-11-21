import { randomUUID } from 'node:crypto';
import type { FilePatch, FileStore, QuarantineStorage } from './file-store';
import { uploadPartName } from './file-store';
import { DEFAULT_FILE_POLICY, sha256Hex } from './file-types';
import type { FilePolicy, FileRecord } from './file-types';

export class FilePolicyError extends Error {
  constructor(readonly code: 'not_found' | 'scope_denied' | 'invalid_intent' | 'state_conflict' |
    'part_mismatch' | 'size_mismatch' | 'bounds_exceeded' | 'not_ready' | 'inspection_unavailable') {
    super(code);
  }
}

interface UploadInspection {
  scan(bytes: Uint8Array, type: string, signal: AbortSignal): Promise<'clean' | 'infected'>;
  expand?(bytes: Uint8Array, type: string, signal: AbortSignal): AsyncIterable<AsyncIterable<Uint8Array>>;
}

const pending = (record: FileRecord) => record.state === 'INTENT' || record.state === 'UPLOADING';
const digestPattern = /^[a-f0-9]{64}$/;

function sniff(bytes: Uint8Array): string | null {
  const header = Buffer.from(bytes.subarray(0, 8));
  if (header.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) ||
      header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x05, 0x06]))) return 'application/zip';
  if (header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.some(byte => (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte === 127)) return null;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return 'text/plain';
  } catch {
    return null;
  }
}

export class UploadService {
  constructor(
    private readonly store: FileStore,
    private readonly quarantine: QuarantineStorage,
    private readonly inspection: UploadInspection,
    private readonly policy: FilePolicy = DEFAULT_FILE_POLICY,
  ) {}

  /** The caller supplies the UID from a verified server session. */
  async createIntent(input: {
    uid: string;
    workspaceId?: string | null;
    name: string;
    declaredType: string;
    declaredSize: number;
    expectedDigest: string;
  }): Promise<FileRecord> {
    const { uid, name, declaredType, declaredSize, expectedDigest } = input;
    if (typeof name !== 'string' || name.length === 0 || name.length > 180 || /[\u0000-\u001f\u007f\\/]/.test(name) ||
        !this.policy.allowedTypes.includes(declaredType) || !digestPattern.test(expectedDigest) ||
        !Number.isSafeInteger(declaredSize) || declaredSize < 1) throw new FilePolicyError('invalid_intent');
    if (declaredSize > this.policy.maxFileBytes || Math.ceil(declaredSize / this.policy.chunkBytes) > 128) {
      throw new FilePolicyError('bounds_exceeded');
    }
    const now = await this.store.clock();
    const record: FileRecord = {
      id: 'file_' + randomUUID(), uid, workspaceId: input.workspaceId ?? null, name,
      declaredType, declaredSize, expectedDigest, state: 'INTENT', revision: 0,
      createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + this.policy.intentLifetimeMs).toISOString(),
      bytesReceived: 0, chunkBytes: this.policy.chunkBytes, digest: null, sniffedType: null,
      scanResult: null, rejectionReason: null, parserOutputBytes: 0, archiveEntries: 0,
      maxParserOutputBytes: this.policy.maxParserOutputBytes, maxArchiveEntries: this.policy.maxArchiveEntries,
    };
    if (!await this.store.create(record)) throw new FilePolicyError('scope_denied');
    return record;
  }

  async progress(id: string, uid: string): Promise<number> {
    return (await this.find(id, uid)).bytesReceived;
  }

  async appendChunk(id: string, uid: string, offset: number, content: Uint8Array): Promise<FileRecord> {
    const record = await this.find(id, uid);
    if (!pending(record) || !Number.isSafeInteger(offset) || offset < 0 || offset > record.bytesReceived) {
      throw new FilePolicyError('state_conflict');
    }
    const size = Math.min(record.chunkBytes, record.declaredSize - offset);
    if (size < 1 || !(content instanceof Uint8Array) || content.length !== size) throw new FilePolicyError('size_mismatch');
    const bytes = Uint8Array.from(content);
    const digest = sha256Hex(bytes);
    if (offset < record.bytesReceived) return this.replayPart(id, uid, offset, size, digest);
    if (Date.parse(record.expiresAt) <= (await this.store.clock()).getTime()) throw new FilePolicyError('state_conflict');
    const objectName = uploadPartName(id, offset, digest);
    if (!await this.store.reserve(uid, id, record.revision, { offset, size, digest, objectName })) {
      const latest = await this.find(id, uid);
      if (latest.bytesReceived > offset) return this.replayPart(id, uid, offset, size, digest);
      if (!pending(latest) || Date.parse(latest.expiresAt) <= (await this.store.clock()).getTime()) {
        throw new FilePolicyError('state_conflict');
      }
      throw new FilePolicyError('part_mismatch');
    }
    const chunk = await this.quarantine.put(id, offset, bytes, digest);
    if (chunk.offset !== offset || chunk.size !== size || chunk.digest !== digest || chunk.objectName !== objectName) {
      throw Error('Invalid quarantine receipt.');
    }
    const updated = await this.store.append(uid, id, record.revision, chunk);
    return updated ?? this.replayPart(id, uid, offset, size, digest);
  }

  private async replayPart(id: string, uid: string, offset: number, size: number, digest: string): Promise<FileRecord> {
    const committed = await this.store.chunk(uid, id, offset);
    if (!committed) throw new FilePolicyError('state_conflict');
    if (committed.size !== size || committed.digest !== digest) throw new FilePolicyError('part_mismatch');
    return this.find(id, uid);
  }

  async verify(id: string, uid: string): Promise<FileRecord> {
    const record = await this.find(id, uid);
    if (!pending(record)) {
      if (record.state === 'SCANNING' || record.state === 'READY' || record.state === 'REJECTED') return record;
      throw new FilePolicyError('state_conflict');
    }
    if (record.bytesReceived !== record.declaredSize) throw new FilePolicyError('size_mismatch');
    if (Date.parse(record.expiresAt) <= (await this.store.clock()).getTime()) throw new FilePolicyError('state_conflict');
    const bytes = await this.assemble(record, AbortSignal.timeout(this.policy.inspectionTimeoutMs));
    const digest = sha256Hex(bytes);
    if (digest !== record.expectedDigest) return this.change(record, { state: 'REJECTED', rejectionReason: 'digest_mismatch' });
    const sniffedType = sniff(bytes);
    if (sniffedType !== record.declaredType) return this.change(record, { state: 'REJECTED', rejectionReason: 'type_mismatch' });
    return this.change(record, { state: 'SCANNING', digest, sniffedType });
  }

  /** A trusted worker calls this entry point. Scanner verdicts never come from the client. */
  async scan(id: string, uid: string): Promise<FileRecord> {
    const record = await this.find(id, uid);
    if (record.state === 'READY' || record.state === 'REJECTED') return record;
    if (record.state !== 'SCANNING' || !record.sniffedType || !record.digest) throw new FilePolicyError('state_conflict');
    if (Date.parse(record.expiresAt) <= (await this.store.clock()).getTime()) throw new FilePolicyError('state_conflict');
    const signal = AbortSignal.timeout(this.policy.inspectionTimeoutMs);
    const bytes = await this.assemble(record, signal);
    if (sha256Hex(bytes) !== record.digest) throw Error('Verified upload integrity check failed.');
    const verdict = await this.inspection.scan(bytes.slice(), record.sniffedType, signal);
    signal.throwIfAborted();
    if (verdict === 'infected') return this.change(record, {
      state: 'REJECTED', scanResult: 'infected', rejectionReason: 'scan_infected',
    });
    if (verdict !== 'clean') throw new FilePolicyError('inspection_unavailable');
    let parserOutputBytes = 0, archiveEntries = 0;
    if (this.policy.expandableTypes.includes(record.sniffedType)) {
      if (!this.inspection.expand) throw new FilePolicyError('inspection_unavailable');
      for await (const entry of this.inspection.expand(bytes, record.sniffedType, signal)) {
        signal.throwIfAborted();
        if (++archiveEntries > record.maxArchiveEntries) {
          return this.change(record, { state: 'REJECTED', rejectionReason: 'archive_entry_bound' });
        }
        for await (const part of entry) {
          signal.throwIfAborted();
          if (part.length > record.maxParserOutputBytes - parserOutputBytes) {
            return this.change(record, { state: 'REJECTED', rejectionReason: 'parser_output_bound' });
          }
          parserOutputBytes += part.length;
        }
      }
    }
    signal.throwIfAborted();
    return this.change(record, { state: 'READY', scanResult: 'clean', parserOutputBytes, archiveEntries });
  }

  async requireReady(id: string, uid: string): Promise<FileRecord> {
    const record = await this.find(id, uid);
    if (record.state !== 'READY') throw new FilePolicyError('not_ready');
    return record;
  }

  async cancel(id: string, uid: string): Promise<FileRecord> {
    const record = await this.find(id, uid);
    if (record.state === 'CANCELLED') return record;
    if (!pending(record) && record.state !== 'SCANNING') throw new FilePolicyError('state_conflict');
    return this.change(record, { state: 'CANCELLED' });
  }

  private async find(id: string, uid: string): Promise<FileRecord> {
    const record = await this.store.get(uid, id);
    if (!record) throw new FilePolicyError('not_found');
    return record;
  }

  private async change(record: FileRecord, patch: FilePatch): Promise<FileRecord> {
    const result = await this.store.transition(record.uid, record.id, record.revision, patch);
    if (!result) throw new FilePolicyError('state_conflict');
    return result;
  }

  private async assemble(record: FileRecord, signal: AbortSignal): Promise<Uint8Array> {
    const chunks = await this.store.chunks(record.uid, record.id);
    if (!chunks || chunks.length !== Math.ceil(record.declaredSize / record.chunkBytes)) {
      throw new FilePolicyError('state_conflict');
    }
    const bytes = new Uint8Array(record.declaredSize);
    let offset = 0;
    for (const chunk of chunks) {
      signal.throwIfAborted();
      if (chunk.offset !== offset || chunk.size !== Math.min(record.chunkBytes, record.declaredSize - offset)) {
        throw Error('Upload chunk manifest is incomplete.');
      }
      const part = await this.quarantine.read(chunk, signal);
      if (part.length !== chunk.size || sha256Hex(part) !== chunk.digest) throw Error('Upload chunk integrity check failed.');
      bytes.set(part, offset);
      offset += part.length;
    }
    signal.throwIfAborted();
    return bytes;
  }
}
