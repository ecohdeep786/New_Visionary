// DATA-08 — prove wrong UID/workspace/role, concurrent grants/revocation,
// stale writes and account-switch races; bound total instances x connection
// pools and recover cleanly after reconnect.
//
// The enabler has two parts: (1) a deterministically-testable authority/proof
// runner that replays the races against the owning store under test, and
// (2) a bounded connection pool gate that caps total instances x connections
// and recovers after a simulated disconnect. These shapes map onto the DATA-01
// owning tables (workspace_memberships, consent_grants, shares, command_results).
export type ProofOperation = 'grant' | 'revoke' | 'share' | 'workspace_membership' | 'command';

export interface AuthorityProbe {
  uid: string;
  workspaceId: string | null;
  role: string | null;
  operation: ProofOperation;
  resourceType?: string;
  resourceId?: string;
  payload?: unknown;
  revision?: number;
}

export type ProbeOutcome = 'allowed' | 'denied_wrong_owner' | 'denied_wrong_workspace' | 'denied_wrong_role' | 'denied_stale' | 'denied_duplicate' | 'denied_revoked' | 'denied_account_switch';

export interface RaceReport {
  probe: AuthorityProbe;
  outcome: ProbeOutcome;
  detail: string;
}

/** Bounded pool configuration: total active connections across instances. */
export interface PoolConfig {
  totalAllowed: number;
  instances: number;
}

export type ConnectionState = 'idle' | 'busy' | 'closed';

export interface ConnectionSpan {
  id: string;
  instanceId: string;
  state: ConnectionState;
  acquiredAt: string | null;
  releasedAt: string | null;
  lastError: string | null;
}
