// AI-02 (KAN-84) — reviewed provider purpose/region/retention/tools and
// contract settings; minimize sent data; fallback requires explicit approval.
//
// The checkpoint here is a server-owned provider-request scope gate:
//   - A provider contract is REVIEWED and versioned: purpose, region, retention
//     and permitted tools are explicit; requests run only against a reviewed,
//     active contract version.
//   - Sent data is MINIMIZED: only the fields the reviewed contract permits are
//     forwarded — everything else is stripped server-side before any provider
//     call. A request needing a non-permitted field is refused (fail closed),
//     never silently widened.
//   - Fallback providers require EXPLICIT APPROVAL: a request may fall back to
//     another provider/region only when that fallback is pre-approved in the
//     contract; an unapproved fallback is refused.
//   - Revoked/expired contracts block requests immediately (fail closed).
//   - Wrong users denied; fail closed everywhere.
//
// Exit: permitted, minimized, versioned provider usage.

/** The actor on whose behalf a provider request runs. */
export interface ProviderCaller {
  uid: string;
  workspaceId: string;
}

/** What a provider may be used for (reviewed). */
export type ProviderPurpose = 'teaching' | 'evaluation' | 'transcription' | 'summarization';

/** A reviewed provider contract version. */
export interface ProviderContract {
  contractId: string;
  provider: string;
  version: number;
  purpose: ProviderPurpose;
  /** Data-residency region the contract reviewed. */
  region: string;
  /** Retention class the provider agreed to. */
  retention: 'none' | 'session' | 'days30' | 'contractual';
  /** Tools the provider may invoke. */
  permittedTools: readonly string[];
  /** Payload fields the contract permits to be sent (minimization allowlist). */
  permittedFields: readonly string[];
  /** Pre-approved fallback providers (exact provider:region pairs). */
  approvedFallbacks: readonly { provider: string; region: string }[];
  status: 'active' | 'revoked' | 'expired';
}

/** The caller's intended request payload (before minimization). */
export interface ProviderRequest {
  caller: ProviderCaller;
  purpose: ProviderPurpose;
  /** Desired payload fields (may contain non-permitted entries). */
  fields: Record<string, unknown>;
  tool: string;
}

/** The minimized, contract-bound request actually allowed out. */
export interface MinimizedRequest {
  provider: string;
  contractVersion: number;
  region: string;
  retention: ProviderContract['retention'];
  tool: string;
  /** Only the permitted fields survive minimization. */
  fields: Record<string, unknown>;
}

export class ProviderScopeError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'contract_not_active'
      | 'field_not_permitted'
      | 'tool_not_permitted'
      | 'fallback_not_approved'
      | 'unknown_contract'
  ) {
    super(code);
  }
}
