// DATA-07 — repository contract + in-memory synthetic implementation for
// owner-scoped UID projections. Every query is scoped by owner uid: a caller
// only ever sees rows where the uid is the subject (membership, consent,
// command history, audit) or belongs to a workspace the uid is a member of or
// created. A raw row is never returned; pagination is cursor-based and bounded
// to MAX_PAGE_SIZE before materialization. The Cloud SQL/Firestore adapter
// implements the same contract.
import type { WorkspaceProjection, MembershipProjection, ConsentProjection, CommandHistoryRow, AuditEventProjection, ProjectionRole } from './overview-types';
import { MAX_PAGE_SIZE } from './overview-types';

interface SeedWorkspace extends WorkspaceProjection { uid: string; }
interface SeedMembership extends MembershipProjection { uid: string; }
interface SeedConsent extends ConsentProjection { uid: string; }
interface SeedCommand extends CommandHistoryRow { uid: string; }
interface SeedAudit extends AuditEventProjection { uid: string; }

export interface OverviewStore {
  accountOverview(uid: string): Promise<{
    profile: { displayName: string | null; emailHint: string | null } | null;
    billing: { plan: string | null; currency: string | null; status: string | null } | null;
    redacted: string[];
  }>;
  /** Workspaces the uid created or is an explicit member of. Never ALL workspaces of a role. */
  workspaceRows(uid: string): Promise<WorkspaceProjection[]>;
  membershipRows(uid: string): Promise<MembershipProjection[]>;
  consentRows(uid: string): Promise<ConsentProjection[]>;
  commandHistory(uid: string, afterCursor: string | null, size: number): Promise<{ rows: CommandHistoryRow[]; nextCursor: string | null }>;
  auditRows(uid: string, afterCursor: string | null, size: number): Promise<{ rows: AuditEventProjection[]; nextCursor: string | null }>;
  workspaceRole(uid: string, workspaceId: string): Promise<ProjectionRole | null>;
}

export class InMemoryOverviewStore implements OverviewStore {
  readonly workspaces = new Map<string, SeedWorkspace>();
  readonly memberships = new Map<string, SeedMembership>();
  readonly consents = new Map<string, SeedConsent>();
  readonly commands: SeedCommand[] = [];
  readonly audits: SeedAudit[] = [];
  private acc: { uid: string; profile: { displayName: string | null; emailHint: string | null } | null; billing: { plan: string | null; currency: string | null; status: string | null } | null; redacted: string[] } = { uid: '', profile: null, billing: null, redacted: [] };

  seedAccount(overview: { uid: string; profile: { displayName: string | null; emailHint: string | null } | null; billing: { plan: string | null; currency: string | null; status: string | null } | null; redacted?: string[] }) {
    this.acc = { uid: overview.uid, profile: overview.profile, billing: overview.billing, redacted: overview.redacted ?? [] };
  }

  async accountOverview(uid: string) {
    if (uid !== this.acc.uid) return { profile: null, billing: null, redacted: [] };
    return { profile: this.acc.profile, billing: this.acc.billing, redacted: this.acc.redacted.slice() };
  }

  seedWorkspace(w: SeedWorkspace, ownerUid: string) { this.workspaces.set(w.id, { ...w, uid: ownerUid }); }
  async workspaceRows(uid: string): Promise<WorkspaceProjection[]> {
    const memberWorkspaceIds = new Set<string>();
    for (const m of this.memberships.values()) if (m.uid === uid) memberWorkspaceIds.add(m.workspaceId);
    return [...this.workspaces.values()]
      .filter((w) => w.uid === uid || memberWorkspaceIds.has(w.id))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ uid: _ignore, ...rest }) => rest);
  }

  seedMembership(m: SeedMembership) { this.memberships.set(`${m.uid}:${m.workspaceId}`, m); }
  async membershipRows(uid: string): Promise<MembershipProjection[]> {
    return [...this.memberships.values()].filter((m) => m.uid === uid).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  }

  seedConsent(c: SeedConsent) { this.consents.set(c.id, c); }
  async consentRows(uid: string): Promise<ConsentProjection[]> {
    return [...this.consents.values()].filter((c) => c.uid === uid).sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))
      .map(({ uid: _ignore, ...rest }) => rest);
  }

  pushCommand(row: SeedCommand) { this.commands.push(row); this.commands.sort((a, b) => (b.committedAt ?? '').localeCompare(a.committedAt ?? '')); }
  async commandHistory(uid: string, afterCursor: string | null, size: number) {
    const limit = Math.min(size, MAX_PAGE_SIZE);
    const rows = this.commands.filter((r) => r.uid === uid).map(({ uid: _ignore, ...rest }) => rest);
    return this.pageRows(rows, afterCursor, limit);
  }

  pushAudit(row: SeedAudit) { this.audits.push(row); this.audits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async auditRows(uid: string, afterCursor: string | null, size: number) {
    const limit = Math.min(size, MAX_PAGE_SIZE);
    const rows = this.audits.filter((r) => r.uid === uid).map(({ uid: _ignore, ...rest }) => rest);
    return this.pageRows(rows, afterCursor, limit);
  }

  async workspaceRole(uid: string, workspaceId: string): Promise<ProjectionRole | null> {
    const ws = this.workspaces.get(workspaceId);
    if (ws?.uid === uid) return 'OWNER';
    const m = this.memberships.get(`${uid}:${workspaceId}`);
    return m ? m.role : null;
  }

  private pageRows<T extends { id: string }>(rows: T[], after: string | null, limit: number) {
    if (limit < 1) return { rows: [], nextCursor: null };
    let index = 0;
    if (after) {
      const found = rows.findIndex((r) => r.id === after);
      if (found === -1) return { rows: [], nextCursor: null }; // unknown cursor → empty bounded page, no data leak
      index = found + 1;
    }
    const slice = rows.slice(index, index + limit);
    const nextCursor = index + limit < rows.length && slice.length > 0 ? slice[slice.length - 1].id : null;
    return { rows: slice, nextCursor };
  }
}
