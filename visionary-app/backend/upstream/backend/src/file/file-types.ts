// FILE-01 — authorized upload intent → private quarantine → digest/type/size
// verification → scan → ready lifecycle for private immutable file objects.
//
// Mirrors the owning-store shape used by DATA-01 so the enabler maps 1:1 onto
// private-object rows at integration. An upload is never readable, listed,
// exported or embedded until it has passed verification AND scan AND reached
// READY; every earlier state is private quarantine. A record's owning uid is
// authoritative (server-side); a device/job cannot read or mutate a record it
// does not own.

export type FileState =
  | 'INTENT' // authorized upload intent created; no bytes yet; private quarantine
  | 'UPLOADING' // resumable chunks arriving; still private quarantine
  | 'VERIFYING' // bytes complete; digest/type/size checks running; quarantine
  | 'SCANNING' // verified; scan running; quarantine
  | 'READY' // verified + scan-verified; the only state devices may consume
  | 'REJECTED' // verification or scan failed (or bounds exceeded); not silently dropped
  | 'CANCELLED'; // user cancelled before READY; no bytes are admitted

export interface FileRecord {
  id: string;
  uid: string; // owning uid — server-authoritative
  workspaceId: string | null;
  name: string;
  declaredType: string; // caller-declared MIME type
  declaredSize: number; // caller-declared byte count
  state: FileState;
  createdAt: string;
  /** Bytes received so far (durable upload progress for resumption). */
  bytesReceived: number;
  /** Expected size — verification compares bytesReceived to declaredSize. */
  expectedSize: number;
  /** sha256 over admitted bytes computed at VERIFYING; null until computed. */
  digest: string | null;
  /** MIME type independently sniffed from the admitted bytes at verification. */
  sniffedType: string | null;
  scanResult: 'clean' | 'infected' | null;
  rejectionReason: string | null;
  /** Total attempted bytes-touches (parser/archive output cap enforcement). */
  parserOutputBytes: number;
  maxParserOutputBytes: number;
  lastError: string | null;
}

/** Upload lifecycle policy: acceptable types, size bounds, scan + parser output caps. */
export interface FilePolicy {
  maxFileBytes: number;
  /** Acceptable MIME types for container/archive expansion — other types only pass as opaque blobs. */
  expandableTypes: string[];
  maxParserOutputBytes: number; // bounded parser/archive extraction cap
  maxArchiveEntries: number; // bounded archive member expansion cap
}

export const DEFAULT_FILE_POLICY: FilePolicy = {
  maxFileBytes: 25 * 1024 * 1024,
  expandableTypes: ['application/pdf', 'text/markdown'],
  maxParserOutputBytes: 50 * 1024 * 1024,
  maxArchiveEntries: 1000,
};

/** Deterministic sha256 of a byte sequence (pure helper used by the service and tests). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes); // detach any shared/underylying ArrayBufferLike view
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
