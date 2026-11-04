import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'node:crypto';
import { CONSENT_PURPOSES, MAX_CONSENT_EXPIRY_SECONDS, isConsentVersion, type ConsentPurpose } from '../consent/consent-types';

type Store = Prisma.TransactionClient;
type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
const ranks: Record<Role, number> = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
const knownRole = (role: unknown): role is Role => typeof role === 'string' && Object.prototype.hasOwnProperty.call(ranks, role);
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export interface WorkspaceInput {
  name: string; slug: string; description?: string; isPersonal?: boolean; commandId: string;
}

/** Unwired domain repository. Callers must supply a verified server UID.
 * Account/profile/billing authority stays in Firestore. This class does not
 * establish admission, source rights or guardian permissions for any caller. */
@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePerson(uid: string): Promise<void> {
    if (typeof uid !== 'string' || !uid || uid.length > 128) throw new BadRequestException('Invalid account reference.');
    await this.prisma.person.upsert({ where: { uid }, update: { updatedAt: new Date() }, create: { uid } });
  }

  private async notErased(tx: Store, uid: string, id: string): Promise<void> {
    // A marker remains authoritative until explicitly retired by approved
    // retention policy. Time alone must not revive an erased resource.
    if (await tx.deletionTombstone.findUnique({ where: { uid_resourceType_resourceId: { uid, resourceType: 'workspace', resourceId: id } } })) {
      throw new ForbiddenException('Workspace is no longer available.');
    }
  }

  private async owned(tx: Store, workspaceId: string, uid: string): Promise<void> {
    const ws = await tx.workspace.findUnique({ where: { id: workspaceId }, select: { uid: true } });
    if (!ws) throw new NotFoundException('Workspace not found.');
    if (ws.uid !== uid) throw new ForbiddenException('You do not have permission to access this workspace.');
    await this.notErased(tx, ws.uid, workspaceId);
  }

  async assertOwnership(workspaceId: string, uid: string): Promise<void> {
    await this.owned(this.prisma, workspaceId, uid);
  }

  async assertMembership(workspaceId: string, uid: string, minRole: Role = 'GUEST'): Promise<void> {
    if (!knownRole(minRole)) throw new ForbiddenException('Unknown required role.');
    const ws = await this.prisma.workspace.findUnique({ where: { id: workspaceId }, select: { uid: true } });
    if (!ws) throw new NotFoundException('Workspace not found.');
    await this.notErased(this.prisma, ws.uid, workspaceId);
    if (ws.uid === uid) return;
    const membership = await this.prisma.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid, workspaceId } } });
    if (!membership || !knownRole(membership.role) || membership.role === 'OWNER' || ranks[membership.role] < ranks[minRole]) {
      throw new ForbiddenException('Required workspace membership is unavailable.');
    }
  }

  async assertConsent(uid: string, purpose: string, resourceId?: string, consentVersion?: string): Promise<void> {
    if (typeof uid !== 'string' || !uid.trim()) throw new ForbiddenException('A consent subject is required.');
    if (!purpose || !consentVersion) throw new ForbiddenException('An explicit purpose and policy version are required.');
    // The grant and revocation writers also use the database clock.
    const grants = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT grant_row.id
      FROM consent_grants AS grant_row
      WHERE grant_row.uid = ${uid}
        AND grant_row.purpose = ${purpose}
        AND grant_row."resourceId" IS NOT DISTINCT FROM ${resourceId ?? null}::text
        AND grant_row."consentVersion" = ${consentVersion}
        AND grant_row."revokedAt" IS NULL
        AND grant_row."grantedAt" <= timezone('UTC', statement_timestamp())
        AND (grant_row."expiresAt" IS NULL OR grant_row."expiresAt" > timezone('UTC', statement_timestamp()))
        AND NOT EXISTS (
          SELECT 1 FROM deletion_tombstones AS tombstone
          WHERE tombstone.uid = grant_row.uid AND tombstone."resourceType" = 'person'
        )
      LIMIT 1
    `;
    if (!grants.length) throw new ForbiddenException('Required consent is unavailable or revoked.');
  }

  async revokeConsent(uid: string, grantId: string): Promise<{ id: string; revokedAt: string }> {
    if (typeof uid !== 'string' || !uid.trim() || typeof grantId !== 'string' || !grantId.trim()) {
      throw new BadRequestException('An account and consent grant are required.');
    }
    return this.prisma.$transaction(async tx => {
      const accounts = await tx.$queryRaw<Array<{ uid: string }>>`SELECT "uid" FROM "persons" WHERE "uid" = ${uid} FOR UPDATE`;
      if (!accounts.length) throw new ForbiddenException('Consent grant is unavailable.');
      const grant = await tx.consentGrant.findFirst({ where: { id: grantId, uid } });
      if (!grant) throw new ForbiddenException('Consent grant is unavailable.');
      if (grant.revokedAt) return { id: grantId, revokedAt: grant.revokedAt.toISOString() };

      const [clock] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
      await tx.consentGrant.update({ where: { id: grantId, uid, revokedAt: null }, data: { revokedAt: clock.now } });
      const result = { id: grantId, revokedAt: clock.now.toISOString() };
      await tx.auditEvent.create({ data: { uid, actorUid: uid, actorType: 'user', operation: 'consent.revoked',
        resourceType: 'consentGrant', resourceId: grantId, outcome: 'SUCCESS' } });
      await tx.outboxEvent.create({ data: { uid, topic: 'consent.revoked', payload: result } });
      return result;
    });
  }

  /** The caller supplies the authenticated subject and the server-selected policy version. */
  async grantAccountConsent(uid: string, purpose: ConsentPurpose, consentVersion: string, expiresInSeconds: number) {
    if (typeof uid !== 'string' || !uid.trim() || !CONSENT_PURPOSES.includes(purpose) ||
        !isConsentVersion(consentVersion) ||
        !Number.isSafeInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > MAX_CONSENT_EXPIRY_SECONDS) {
      throw new BadRequestException('An account, supported purpose, policy version and bounded expiry are required.');
    }
    return this.prisma.$transaction(async tx => {
      const accounts = await tx.$queryRaw<Array<{ uid: string }>>`SELECT "uid" FROM "persons" WHERE "uid" = ${uid} FOR UPDATE`;
      if (!accounts.length || await tx.deletionTombstone.findFirst({ where: { uid, resourceType: 'person' } })) {
        throw new ForbiddenException('Consent subject is unavailable.');
      }
      const scope = { uid, purpose, resourceId: null, consentVersion };
      const prior = await tx.consentGrant.findFirst({ where: scope });
      const [clock] = await tx.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
      if (prior) {
        if (prior.grantedAt > clock.now) throw new ConflictException('This consent grant is not yet effective.');
        if (prior.revokedAt || (prior.expiresAt && prior.expiresAt <= clock.now)) {
          throw new ConflictException('This policy version already has a closed consent grant.');
        }
        return { id: prior.id, expiresAt: prior.expiresAt?.toISOString() ?? null };
      }
      const expiresAt = new Date(clock.now.getTime() + expiresInSeconds * 1000);
      const grant = await tx.consentGrant.create({ data: { ...scope, version: consentVersion, grantedAt: clock.now, expiresAt } });
      const result = { id: grant.id, expiresAt: expiresAt.toISOString() };
      await tx.auditEvent.create({ data: { uid, actorUid: uid, actorType: 'user', operation: 'consent.granted',
        resourceType: 'consentGrant', resourceId: grant.id, outcome: 'SUCCESS' } });
      await tx.outboxEvent.create({ data: { uid, topic: 'consent.granted', payload: result } });
      return result;
    });
  }

  private checkReceipt(existing: { uid: string; kind: string; payloadDigest: string }, uid: string, kind: string, hash: string): void {
    if (existing.uid !== uid) throw new ForbiddenException('This command belongs to another account.');
    if (existing.kind !== kind || existing.payloadDigest !== hash) throw new ConflictException('Rejected: same command key with a changed payload or operation.');
  }

  async checkCommandConflict(commandId: string, payloadDigest: string, uid: string, kind: string): Promise<'new' | 'duplicate'> {
    const existing = await this.prisma.commandResult.findUnique({ where: { commandId } });
    if (!existing) return 'new';
    this.checkReceipt(existing, uid, kind, payloadDigest);
    return 'duplicate';
  }

  private input(input: WorkspaceInput): { name: string; slug: string; description: string | null; isPersonal: boolean } {
    if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 120 ||
        typeof input.slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(input.slug) ||
        typeof input.commandId !== 'string' || !/^[A-Za-z0-9_:-]{1,128}$/.test(input.commandId) ||
        (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 1000)) ||
        (input.isPersonal !== undefined && typeof input.isPersonal !== 'boolean')) {
      throw new BadRequestException('Use bounded workspace fields and a stable command key.');
    }
    return { name: input.name, slug: input.slug, description: input.description ?? null, isPersonal: input.isPersonal ?? false };
  }

  async createWorkspace(uid: string, input: WorkspaceInput) {
    const fields = this.input(input);
    const hash = digest({ kind: 'workspace:create', uid, ...fields });
    await this.ensurePerson(uid);
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Serialize commands/events for this UID through its canonical anchor.
        // A later event cannot allocate its sequence cursor before this commits.
        await tx.person.update({ where: { uid }, data: { updatedAt: new Date() } });
        const prior = await tx.commandResult.findUnique({ where: { commandId: input.commandId } });
        if (prior) {
          this.checkReceipt(prior, uid, 'workspace:create', hash);
          if (prior.status !== 'COMMITTED' || !prior.workspaceId || !prior.resultJson) throw new ConflictException('Command is not a committed workspace result.');
          await this.owned(tx, prior.workspaceId, uid);
          return prior.resultJson as { id: string; uid: string; name: string; slug: string; isPersonal: boolean };
        }
        const created = await tx.workspace.create({ data: { uid, ...fields } });
        const result = { id: created.id, uid, name: created.name, slug: created.slug, isPersonal: created.isPersonal };
        await tx.workspaceMembership.create({ data: { uid, workspaceId: created.id, role: 'OWNER', source: 'direct' } });
        await tx.commandResult.create({ data: { uid, commandId: input.commandId, kind: 'workspace:create', payloadDigest: hash,
          workspaceId: created.id, status: 'COMMITTED', committedAt: new Date(), revision: 1, resultJson: result } });
        await tx.outboxEvent.create({ data: { uid, workspaceId: created.id, topic: 'workspace.created', payload: result } });
        await tx.auditEvent.create({ data: { uid, workspaceId: created.id, operation: 'workspace.create', actorType: 'user',
          resourceType: 'workspace', resourceId: created.id, outcome: 'SUCCESS' } });
        return result;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Workspace or command already exists.');
      throw error;
    }
  }

  async acceptInvitation(uid: string, token: string): Promise<{ workspaceId: string; role: string }> {
    if (typeof token !== 'string' || token.length < 16 || token.length > 256) throw new BadRequestException('Use a valid invitation token.');
    await this.ensurePerson(uid);
    return this.prisma.$transaction(async (tx) => {
      await tx.person.update({ where: { uid }, data: { updatedAt: new Date() } });
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const invitation = await tx.invitation.findUnique({ where: { tokenHash }, include: { workspace: true } });
      if (!invitation) throw new NotFoundException('Invitation is unavailable.');
      await this.notErased(tx, invitation.workspace.uid, invitation.workspaceId);
      if (invitation.workspace.uid === uid) throw new ForbiddenException('The owner cannot accept an invitation to their own workspace.');
      if (invitation.status === 'ACCEPTED' && invitation.acceptedByUid === uid) {
        const member = await tx.workspaceMembership.findUnique({ where: { uid_workspaceId: { uid, workspaceId: invitation.workspaceId } } });
        if (!member || !knownRole(member.role) || member.role === 'OWNER') throw new ForbiddenException('Membership is no longer available.');
        return { workspaceId: invitation.workspaceId, role: member.role };
      }
      if (invitation.role === 'OWNER' || !knownRole(invitation.role)) throw new ForbiddenException('Invitation cannot grant that role.');
      const claimed = await tx.invitation.updateMany({ where: { id: invitation.id, status: 'ISSUED', revokedAt: null, expiresAt: { gt: new Date() } },
        data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByUid: uid } });
      if (claimed.count !== 1) throw new ForbiddenException('Invitation expired, revoked, or already used.');
      // Existing membership is never silently promoted by accepting a token.
      const member = await tx.workspaceMembership.upsert({ where: { uid_workspaceId: { uid, workspaceId: invitation.workspaceId } }, update: {},
        create: { uid, workspaceId: invitation.workspaceId, role: invitation.role, source: 'invitation' } });
      if (!knownRole(member.role) || member.role === 'OWNER') throw new ForbiddenException('Existing membership has an invalid role.');
      await tx.auditEvent.create({ data: { uid, workspaceId: invitation.workspaceId, operation: 'invitation.accept', actorType: 'user',
        resourceType: 'invitation', resourceId: invitation.id, outcome: 'SUCCESS' } });
      await tx.outboxEvent.create({ data: { uid, workspaceId: invitation.workspaceId, topic: 'workspace.membership.add',
        payload: { workspaceId: invitation.workspaceId, uid, role: member.role } } });
      return { workspaceId: invitation.workspaceId, role: member.role };
    });
  }

  async listWorkspaces(uid: string) {
    const rows = await this.prisma.workspaceMembership.findMany({ where: { uid }, include: { workspace: true }, orderBy: { joinedAt: 'desc' } });
    const visible = [];
    for (const row of rows) {
      if (!knownRole(row.role) || (row.role === 'OWNER' && row.workspace.uid !== uid)) continue;
      const tombstone = await this.prisma.deletionTombstone.findUnique({ where: { uid_resourceType_resourceId: {
        uid: row.workspace.uid, resourceType: 'workspace', resourceId: row.workspaceId } } });
      if (!tombstone) visible.push({ id: row.workspace.id, name: row.workspace.name, slug: row.workspace.slug,
        role: row.role, source: row.source, joinedAt: row.joinedAt });
    }
    return visible;
  }
}
