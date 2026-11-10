// DATA-07 — owner-scoped UID overview projection service.
//
// Every repository read is owner-scoped and every DTO is built by the server
// from redacted fields. Private security fields (tokens, session ids, raw IPs,
// user agents, payment identifiers) never appear in a projection. History is
// cursor-paginated and bounded — there is no unlimited user-history document.
import type { AccountOverviewDto, CommandHistoryRow, Page, PageCursor, WorkspaceProjection, MembershipProjection, ConsentProjection, AuditEventProjection } from './overview-types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './overview-types';
import { accountProjection, workspaceProjection, membershipProjection, consentProjection, commandProjection, auditProjection } from './overview-projections';
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

  private assertUid(uid: string) {
    if (typeof uid !== 'string' || !uid.trim() || uid.length > 128 || /[\x00-\x1f\x7f]/.test(uid)) throw new OverviewPolicyError('unauthorized');
  }

  private assertPageSize(size: unknown): number {
    if (size === undefined) return DEFAULT_PAGE_SIZE;
    if (typeof size === 'number' && Number.isSafeInteger(size) && size >= 1 && size <= MAX_PAGE_SIZE) return size;
    if (typeof size === 'string' && /^[1-9]\d?$/.test(size)) {
      const n = Number(size);
      if (n <= MAX_PAGE_SIZE) return n;
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
  async overview(uid: string): Promise<AccountOverviewDto & { workspaces: Page<WorkspaceProjection>; memberships: Page<MembershipProjection>; consents: Page<ConsentProjection>; history: Page<CommandHistoryRow>; audit: Page<AuditEventProjection> }> {
    this.assertUid(uid);
    const [account, workspaces, memberships, consents, history, audit] = await Promise.all([
      this.store.accountOverview(uid),
      this.store.workspaceRows(uid, null, DEFAULT_PAGE_SIZE),
      this.store.membershipRows(uid, null, DEFAULT_PAGE_SIZE),
      this.store.consentRows(uid, null, DEFAULT_PAGE_SIZE),
      this.store.commandHistory(uid, null, DEFAULT_PAGE_SIZE),
      this.store.auditRows(uid, null, DEFAULT_PAGE_SIZE),
    ]);
    return {
      uid,
      asOf: this.when(),
      ...accountProjection(account),
      workspaces: this.page(workspaces.rows.map(workspaceProjection), workspaces.nextCursor),
      memberships: this.page(memberships.rows.map(membershipProjection), memberships.nextCursor),
      consents: this.page(consents.rows.map(consentProjection), consents.nextCursor),
      history: this.page(history.rows.map(commandProjection), history.nextCursor),
      audit: this.page(audit.rows.map(auditProjection), audit.nextCursor),
    };
  }

  /** Paginated, redacted command history for the verified uid. */
  async history(uid: string, after?: unknown, size?: unknown): Promise<Page<CommandHistoryRow>> {
    this.assertUid(uid);
    const cursor = this.assertCursor(after);
    const limit = this.assertPageSize(size);
    const { rows, nextCursor } = await this.store.commandHistory(uid, cursor, limit);
    return this.page(rows.map(commandProjection), nextCursor);
  }

  /** Paginated, redacted audit projection for the verified uid. */
  async audit(uid: string, after?: unknown, size?: unknown): Promise<Page<AuditEventProjection>> {
    this.assertUid(uid);
    const cursor = this.assertCursor(after);
    const limit = this.assertPageSize(size);
    const { rows, nextCursor } = await this.store.auditRows(uid, cursor, limit);
    return this.page(rows.map(auditProjection), nextCursor);
  }

  async workspaces(uid: string, after?: unknown, size?: unknown): Promise<Page<WorkspaceProjection>> {
    this.assertUid(uid);
    const cursor = this.assertCursor(after), limit = this.assertPageSize(size);
    const result = await this.store.workspaceRows(uid, cursor, limit);
    return this.page(result.rows.map(workspaceProjection), result.nextCursor);
  }
  async memberships(uid: string, after?: unknown, size?: unknown): Promise<Page<MembershipProjection>> {
    this.assertUid(uid);
    const cursor = this.assertCursor(after), limit = this.assertPageSize(size);
    const result = await this.store.membershipRows(uid, cursor, limit);
    return this.page(result.rows.map(membershipProjection), result.nextCursor);
  }
  async consents(uid: string, after?: unknown, size?: unknown): Promise<Page<ConsentProjection>> {
    this.assertUid(uid);
    const cursor = this.assertCursor(after), limit = this.assertPageSize(size);
    const result = await this.store.consentRows(uid, cursor, limit);
    return this.page(result.rows.map(consentProjection), result.nextCursor);
  }
}

export type { PageCursor };
