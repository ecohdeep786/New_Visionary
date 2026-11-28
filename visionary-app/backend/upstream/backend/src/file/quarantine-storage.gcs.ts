import type { QuarantineStorage, StoredChunk } from './file-store';
import { uploadPartName } from './file-store';
import { sha256Hex } from './file-types';

const origin = 'https://storage.googleapis.com';
const objectPattern = /^file-01\/file_[a-f0-9-]{36}\/[0-9]{1,9}-[a-f0-9]{64}$/;
const generationPattern = /^[1-9][0-9]{0,19}$/;
const maxChunkBytes = 1024 * 1024;

export class GcsQuarantineStorage implements QuarantineStorage {
  constructor(
    private readonly bucket: string,
    private readonly accessToken: () => Promise<string | null>,
    private readonly request: typeof fetch = fetch,
  ) {
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw Error('Invalid quarantine bucket.');
  }

  private async call(url: URL, init: RequestInit = {}): Promise<Response> {
    const token = await this.accessToken();
    if (!token) throw Error('Quarantine credentials unavailable.');
    return this.request(url, {
      ...init,
      headers: { ...init.headers, Authorization: 'Bearer ' + token },
      redirect: 'error',
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
    });
  }

  private objectUrl(objectName: string): URL {
    return new URL('/storage/v1/b/' + this.bucket + '/o/' + encodeURIComponent(objectName), origin);
  }

  async put(id: string, offset: number, bytes: Uint8Array, digest: string): Promise<StoredChunk> {
    const objectName = uploadPartName(id, offset, digest);
    if (!objectPattern.test(objectName) || bytes.length < 1 || bytes.length > maxChunkBytes ||
        sha256Hex(bytes) !== digest) throw Error('Invalid quarantine chunk.');
    const url = new URL('/upload/storage/v1/b/' + this.bucket + '/o', origin);
    url.search = new URLSearchParams({ uploadType: 'media', ifGenerationMatch: '0', name: objectName }).toString();
    let response = await this.call(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(bytes),
    });
    if (response.status === 412) {
      await response.body?.cancel();
      response = await this.call(this.objectUrl(objectName));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw Error('Quarantine write unavailable.');
    }
    const meta = await response.json() as { bucket?: string; name?: string; size?: string; generation?: string };
    if (meta.bucket !== this.bucket || meta.name !== objectName || meta.size !== String(bytes.length) ||
        !meta.generation || !generationPattern.test(meta.generation)) throw Error('Invalid quarantine write receipt.');
    return { objectName, offset, size: bytes.length, digest, generation: meta.generation };
  }

  async read(chunk: StoredChunk, signal: AbortSignal): Promise<Uint8Array> {
    const { objectName, generation, size, digest } = chunk;
    if (!objectPattern.test(objectName) || !generationPattern.test(generation) ||
        !Number.isSafeInteger(size) || size < 1 || size > maxChunkBytes) throw Error('Invalid quarantine read target.');
    const url = this.objectUrl(objectName);
    url.search = new URLSearchParams({ alt: 'media', generation, ifGenerationMatch: generation }).toString();
    const response = await this.call(url, { signal });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw Error('Quarantine read unavailable.');
    }
    const bytes = new Uint8Array(size);
    const reader = response.body.getReader();
    let written = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (written + value.length > size) throw Error('Quarantine chunk size mismatch.');
        bytes.set(value, written);
        written += value.length;
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    if (written !== size || sha256Hex(bytes) !== digest) throw Error('Quarantine chunk integrity check failed.');
    return bytes;
  }
}
