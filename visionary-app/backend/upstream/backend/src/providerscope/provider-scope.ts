// AI-02 (KAN-84) — the provider-request scope gate.
//
// Core responsibilities (server-owned; minimized; fail closed):
//   1. authorize: run a request only against the ACTIVE reviewed contract for
//      the provider+purpose; revoked/expired/unknown contracts refuse.
//   2. minimize: only contract-permitted fields are forwarded — a request that
//      needs a non-permitted field is refused, never silently widened, and the
//      minimized output carries the contract version + region + retention.
//   3. tools: only contract-permitted tools are allowed.
//   4. fallback: switching provider/region requires an EXPLICIT pre-approved
//      fallback entry in the contract; unapproved fallbacks refuse.
import type {
  MinimizedRequest,
  ProviderContract,
  ProviderRequest,
  ProviderScopeError as ProviderScopeErrorType,
} from './provider-scope-types';
import { ProviderScopeError } from './provider-scope-types';
import type { ProviderContractStore } from './provider-scope-lookups';

export class ProviderScopeGate {
  constructor(private readonly store: ProviderContractStore) {}

  /** Authorize + minimize one provider request (primary provider). */
  async authorize(provider: string, request: ProviderRequest): Promise<MinimizedRequest> {
    const contract = await this.store.activeContract(provider, request.purpose);
    if (!contract) throw new ProviderScopeError('contract_not_active');
    return this.bind(contract, request);
  }

  /** Fall back to another provider/region — ONLY if pre-approved. */
  async authorizeFallback(primary: string, fallbackProvider: string, request: ProviderRequest): Promise<MinimizedRequest> {
    const contract = await this.store.activeContract(primary, request.purpose);
    if (!contract) throw new ProviderScopeError('contract_not_active');
    // The fallback needs its own reviewed contract AND a pre-approved entry.
    const fallbackContract = await this.store.activeContract(fallbackProvider, request.purpose);
    if (!fallbackContract) throw new ProviderScopeError('contract_not_active');
    const approved = contract.approvedFallbacks.some((f) => f.provider === fallbackContract.provider && f.region === fallbackContract.region);
    if (!approved) throw new ProviderScopeError('fallback_not_approved');
    return this.bind(fallbackContract, request);
  }

  private bind(contract: ProviderContract, request: ProviderRequest): MinimizedRequest {
    if (contract.status !== 'active') throw new ProviderScopeError('contract_not_active');
    if (!contract.permittedTools.includes(request.tool)) throw new ProviderScopeError('tool_not_permitted');

    const minimized: Record<string, unknown> = {};
    for (const field of contract.permittedFields) {
      if (field in request.fields) minimized[field] = request.fields[field];
    }
    // Fail closed: a request that NEEDS a non-permitted field is refused —
    // never silently widened, never silently dropped-and-sent-anyway.
    const requestedKeys = Object.keys(request.fields);
    const notPermitted = requestedKeys.filter((k) => !contract.permittedFields.includes(k));
    if (notPermitted.length > 0) throw new ProviderScopeError('field_not_permitted');

    return {
      provider: contract.provider,
      contractVersion: contract.version,
      region: contract.region,
      retention: contract.retention,
      tool: request.tool,
      fields: minimized,
    };
  }
}

export type { ProviderScopeErrorType };
