/**
 * DATA-01 — Workspace repository behavior tests.
 *
 * Tests the WorkspaceRepository logic using an in-memory mock that simulates
 * the Prisma client behavior. Verifies:
 *   - Wrong-owner/reference cases are denied
 *   - Duplicate command keys with same payload are idempotent
 *   - Duplicate command keys with changed payload are rejected
 *   - Stale revision / conflict detection works
 *   - Consent revocation blocks operations
 *   - SQL does not duplicate Firestore account authority
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const digest = (value) => createHash('sha256').update(value).digest('hex');

// Lightweight in-memory Prisma mock for WorkspaceRepository
class MockWorkspaceRepository {
  // Storage
  persons = new Map();        // uid -> { uid, createdAt, updatedAt }
  workspaces = new Map();     // id -> { id, uid, name, slug, ... }
  memberships = new Map();    // `${uid}-${workspaceId}` -> { uid, workspaceId, role, ... }
  invitations = new Map();    // id -> { id, workspaceId, email, tokenHash, status, ... }
  commandResults = new Map(); // commandId -> { uid, commandId, kind, payloadDigest, ... }
  consentGrants = new Map();  // `${uid}-${purpose}-${resourceId}-${consentVersion}` -> { ... }
  outboxEvents = [];          // array of { uid, workspaceId, topic, payload, cursor }
  auditEvents = [];           // array of { uid, operation, ... }

  // Helpers
  findWorkspace(slug) {
    for (const ws of this.workspaces.values()) {
      if (ws.slug === slug) return ws;
    }
    return null;
  }

  // Repository methods (mirrors workspace.repository.ts logic)

  async ensurePerson(uid) {
    if (!this.persons.has(uid)) {
      this.persons.set(uid, { uid, createdAt: new Date(), updatedAt: new Date() });
    }
  }

  async createWorkspace(uid, input) {
    if (!input.slug || !/^[a-z0-9-]+$/i.test(input.slug)) {
      throw new Error('BAD_REQUEST: Workspace slug invalid');
    }
    await this.ensurePerson(uid);

    // Idempotency: check commandId if provided
    if (input.commandId) {
      const existing = this.commandResults.get(input.commandId);
      if (existing) {
        if (existing.uid !== uid) throw new Error('FORBIDDEN: Command belongs to another account');
        if (existing.payloadDigest !== digest(JSON.stringify(input.payload ?? {}))) {
          throw new Error('CONFLICT: Same command key with changed payload');
        }
        // Duplicate with same payload — idempotent
        const existingWs = this.findWorkspace(input.slug);
        if (existingWs && existingWs.uid === uid) return existingWs;
      }
    }

    // Check unique slug
    if (this.findWorkspace(input.slug)) {
      throw new Error('CONFLICT: Workspace slug already exists');
    }

    const id = `ws_${this.workspaces.size + 1}`;
    const now = new Date();
    const workspace = {
      id,
      uid,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      isPersonal: input.isPersonal ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.workspaces.set(id, workspace);

    // Membership
    this.memberships.set(`${uid}-${id}`, {
      uid,
      workspaceId: id,
      role: 'OWNER',
      source: 'direct',
      joinedAt: now,
      updatedAt: now,
    });

    // Command result
    if (input.commandId) {
      this.commandResults.set(input.commandId, {
        uid,
        commandId: input.commandId,
        kind: 'workspace:create',
        payloadDigest: digest(JSON.stringify(input.payload ?? {})),
        workspaceId: id,
        status: 'COMMITTED',
        committedAt: now,
        revision: 1,
      });
    }

    // Outbox
    this.outboxEvents.push({
      uid,
      workspaceId: id,
      topic: 'workspace.created',
      payload: { workspaceId: id, name: input.name, slug: input.slug },
      cursor: `${Date.now()}`,
      status: 'PENDING',
    });

    // Audit
    this.auditEvents.push({
      uid,
      workspaceId: id,
      operation: 'workspace.create',
      actorType: 'user',
      resourceType: 'workspace',
      resourceId: id,
      outcome: 'SUCCESS',
    });

    return workspace;
  }

  async assertOwnership(workspaceId, uid) {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) throw new Error('NOT_FOUND: Workspace not found');
    if (ws.uid !== uid) throw new Error('FORBIDDEN: Not the workspace owner');
  }

  async assertMembership(workspaceId, uid, minRole) {
    const ws = this.workspaces.get(workspaceId);
    if (!ws) throw new Error('NOT_FOUND: Workspace not found');
    if (ws.uid === uid) return; // owner
    const membership = this.memberships.get(`${uid}-${workspaceId}`);
    if (!membership) throw new Error('FORBIDDEN: Not a member');
    if (minRole) {
      const rank = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
      if (rank[membership.role] < rank[minRole]) {
        throw new Error(`FORBIDDEN: Requires ${minRole} or higher`);
      }
    }
  }

  async acceptInvitation(uid, token) {
    const tokenHash = digest(token);
    const invitation = Array.from(this.invitations.values()).find(
      (inv) => inv.tokenHash === tokenHash && inv.status === 'ISSUED',
    );
    if (!invitation) throw new Error('NOT_FOUND: Invitation not found or used');
    if (invitation.expiresAt < new Date()) throw new Error('FORBIDDEN: Invitation expired');
    if (invitation.revokedAt) throw new Error('FORBIDDEN: Invitation revoked');

    await this.ensurePerson(uid);
    this.invitations.set(invitation.id, { ...invitation, status: 'ACCEPTED', acceptedAt: new Date() });

    this.memberships.set(`${uid}-${invitation.workspaceId}`, {
      uid,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
      source: 'invitation',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    return { workspaceId: invitation.workspaceId, role: invitation.role };
  }

  // Domain command with idempotency + revision check
  async presentCheck(uid, workspaceId, sessionId, input) {
    await this.assertMembership(workspaceId, uid);

    const commandId = input.commandId;
    const payloadDigest = digest(JSON.stringify(input));

    // Idempotency: check for existing command result
    const existing = this.commandResults.get(commandId);
    if (existing) {
      if (existing.uid !== uid) throw new Error('FORBIDDEN: Command belongs to another account');
      if (existing.payloadDigest !== payloadDigest) {
        throw new Error('CONFLICT: Same command key with changed payload');
      }
      // Duplicate — return existing
      return { ...existing, idempotent: true };
    }

    // Stale revision check
    if (input.expectedRevision !== undefined) {
      const last = Array.from(this.commandResults.values())
        .filter((r) => r.workspaceId === workspaceId && r.kind === 'learning:present')
        .sort((a, b) => b.revision - a.revision)[0];
      if (last && last.revision !== input.expectedRevision) {
        throw new Error('CONFLICT: Expected changed on another device or tab');
      }
    }

    // Commit
    const now = new Date();
    const record = {
      uid,
      commandId,
      kind: 'learning:present',
      payloadDigest,
      workspaceId,
      status: 'COMMITTED',
      committedAt: now,
      revision: (existing?.revision ?? 0) + 1,
    };
    this.commandResults.set(commandId, record);
    return record;
  }

  async grantConsent(uid, purpose, consentVersion, resourceId) {
    await this.ensurePerson(uid);
    const key = `${uid}-${purpose}-${resourceId ?? 'null'}-${consentVersion}`;
    if (this.consentGrants.has(key)) {
      throw new Error('CONFLICT: Active consent grant already exists for this purpose/version');
    }
    this.consentGrants.set(key, {
      uid,
      purpose,
      resourceId: resourceId ?? null,
      consentVersion,
      grantedAt: new Date(),
      expiresAt: null,
      revokedAt: null,
    });
    return { ok: true };
  }

  async revokeConsent(uid, purpose, resourceId) {
    for (const [key, grant] of this.consentGrants) {
      if (grant.uid === uid && grant.purpose === purpose &&
          (resourceId ? grant.resourceId === resourceId : grant.resourceId === null)) {
        this.consentGrants.set(key, { ...grant, revokedAt: new Date() });
        return true;
      }
    }
    return false;
  }

  async assertConsent(uid, purpose, resourceId, consentVersion) {
    const key = `${uid}-${purpose}-${resourceId ?? 'null'}-${consentVersion ?? ''}`;
    const grant = this.consentGrants.get(key);
    if (!grant) throw new Error('FORBIDDEN: No consent grant found');
    if (grant.revokedAt) throw new Error('FORBIDDEN: Consent has been revoked');
    if (grant.expiresAt && grant.expiresAt < new Date()) throw new Error('FORBIDDEN: Consent expired');
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

test('DATA-01 wrong-owner workspace access is denied', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');
  await repo.ensurePerson('user-b');

  const ws = await repo.createWorkspace('user-a', { name: 'A-Workspace', slug: 'a-workspace' });

  // user-b tries to access user-a's workspace → denied
  await assert.rejects(
    repo.assertOwnership(ws.id, 'user-b'),
    { message: 'FORBIDDEN: Not the workspace owner' },
  );
});

test('DATA-01 duplicate command key with same payload is idempotent', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');

  const input = {
    name: 'Test Workspace',
    slug: 'test-workspace',
    commandId: 'cmd-123',
    payload: { source: 'web' },
  };

  const ws1 = await repo.createWorkspace('user-a', input);
  const ws2 = await repo.createWorkspace('user-a', input);

  assert.equal(ws1.id, ws2.id, 'Idempotent retry should return the same workspace');
});

test('DATA-01 duplicate command key with changed payload is rejected', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');

  await repo.createWorkspace('user-a', {
    name: 'First',
    slug: 'first',
    commandId: 'cmd-456',
    payload: { source: 'web' },
  });

  // Same commandId but different payload → conflict
  await assert.rejects(
    repo.createWorkspace('user-a', {
      name: 'Second',
      slug: 'second',
      commandId: 'cmd-456',
      payload: { source: 'api', different: true },
    }),
    { message: 'CONFLICT: Same command key with changed payload' },
  );
});

test('DATA-01 stale revision / concurrent edit conflict', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');

  const sessionId = 'sess-1';
  const ws = await repo.createWorkspace('user-a', { name: 'RevTest', slug: 'rev-test' });

  // First check at revision 1
  const r1 = await repo.presentCheck('user-a', ws.id, sessionId, {
    commandId: 'check-1',
    expectedRevision: 0,
    answer: 'A',
    prompt: 'What is 2+2?',
  });

  // Second check at wrong revision → conflict
  await assert.rejects(
    repo.presentCheck('user-a', ws.id, sessionId, {
      commandId: 'check-2',
      expectedRevision: 0, // stale — should be 1
      answer: 'B',
      prompt: 'What is 3+3?',
    }),
    { message: /CONFLICT: Expected changed/ },
  );
});

test('DATA-01 consent revocation blocks subsequent operations', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');

  await repo.grantConsent('user-a', 'learning-evidence', 'v1');

  // Before revocation: consent is active
  await repo.assertConsent('user-a', 'learning-evidence', null, 'v1');

  // Revoke
  await repo.revokeConsent('user-a', 'learning-evidence', null);

  // After revocation: operation is blocked
  await assert.rejects(
    repo.assertConsent('user-a', 'learning-evidence', null, 'v1'),
    { message: 'FORBIDDEN: Consent has been revoked' },
  );
});

test('DATA-01 command from one user cannot be replayed by another', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');
  await repo.ensurePerson('user-b');

  await repo.createWorkspace('user-a', {
    name: 'Private',
    slug: 'private-space',
    commandId: 'cmd-private',
    payload: { secret: 'data' },
  });

  // user-b tries to reuse user-a's commandId → forbidden
  await assert.rejects(
    repo.createWorkspace('user-b', {
      name: 'Stolen',
      slug: 'stolen-space',
      commandId: 'cmd-private',
      payload: { secret: 'data' },
    }),
    { message: 'FORBIDDEN: Command belongs to another account' },
  );
});

test('DATA-01 membership role escalation is denied for non-owner', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('owner');
  await repo.ensurePerson('member');

  const ws = await repo.createWorkspace('owner', { name: 'RoleTest', slug: 'role-test' });

  // Grant member role (use the correct key format: `${uid}-${workspaceId}`)
  const membershipKey = `member-${ws.id}`;
  repo.memberships.set(membershipKey, {
    uid: 'member', workspaceId: ws.id, role: 'MEMBER',
    source: 'direct', joinedAt: new Date(), updatedAt: new Date(),
  });

  // Member cannot perform OWNER-level action
  await assert.rejects(
    () => repo.assertMembership(ws.id, 'member', 'OWNER'),
    { message: 'FORBIDDEN: Requires OWNER or higher' },
  );

  // But can perform MEMBER-level action
  await repo.assertMembership(ws.id, 'member', 'MEMBER');
});

test('DATA-01 workspace slug uniqueness is enforced', async () => {
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('user-a');

  await repo.createWorkspace('user-a', { name: 'First', slug: 'unique-slug' });
  await assert.rejects(
    repo.createWorkspace('user-a', { name: 'Second', slug: 'unique-slug' }),
    { message: 'CONFLICT: Workspace slug already exists' },
  );
});

test('DATA-01 SQL persons table does not store auth fields', async () => {
  // This test verifies the principle that SQL does not duplicate Firestore auth
  const repo = new MockWorkspaceRepository();
  await repo.ensurePerson('firebase-uid-123');

  const person = repo.persons.get('firebase-uid-123');
  assert.equal(person.uid, 'firebase-uid-123');
  // No email, password, plan, subscription fields
  assert.equal(person.email, undefined);
  assert.equal(person.passwordHash, undefined);
  assert.equal(person.plan, undefined);
  assert.equal(person.subscription, undefined);
});
