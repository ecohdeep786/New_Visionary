import type { FileRecord } from './file-types';

export interface UploadPart {
  offset: number;
  size: number;
  digest: string;
  objectName: string;
}

export interface StoredChunk extends UploadPart {
  generation: string;
}

export function uploadPartName(id: string, offset: number, digest: string): string {
  return 'file-01/' + id + '/' + offset + '-' + digest;
}

export interface QuarantineStorage {
  put(id: string, offset: number, bytes: Uint8Array, digest: string): Promise<StoredChunk>;
  read(chunk: StoredChunk, signal: AbortSignal): Promise<Uint8Array>;
}

export type FilePatch = Partial<Pick<FileRecord, 'digest' | 'sniffedType' |
  'scanResult' | 'rejectionReason' | 'parserOutputBytes' | 'archiveEntries'>> & {
  state: Exclude<FileRecord['state'], 'INTENT' | 'UPLOADING'>;
};

export interface FileStore {
  clock(): Promise<Date>;
  create(record: FileRecord): Promise<boolean>;
  get(uid: string, id: string): Promise<FileRecord | null>;
  chunks(uid: string, id: string): Promise<StoredChunk[] | null>;
  chunk(uid: string, id: string, offset: number): Promise<StoredChunk | null>;
  reserve(uid: string, id: string, revision: number, part: UploadPart): Promise<boolean>;
  append(uid: string, id: string, revision: number, chunk: StoredChunk): Promise<FileRecord | null>;
  transition(uid: string, id: string, revision: number, patch: FilePatch): Promise<FileRecord | null>;
}
