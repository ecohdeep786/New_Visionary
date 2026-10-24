# KAN-33 / SCOPE-06 invariant case preparation

## Scope

This document records a **proposed synthetic contract-case enabler**. It turns existing frontend invariants into a bounded case matrix for later backend/API reconciliation. It does not claim connected runtime authorization, a selected released curriculum/language/source, a durable domain store, hosted acceptance, or product completion.

Owned files:

- `backend/tests/contracts/scope-06/invariants.mjs`
- `backend/tests/contracts/scope-06/invariants.test.mjs`
- `frontend/tests/contracts/scope-06/invariants.test.mjs`
- `docs/architecture/reviews/KAN33_INVARIANT_CASES.md`

The matrix intentionally stays outside runtime product code, `integration/contracts/v1/**` (KAN-30), authority mapping (KAN-31), source coverage decisions (KAN-29), central tracking, and landing.

## Case matrix

| Case | Family | Expected result | Side effects | Recovery / evidence boundary |
| --- | --- | --- | --- | --- |
| `owner-read-wrong-user` | authority | deny / `wrong-actor` | none | Re-authenticate as owner; synthetic deny only |
| `workspace-membership-not-verified` | authority | deny / `workspace-membership-required` | none | Show unavailable; preview role/tag is not authority |
| `consent-required` | consent | deny / `consent-required` | none | Preserve unrelated authorized work; consent store remains open |
| `source-revoked` | source | deny / `source-unavailable` | none | Refetch current release; never switch silently |
| `unsupported-category-language` | source | deny / `unsupported-scope` | none | Preserve draft; KAN-29 source decision is still required |
| `stale-revision` | revision | deny / `stale-revision` | none | Return current revision and preserve draft |
| `duplicate-command` | idempotency | replay original receipt | one commit | No duplicate mutation/charge; durable receipt remains open |
| `draft-preserved-after-conflict` | recovery | conflict / `stale-revision` | preserve draft | Keep server revision and local draft separate |
| `two-device-reconnect` | recovery | refetch current | none | Cached state cannot grant permission; sync remains open |

The expected error classes are proposed names for reconciliation with the accepted KAN-30 schema. They are not assertions that a production endpoint currently emits these values.

## Source evidence mapped into the cases

Existing tests provide the source invariants being translated:

- `frontend/tests/artifact-conflict.test.mjs`: stale revision rejection, draft preservation, failed writes, private conflict copies, and per-tab draft isolation.
- `frontend/tests/classwork-submit-boundary.test.mjs`: source changes at commit, newer review protection, withdrawn enrollment denial, and retry after a failed write.
- `frontend/tests/workspace.test.mjs`: owner/workspace isolation, consent/revocation boundaries, idempotent submissions, unsupported AI path, and explicit unavailable states.
- `frontend/tests/fixtures/connectedContext.mjs`: a connected classroom fixture requires explicit matching Work membership; a workspace tag is not enough.
- `integration/contracts/operation-authority.v1.json`: current source-audited rules state that client UID/role/workspace/consent/source flags, preview guards, queue events, and ML output do not independently grant authority.

## Verification command

From `visionary-app/`:

```text
node --test backend/tests/contracts/scope-06/invariants.test.mjs frontend/tests/contracts/scope-06/invariants.test.mjs
```

These are dependency-free synthetic tests. A passing result proves matrix consistency only. It does not prove UI → API → backend → data → jobs → cache → two-device outcome.

## Open gates and handoff

- KAN-29 must select and accept the first released curriculum/category/language/source and rights/coverage behavior.
- KAN-30 must reconcile the proposed error and command shapes with the versioned API contract.
- KAN-31 must reconcile operation authority and owning-store decisions; this work does not modify its mapping.
- KAN-35 request limits remain a separate accepted contract enabler; this work does not modify its files.
- Connected domain persistence, durable receipts/outbox, hosted verification, reviewer approval, checked/published `dev` integration, and final Jira Done remain open.

The implementer must not self-approve. The exact candidate commit, separate reviewer decision, and relevant integrated checks must be recorded in Jira Testing before any Done transition.
