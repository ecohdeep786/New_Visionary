import { createHash } from 'node:crypto';

export type FileState = 'INTENT' | 'UPLOADING' | 'SCANNING' | 'READY' | 'REJECTED' | 'CANCELLED';

export interface FileRecord {
  id: string;
  uid: string;
  workspaceId: string | null;
  name: string;
  declaredType: string;
  declaredSize: number;
  expectedDigest: string;
  state: FileState;
  revision: number;
  createdAt: string;
  expiresAt: string;
  bytesReceived: number;
  chunkBytes: number;
  digest: string | null;
  sniffedType: string | null;
  scanResult: 'clean' | 'infected' | null;
  rejectionReason: string | null;
  parserOutputBytes: number;
  archiveEntries: number;
  maxParserOutputBytes: number;
  maxArchiveEntries: number;
}

export interface FilePolicy {
  maxFileBytes: number;
  chunkBytes: number;
  intentLifetimeMs: number;
  inspectionTimeoutMs: number;
  allowedTypes: readonly string[];
  expandableTypes: readonly string[];
  maxParserOutputBytes: number;
  maxArchiveEntries: number;
}

export const DEFAULT_FILE_POLICY: FilePolicy = Object.freeze({
  maxFileBytes: 25 * 1024 * 1024,
  chunkBytes: 512 * 1024,
  intentLifetimeMs: 24 * 60 * 60 * 1000,
  inspectionTimeoutMs: 30_000,
  allowedTypes: Object.freeze(['application/pdf', 'application/zip', 'text/plain', 'image/png', 'image/jpeg']),
  expandableTypes: Object.freeze(['application/pdf', 'application/zip']),
  maxParserOutputBytes: 50 * 1024 * 1024,
  maxArchiveEntries: 1000,
});

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
