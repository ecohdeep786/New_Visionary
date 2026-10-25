// DATA-03 — provisioning store contract + in-memory synthetic implementation.
// SQL owns the personal workspace domain rows (person, workspace, OWNER
// membership); Firestore remains the account/profile/billing authority and is
// never written by provisioning. The in-memory store is the synthetic fixture
// (same style as the repo's Firestore fixtures) so the enabler is fully tested
// without a live Cloud SQL/Firestore.
import type { PersonalWorkspace, ProvisionReceipt, ProvisionState } from './provision-types';

export interface ProvisionStore {
  ensurePerson(uid: string): Promise<void>;
  personalWorkspaceFor(uid: string): Promise<PersonalWorkspace | null>;
  createPersonalWorkspace(uid: string, name: string, slug: string): Promise<PersonalWorkspace>;
  ensureOwnerMembership(uid: string, workspaceId: string): Promise<void>;
  readState(uid: string): Promise<ProvisionState | null>;
  writeState(uid: string, state: ProvisionState): Promise<void>;
  readReceipt(commandId: string): Promise<ProvisionReceipt | null>;
  writeReceipt(receipt: ProvisionReceipt): Promise<void>;
}

export class InMemoryProvisionStore implements ProvisionStore {
  readonly persons = new Set<string>();
  readonly workspaces = new Map<string, PersonalWorkspace>();
  readonly byUid = new Map<string, string>(); // uid -> personal workspace id
  readonly memberships = new Set<string>(); // `${uid}:${workspaceId}`
  readonly states = new Map<string, ProvisionState>();
  readonly receipts = new Map<string, ProvisionReceipt>();
  /** Emulated Firestore account/profile/billing rows that provisioning must preserve. */
  readonly firestore = new Map<string, unknown>();

  // Leave a SQL write half-applied to emulate an interrupted provisioning run.
  interruptAfter: 'person' | 'workspace' | 'membership' | null = null;

  async ensurePerson(uid: string): Promise<void> {
    this.persons.add(uid);
    if (this.interruptAfter === 'person') { this.interruptAfter = null; throw new Error('SIMULATED_INTERRUPTION: person recorded, provisioning not complete'); }
  }

  async personalWorkspaceFor(uid: string): Promise<PersonalWorkspace | null> {
    const id = this.byUid.get(uid);
    if (!id) return null;
    return this.workspaces.get(id) ?? null;
  }

  async createPersonalWorkspace(uid: string, name: string, slug: string): Promise<PersonalWorkspace> {
    const existing = this.byUid.get(uid);
    if (existing) return this.workspaces.get(existing)!;
    const id = 'ws_' + this.workspaces.size + 1;
    const ws: PersonalWorkspace = { id, uid, name, slug };
    this.workspaces.set(id, ws);
    this.byUid.set(uid, id);
    if (this.interruptAfter === 'workspace') { this.interruptAfter = null; throw new Error('SIMULATED_INTERRUPTION: workspace created without membership'); }
    return ws;
  }

  async ensureOwnerMembership(uid: string, workspaceId: string): Promise<void> {
    const key = `${uid}:${workspaceId}`;
    if (!this.memberships.has(key)) this.memberships.add(key);
    if (this.interruptAfter === 'membership') { this.interruptAfter = null; throw new Error('SIMULATED_INTERRUPTION: membership not yet recorded'); }
  }

  async readState(uid: string): Promise<ProvisionState | null> { return this.states.get(uid) ?? null; }
  async writeState(uid: string, state: ProvisionState): Promise<void> { this.states.set(uid, state); }
  async readReceipt(commandId: string): Promise<ProvisionReceipt | null> { return this.receipts.get(commandId) ?? null; }
  async writeReceipt(receipt: ProvisionReceipt): Promise<void> { this.receipts.set(receipt.commandId, receipt); }
}
