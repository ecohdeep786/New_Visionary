// LEARN-14 (KAN-159) — the stage-continuity domain's typed state seams.
// The owning stores (reviewed mappings, append-only events, proposals,
// postponed proposals, exit records, preserved due dates/assignment labels)
// implement these at integration; the in-memory implementation is contract-true
// and fails closed.
import type {
  PromotionProposal,
  StageEvent,
  StageMapping,
  StageOwner,
} from './stage-types';

export interface StageStore {
  saveMapping(mapping: StageMapping): Promise<void>;
  mapping(mappingId: string): Promise<StageMapping | undefined>;
  findReviewedMapping(fromStage: string, toStage: string): Promise<StageMapping | undefined>;
  saveProposal(proposal: PromotionProposal): Promise<void>;
  proposal(proposalId: string): Promise<PromotionProposal | undefined>;
  saveEvent(event: StageEvent): Promise<void>;
  eventsFor(owner: StageOwner): Promise<StageEvent[]>;
  event(eventId: string): Promise<StageEvent | undefined>;
  /** Preserved review due dates (never rewritten by continuity). */
  reviewDueDates(owner: StageOwner): Promise<readonly { conceptId: string; dueAt: string }[]>;
  /** Preserved fixed assignment labels (never rewritten by continuity). */
  assignmentLabels(owner: StageOwner): Promise<readonly { assignmentId: string; label: string }[]>;
  commandPayload(commandKey: string): Promise<string | undefined>;
  recordCommand(commandKey: string, payloadHash: string): Promise<void>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ownerKey(owner: StageOwner): string {
  return `${owner.uid}|${owner.workspaceId}`;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryStageStore implements StageStore {
  private mappings = new Map<string, StageMapping>();
  private proposals = new Map<string, PromotionProposal>();
  private eventList = new Map<string, StageEvent[]>();
  private dueDates = new Map<string, { conceptId: string; dueAt: string }[]>();
  private labels = new Map<string, { assignmentId: string; label: string }[]>();
  private commands = new Map<string, string>();

  async saveMapping(mapping: StageMapping): Promise<void> {
    this.mappings.set(mapping.mappingId, clone(mapping));
  }
  async mapping(mappingId: string): Promise<StageMapping | undefined> {
    const found = this.mappings.get(mappingId);
    return found ? clone(found) : undefined;
  }
  async findReviewedMapping(fromStage: string, toStage: string): Promise<StageMapping | undefined> {
    for (const m of this.mappings.values()) {
      if (m.fromStage === fromStage && m.toStage === toStage && m.reviewedBy) return clone(m);
    }
    return undefined;
  }
  async saveProposal(proposal: PromotionProposal): Promise<void> {
    this.proposals.set(proposal.proposalId, clone(proposal));
  }
  async proposal(proposalId: string): Promise<PromotionProposal | undefined> {
    const found = this.proposals.get(proposalId);
    return found ? clone(found) : undefined;
  }
  async saveEvent(event: StageEvent): Promise<void> {
    const key = ownerKey(event.owner);
    const list = this.eventList.get(key) ?? [];
    list.push(clone(event));
    this.eventList.set(key, list);
  }
  async eventsFor(owner: StageOwner): Promise<StageEvent[]> {
    return clone(this.eventList.get(ownerKey(owner)) ?? []);
  }
  async event(eventId: string): Promise<StageEvent | undefined> {
    for (const list of this.eventList.values()) {
      const found = list.find((e) => e.eventId === eventId);
      if (found) return clone(found);
    }
    return undefined;
  }
  async reviewDueDates(owner: StageOwner): Promise<readonly { conceptId: string; dueAt: string }[]> {
    return clone(this.dueDates.get(ownerKey(owner)) ?? []);
  }
  /** Test/ingestion helper: seed preserved due dates (owned elsewhere). */
  seedDueDates(owner: StageOwner, rows: { conceptId: string; dueAt: string }[]): void {
    this.dueDates.set(ownerKey(owner), clone(rows));
  }
  async assignmentLabels(owner: StageOwner): Promise<readonly { assignmentId: string; label: string }[]> {
    return clone(this.labels.get(ownerKey(owner)) ?? []);
  }
  /** Test/ingestion helper: seed fixed assignment labels (owned elsewhere). */
  seedAssignmentLabels(owner: StageOwner, rows: { assignmentId: string; label: string }[]): void {
    this.labels.set(ownerKey(owner), clone(rows));
  }
  async commandPayload(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey);
  }
  async recordCommand(commandKey: string, payloadHash: string): Promise<void> {
    this.commands.set(commandKey, payloadHash);
  }
}
