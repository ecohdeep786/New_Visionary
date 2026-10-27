// AI-06 (KAN-88) — the ML gate's typed state seams. The owning stores
// (source facts, workspace permissions) implement these at integration; the
// in-memory implementation is contract-true and fails closed.
import type { MlCaller, MlSourceFact } from './ml-gate-types';

export interface MlSourceLookup {
  /** All candidate source facts for the requested locale (server-side). */
  candidateSources(locale: string): Promise<MlSourceFact[]>;
  /** True only when the caller may retrieve this source in this workspace. */
  mayRetrieve(caller: MlCaller, sourceId: string): Promise<boolean>;
}

/** Contract-true in-memory store; permission filtering is server-side. */
export class InMemoryMlStore implements MlSourceLookup {
  constructor(
    private readonly sources: readonly MlSourceFact[],
    private readonly forbidden = new Set<string>(),
  ) {}

  async candidateSources(locale: string): Promise<MlSourceFact[]> {
    return this.sources.filter((s) => s.locale === locale).map((s) => ({ ...s }));
  }

  async mayRetrieve(_caller: MlCaller, sourceId: string): Promise<boolean> {
    return !this.forbidden.has(sourceId);
  }
}
