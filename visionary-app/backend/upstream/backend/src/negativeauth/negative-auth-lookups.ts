// PRIV-06 (KAN-115) — the negative-authorization gate's typed state seams.
// The owning stores (links, search index, telemetry, procedures) implement
// these at integration; the in-memory implementation is contract-true.
import type { PrivacyActor, SignedLink } from './negative-auth-types';

/** A search result the caller may or may not see. */
export interface SearchHit {
  resultId: string;
  ownerUid: string;
  visibility: 'private' | 'shared_with_caller' | 'public';
  snippet: string;
}

export interface NegativeAuthStore {
  signedLink(token: string): Promise<SignedLink | undefined>;
  searchHits(): Promise<SearchHit[]>;
  maySee(actor: PrivacyActor, hit: SearchHit): Promise<boolean>;
  procedures(): Promise<{ procedureId: string; kind: string; cadenceDays: number; steps: readonly string[] }[]>;
}

/** Contract-true in-memory store; links, hits and procedures are seeded. */
export class InMemoryNegativeAuthStore implements NegativeAuthStore {
  private links = new Map<string, SignedLink>();
  private hits: SearchHit[] = [];
  private procs: { procedureId: string; kind: string; cadenceDays: number; steps: readonly string[] }[] = [];

  seedLink(link: SignedLink): void {
    this.links.set(link.token, { ...link });
  }

  seedSearchHits(hits: readonly SearchHit[]): void {
    this.hits = hits.map((h) => ({ ...h }));
  }

  seedProcedures(procs: readonly { procedureId: string; kind: string; cadenceDays: number; steps: readonly string[] }[]): void {
    this.procs = procs.map((p) => ({ ...p, steps: [...p.steps] }));
  }

  async signedLink(token: string): Promise<SignedLink | undefined> {
    const found = this.links.get(token);
    return found ? { ...found } : undefined;
  }

  async searchHits(): Promise<SearchHit[]> {
    return this.hits.map((h) => ({ ...h }));
  }

  async maySee(actor: PrivacyActor, hit: SearchHit): Promise<boolean> {
    if (hit.visibility === 'public') return true;
    if (hit.visibility === 'shared_with_caller') return true; // share records checked upstream
    return hit.ownerUid === actor.uid;
  }

  async procedures() {
    return this.procs.map((p) => ({ ...p, steps: [...p.steps] }));
  }
}
