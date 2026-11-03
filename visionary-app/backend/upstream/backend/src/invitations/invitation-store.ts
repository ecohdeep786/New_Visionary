import { randomUUID } from 'node:crypto';
import { assertActiveInstitutionApproval, assertInstitutionReviewer, createInstitutionApproval, INSTITUTION_INVITATION_POLICY, InstitutionApproval } from './institution-approval';
import type { PrismaClient, Prisma } from '@prisma/client';
import { digest, InvitationIssue, InvitationPolicyError, InvitationStore, InvitationView, rank, WorkspaceRole, assertId } from './invitation-types';
type Tx = Prisma.TransactionClient;
/** DML-only PostgreSQL owner. Every command locks its workspace before reading
 * mutable invitation/membership state. SQL row locks also fence external changes
 * to the workspace and current issuer/recipient authority until commit. */
export class PostgresInvitationStore implements InvitationStore {
  constructor(private readonly db: PrismaClient, private readonly target: { role: string; schema: string; database: string }, private readonly institutionReviewers: ReadonlySet<string> = new Set()) {}
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
  private async databaseTime(tx: Tx): Promise<Date> {
    const [row] = await tx.$queryRawUnsafe<{ current: Date }[]>('SELECT clock_timestamp() AS current');
    return row.current;
  }

  private async lockApproval(tx: Tx, workspace: { id: string; uid: string }, approvalId?: string) {
    const ids = approvalId
      ? await tx.$queryRawUnsafe<{ id: string }[]>('SELECT "id" FROM "institution_approvals" WHERE "workspaceId"=$1 AND "id"=$2 FOR UPDATE', workspace.id, approvalId)
      : await tx.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "institution_approvals"
          WHERE "workspaceId"=$1 AND "administratorUid"=$2 AND "policy"=$3 AND "revokedAt" IS NULL
            AND "approvedAt" <= (clock_timestamp() AT TIME ZONE 'UTC') AND "expiresAt" > (clock_timestamp() AT TIME ZONE 'UTC')
          ORDER BY "approvedAt" DESC, "id" DESC LIMIT 1 FOR UPDATE`, workspace.id, workspace.uid, INSTITUTION_INVITATION_POLICY);
    const row = ids[0] ? await tx.institutionApproval.findUnique({ where: { id: ids[0].id } }) : null;
    const approval: InstitutionApproval | null = row?.policy === INSTITUTION_INVITATION_POLICY ? { ...row, policy: INSTITUTION_INVITATION_POLICY } : null;
    if (!row) throw new InvitationPolicyError('unauthorized');
    await this.member(tx, workspace.id, workspace.uid, 3);
    assertActiveInstitutionApproval(approval, workspace.id, workspace.uid, await this.databaseTime(tx));
    return row;
  }

  async approveInstitution(input: { workspaceId: string; administratorUid: string; reviewerUid: string; evidenceRef: string; expiresAt: Date }) {
    assertInstitutionReviewer(input.reviewerUid, this.institutionReviewers);
    return this.transaction(async tx => {
      await this.anchor(tx, input.administratorUid);
      const workspace = await this.workspace(tx, input.workspaceId);
      await this.member(tx, workspace.id, input.administratorUid, 3);
      const now = await this.databaseTime(tx);
      const approval = createInstitutionApproval(input, workspace.uid, now, this.institutionReviewers);
      const existing = await tx.institutionApproval.findFirst({ where: {
        workspaceId: workspace.id, revokedAt: null, expiresAt: { gt: now },
      }, select: { id: true } });
      if (existing) throw new InvitationPolicyError('conflict');
      const id = 'iap_' + randomUUID().replaceAll('-', '');
      await tx.institutionApproval.create({ data: { id, ...approval } });
      await tx.auditEvent.create({ data: { uid: workspace.uid, actorUid: input.reviewerUid, workspaceId: workspace.id,
        operation: 'institution.approved', actorType: 'user', resourceType: 'institutionApproval', resourceId: id, outcome: 'SUCCESS' } });
      return { approvalId: id, expiresAt: approval.expiresAt };
    });
  }

  async revokeInstitution(reviewerUid: string, workspaceId: string, approvalId: string) {
    assertInstitutionReviewer(reviewerUid, this.institutionReviewers);
    assertId(approvalId);
    return this.transaction(async tx => {
      const owner = await tx.workspace.findUnique({ where: { id: workspaceId }, select: { uid: true } });
      if (!owner) throw new InvitationPolicyError('not_found');
      await this.anchor(tx, owner.uid);
      const workspace = await this.workspace(tx, workspaceId);
      if (workspace.uid !== owner.uid) throw new InvitationPolicyError('conflict');
      if (reviewerUid === workspace.uid) throw new InvitationPolicyError('unauthorized');
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>('SELECT "id" FROM "institution_approvals" WHERE "workspaceId"=$1 AND "id"=$2 FOR UPDATE', workspace.id, approvalId);
      if (!rows.length) throw new InvitationPolicyError('not_found');
      const row = await tx.institutionApproval.findUniqueOrThrow({ where: { id: approvalId } });
      if (row.revokedAt) return { approvalId, revokedAt: row.revokedAt };
      const revokedAt = await this.databaseTime(tx);
      await tx.institutionApproval.update({ where: { id: approvalId }, data: { revokedAt, revokedByUid: reviewerUid } });
      await tx.auditEvent.create({ data: { uid: workspace.uid, actorUid: reviewerUid, workspaceId: workspace.id,
        operation: 'institution.revoked', actorType: 'user', resourceType: 'institutionApproval', resourceId: approvalId, outcome: 'SUCCESS' } });
      return { approvalId, revokedAt };
    });
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
      const workspace = await this.workspace(tx, input.workspaceId);
      await this.member(tx, input.workspaceId, input.actorUid, 2);
      const approval = await this.lockApproval(tx, workspace);
      const [clock] = await tx.$queryRawUnsafe<any[]>('SELECT clock_timestamp() AS current');
      if (input.expiresAt <= clock.current) throw new InvitationPolicyError('expired');
      // Close only genuinely elapsed deliveries, under the same workspace lock.
      // Their tokens/IDs/history remain immutable; reissue creates a fresh row.
      // Equality is literal, including valid '%'/'_' email characters; avoid
      // an ILIKE filter that could interpret delivery text as a wildcard.
      // Prisma DateTime columns are UTC timestamp-without-time-zone. Compare
      // like types explicitly; a timestamptz cast would shift retained expiry
      // according to the connection timezone and close still-valid deliveries.
      const elapsed = await tx.$queryRawUnsafe<any[]>('SELECT * FROM "invitations" WHERE "workspaceId"=$1 AND lower("email")=lower($2) AND "status" IN (\'PENDING\',\'ISSUED\') AND "expiresAt"<=(clock_timestamp() AT TIME ZONE \'UTC\') FOR UPDATE', input.workspaceId, input.email);
      for (const old of elapsed) {
        const expired = await tx.invitation.update({ where: { id: old.id }, data: { status: 'EXPIRED' } });
        await this.record(tx, input.actorUid, expired, 'expired', this.view(expired));
      }
      // A replacement approval never revives an earlier delivery. Retire the
      // older delivery for this address in the same transaction as its reissue.
      const obsolete = await tx.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "invitations"
        WHERE "workspaceId"=$1 AND lower("email")=lower($2) AND "status" IN ('PENDING','ISSUED')
          AND "institutionApprovalId" IS DISTINCT FROM $3 FOR UPDATE`, input.workspaceId, input.email, approval.id);
      for (const { id } of obsolete) {
        const revoked = await tx.invitation.update({ where: { id }, data: { status: 'REVOKED', revokedAt: await this.databaseTime(tx) } });
        await this.record(tx, input.actorUid, revoked, 'revoked', this.view(revoked));
      }
      const pending = await tx.$queryRawUnsafe<any[]>('SELECT "id" FROM "invitations" WHERE "workspaceId"=$1 AND lower("email")=lower($2) AND "status" IN (\'PENDING\',\'ISSUED\') LIMIT 1', input.workspaceId, input.email);
      if (pending.length) throw new InvitationPolicyError('conflict');
      const i = await tx.invitation.create({ data: { id: input.id, workspaceId: input.workspaceId, email: input.email, institutionApprovalId: approval.id,
        role: input.role, tokenHash: input.tokenHash, status: 'PENDING', issuedAt: input.at, expiresAt: input.expiresAt } });
      const result = this.view(i);
      await this.record(tx, input.actorUid, i, 'issued', result);
      await this.lockApproval(tx, workspace, approval.id);
      return result;
    });
  }
  accept(uid: string, tokenHash: string, verifiedEmail: string, at: Date) {
    return this.transaction(async tx => {
      // A token cannot create an identity; the canonical UID also fences events.
      await this.anchor(tx, uid);
      const found = await tx.invitation.findUnique({ where: { tokenHash } });
      if (!found) throw new InvitationPolicyError('invalid_token');
      const workspace = await this.workspace(tx, found.workspaceId);
      await tx.$queryRawUnsafe('SELECT "id" FROM "invitations" WHERE "id"=$1 FOR UPDATE', found.id);
      const i = await tx.invitation.findUniqueOrThrow({ where: { id: found.id } });
      if (i.workspaceId !== found.workspaceId) throw new InvitationPolicyError('conflict');
      if (i.tokenHash !== tokenHash || !verifiedEmail || i.email.toLowerCase() !== verifiedEmail) throw new InvitationPolicyError('invalid_token');
      if (i.status === 'REVOKED' || i.revokedAt) throw new InvitationPolicyError('revoked');
      if (i.status === 'EXPIRED') throw new InvitationPolicyError('expired');
      if (!['MEMBER', 'ADMIN'].includes(i.role)) throw new InvitationPolicyError('unauthorized');
      if (await tx.deletionTombstone.findFirst({ where: { uid, OR: [{ resourceType: 'workspace', resourceId: i.workspaceId }, { resourceType: 'person' }] } })) throw new InvitationPolicyError('unauthorized');
      const existing = await tx.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid, workspaceId: i.workspaceId } } });
      if (!i.institutionApprovalId) throw new InvitationPolicyError('unauthorized');
      await this.lockApproval(tx, workspace, i.institutionApprovalId);
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
      await this.unexpired(tx, i.expiresAt, at);
      await this.lockApproval(tx, workspace, i.institutionApprovalId);
      return result;
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
