// SYNC-02 (KAN-140) — the sync coordinator's shared types.
export type SyncSurface = 'account' | 'billing' | 'workspace' | 'build' | 'teaching' | 'content' | 'quality';

export interface SyncIdentity {
  uid: string;
  workspaceId: string;
}
