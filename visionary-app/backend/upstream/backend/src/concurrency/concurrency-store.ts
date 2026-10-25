// DATA-08 — authority proof runner contract + in-memory synthetic store.
// The Cloud SQL adapter implements the same surface over the DATA-01
// workspace/consent/command rows so a real backend can run the same proof.
import type { ConnectionSpan, PoolConfig, AuthorityProbe } from './concurrency-types';
import type { RaceReport, ProbeOutcome } from './concurrency-types';

export interface ProofStore {
  role(uid: string, workspaceId: string): Promise<string | null>;
  /** Owner uid of a resource (workspace, document, grant) — authority is the owning uid, never the requester. */
  ownerOf(resourceType: string, resourceId: string): Promise<string | null>;
  subjectGrant(uid: string, purpose: string, resourceId: string | null): Promise<{ id: string; state: 'active' | 'expired' | 'revoked' } | null>;
  commandState(commandId: string): Promise<{ uid: string; digest: string; status: string } | null>;
  /** Record a proof detail line for the report. */
  appendDetail(line: string): void;
  /** Persist an active grant for a subject purpose/resource (server-authoritative). */
  applyGrant(uid: string, purpose: string, resourceId: string | null): Promise<void>;
  /** Persist a revocation for the subject's grant. */
  applyRevoke(uid: string, purpose: string, resourceId: string | null): Promise<void>;
}

export class InMemoryProofStore implements ProofStore {
  readonly members = new Map<string, string>(); // `${uid}:${workspaceId}` -> role
  readonly resources = new Map<string, { uid: string; state: 'active' | 'expired' | 'revoked' }>(); // `${type}:${id}` -> record
  readonly grants = new Map<string, { uid: string; purpose: string; resourceId: string | null; state: 'active' | 'expired' | 'revoked' }>();
  readonly commands = new Map<string, { uid: string; digest: string; status: string }>();
  readonly details: string[] = [];

  seedMember(uid: string, workspaceId: string, role: string) { this.members.set(`${uid}:${workspaceId}`, role); }
  seedResource(type: string, id: string, state: 'active' | 'expired' | 'revoked' = 'active', uid = 'seed-owner') { this.resources.set(`${type}:${id}`, { uid, state }); }
  seedGrant(id: string, grant: { uid: string; purpose: string; resourceId: string | null; state: 'active' | 'expired' | 'revoked' }) { this.grants.set(id, grant); }
  seedCommand(id: string, cmd: { uid: string; digest: string; status: string }) { this.commands.set(id, cmd); }

  async role(uid: string, workspaceId: string): Promise<string | null> {
    return this.members.get(`${uid}:${workspaceId}`) ?? null;
  }
  async ownerOf(resourceType: string, resourceId: string): Promise<string | null> {
    return this.resources.get(`${resourceType}:${resourceId}`)?.uid ?? null;
  }
  async subjectGrant(uid: string, purpose: string, resourceId: string | null): Promise<{ id: string; state: 'active' | 'expired' | 'revoked' } | null> {
    for (const [id, g] of this.grants) {
      if (g.uid === uid && g.purpose === purpose && (g.resourceId ?? null) === (resourceId ?? null)) return { id, state: g.state };
    }
    return null;
  }
  async commandState(commandId: string): Promise<{ uid: string; digest: string; status: string } | null> {
    return this.commands.get(commandId) ?? null;
  }
  appendDetail(line: string) { this.details.push(line); }
  async applyGrant(uid: string, purpose: string, resourceId: string | null) {
    const id = `cg_${uid}_${purpose}_${resourceId ?? '*'}`;
    this.grants.set(id, { uid, purpose, resourceId, state: 'active' });
  }
  async applyRevoke(uid: string, purpose: string, resourceId: string | null) {
    for (const [id, g] of this.grants) {
      if (g.uid === uid && g.purpose === purpose && (g.resourceId ?? null) === (resourceId ?? null)) { this.grants.set(id, { ...g, state: 'revoked' }); break; }
    }
  }
}

/** Bounded pool gate: caps total connections across all instances and exposes an advisory lock for a subject key. */
export class BoundedConnectionPool {
  readonly spans = new Map<string, ConnectionSpan>();
  private next = 0;
  private readonly limit: number;

  constructor(private readonly config: PoolConfig) {
    this.limit = config.totalAllowed;
    if (!Number.isSafeInteger(this.limit) || this.limit < 1) throw new Error('INVALID_POOL: totalAllowed must be a positive integer.');
    if (!Number.isSafeInteger(config.instances) || config.instances < 1) throw new Error('INVALID_POOL: instances must be a positive integer.');
  }

  get totalAllowed() { return this.limit; }

  /** Number of currently-acquired (busy) connections across all instances. */
  active() { return [...this.spans.values()].filter((c) => c.state === 'busy').length; }

  private id(prefix: string) { return `${prefix}_${++this.next}`; }

  /** Acquire a connection; throws POOL_EXHAUSTED when the fleet-wide limit is reached. */
  async acquire(instanceId: string, timeoutMs = 1000): Promise<Connection> {
    const deadline = Date.now() + timeoutMs;
    while (this.active() >= this.limit) {
      if (Date.now() >= deadline) throw new Error('POOL_EXHAUSTED: total instance connections bounded by the pool limit.');
      await new Promise((r) => setTimeout(r, 5));
    }
    const id = this.id('conn');
    const span: ConnectionSpan = { id, instanceId, state: 'busy', acquiredAt: new Date().toISOString(), releasedAt: null, lastError: null };
    this.spans.set(id, span);
    return new Connection(this, span);
  }

  /** Release a connection back; idempotent. */
  async release(id: string): Promise<void> {
    const span = this.spans.get(id);
    if (!span || span.state === 'closed') return;
    span.state = 'idle';
    span.releasedAt = new Date().toISOString();
  }

  /** Simulate a dropped connection: mark it closed so recovery can re-acquire. */
  async simulateDrop(id: string, error = 'NETWORK_ERROR') {
    const span = this.spans.get(id);
    if (!span) return;
    span.state = 'closed';
    span.lastError = error;
  }

  /** Count spans currently closed (awaiting/recovered from disconnect). */
  closed() { return [...this.spans.values()].filter((c) => c.state === 'closed').length; }

  list() { return [...this.spans.values()]; }
}

export class Connection {
  constructor(private readonly pool: BoundedConnectionPool, readonly span: ConnectionSpan) {}
  get id() { return this.span.id; }
  async release() { await this.pool.release(this.span.id); }
  /** After a reconnect, the previous connection is retired and a fresh one is acquired. */
  async recover(instanceId: string) {
    await this.pool.simulateDrop(this.span.id);
    return this.pool.acquire(instanceId);
  }
}

export type { PoolConfig };
export type { ConnectionSpan };
