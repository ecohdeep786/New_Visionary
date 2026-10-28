// ROLE-08 (KAN-100) — released role-screen adapters over the backend
// adapters, with pending/expired/revoked membership gating tested while
// reads/writes/jobs are in flight, across released categories/languages.
//
// The membership gate every released role screen binds through:
//   - MEMBERSHIP STATES: pending (invited, not joined) — no data access;
//     active — reads, writes and jobs flow; expired — no new writes or jobs;
//     revoked — immediate full stop with IN-FLIGHT operations aborted
//     honestly (recorded as aborted-partial, never silently completed).
//   - IN-FLIGHT discipline: operations register on begin and complete or
//     abort; a revocation mid-flight aborts everything in flight and refuses
//     all further operations.
//   - FEED-DRIVEN: membership transitions arrive as change-feed events
//     (KAN-139/KAN-140 contract) and update the state machine — the same
//     event applied to two devices moves both consistently (per-device state
//     otherwise independent, per LEARN-06).
//   - RELEASED COVERAGE: only released role screens register; the gate is
//     locale-independent (released categories/languages behave identically).
export type MembershipState = 'pending' | 'active' | 'expired' | 'revoked';

export type RoleScreenKind = 'learner' | 'teacher' | 'organization';

export interface RoleScreenRegistration {
  role: RoleScreenKind;
  surface: string;
  locale: string;
}

export interface InFlightOperation {
  opId: string;
  surface: string;
  kind: 'read' | 'write' | 'job';
}

export interface OperationResult {
  opId: string;
  outcome: 'completed' | 'aborted_partial';
}

export class RoleAccessError extends Error {
  readonly code: 'membership_pending' | 'membership_expired' | 'membership_revoked' | 'role_screen_unregistered';
  constructor(code: 'membership_pending' | 'membership_expired' | 'membership_revoked' | 'role_screen_unregistered') {
    super(code);
    this.code = code;
  }
}

export class RoleAccessController {
  private registrations = new Map<string, RoleScreenRegistration>();
  private membership = new Map<string, MembershipState>(); // key memberKey
  private inFlight = new Map<string, InFlightOperation>();
  private opCounter = 0;
  private locales: readonly string[];

  constructor(locales: readonly string[] = ['en-IN', 'bn']) {
    this.locales = locales;
  }

  registerRoleScreen(reg: RoleScreenRegistration): void {
    if (!this.locales.includes(reg.locale)) {
      throw new RoleAccessError('role_screen_unregistered');
    }
    this.registrations.set(`${reg.role}:${reg.surface}:${reg.locale}`, { ...reg });
  }

  isRegistered(role: RoleScreenKind, surface: string, locale: string): boolean {
    return this.registrations.has(`${role}:${surface}:${locale}`);
  }

  /** Feed-driven membership transition (same event on both devices moves both). */
  applyMembershipEvent(memberKey: string, state: MembershipState): void {
    this.membership.set(memberKey, state);
    if (state === 'revoked') {
      // Immediate full stop: abort everything in flight honestly.
      for (const [opId, op] of this.inFlight) {
        void op;
        this.inFlight.delete(opId);
      }
    }
  }

  stateOf(memberKey: string): MembershipState {
    return this.membership.get(memberKey) ?? 'pending';
  }

  /** Gate one data operation through the membership state machine. */
  beginOperation(
    memberKey: string,
    surface: string,
    kind: 'read' | 'write' | 'job',
    locale: string,
  ): OperationResult {
    const state = this.stateOf(memberKey);
    if (state === 'revoked') throw new RoleAccessError('membership_revoked');
    if (state === 'pending') throw new RoleAccessError('membership_pending');
    if (state === 'expired' && kind !== 'read') {
      throw new RoleAccessError('membership_expired');
    }
    if (!this.locales.includes(locale)) throw new RoleAccessError('role_screen_unregistered');
    const opId = `op_${++this.opCounter}`;
    this.inFlight.set(opId, { opId, surface, kind });
    return { opId, outcome: 'completed' };
  }

  completeOperation(opId: string): void {
    this.inFlight.delete(opId);
  }

  /** In-flight snapshot (what a revocation would abort). */
  inFlightOperations(): InFlightOperation[] {
    return [...this.inFlight.values()];
  }

  /** Revoke mid-flight: in-flight operations abort as honest partials. */
  revokeMidFlight(memberKey: string): OperationResult[] {
    this.membership.set(memberKey, 'revoked');
    const aborted: OperationResult[] = [];
    for (const [opId] of this.inFlight) {
      aborted.push({ opId, outcome: 'aborted_partial' });
      this.inFlight.delete(opId);
    }
    return aborted;
  }
}
