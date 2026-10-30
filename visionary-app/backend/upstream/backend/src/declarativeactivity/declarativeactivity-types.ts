// BUILD-09 (KAN-154) — trusted declarative Build activities and accessible
// preview (Build Stage3): versioned allowlisted activity schemas, approved
// trusted renderers, bounded validated parameters/assets, and accessible
// preview served over a FIXED immutable project/proposal revision.
//
// The checkpoint here is the server-owned declarative-admission contract:
//   - Schemas are SERVER-REGISTERED and VERSIONED: a schema version pins the
//     allowed component allowlist and the approved renderer set — a client can
//     never extend it.
//   - MANIFESTS ARE VALIDATED, not executed: bounded depth/size, component and
//     renderer must be allowlisted, and banned content (scripts, arbitrary
//     HTML/URLs, network actions, hidden answer keys) rejects the manifest
//     BEFORE anything persists.
//   - PREVIEW IS FIXED AND TRUSTED: the preview serves the exact immutable
//     base revision the proposal was generated against; integrity is
//     re-verified (manifest digest) and the view is a pre-validated safe
//     representation — raw script/HTML from the manifest is never returned.
//     No generated JavaScript/HTML is executed anywhere.
//   - OPERATIONS ARE DISTINCT AND AUTHORIZED: generation (admit), preview,
//     accept/save, export and sharing are separate operations with their own
//     ownership checks; sharing itself stays in the KAN-80 contract.
//   - STALE PROPOSALS AND CANCELLED RUNS FAIL CLOSED: acceptance is blocked
//     when the project revision moved past the proposal's base; a cancelled
//     run yields no admissible activity. Wrong users denied everywhere.
//
// This does NOT enable the separate arbitrary-code/public-app runtime.

/** Actor/workspace ownership. */
export interface ActivityOwner {
  uid: string;
  workspaceId: string;
}

/** An approved, trusted renderer for one component (never arbitrary output). */
export interface ApprovedRenderer {
  component: string;
  rendererId: string;
  /** Safe, predefined representation kind, e.g. 'ekan-card' — no scripts. */
  representation: string;
}

/** One versioned, server-registered activity schema. */
export interface ActivitySchema {
  schemaId: string;
  version: number;
  allowedComponents: readonly string[];
  renderers: readonly ApprovedRenderer[];
  maxManifestDepth: number;
  maxManifestBytes: number;
  readonly bannedKeys: readonly string[];
}

/** A client-submitted declarative activity manifest (validated, never run). */
export interface ActivityManifest {
  kind: 'activity';
  schemaId: string;
  schemaVersion: number;
  component: string;
  rendererId: string;
  title: string;
  params: Record<string, unknown>;
}

/** A server-admitted declarative activity bound to an exact proposal revision. */
export interface DeclarativeActivity {
  activityId: string;
  owner: ActivityOwner;
  projectId: string;
  /** The KAN-78 proposal this activity came from (cancelled runs yield none). */
  proposalId: string;
  /** Fixed immutable revision the preview serves — never moves. */
  baseRevision: number;
  manifest: ActivityManifest;
  status: 'pending' | 'accepted' | 'rejected';
}

/** The safe preview representation returned to the owner. */
export interface ActivityPreviewView {
  activityId: string;
  projectId: string;
  baseRevision: number;
  rendererId: string;
  representation: string;
  /** Pre-validated safe view rows — never raw script/HTML from the manifest. */
  view: readonly { key: string; kind: 'text' | 'number' | 'bool' | 'select'; value: string }[];
}

export type ActivityErrorCode =
  | 'not_owner'                 // wrong uid/workspace
  | 'unknown_project'
  | 'unknown_proposal'
  | 'unknown_activity'
  | 'run_cancelled'             // proposals from cancelled runs never admitted
  | 'unknown_schema'
  | 'schema_tampered'           // manifest schema/version vs registered record
  | 'unknown_component'
  | 'unapproved_renderer'
  | 'manifest_too_deep'
  | 'manifest_too_large'
  | 'script_execution_banned'   // scripts / arbitrary HTML / event handlers
  | 'hidden_answer_key'         // answer keys must stay server-protected
  | 'unsafe_url'                // arbitrary URLs rejected
  | 'network_action_banned'     // network/fetch actions rejected
  | 'base_revision_moved'       // stale proposal: project moved past the base
  | 'activity_decided'          // already accepted/rejected
  | 'preview_integrity_failed'; // base revision bytes no longer match its digest

export class DeclarativeError extends Error {
  constructor(public readonly code: ActivityErrorCode) {
    super(code);
  }
}
