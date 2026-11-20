# FHE-13 / FHE-14 / FHE-15 / FHE-16 — GUARDIAN, PROFESSIONAL, ORGANIZATION AND CROSS-ROLE EVENT HANDOFF TO THE BACKEND OWNERS

**Status:** exact frontend-side contract handoff (V6 §7 FHE-13–FHE-16, FHE-24
deliverable). **Written:** 2026-11-18 on `dev` = `5fb4445c`. **Owner:** backend data
lane (all parts; no ML requirement). **Companion to:**
`FHE07_08_CONTENT_TEACHING_HANDOFF.md` (transport idiom, error semantics, frontend
guarantees) and `FHE10_12_BUILD_CLASSROOM_HANDOFF.md` (classroom authority).

Everything below transcribes the accepted preview UX's domain models
(`workspaceService.ts` relationships/family summaries, `roleMentorService.ts`
career records, the Organization surfaces) into the selected backend's
registered command idiom. Preview implementations stay DEV-only; production
keeps honest rooms until each service is registered, qualified and reviewed.

---

## Part A — Guardian relationships and permitted summaries (FHE-13)

**User outcome:** a verified guardian requests/accepts the correct
relationship and sees only explicitly permitted summaries; nothing is visible
merely by choosing "Parent" at onboarding; Family billing never grants
educational guardian authority.

### A1. Relationship model (from the accepted preview UX)

```jsonc
{
  "relationshipId": "uuidv4",
  "from": "requester uid",             // guardian
  "to": "target uid",                  // learner
  "type": "guardian",                  // 'guardian' in this release
  "status": "pending",                 // 'pending'|'active'|'declined'|'revoked'|'expired'
  "scope": ["progress-summary"],       // the ONLY release scope
  "expiresAt": "ISO-8601",             // pending invitations expire after 7 days
  "events": [{"event": "requested|accepted|declined|cancelled|revoked", "at": "ISO-8601", "actor": "uid"}]
}
```

### A2. Endpoints

| Operation | Call | Invariants |
| --- | --- | --- |
| Request connection | `POST /api/account/relationships` `{version:1, commandId, targetEmail(≤254), type:'guardian'}` | creates `pending` with 7-day expiry; the target is resolved server-side by verified account email — never client-supplied uid; duplicate open request is idempotent |
| Respond | `POST /api/account/relationships/:relationshipId/respond` `{version:1, commandId, decision:'accept'\|'decline'}` | target only; `accept` requires the target account's own verified admission state; expired/revoked requests cannot be accepted (`409`) |
| Renew | `POST /api/account/relationships/:relationshipId/renew` `{version:1, commandId, requesterUid-check}` | requester only, only when `expired` — an open request cannot be renewed (`409`, the preview's exact copy) |
| Revoke | `POST /api/account/relationships/:relationshipId/revoke` `{version:1, commandId, expectedStatus}` | either party; summary visibility ends immediately (E17) |
| List | `GET /api/account/relationships` | both directions, server-computed live status incl. expiry |
| Permitted progress summary | `GET /api/account/relationships/:relationshipId/progress-summary?days=7\|30` | requester only while `active`; aggregates over the learner's server-owned learning evidence (checks, retention, concepts) — **computed server-side, never client-calculated** |
| Shared goal/project summaries | `GET /api/account/relationships/:relationshipId/shared-summaries` | ONLY entries the learner explicitly shared to THIS relationship (fixed copies with version + sharedAt; private notes, drafts and answers never leave the learner's records) |
| Classwork digest | `GET /api/account/relationships/:relationshipId/classwork-digest` | returned-work titles + upcoming due dates ONLY — answers, grades and private feedback excluded at the server, not by UI filtering |

### A3. Server invariants

1. Under-18 admission stays blocked regardless of guardian flows (V6 §1.4);
   guardian links only ever grant the `progress-summary` scope.
2. Every summary is derived from server-owned records with the relationship
   verified on every read; revocation/expiry ends visibility mid-session
   (the next read fails closed; no cached copy is served).
3. Family billing entitlements (`/api/billing/family/*`) are commercial
   records and never establish educational guardian authority.
4. Lifecycle events are durable audit records; they feed the FHE-16
   notification lane with per-recipient authorization.

---

## Part B — Professional career records and portfolio (FHE-14)

**User outcome:** a professional owns private goals and projects, builds a
reviewable portfolio and explicitly shares an exact approved version; no
employer sees anything automatically.

### B1. Endpoints

| Operation | Call | Invariants |
| --- | --- | --- |
| Save career target | `PATCH /api/account/career/target` `{version:1, commandId, expectedRevision, target(≤500), interests?(≤2k)}` | owner-private; revision chain identical to profile updates (`409` on stale) |
| Read career path | `GET /api/account/career/path` | owner only; derived from the owner's server-owned learning/goal records — no employer or organization scope joins it |
| Portfolio export | `GET /api/account/career/portfolio` | assembles an exact, downloadable snapshot from server-owned records at request time; the artifact is generated server-side and never cached cross-account |
| Share a record | explicit share commands only (the relationship/share lanes above) | sharing a specific goal/project version to a specific recipient is the ONLY distribution path; no automatic employer access exists at any tier |

### B2. Server invariants

1. Personal vs employer-sponsored work boundaries: records created in a
   personal workspace never appear in an organization context and vice versa,
   even when the same person holds both (matrix row 13; E18).
2. Unsaved editor drafts remain explicit client state (the permitted local
   class in V6 §3) — the server never invents drafts, and draft loss is
   honest.
3. Portfolio snapshots record their source revisions; a later edit never
   retroactively changes a shared/exported copy.

---

## Part C — Organization people, cohorts, curriculum and governance (FHE-15)

**User outcome:** an approved institution administrator manages authorized
people and resources without exposing private learner data; every
administrative mutation is authorized, versioned and audited.

### C1. Endpoints (owner: backend data lane; separate authorization service)

| Operation | Call | Invariants |
| --- | --- | --- |
| Create organization | `POST /api/account/organizations` `{version:1, commandId, name(1–200)}` | creator becomes `owner`; roles are `owner`/`admin`/`member`/`guest`, server-verified per call |
| Invite/approve people | `POST /api/account/organizations/:orgId/invitations` + `/respond` | the same invitation lifecycle as Part A (pending/expiry/accept/decline/revoke) with `type:'organization'` |
| Manage cohorts | `POST/GET /api/account/organizations/:orgId/cohorts` (+ membership commands) | cohort membership is server truth; teacher delivery reads require CURRENT cohort membership |
| Curriculum lifecycle | `POST/GET/PATCH /api/account/organizations/:orgId/curriculum` with `expectedRevision` and `draft → review → published → withdrawn` transitions | publication snapshots content; withdrawal drops future reads without destroying history; stale publications are `409` (E19) |
| Aggregate insights | `GET /api/account/organizations/:orgId/insights` | aggregate suppression rules apply (no re-identifying small cohorts); private learner text never aggregates |
| Audit | `GET /api/account/organizations/:orgId/audit?after` | append-only administrative audit with actor, action, revision; admin-only read |

### C2. Server invariants

1. Revoked administrators lose administrative reads immediately; owner
   transfer is a distinct, audited command (E26).
2. Cross-organization isolation: every command resolves the org through
   verified membership; another org's ids are `404` (E20).
3. Teacher delivery after content withdrawal fails closed with the honest
   unavailable copy; already-delivered learner copies stay owned history
   (mirrors the classroom snapshot law).
4. The preview's `organizationAccess` derivation is DEV-gated; the production
   org surfaces mount only against these verified services.

---

## Part D — Cross-role events and notifications (FHE-16)

**User outcome:** the right person sees the right update following a real
cross-role event; no one else does; notifications are protected server
records with read states and explicit outbound channels.

### D1. Endpoints

| Operation | Call | Invariants |
| --- | --- | --- |
| List | `GET /api/account/notifications?after&unread_only` | recipient-scoped page, newest first, cursor-stable |
| Mark read | `POST /api/account/notifications/:notificationId/read` `{version:1, commandId}` | recipient only; idempotent |
| Mark all read | `POST /api/account/notifications/read-all` `{version:1, commandId, expectedCursor}` | idempotent; `expectedCursor` prevents racing new events |

### D2. Server invariants

1. Events are emitted by the owning service lanes (guardian lifecycle in
   Part A, classroom review in FHE-12 Part B, organization governance in
   Part C) at the moment the server commits the underlying change — never by
   the browser (matrix row 19: no local notification is displayed as a
   delivered server alert).
2. Outbound channels (email/push) require explicit per-channel consent
   records; the in-product list is always served regardless.
3. Revoked/expired relationships stop generating events; already-delivered
   records remain the recipient's own history without exposing new data.
4. Duplicate events collapse by `(sourceEventId, recipientUid)` idempotency;
   out-of-order delivery cannot resurrect a revoked state (E-cases in V6 §8).

---

## Acceptance gates (all parts)

1. Contract-compliance tests in the `learning.contract.ts` idiom, written
   with the frontend owner; negative tests for every authorization boundary
   above (wrong account, revoked/expired state, cross-org id, duplicate
   commandId).
2. L2 realm journeys on the production build with two real accounts per
   relationship lane: request → accept → permitted read → revoke → denied
   read, with SQL readback and second-device verification.
3. `npm run verify:graph` + the route-law test extended to each newly mounted
   connected surface; `scope:audit` regenerated with reviewed control files.
4. No release claim beyond the selected runtime: until each service lands,
   the production shell keeps the verified honest rooms.
