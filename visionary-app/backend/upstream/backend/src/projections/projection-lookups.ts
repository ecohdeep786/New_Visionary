// LEARN-03 (KAN-69) — the projection domain's typed state seams. The owning
// store (immutable evidence events + versioned projections) implements these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { EvidenceEvent, ProjectionOwner, ProjectionSnapshot } from './projection-types';

export interface EvidenceStore {
  appendEvent(event: EvidenceEvent): Promise<void>;
  eventsFor(owner: ProjectionOwner, conceptId: string): Promise<EvidenceEvent[]>;
  byEventId(eventId: string): Promise<EvidenceEvent | undefined>;
}

export interface SnapshotStore {
  saveSnapshot(snapshot: ProjectionSnapshot): Promise<void>;
  latestSnapshot(owner: ProjectionOwner, conceptId: string): Promise<ProjectionSnapshot | undefined>;
}

/** Contract-true in-memory store; append-only evidence, never rewritten. */
export class InMemoryProjectionStore implements EvidenceStore, SnapshotStore {
  private events = new Map<string, EvidenceEvent>();
  private snapshots: ProjectionSnapshot[] = [];

  async appendEvent(event: EvidenceEvent): Promise<void> {
    if (this.events.has(event.eventId)) return; // idempotent append
    this.events.set(event.eventId, { ...event, owner: { ...event.owner } });
  }

  async eventsFor(owner: ProjectionOwner, conceptId: string): Promise<EvidenceEvent[]> {
    return [...this.events.values()]
      .filter((e) => e.owner.uid === owner.uid && e.owner.workspaceId === owner.workspaceId && e.conceptId === conceptId)
      .map((e) => ({ ...e, owner: { ...e.owner } }))
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.eventId.localeCompare(b.eventId));
  }

  async byEventId(eventId: string): Promise<EvidenceEvent | undefined> {
    const found = this.events.get(eventId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async saveSnapshot(snapshot: ProjectionSnapshot): Promise<void> {
    this.snapshots.push({ ...snapshot, owner: { ...snapshot.owner }, projection: { ...snapshot.projection, assessed: { ...snapshot.projection.assessed }, reviewDue: { ...snapshot.projection.reviewDue } } });
  }

  async latestSnapshot(owner: ProjectionOwner, conceptId: string): Promise<ProjectionSnapshot | undefined> {
    const found = this.snapshots
      .filter((s) => s.owner.uid === owner.uid && s.owner.workspaceId === owner.workspaceId && s.conceptId === conceptId)
      .sort((a, b) => a.projectionVersion - b.projectionVersion);
    const latest = found[found.length - 1];
    return latest ? { ...latest, owner: { ...latest.owner }, projection: { ...latest.projection, assessed: { ...latest.projection.assessed }, reviewDue: { ...latest.projection.reviewDue } } } : undefined;
  }
}
