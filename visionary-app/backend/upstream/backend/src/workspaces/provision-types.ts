// DATA-03 — personal workspace provisioning pending/recovery state types.
export type ProvisionStatus = 'pending' | 'provisioned' | 'rejected';

export interface ProvisionState {
  status: ProvisionStatus;
  personalWorkspaceId?: string;
  reason?: string;
  updatedAt: string;
}

/** Stable command key + payload digest for idempotent replay. */
export interface ProvisionReceipt {
  uid: string;
  commandId: string;
  digest: string;
  personalWorkspaceId: string;
  createdAt: string;
}

/** A provisioned personal workspace (SQL domain row).
 *  Firestore account/profile/billing are untouched and remain the authority. */
export interface PersonalWorkspace {
  id: string;
  uid: string;
  name: string;
  slug: string;
}

export interface ProvisionResult {
  personalWorkspaceId: string;
  name: string;
  slug: string;
  replay: boolean;
  recovered: boolean;
}

export interface ProvisionCommand {
  /** Client-supplied UID is only a hint; it must equal the verified server uid. */
  uid?: string;
  commandId: string;
  payload: unknown;
}
