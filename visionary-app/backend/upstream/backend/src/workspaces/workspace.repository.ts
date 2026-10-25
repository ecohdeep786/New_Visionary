import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'node:crypto';

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
    if (!purpose || !consentVersion) throw new ForbiddenException('An explicit purpose and policy version are required.');
    const grant = await this.prisma.consentGrant.findFirst({ where: {
      uid, purpose, resourceId: resourceId ?? null, consentVersion, revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    } });
    if (!grant) throw new ForbiddenException('Required consent is unavailable or revoked.');
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
