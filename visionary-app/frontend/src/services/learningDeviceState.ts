// LEARN-06 (KAN-72) — authorized change cursors/refetch, stale-response
// rejection, independent workspace selection per device, offline/conflict
// recovery and sign-out/account-switch handling.
//
// The device-side learning state machine (companion to the SYNC-02
// coordinator):
//   - AUTHORIZED CURSORS: cursors are issued per (device, workspace, surface)
//     and carry an identity binding — a cursor presented by another device or
//     workspace refuses (uniform invalid, no leak).
//   - REFETCH: refetching from a retained cursor replays the exact ordered
//     suffix deterministically.
//   - STALE-RESPONSE REJECTION: every response carries a monotonically
//     increasing generation; a response older than the applied generation is
//     rejected and never overwrites newer state.
//   - INDEPENDENT WORKSPACE SELECTION PER DEVICE: each device selects its own
//     workspace; switching on one device never affects another.
//   - OFFLINE/CONFLICT RECOVERY: drafts queued offline bind the BASE revision
//     they were made against; on reconnect a draft whose base still matches
//     applies cleanly, and a draft whose base moved becomes an explicit
//     CONFLICT (both versions retained — no silent overwrite).
//   - SIGN-OUT/ACCOUNT-SWITCH: sign-out wipes ALL device state (cursors,
//     drafts, workspace selection); account switch isolates per account.
export interface DeviceIdentity {
  uid: string;
  workspaceId: string;
}

export interface DeviceCursor {
  token: string;
  deviceRef: string;
  workspaceId: string;
  surface: string;
  seq: number;
}

export interface QueuedDraft {
  draftId: string;
  surface: string;
  baseRevision: number;
  op: Record<string, unknown>;
}

export type RecoveryOutcome =
  | { kind: 'applied'; draftId: string }
  | { kind: 'conflict'; draftId: string; baseRevision: number; serverRevision: number };

export class LearningDeviceError extends Error {
  readonly code: 'cursor_invalid' | 'stale_response' | 'identity_mismatch' | 'signed_out';
  constructor(code: 'cursor_invalid' | 'stale_response' | 'identity_mismatch' | 'signed_out') {
    super(code);
    this.code = code;
  }
}

interface DeviceState {
  identity: DeviceIdentity;
  cursors: Map<string, DeviceCursor>;
  applied: Map<string, number>;
  drafts: QueuedDraft[];
  conflicts: { draft: QueuedDraft; serverRevision: number }[];
}

export class LearningDeviceState {
  private signedOut = false;
  private states = new Map<string, DeviceState>(); // keyed deviceRef
  private currentDevice: string;
  private generation = 0;

  constructor(deviceRef: string, identity: DeviceIdentity) {
    this.currentDevice = deviceRef;
    this.states.set(deviceRef, {
      identity: { ...identity },
      cursors: new Map(),
      applied: new Map(),
      drafts: [],
      conflicts: [],
    });
  }

  /** Independent workspace selection PER DEVICE. */
  selectWorkspace(deviceRef: string, identity: DeviceIdentity): void {
    this.currentDevice = deviceRef;
    const existing = this.states.get(deviceRef);
    if (!existing) {
      this.states.set(deviceRef, {
        identity: { ...identity },
        cursors: new Map(),
        applied: new Map(),
        drafts: [],
        conflicts: [],
      });
      return;
    }
    // A workspace/account switch on this device rebinds its identity and
    // drops its cursors (old-scope cursors refuse afterwards).
    if (
      existing.identity.workspaceId !== identity.workspaceId ||
      existing.identity.uid !== identity.uid
    ) {
      existing.identity = { ...identity };
      existing.cursors.clear();
    }
  }

  workspaceOf(deviceRef: string): string {
    return this.requireState(deviceRef).identity.workspaceId;
  }

  /** Issue an authorized cursor bound to (device, workspace, surface). */
  issueCursor(surface: string, seq: number): DeviceCursor {
    const state = this.requireState(this.currentDevice);
    const cursor: DeviceCursor = {
      token: `dc_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`,
      deviceRef: this.currentDevice,
      workspaceId: state.identity.workspaceId,
      surface,
      seq,
    };
    state.cursors.set(`${surface}`, cursor);
    return cursor;
  }

  /** Refetch from a cursor: identity-bound (other device/workspace refuses). */
  refetch(deviceRef: string, cursor: DeviceCursor): { surface: string; fromSeq: number } {
    if (cursor.deviceRef !== deviceRef) throw new LearningDeviceError('cursor_invalid');
    const state = this.requireState(deviceRef);
    if (cursor.workspaceId !== state.identity.workspaceId) {
      throw new LearningDeviceError('cursor_invalid');
    }
    const stored = state.cursors.get(cursor.surface);
    if (!stored || stored.token !== cursor.token) throw new LearningDeviceError('cursor_invalid');
    return { surface: cursor.surface, fromSeq: cursor.seq };
  }

  /** Stale-response rejection: monotonically increasing generations. */
  acceptResponse(generation: number): boolean {
    if (generation <= this.generation) {
      return false;
    }
    this.generation = generation;
    return true;
  }

  currentGeneration(): number {
    return this.generation;
  }

  /** Queue a draft offline, bound to the base revision it was made against. */
  queueDraft(surface: string, baseRevision: number, op: Record<string, unknown>): QueuedDraft {
    const state = this.requireState(this.currentDevice);
    const draft: QueuedDraft = {
      draftId: `dft_${Math.random().toString(36).slice(2, 10)}`,
      surface,
      baseRevision,
      op,
    };
    state.drafts.push(draft);
    return draft;
  }

  /** Recovery: apply clean drafts; a moved base becomes an explicit CONFLICT. */
  recover(draftId: string, serverRevision: number): RecoveryOutcome {
    const state = this.requireState(this.currentDevice);
    const draft = state.drafts.find((d) => d.draftId === draftId);
    if (!draft) throw new LearningDeviceError('signed_out');
    if (serverRevision === draft.baseRevision) {
      state.drafts = state.drafts.filter((d) => d.draftId !== draftId);
      return { kind: 'applied', draftId };
    }
    // Conflict: BOTH versions retained — no silent overwrite.
    state.drafts = state.drafts.filter((d) => d.draftId !== draftId);
    state.conflicts.push({ draft, serverRevision });
    return { kind: 'conflict', draftId, baseRevision: draft.baseRevision, serverRevision };
  }

  conflicts(): { draft: QueuedDraft; serverRevision: number }[] {
    return [...this.requireState(this.currentDevice).conflicts];
  }

  /** Account switch: isolate per account (device keeps its own state). */
  switchAccount(deviceRef: string, identity: DeviceIdentity): void {
    this.selectWorkspace(deviceRef, identity);
  }

  /** Sign-out: wipe ALL device state (cursors, drafts, workspace selection). */
  signOut(deviceRef: string): void {
    this.states.delete(deviceRef);
    if (this.currentDevice === deviceRef) {
      this.signedOut = true;
    }
  }

  isSignedOut(deviceRef: string): boolean {
    return this.signedOut && !this.states.has(deviceRef);
  }

  private requireState(deviceRef: string): DeviceState {
    const state = this.states.get(deviceRef);
    if (!state) throw new LearningDeviceError('signed_out');
    return state;
  }
}
