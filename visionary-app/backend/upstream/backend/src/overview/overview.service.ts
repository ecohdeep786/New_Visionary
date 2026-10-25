// DATA-07 — owner-scoped UID overview projection service.
//
// Every repository read is owner-scoped and every DTO is built by the server
// from redacted fields. Private security fields (tokens, session ids, raw IPs,
// user agents, payment identifiers) never appear in a projection. History is
// cursor-paginated and bounded — there is no unlimited user-history document.
import type { AccountOverviewDto, CommandHistoryRow, Page, PageCursor, WorkspaceProjection, MembershipProjection, ConsentProjection, AuditEventProjection } from './overview-types';
import { DEFAULT_PAGE_SIZE } from './overview-types';
import type { OverviewStore } from './overview-store';

export class OverviewPolicyError extends Error {
  constructor(public readonly code: 'unauthorized' | 'invalid_cursor' | 'invalid_page') {
    super(code);
  }
}

export interface OverviewServiceOptions {
  now?: () => Date;
}

export class OverviewService {
  private readonly now: () => Date;

  constructor(private readonly store: OverviewStore, options: OverviewServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  private when() { return this.now().toISOString(); }

  private assertPageSize(size: unknown): number {
    if (size === undefined || size === null) return DEFAULT_PAGE_SIZE;
    if (typeof size === 'number' && Number.isSafeInteger(size) && size >= 1) return size;
    if (typeof size === 'string' && /^\d+$/.test(size)) {
      const n = Number(size);
      if (n >= 1) return n;
    }
    throw new OverviewPolicyError('invalid_page');
  }

  private assertCursor(after: unknown): string | null {
    if (after === undefined || after === null) return null;
    if (typeof after !== 'string' || after.length === 0 || after.length > 128 || !/^[A-Za-z0-9_-]+$/.test(after)) {
      throw new OverviewPolicyError('invalid_cursor');
    }
    return after;
  }

  private page<T>(rows: T[], nextCursor: string | null): Page<T> {
    return { items: rows, nextCursor: nextCursor ? { value: nextCursor } : null, hasMore: nextCursor !== null };
  }

  /** The verified uid's redacted account/domain overview. Wrong-owner access is impossible by construction (uid is server-derived). */
  async overview(uid: string): Promise<AccountOverviewDto & { workspaces: WorkspaceProjection[]; memberships: MembershipProjection[]; consents: ConsentProjection[]; history: Page<CommandHistoryRow>; audit: Page<AuditEventProjection> }> {
    const [account, workspaces, memberships, consents, history, audit] = await Promise.all([
      this.store.accountOverview(uid),
      this.store.workspaceRows(uid),
      this.store.membershipRows(uid),
      this.store.consentRows(uid),
      this.store.commandHistory(uid, null, DEFAULT_PAGE_SIZE),
      this.store.auditRows(uid, null, DEFAULT_PAGE_SIZE),
    ]);
    return {
      uid,
      asOf: this.when(),
      profile: account.profile,
      billing: account.billing,
      redacted: account.redacted,
      workspaces,
      memberships,
      consents,
      history: this.page(history.rows, history.nextCursor),
      audit: this.page(audit.rows, audit.nextCursor),
    };
  }

  /** Paginated, redacted command history for the verified uid. */
  async history(uid: string, after?: unknown, size?: unknown): Promise<Page<CommandHistoryRow>> {
    const cursor = this.assertCursor(after);
    const limit = this.assertPageSize(size);
    const { rows, nextCursor } = await this.store.commandHistory(uid, cursor, limit);
    return this.page(rows, nextCursor);
  }

  /** Paginated, redacted audit projection for the verified uid. */
  async audit(uid: string, after?: unknown, size?: unknown): Promise<Page<AuditEventProjection>> {
    const cursor = this.assertCursor(after);
    const limit = this.assertPageSize(size);
    const { rows, nextCursor } = await this.store.auditRows(uid, cursor, limit);
    return this.page(rows, nextCursor);
  }
}

export type { PageCursor };
