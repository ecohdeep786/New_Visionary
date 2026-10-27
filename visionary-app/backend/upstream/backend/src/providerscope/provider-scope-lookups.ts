// AI-02 (KAN-84) — the provider-scope gate's typed state seams. The owning
// store (reviewed provider contracts) implements this at integration; the
// in-memory implementation is contract-true and fails closed.
import type { ProviderContract, ProviderPurpose } from './provider-scope-types';

export interface ProviderContractStore {
  /** The active reviewed contract for a provider+purpose, or undefined. */
  activeContract(provider: string, purpose: ProviderPurpose): Promise<ProviderContract | undefined>;
}

/** Contract-true in-memory store; revoked/expired contracts prove nothing. */
export class InMemoryProviderContractStore implements ProviderContractStore {
  private contracts: ProviderContract[] = [];

  setContract(contract: ProviderContract): void {
    this.contracts = [...this.contracts.filter((c) => !(c.provider === contract.provider && c.purpose === contract.purpose && c.version === contract.version)), { ...contract }];
  }

  async activeContract(provider: string, purpose: ProviderPurpose): Promise<ProviderContract | undefined> {
    const found = this.contracts
      .filter((c) => c.provider === provider && c.purpose === purpose && c.status === 'active')
      .sort((a, b) => b.version - a.version);
    return found[0] ? { ...found[0], permittedFields: [...found[0].permittedFields], permittedTools: [...found[0].permittedTools], approvedFallbacks: found[0].approvedFallbacks.map((f) => ({ ...f })) } : undefined;
  }
}
