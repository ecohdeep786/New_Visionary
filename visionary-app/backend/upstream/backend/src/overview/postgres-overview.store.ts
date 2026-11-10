import type { Prisma, PrismaClient } from '@prisma/client';
import type { OverviewStore } from './overview-store';
import { OverviewPolicyError } from './overview.service';
import type { ProjectionRole } from './overview-types';
import { MAX_PAGE_SIZE } from './overview-types';

type Target = Readonly<{ role: string; schema: string; database: string }>;
type AccountReader = OverviewStore['accountOverview'];
const visibleWorkspace = `NOT EXISTS (SELECT 1 FROM deletion_tombstones d WHERE
  (d."resourceType"='workspace' AND d."resourceId"=w.id) OR
  (d."resourceType"='person' AND d.uid=w.uid))`;
const viewerRole = `CASE WHEN w.uid=$1 THEN 'OWNER' ELSE m.role::text END`;
const member = `(w.uid=$1 OR m.role::text IN ('ADMIN','MEMBER','GUEST'))`;
const workspaceJoin = `FROM workspaces w LEFT JOIN workspace_memberships m ON m."workspaceId"=w.id AND m.uid=$1`;

/** Read-only owning-store adapter. Queries select public columns and fetch at
 * most limit+1 rows. No legacy Prisma service, migration or implicit write. */
export class PostgresOverviewStore implements OverviewStore {
  private readonly target: Target;
  constructor(private readonly db: PrismaClient, target: Target, private readonly account: AccountReader,
    private readonly now: () => Date = () => new Date()) { this.target = Object.freeze({ ...target }); }

  private async read<T>(uid: string, operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if (typeof uid !== 'string' || !uid.trim() || uid.length > 128) throw new OverviewPolicyError('unauthorized');
    return this.db.$transaction(async tx => {
      await tx.$queryRawUnsafe("SELECT set_config('statement_timeout','4000',true)");
      const [identity] = await tx.$queryRawUnsafe<Array<{ role: string; schema: string; database: string; privileged: boolean; controls: boolean }>>(`
        SELECT current_user AS role,current_schema() AS schema,current_database() AS database,
          EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND
            (d.rolsuper OR d.rolcreatedb OR d.rolcreaterole OR d.rolbypassrls OR
             has_schema_privilege(d.oid,current_schema(),'CREATE') OR has_database_privilege(d.oid,current_database(),'CREATE'))) AS privileged,
          EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname=current_schema() AND (pg_has_role(current_user,c.relowner,'MEMBER') OR
              (left(c.relname,11)='_visionary_' AND EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND CASE
                WHEN c.relkind IN ('r','p') THEN has_table_privilege(d.oid,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                WHEN c.relkind='S' THEN has_sequence_privilege(d.oid,c.oid,'USAGE,UPDATE') ELSE FALSE END)))) AS controls`);
      if (!identity || identity.role !== this.target.role || identity.schema !== this.target.schema || identity.database !== this.target.database || identity.privileged || identity.controls) throw Error('overview_runtime_unavailable');
      const [actor] = await tx.$queryRawUnsafe<Array<{ uid: string }>>(`SELECT uid FROM persons p WHERE p.uid=$1
        AND NOT EXISTS(SELECT 1 FROM deletion_tombstones d WHERE d.uid=p.uid AND d."resourceType"='person')`, uid);
      if (!actor) throw new OverviewPolicyError('unauthorized');
      return operation(tx);
    }, { isolationLevel: 'RepeatableRead', maxWait: 3000, timeout: 5000 });
  }

  private async page<T>(uid: string, after: string | null, size: number, sql: string, map: (row: any) => T) {
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_PAGE_SIZE) throw new OverviewPolicyError('invalid_page');
    if (after !== null && (typeof after !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(after))) throw new OverviewPolicyError('invalid_cursor');
    return this.read(uid, async tx => {
      // NOT MATERIALIZED lets PostgreSQL use indexed owner/id predicates rather
      // than collecting a user's entire history to validate the cursor.
      const rows = await tx.$queryRawUnsafe<any[]>(`WITH authorized AS NOT MATERIALIZED (${sql})
        SELECT * FROM authorized WHERE ($2::text IS NULL OR id>$2)
          AND ($2::text IS NULL OR EXISTS(SELECT 1 FROM authorized WHERE id=$2))
        ORDER BY id ASC LIMIT $3`, uid, after, size + 1);
      const items = rows.slice(0, size);
      return { rows: items.map(map), nextCursor: rows.length > size ? items.at(-1).id as string : null };
    });
  }

  async accountOverview(uid: string) {
    await this.read(uid, async () => undefined);
    const account = await this.account(uid);
    // Recheck after the cross-store read; no account result survives erasure.
    await this.read(uid, async () => undefined);
    return account;
  }
  workspaceRows(uid: string, after: string | null, size: number) {
    return this.page(uid, after, size, `SELECT w.id,w.name,w.slug,w."isPersonal",${viewerRole} AS role,
      CASE WHEN w.uid=$1 THEN 'owner' ELSE m.source END AS source,m."sourceVersion",w.uid AS "createdByUid",w."createdAt",w."updatedAt"
      ${workspaceJoin} WHERE ${member} AND ${visibleWorkspace}`, r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
  }
  membershipRows(uid: string, after: string | null, size: number) {
    return this.page(uid, after, size, `SELECT m.id,m.uid,m."workspaceId",${viewerRole} AS role,m."sourceVersion",m.purpose,m."consentVersion",m."joinedAt"
      ${workspaceJoin} WHERE m.uid=$1 AND ${member} AND ${visibleWorkspace}`, r => ({ ...r, joinedAt: r.joinedAt.toISOString() }));
  }
  consentRows(uid: string, after: string | null, size: number) {
    return this.page(uid, after, size, `SELECT id,purpose,"resourceId","consentVersion","grantedAt","expiresAt","revokedAt"
      FROM consent_grants WHERE uid=$1`, r => ({ ...r, state: r.revokedAt ? 'revoked' as const : r.expiresAt && r.expiresAt <= this.now() ? 'expired' as const : 'active' as const,
      grantedAt: r.grantedAt.toISOString(), expiresAt: r.expiresAt?.toISOString() ?? null, revokedAt: r.revokedAt?.toISOString() ?? null }));
  }
  commandHistory(uid: string, after: string | null, size: number) {
    return this.page(uid, after, size, `SELECT c.id,c."commandId",c.kind,c."workspaceId",c.status::text,c.revision,c."attemptedAt",c."committedAt",
      CASE WHEN c.error IS NULL THEN NULL ELSE 'unavailable' END AS error,(c."resultJson" IS NOT NULL) AS "hasResult"
      FROM command_results c WHERE c.uid=$1 AND (c."workspaceId" IS NULL OR EXISTS(
        SELECT 1 ${workspaceJoin} WHERE w.id=c."workspaceId" AND ${member} AND ${visibleWorkspace}))`,
      r => ({ ...r, attemptedAt: r.attemptedAt.toISOString(), committedAt: r.committedAt?.toISOString() ?? null }));
  }
  auditRows(uid: string, after: string | null, size: number) {
    return this.page(uid, after, size, `SELECT a.id,a.operation,a.outcome::text,a."resourceType",a."resourceId",a."createdAt"
      FROM audit_events a WHERE a.uid=$1 AND (a."workspaceId" IS NULL OR EXISTS(
        SELECT 1 ${workspaceJoin} WHERE w.id=a."workspaceId" AND ${member} AND ${visibleWorkspace}))`,
      r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }
  workspaceRole(uid: string, workspaceId: string): Promise<ProjectionRole | null> {
    return this.read(uid, async tx => {
      const [row] = await tx.$queryRawUnsafe<Array<{ role: ProjectionRole }>>(`SELECT ${viewerRole} AS role ${workspaceJoin}
        WHERE w.id=$2 AND ${member} AND ${visibleWorkspace}`, uid, workspaceId);
      return row?.role ?? null;
    });
  }
}
