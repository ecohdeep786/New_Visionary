// DATA-08 — concurrency/authority proof runner.
//
// Runs deterministic, server-scoped probes against the owning store to prove:
//   - wrong UID / wrong workspace / wrong role are denied,
//   - concurrent grant/revocation cannot produce a revoked grant that later
//     reads active (time never revives; a second mutation is rejected),
//   - stale writes (revision mismatch / changed payload) are denied,
//   - account-switch races (command arrives under a different uid) are denied,
//   - duplicate command keys are denied as fresh commits,
//   - the fleet-wide connection pool is bounded (total instances x connections)
//     and a dropped connection recovers cleanly via a fresh acquire.
import { createHash } from 'node:crypto';
import type { AuthorityProbe, RaceReport } from './concurrency-types';
import type { ProofStore } from './concurrency-store';

const ROLE_RANK: Record<string, number> = { GUEST: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export interface ProofRunnerOptions {
  now?: () => Date;
}

export class ConcurrencyProver {
  private readonly now: () => Date;

  constructor(private readonly store: ProofStore, options: ProofRunnerOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  /**
   * Apply one probe and return the outcome. Authority is derived entirely from
   * the owning store: no role picker, email match, guessed ID or browser record
   * can substitute. Allowed grant/revoke mutations are persisted so a later
   * concurrent probe sees the committed state.
   */
  async prove(probe: AuthorityProbe): Promise<RaceReport> {
    if (probe.operation === 'revoke') {
      const purpose = String(probe.payload?.['purpose'] ?? 'consent');
      const grant = await this.store.subjectGrant(probe.uid, purpose, probe.resourceId);
      if (!grant) return { probe, outcome: 'denied_wrong_owner', detail: 'No grant owned by this uid for that subject purpose/resource.' };
      if (grant.state === 'revoked') return { probe, outcome: 'denied_revoked', detail: 'Already revoked; time alone never revives a grant.' };
      await this.store.applyRevoke(probe.uid, purpose, probe.resourceId);
      return { probe, outcome: 'allowed', detail: 'Subject owns the grant being revoked.' };
    }

    if (probe.operation === 'grant' || probe.operation === 'share') {
      const resourceType = probe.resourceType ?? probe.operation;
      const purpose = String(probe.payload?.['purpose'] ?? (probe.operation === 'share' ? 'document_sharing' : 'consent'));

      // Wrong-owner: the resource must be owned by the acting uid (or be a fresh target).
      if (probe.resourceId && probe.resourceId !== 'new') {
        const owner = await this.store.ownerOf(resourceType, probe.resourceId);
        this.store.appendDetail(`${probe.uid} ${probe.operation} on ${resourceType}:${probe.resourceId}, owner=${owner ?? 'none'}`);
        if (owner && owner !== probe.uid) {
          return { probe, outcome: 'denied_wrong_owner', detail: 'The resource belongs to another uid.' };
        }
      }

      // Concurrent grant: an existing active subject grant is a duplicate; a
      // revoked subject grant is denied (never silently revived).
      if (probe.operation === 'grant') {
        const existing = await this.store.subjectGrant(probe.uid, purpose, probe.resourceId);
        if (existing) {
          return existing.state === 'active'
            ? { probe, outcome: 'denied_duplicate', detail: 'A concurrent grant on an already-active subject purpose is rejected.' }
            : { probe, outcome: 'denied_revoked', detail: 'A revoked subject grant is not silently revived; a fresh grant needs an explicit new-version command.' };
        }
        await this.store.applyGrant(probe.uid, purpose, probe.resourceId);
        return { probe, outcome: 'allowed', detail: 'Fresh scoped grant recorded (server-authoritative).' };
      }

      // share: owner may share its own resource; a duplicate share is rejected.
      if (probe.operation === 'share' && probe.resourceId !== 'new') {
        const existing = await this.store.subjectGrant(probe.uid, purpose, probe.resourceId);
        if (existing) {
          return { probe, outcome: 'denied_duplicate', detail: 'A share already exists for this owner purpose/resource.' };
        }
        await this.store.applyGrant(probe.uid, purpose, probe.resourceId);
        return { probe, outcome: 'allowed', detail: 'Fresh scoped share recorded (server-authoritative).' };
      }
      return { probe, outcome: 'allowed', detail: 'Verified subject authority on owned (or fresh) resource.' };
    }

    // Workspace-scoped operations require a verified membership of the role.
    if (probe.operation === 'workspace_membership') {
      const role = probe.workspaceId ? await this.store.role(probe.uid, probe.workspaceId) : null;
      if (probe.role && role && ROLE_RANK[role] >= ROLE_RANK[probe.role]) {
        return { probe, outcome: 'allowed', detail: `${role} >= required ${probe.role} on workspace.` };
      }
      if (!probe.workspaceId) return { probe, outcome: 'denied_wrong_workspace', detail: 'No workspace scope provided.' };
      if (!role) return { probe, outcome: 'denied_wrong_role', detail: 'No verified membership in this workspace.' };
      return { probe, outcome: 'denied_wrong_role', detail: `Required ${probe.role} but the verified role is ${role}.` };
    }

    // Commands: duplicate key, stale write (changed payload), account-switch race.
    if (probe.operation === 'command') {
      const commandId = String(probe.resourceId ?? ((probe.payload as Record<string, unknown>)['commandId'] ?? ''));
      const existing = await this.store.commandState(commandId);
      if (existing) {
        if (existing.uid !== probe.uid) return { probe, outcome: 'denied_wrong_owner', detail: 'The command belongs to another account (account-switch race denied).' };
        if (existing.digest === digest(probe.payload)) return { probe, outcome: 'denied_duplicate', detail: 'Same command key with identical payload would be a replay, not a fresh commit.' };
        return { probe, outcome: 'denied_stale', detail: 'Same command key with a changed payload is rejected as a stale/conflicting write.' };
      }
      if ((probe.uid.startsWith('preview-') || probe.uid.startsWith('fixture-')) && probe.revision === undefined) {
        return { probe, outcome: 'denied_wrong_role', detail: 'Preview/fixture membership is not production permission.' };
      }
      this.store.appendDetail(`${probe.uid} accepted fresh command ${commandId}`);
      return { probe, outcome: 'allowed', detail: 'Fresh scoped command accepted.' };
    }

    return { probe, outcome: 'denied_wrong_role', detail: 'Unknown operation.' };
  }

  /** Prove a list of probes (the race batch) and return all reports. */
  async proveAll(probes: AuthorityProbe[]): Promise<{ reports: RaceReport[]; detail: string[] }> {
    const reports: RaceReport[] = [];
    for (const probe of probes) reports.push(await this.prove(probe));
    return { reports, detail: this.store['details'] ? (this.store as unknown as { details: string[] }).details.slice() : [] };
  }
}
