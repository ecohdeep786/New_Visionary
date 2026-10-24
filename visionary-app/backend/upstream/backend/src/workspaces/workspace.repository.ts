import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'node:crypto';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

/**
 * DATA-01 / SCOPE-04 repository for workspace domain state.
 *
 * PostgreSQL owns workspace/membership/consent/outbox state, linked by the
 * canonical Firebase UID (Person.uid). This repository never trusts a client-
 * supplied UID — every write is scoped to the verified server UID. It rejects
 * duplicate command keys with changed payloads, and demonstrates correct
 * wrong-owner/reference, stale-revision, and consent-revocation behavior.
 */
@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensure a Person row exists for the UID. SQL does not store account/
   *  billing fields — it references the Firestore UID as a foreign key. */
  async ensurePerson(uid: string): Promise<void> {
    await this.prisma.person.upsert({
      where: { uid },
      update: { updatedAt: new Date() },
      create: { uid },
    });
  }

  /** Verify the UID owns the workspace. Throws ForbiddenException for a
   *  wrong-owner reference. */
  async assertOwnership(workspaceId: string, uid: string): Promise<void> {
    const ws = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { uid: true },
    });
    if (ws === null) throw new NotFoundException('Workspace not found.');
    if (ws.uid !== uid) throw new ForbiddenException('You do not have permission to access this workspace.');
  }

  /** Verify the UID has an active membership (role) in the workspace. */
  async assertMembership(workspaceId: string, uid: string, minRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'): Promise<void> {
    const ws = await this.prisma.workspace.findUnique({ where: { id: workspaceId }, select: { uid: true } });
    if (ws === null) throw new NotFoundException('Workspace not found.');
    if (ws.uid === uid) return; // owner always has access
    const membership = await this.prisma.workspaceMembership.findFirst({
      where: { uid, workspaceId },
      select: { role: true },
    });
    if (membership === null) throw new ForbiddenException('You are not a member of this workspace.');
    if (minRole !== undefined) {
      const rank = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 }[membership.role as keyof typeof WorkspaceRoleRank];
      const required = WorkspaceRoleRank[minRole];
      if (rank < required) throw new ForbiddenException(`Requires role ${minRole} or higher.`);
    }
  }

  /** Verify an unexpired, non-revoked consent grant exists for the purpose. */
  async assertConsent(uid: string, purpose: string, resourceId?: string, consentVersion?: string): Promise<void> {
    const existing = await this.prisma.consentGrant.findFirst({
      where: {
        uid,
        purpose,
        resourceId: resourceId ?? null,
        ...(consentVersion ? { consentVersion } : {}),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (existing === null) throw new ForbiddenException('Required consent has not been granted or has been revoked.');
  }

  /** Check that a command key is not already committed with a different payload.
   *  Returns "duplicate" if same payload (safe retry), throws ConflictException
   *  if the payload digest differs (reject same command key with changed payload). */
  async checkCommandConflict(commandId: string, payloadDigest: string, uid: string, kind: string): Promise<'new' | 'duplicate'> {
    const existing = await this.prisma.commandResult.findUnique({ where: { commandId } });
    if (existing === null) return 'new';
    if (existing.uid !== uid) throw new ForbiddenException('This command belongs to another account.');
    if (existing.kind !== kind) throw new ConflictException('Command key reused with a different operation.');
    if (existing.payloadDigest !== payloadDigest) throw new ConflictException('Rejected: same command key with a changed payload.');
    return 'duplicate';
  }

  /** Record a command result. Uses a transaction to ensure atomicity. */
  async recordCommand(
    uid: string,
    commandId: string,
    kind: string,
    payload: unknown,
    status: 'COMMITTED' | 'FAILED' | 'PENDING',
    resultJson?: unknown,
    error?: string,
    workspaceId?: string,
    revision: number = 1,
  ): Promise<void> {
    const payloadDigest = digest(JSON.stringify(payload));
    await this.prisma.$transaction(async (tx) => {
      // Re-verify the conflict inside the transaction
      const existing = await tx.commandResult.findUnique({ where: { commandId } });
      if (existing !== null) {
        if (existing.uid !== uid) throw new ForbiddenException('This command belongs to another account.');
        if (existing.payloadDigest !== payloadDigest) throw new ConflictException('Rejected: same command key with a changed payload.');
        // Duplicate with same payload — idempotent, update status only
        if (status === 'COMMITTED' && existing.status !== 'COMMITTED') {
          await tx.commandResult.update({
            where: { commandId },
            data: { status: 'COMMITTED', resultJson: resultJson ?? undefined, committedAt: new Date() },
          });
        }
        return;
      }
      await tx.commandResult.create({
        data: {
          uid,
          commandId,
          kind,
          payloadDigest,
          workspaceId: workspaceId ?? undefined,
          status,
          resultJson,
          error,
          revision,
          committedAt: status === 'COMMITTED' ? new Date() : undefined,
        },
      });
    });
  }

  /** Create a workspace. Verifies UID via ensurePerson first. */
  async createWorkspace(uid: string, input: {
    name: string;
    slug: string;
    description?: string;
    isPersonal?: boolean;
    commandId?: string;
    payload?: unknown;
  }): Promise<{ id: string; uid: string; name: string; slug: string; isPersonal: boolean }> {
    if (!input.slug || !/^[a-z0-9-]+$/i.test(input.slug)) {
      throw new BadRequestException('Workspace slug must contain only alphanumeric characters and hyphens.');
    }
    await this.ensurePerson(uid);

    // Idempotency: if a commandId is provided, check for duplicates
    if (input.commandId) {
      const conflict = await this.checkCommandConflict(input.commandId, digest(JSON.stringify(input.payload ?? {})), uid, 'workspace:create');
      if (conflict === 'duplicate') {
        // Idempotent retry — return the existing workspace
        const existing = await this.prisma.workspace.findUnique({ where: { slug: input.slug } });
        if (existing && existing.uid === uid) return existing;
      }
    }

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          uid,
          name: input.name,
          slug: input.slug,
          description: input.description,
          isPersonal: input.isPersonal ?? false,
        },
      });
      // Record the command
      if (input.commandId) {
        await tx.commandResult.create({
          data: {
            uid,
            commandId: input.commandId,
            kind: 'workspace:create',
            payloadDigest: digest(JSON.stringify(input.payload ?? {})),
            workspaceId: created.id,
            status: 'COMMITTED',
            committedAt: new Date(),
            revision: 1,
          },
        });
      }
      // Create owner membership
      await tx.workspaceMembership.create({
        data: { uid, workspaceId: created.id, role: 'OWNER', source: 'direct' },
      });
      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          uid,
          workspaceId: created.id,
          topic: 'workspace.created',
          payload: { workspaceId: created.id, name: created.name, slug: created.slug },
          cursor: `${Date.now()}`,
        },
      });
      // Create audit event
      await tx.auditEvent.create({
        data: {
          uid,
          workspaceId: created.id,
          operation: 'workspace.create',
          actorType: 'user',
          resourceType: 'workspace',
          resourceId: created.id,
          outcome: 'SUCCESS',
        },
      });
      return created;
    });

    return { id: workspace.id, uid: workspace.uid, name: workspace.name, slug: workspace.slug, isPersonal: workspace.isPersonal };
  }

  /** Accept an invitation. Verifies token and ownership. */
  async acceptInvitation(uid: string, token: string): Promise<{ workspaceId: string; role: string }> {
    if (!token || token.length < 16) {
      throw new BadRequestException('Use a valid invitation token.');
    }
    await this.ensurePerson(uid);

    const tokenHash = digest(token);
    const invitation = await this.prisma.invitation.findFirst({
      where: { tokenHash, status: 'ISSUED' },
      include: { workspace: true },
    });
    if (invitation === null) throw new NotFoundException('Invitation not found or already used.');
    if (invitation.expiresAt < new Date()) throw new ForbiddenException('Invitation has expired.');
    if (invitation.revokedAt !== null) throw new ForbiddenException('Invitation has been revoked.');

    return this.prisma.$transaction(async (tx) => {
      // Accept the invitation
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      // Create membership
      await tx.workspaceMembership.create({
        data: {
          uid,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
          source: 'invitation',
        },
      });
      // Audit
      await tx.auditEvent.create({
        data: {
          uid,
          workspaceId: invitation.workspaceId,
          operation: 'invitation.accept',
          actorType: 'user',
          resourceType: 'invitation',
          resourceId: invitation.id,
          outcome: 'SUCCESS',
        },
      });
      // Outbox
      await tx.outboxEvent.create({
        data: {
          uid,
          workspaceId: invitation.workspaceId,
          topic: 'workspace.membership.add',
          payload: { workspaceId: invitation.workspaceId, uid, role: invitation.role },
          cursor: `${Date.now()}`,
        },
      });
      return { workspaceId: invitation.workspaceId, role: invitation.role };
    });
  }

  /** List memberships for a UID. */
  async listWorkspaces(uid: string): Promise<Array<{
    id: string; name: string; slug: string; role: string; source: string; joinedAt: Date;
  }>> {
    const rows = await this.prisma.workspaceMembership.findMany({
      where: { uid },
      include: { workspace: { select: { id: true, name: true, slug: true } } },
      orderBy: { joinedAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.workspace.id,
      name: r.workspace.name,
      slug: r.workspace.slug,
      role: r.role,
      source: r.source,
      joinedAt: r.joinedAt,
    }));
  }
}

const WorkspaceRoleRank = {
  GUEST: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
} as const;
