// DATA-03 — idempotent personal workspace provisioning with pending/recovery.
//
// Every domain command is server-authorized and transactionally scoped:
//   - The verified server uid is authoritative; a client-supplied uid that
//     differs is rejected (wrong-owner).
//   - A command key already committed with the same payload replays its prior
//     result; the same key with a changed payload is rejected.
//   - Provisioning first writes a `pending` state, then idempotently creates
//     the Person + personal Workspace + OWNER membership, then marks
//     `provisioned`. An interrupted run (outage mid-provision) is recovered from
//     the pending state without duplicates or conflicting workspaces.
//   - Firestore account/profile/billing are never touched by provisioning.
import { createHash } from 'node:crypto';
import type { PersonalWorkspace, ProvisionCommand, ProvisionResult, ProvisionState } from './provision-types';
import type { ProvisionStore } from './provision-store';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const now = () => new Date().toISOString();
const personalSlug = (uid: string) => `personal-${uid.replace(/[^A-Za-z0-9-]/g, '').slice(0, 40).toLowerCase()}`;
const uname = (uid: string) => 'Personal workspace';

export class WorkspaceProvisioner {
  constructor(private readonly store: ProvisionStore) {}

  private validCommand(input: unknown): ProvisionCommand {
    if (typeof input !== 'object' || input === null) throw new Error('INVALID_COMMAND: provisioning payload required.');
    const cmd = input as Record<string, unknown>;
    if (typeof cmd.commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(cmd.commandId)) {
      throw new Error('INVALID_COMMAND: a stable command id is required.');
    }
    return { uid: cmd.uid as string | undefined, commandId: cmd.commandId, payload: cmd.payload ?? {} };
  }

  private workspaceId(w: PersonalWorkspace) { return w.id; }

  /** Run (or resume) personal workspace provisioning for one verified uid. */
  async provision(uid: string, input: unknown): Promise<ProvisionResult> {
    const command = this.validCommand(input);
    if (command.uid !== undefined && command.uid !== uid) {
      throw new Error('WRONG_OWNER: the verified account differs from the requested provisioning uid.');
    }
    // Defense-in-depth: a client payload must not carry a foreign uid or a
    // personal workspace that belongs to another account.
    const payload = (command.payload ?? {}) as Record<string, unknown>;
    if (typeof payload.uid === 'string' && payload.uid !== uid) {
      throw new Error('WRONG_OWNER: the verified account differs from the payload uid.');
    }
    if (typeof payload.workspaceId === 'string' && payload.workspaceId) {
      const mine = await this.store.personalWorkspaceFor(uid);
      if (!mine || payload.workspaceId !== mine.id) {
        throw new Error("WRONG_OWNER: a client cannot reference another account's personal workspace.");
      }
    }
    const payloadDigest = digest(command.payload);

    const previous = await this.store.readReceipt(command.commandId);
    if (previous) {
      if (previous.uid !== uid) throw new Error('WRONG_OWNER: this command belongs to another account.');
      if (previous.digest !== payloadDigest) throw new Error('CONFLICT: same command key with a changed payload.');
      const ws = await this.store.personalWorkspaceFor(uid);
      if (!ws || ws.id !== previous.personalWorkspaceId) throw new Error('CONFLICT: command outcome no longer matches the saved workspace.');
      return { personalWorkspaceId: ws.id, name: ws.name, slug: ws.slug, replay: true, recovered: false };
    }

    // Pending/recovery: if a prior attempt left pending state, resume it.
    const state = await this.store.readState(uid);
    if (state?.status === 'provisioned' && state.personalWorkspaceId) {
      const ws = await this.store.personalWorkspaceFor(uid);
      if (ws) {
        await this.store.writeReceipt({ uid, commandId: command.commandId, digest: payloadDigest, personalWorkspaceId: ws.id, createdAt: now() });
        return { personalWorkspaceId: ws.id, name: ws.name, slug: ws.slug, replay: true, recovered: false };
      }
    }

    // Fresh or interrupted run: mark pending, provision idempotently, mark done.
    // `recovered` reports that we resumed from a prior interrupted attempt or a
    // previously provisioned workspace rather than completing a fresh run.
    const priorState = await this.store.readState(uid);
    let recovered = priorState !== null;
    const pending: ProvisionState = { status: 'pending', updatedAt: now() };
    await this.store.writeState(uid, pending);

    try {
      await this.store.ensurePerson(uid);
      // Personal workspace: create only if the uid does not already own one.
      let ws = await this.store.personalWorkspaceFor(uid);
      if (!ws) {
        ws = await this.store.createPersonalWorkspace(uid, uname(uid), personalSlug(uid));
      } else {
        recovered = true; // resumed from an interrupted run
      }
      await this.store.ensureOwnerMembership(uid, this.workspaceId(ws));

      const done: ProvisionState = { status: 'provisioned', personalWorkspaceId: ws.id, updatedAt: now() };
      await this.store.writeState(uid, done);
      await this.store.writeReceipt({ uid, commandId: command.commandId, digest: payloadDigest, personalWorkspaceId: ws.id, createdAt: now() });
      return { personalWorkspaceId: ws.id, name: ws.name, slug: ws.slug, replay: false, recovered };
    } catch (error) {
      await this.store.writeState(uid, { ...pending, status: 'rejected', reason: error instanceof Error ? error.message : 'provision failed', updatedAt: now() });
      throw error;
    }
  }
}
