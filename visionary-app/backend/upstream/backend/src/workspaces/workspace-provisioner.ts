import { canonicalProvisionTarget, provisionIdentity, ProvisionResult, ProvisionTarget } from './provision-types';
import type { ProvisionStore, ProvisionLinkStore } from './provision-store';
/** Explicit cross-store reconciliation, not distributed ACID. A failed link
 * completion leaves durable pending state; retries reconcile the SQL receipt.
 * Only the verified session controller supplies verifiedUid. */
export class WorkspaceProvisioner {
  private readonly target: Readonly<ProvisionTarget>;
  constructor(private readonly store: ProvisionStore, private readonly links: ProvisionLinkStore, target: ProvisionTarget) { this.target = canonicalProvisionTarget(target); }
  async provision(verifiedUid: string, input: unknown): Promise<ProvisionResult> {
    const identity = provisionIdentity(verifiedUid, input, this.target);
    const pending = await this.links.begin(identity);
    const result = await this.store.commit(identity);
    await this.links.complete(identity, result.personalWorkspaceId);
    return { ...result, recovered: result.recovered || pending.recovered };
  }
}
