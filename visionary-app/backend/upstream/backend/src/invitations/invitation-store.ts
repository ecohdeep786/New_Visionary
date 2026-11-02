import type { PrismaClient, Prisma } from '@prisma/client';
import { digest, InvitationIssue, InvitationPolicyError, InvitationStore, InvitationView, rank, WorkspaceRole } from './invitation-types';
type Tx = Prisma.TransactionClient;
/** DML-only PostgreSQL owner. Every command locks its workspace before reading
 * mutable invitation/membership state. SQL row locks also fence external changes
 * to the workspace and current issuer/recipient authority until commit. */
export class PostgresInvitationStore implements InvitationStore {
  constructor(private readonly db: PrismaClient, private readonly target: { role: string; schema: string; database: string }) {}
  private transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.$transaction(async tx => {
      const [r] = await tx.$queryRawUnsafe<any[]>(`SELECT current_user AS role,current_schema() AS schema,current_database() AS database,
        EXISTS(SELECT 1 FROM pg_roles d WHERE pg_has_role(current_user,d.oid,'MEMBER') AND
          (d.rolsuper OR d.rolcreatedb OR d.rolcreaterole OR d.rolbypassrls OR
           has_schema_privilege(d.oid,current_schema(),'CREATE') OR has_database_privilege(d.oid,current_database(),'CREATE'))) AS privileged,
        EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname=current_schema() AND pg_has_role(current_user,c.relowner,'MEMBER')) AS owns_tables`);
      if (!r || r.role !== this.target.role || r.schema !== this.target.schema || r.database !== this.target.database || r.privileged || r.owns_tables) throw new InvitationPolicyError('unavailable');
      return work(tx);
    }, { maxWait: 5000, timeout: 10000 });
  }
  private async workspace(tx: Tx, id: string) {
    const [w] = await tx.$queryRawUnsafe<any[]>('SELECT "id","uid","isPersonal" FROM "workspaces" WHERE "id"=$1 FOR UPDATE', id);
    if (!w || w.isPersonal) throw new InvitationPolicyError('unauthorized');
    if (await tx.deletionTombstone.findFirst({ where: { uid: w.uid, OR: [{ resourceType: 'workspace', resourceId: id }, { resourceType: 'person' }] } })) throw new InvitationPolicyError('unauthorized');
    return w;
  }
  private async anchor(tx: Tx, uid: string) {
    // Same UID order as WorkspaceRepository: acquire before workspace locks and
    // retain through outbox allocation/commit. Never upgrade a shared UID lock.
    const rows = await tx.$queryRawUnsafe<any[]>('SELECT "uid" FROM "persons" WHERE "uid"=$1 FOR UPDATE', uid);
    if (!rows.length) throw new InvitationPolicyError('unauthorized');
  }
  private async unexpired(tx: Tx, expiresAt: Date, callerTime: Date) {
    // clock_timestamp is current at this statement, unlike transaction-start NOW.
    const [row] = await tx.$queryRawUnsafe<any[]>('SELECT clock_timestamp() AS current');
    const current = new Date(Math.max(row.current.getTime(), callerTime.getTime()));
    if (expiresAt <= current) throw new InvitationPolicyError('expired');
    return current;
  }
  private async member(tx: Tx, workspaceId: string, uid: string, minimum: number) {
    const [m] = await tx.$queryRawUnsafe<any[]>('SELECT m."role",w."uid" AS owner FROM "workspace_memberships" m JOIN "workspaces" w ON w."id"=m."workspaceId" WHERE m."workspaceId"=$1 AND m."uid"=$2 FOR SHARE OF m', workspaceId, uid);
    if (!m || rank(m.role) < minimum || (m.role === 'OWNER' && m.owner !== uid)) throw new InvitationPolicyError('unauthorized');
    return m.role as WorkspaceRole;
  }
  private view(i: any, replay = false, membershipRole?: WorkspaceRole): InvitationView {
    return { id: i.id, workspaceId: i.workspaceId, email: i.email, role: i.role, status: i.status.toLowerCase(),
      issuedAt: i.issuedAt?.toISOString() ?? '', expiresAt: i.expiresAt.toISOString(), acceptedBy: i.acceptedByUid,
      revokedAt: i.revokedAt?.toISOString() ?? null, replay, ...(membershipRole ? { membershipRole } : {}) };
  }
  private async record(tx: Tx, uid: string, i: any, action: string, result: InvitationView) {
    const key = 'inv-v1-' + digest([action, i.id, uid]);
    await tx.commandResult.create({ data: { uid, workspaceId: i.workspaceId, commandId: key,
      kind: 'invitation.' + action, payloadDigest: digest([action, i.id, uid, i.tokenHash, i.role]), status: 'COMMITTED', committedAt: new Date(), resultJson: result as any } });
    await tx.auditEvent.create({ data: { uid, actorUid: uid, workspaceId: i.workspaceId, operation: 'invitation.' + action,
      actorType: 'user', resourceType: 'invitation', resourceId: i.id, outcome: 'SUCCESS' } });
    await tx.outboxEvent.create({ data: { uid, workspaceId: i.workspaceId, topic: 'invitation.' + action,
      payload: { invitationId: i.id, status: result.status } } });
  }
  issue(input: InvitationIssue) {
    return this.transaction(async tx => {
      await this.anchor(tx, input.actorUid);
      await this.workspace(tx, input.workspaceId);
      await this.member(tx, input.workspaceId, input.actorUid, 2);
      // The domain schema's email uniqueness is retained; reissue never silently
      // overwrites an existing token or grants another role.
      if (await tx.invitation.findUnique({ where: { workspaceId_email: { workspaceId: input.workspaceId, email: input.email } } })) throw new InvitationPolicyError('conflict');
      const i = await tx.invitation.create({ data: { id: input.id, workspaceId: input.workspaceId, email: input.email,
        role: input.role, tokenHash: input.tokenHash, status: 'PENDING', issuedAt: input.at, expiresAt: input.expiresAt } });
      const result = this.view(i); await this.record(tx, input.actorUid, i, 'issued', result); return result;
    });
  }
  accept(uid: string, tokenHash: string, at: Date) {
    return this.transaction(async tx => {
      // A token cannot create an identity; the canonical UID also fences events.
      await this.anchor(tx, uid);
      const found = await tx.invitation.findUnique({ where: { tokenHash } });
      if (!found) throw new InvitationPolicyError('invalid_token');
      const workspace = await this.workspace(tx, found.workspaceId);
      await tx.$queryRawUnsafe('SELECT "id" FROM "invitations" WHERE "id"=$1 FOR UPDATE', found.id);
      const i = await tx.invitation.findUniqueOrThrow({ where: { id: found.id } });
      if (i.workspaceId !== found.workspaceId) throw new InvitationPolicyError('conflict');
      if (i.tokenHash !== tokenHash) throw new InvitationPolicyError('invalid_token');
      if (i.status === 'REVOKED' || i.revokedAt) throw new InvitationPolicyError('revoked');
      if (!['MEMBER', 'ADMIN'].includes(i.role)) throw new InvitationPolicyError('unauthorized');
      if (await tx.deletionTombstone.findFirst({ where: { uid, OR: [{ resourceType: 'workspace', resourceId: i.workspaceId }, { resourceType: 'person' }] } })) throw new InvitationPolicyError('unauthorized');
      const existing = await tx.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid, workspaceId: i.workspaceId } } });
      if (i.status === 'ACCEPTED') {
        if (i.acceptedByUid !== uid) throw new InvitationPolicyError('already_accepted');
        if (!existing) throw new InvitationPolicyError('unauthorized');
        const receipt = await tx.commandResult.findUnique({ where: { commandId: 'inv-v1-' + digest(['accepted', i.id, uid]) } });
        if (!receipt || receipt.uid !== uid || receipt.workspaceId !== i.workspaceId || receipt.kind !== 'invitation.accepted' || receipt.status !== 'COMMITTED' || receipt.payloadDigest !== digest(['accepted', i.id, uid, i.tokenHash, i.role])) throw new InvitationPolicyError('conflict');
        await this.member(tx, i.workspaceId, uid, 0);
        return this.view(i, true, existing.role);
      }
      if (i.status !== 'PENDING') throw new InvitationPolicyError('conflict');
      if (workspace.uid === uid) throw new InvitationPolicyError('unauthorized');
      await this.unexpired(tx, i.expiresAt, at);
      const issued = await tx.auditEvent.findMany({ where: { workspaceId: i.workspaceId, resourceType: 'invitation', resourceId: i.id, operation: 'invitation.issued', outcome: 'SUCCESS' }, take: 2 });
      if (issued.length !== 1 || !issued[0].actorUid) throw new InvitationPolicyError('unauthorized');
      await this.member(tx, i.workspaceId, issued[0].actorUid, 2);
      const acceptedAt = await this.unexpired(tx, i.expiresAt, at);
      // Invites create membership, never perform a role change or owner transfer.
      const membershipRole = existing ? await this.member(tx, i.workspaceId, uid, 0) : i.role;
      if (!existing) await tx.workspaceMembership.create({ data: { uid, workspaceId: i.workspaceId, role: i.role, source: 'invitation', sourceVersion: 'v1' } });
      const saved = await tx.invitation.update({ where: { id: i.id }, data: { status: 'ACCEPTED', acceptedAt, acceptedByUid: uid } });
      const result = this.view(saved, false, membershipRole); await this.record(tx, uid, saved, 'accepted', result);
      await this.unexpired(tx, i.expiresAt, at); return result;
    });
  }
  revoke(uid: string, id: string, at: Date) {
    return this.transaction(async tx => {
      await this.anchor(tx, uid);
      const found = await tx.invitation.findUnique({ where: { id } });
      if (!found) throw new InvitationPolicyError('not_found');
      await this.workspace(tx, found.workspaceId); await this.member(tx, found.workspaceId, uid, 2);
      await tx.$queryRawUnsafe('SELECT "id" FROM "invitations" WHERE "id"=$1 FOR UPDATE', id);
      const i = await tx.invitation.findUniqueOrThrow({ where: { id } });
      if (i.workspaceId !== found.workspaceId) throw new InvitationPolicyError('conflict');
      if (i.status === 'REVOKED') return this.view(i, true);
      if (i.status !== 'PENDING') throw new InvitationPolicyError('already_accepted');
      const saved = await tx.invitation.update({ where: { id }, data: { status: 'REVOKED', revokedAt: at } });
      const result = this.view(saved); await this.record(tx, uid, saved, 'revoked', result); return result;
    });
  }
  list(uid: string, workspaceId: string) {
    return this.transaction(async tx => { await this.workspace(tx, workspaceId); await this.member(tx, workspaceId, uid, 1);
      return (await tx.invitation.findMany({ where: { workspaceId }, take: 100, orderBy: { id: 'asc' } })).map(i => this.view(i)); });
  }
  track(uid: string, workspaceId: string, id: string) {
    return this.transaction(async tx => { await this.workspace(tx, workspaceId); await this.member(tx, workspaceId, uid, 1);
      if (!await tx.invitation.findFirst({ where: { id, workspaceId } })) throw new InvitationPolicyError('not_found');
      const rows = await tx.auditEvent.findMany({ where: { workspaceId, resourceType: 'invitation', resourceId: id }, take: 100, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
      return rows.map(r => ({ id: r.id, invitationId: id, workspaceId, action: r.operation, actorUid: r.actorUid, at: r.createdAt.toISOString() })); });
  }
}
