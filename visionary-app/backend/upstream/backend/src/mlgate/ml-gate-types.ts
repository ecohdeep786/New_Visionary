// AI-06 (KAN-88) — permission-filtered retrieval, pinned context/prompt/tool
// versions, and schema/citation/locale/allowed-action output validation.
//
// The checkpoint here is the server-owned ML request/response gate:
//   - Retrieval is PERMISSION-FILTERED server-side: only sources the caller is
//     permitted to retrieve (released + allowed for this workspace) are ever
//     placed in the model context — a forbidden source never reaches the model.
//   - Versions are PINNED: the request binds exact context/prompt/tool
//     versions; a model response that was not generated against the SAME
//     pinned versions is refused (no version drift, no silent prompt swap).
//   - Output validation fails closed: an output is accepted only when its
//     schema is valid, every citation resolves to a source inside the
//     permitted set, the locale matches the requested interface locale, and
//     every action is on the allowed-action list. A generated output that
//     fails any check is refused — a model output is not committed product
//     state.
//   - The accepted output carries the full audit trail: pinned versions,
//     filtered source set, and the validation decisions.
//
// Exit: permitted, pinned, validated ML output — nothing unverified commits.

/** The authenticated ML caller (server-derived). */
export interface MlCaller {
  uid: string;
  workspaceId: string;
}

/** A source fact the gate can permission-filter (CONTENT/06 semantics). */
export interface MlSourceFact {
  sourceId: string;
  sourceVersion: string;
  /** The locale this source is released for. */
  locale: string;
  /** Server-side eligibility: published + public + approved/released. */
  eligible: boolean;
}

/** The exact versions a request is pinned to. */
export interface PinnedVersions {
  contextVersion: string;
  promptVersion: string;
  toolVersion: string;
}

/** The retrieval set after server-side permission filtering. */
export interface FilteredRetrieval {
  sourceIds: readonly string[];
  pinned: PinnedVersions;
  locale: string;
  /** Sources that were filtered OUT (for the audit trail; never sent). */
  filteredOut: readonly string[];
}

/** A model output under validation. */
export interface ModelOutput {
  pinned: PinnedVersions;
  locale: string;
  body: unknown;
  requiredFields: readonly string[];
  citations: readonly string[];
  actions: readonly string[];
}

/** The validated, committable output. */
export interface ValidatedOutput {
  accepted: true;
  pinned: PinnedVersions;
  citations: readonly string[];
  actions: readonly string[];
  validatedAt: string;
}

export class MlGateError extends Error {
  constructor(
    public readonly code:
      | 'version_mismatch'
      | 'citation_not_permitted'
      | 'locale_mismatch'
      | 'action_not_allowed'
      | 'schema_invalid'
  ) {
    super(code);
  }
}
