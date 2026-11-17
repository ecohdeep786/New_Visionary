# FHE-07 / FHE-08 — CONTENT AND TEACHING SERVICE HANDOFF TO THE BACKEND/ML OWNERS

**Status:** exact frontend-side contract handoff (V6 §7 FHE-07/FHE-08, FHE-24 deliverable).
**Written:** 2026-11-18 on `dev` = `c02faddb`. **Frontend owner:** Head of Frontend lane.
**Backend/ML owners:** curriculum/data lane (Part A) and model-provider lane (Part B).
**Governing law:** V6 §3 (no-demo, no false success), §5 (source ownership), §8 (E09–E12).

## 0. What the frontend already guarantees (do not redesign around it)

- The production build hosts the connected workspace shell
  (`ConnectedWorkspaceLayout`); the development preview workspace (and
  `workspaceService`) never executes in production — pinned by
  `tests/kan210-workspace-quality-floor.test.mjs`, the route law in
  `tests/production-graph.test.mjs`, and `npm run verify:graph`.
- Every `/dashboard/*` path renders a server-backed connected surface or the
  honest unavailable room ("This workspace area is not available yet … will be
  available once their online services are connected"). Nothing offers a
  control the server cannot honour.
- The curriculum sample graphs (`contentRepository`) and the classroom/study
  services that consume them are preview-class only: imported exclusively by
  preview route chunks that production never mounts or fetches. The
  conversational model seam is an honest fail-closed stub
  (`appClient.integrations.Core.InvokeLLM` → "AI responses are not available
  yet. Your workspace and saved questions are still available.") — no
  fabricated teaching output exists anywhere in the production graph.
- The durable teaching loop is ALREADY registered and connected:
  `/api/account/learning/sessions` (+ checks, assessments, cancel, knowledge
  projections) run on the selected `FirebaseProductModule` with the bounded
  command idiom shown below. **The catalogue and the model turn are the two
  missing services, not a redesign.**

Transport idiom every new endpoint must reuse: `createAuthTransport`
(same-origin `/api`, `credentials: 'same-origin'`, `cache: 'no-store'`),
CSRF double-submit on mutations (`GET /api/auth/csrf` → `X-CSRF-Token`),
`X-Visionary-Account: <uid>` on owner-scoped calls, 20 s client timeout,
reads retry only on 502/503/504. Reference client: `connectedLearning.js`.

---

## Part A — Published curriculum catalogue (backend data lane)

**User outcome (V6 FHE-07):** a learner selects authentic released
stage/category → board/source → subject → book → chapter → topic with accurate
availability; the selection supplies the exact fields the already-registered
teaching loop demands.

**Why this shape:** `startLearningSessionCommand` (backend
`src/learning/learning.contract.ts`) requires
`{ workspaceId, conceptId, sourceVersion, criteriaVersion, provider, sourceId }`.
Today no registered service issues legitimate values for those fields — that
is the entire gap. The catalogue is the admission gate for the existing loop.

### A1. `GET /api/account/learning/catalog`

Read (no CSRF), authenticated, owner-scoped. Query parameters (all optional,
bounded):

| Param | Constraint | Meaning |
| --- | --- | --- |
| `stage` | reference ≤64 chars | learner stage filter (independent-adult tier only in this release) |
| `subject` | reference ≤64 chars | subject filter |
| `after` | cursor ≤512 chars | opaque pagination cursor |
| `limit` | 1–50 | page size (default 20) |

Response `200`:

```jsonc
{
  "version": 1,
  "uid": "<session uid>",
  "available": true,
  "items": [{
    "catalogId": "uuidv4",
    "provider": "≤256 chars, e.g. board/publisher identity",
    "sourceId": "≤256 chars",
    "sourceVersion": "≤256 chars",
    "criteriaVersion": "≤256 chars",
    "conceptId": "≤256 chars",
    "title": "≤200 chars, trimmed",
    "subject": "≤64 chars",
    "stage": "≤64 chars",
    "languageAvailability": ["en"],          // subset of ['en','hi','bn'] this release
    "status": "published"
  }],
  "nextCursor": null                          // or the opaque cursor string
}
```

Feature-off form (exact, mirrors the consent service):
`{ version: 1, uid, available: false, items: [], nextCursor: null }` — the UI
renders the honest "catalogue not available yet" state, never an empty mock
shelf. **Never** fabricate items, never serve `status: 'published'` for
withdrawn sources, never return another account's authorized coverage.

### A2. Server invariants (owner: curriculum/data lane)

1. Only sources with a durable, reviewed publication record are returned.
   Withdrawal appends availability history; withdrawn items drop from the
   list, but a session opened before withdrawal stays owned history (E30) —
   the catalogue never rewrites session records.
2. Publication is a server lifecycle (draft → review → published → withdrawn)
   with an actor, timestamp and audit trail; the catalogue read is derived
   state, not client belief.
3. Owner scoping: an authenticated learner sees published items authorized for
   their account tier; no institution-private content without verified
   membership (matrix rows 7, 11).
4. Idempotent, cursor-stable pagination; `nextCursor` must equal the last
   item's `catalogId` or `null` (the client validates this exactly like
   `listSavedLearning` does).
5. Errors: `401` unauthenticated (client re-auths), `403` honest denial,
   `503` "Account records are temporarily unavailable…" for store outages
   (client renders the retryable room). No 200-with-garbage.

### A3. Frontend commitments once the service lands

- A catalogue surface mounts inside `ConnectedWorkspaceContent` (the route law
  permits a new connected mount; the preview `LearningWorkspace` stays
  DEV-only) with loading / honest-empty / `available:false` / error / retry
  states, mirroring `ConnectedLearningHistory`.
- Client-side response validation rejects malformed pages outright (the
  `listSavedLearning` pattern) — a malformed catalogue is an error, not a
  partially rendered shelf.
- Selection writes nothing browser-local: choosing a topic navigates the
  learner into the registered session flow, which itself mints
  `POST /api/account/learning/sessions` server state.

---

## Part B — Grounded teaching model turn (ML lane)

**User outcome (V6 FHE-08):** a learner receives a useful, safe, grounded
answer about the selected concept and understands the limits; model output is
clearly distinguishable from verified curriculum.

**Why this shape:** the conversational seam today is the fail-closed stub in
`appClient.integrations.Core.InvokeLLM`. Grounding must be server-assembled —
the browser never supplies source text — and the turn must belong to an owned
learning session so context, cost and safety attach to a durable record.

### B1. `POST /api/account/learning/sessions/:sessionId/guide-turn`

Mutation (CSRF + `X-Visionary-Account`, idempotent by `commandId`,
`expectedRevision` optimistic concurrency — the exact
`cancelLearningSessionCommand` idiom). Request:

```jsonc
{
  "version": 1,
  "commandId": "uuidv4",
  "expectedRevision": 0,
  "locale": "en",            // 'en' | 'hi' | 'bn' in this release
  "question": "≤512 chars, trimmed, no control chars"
}
```

Response `200`:

```jsonc
{
  "version": 1,
  "sessionId": "uuidv4",
  "revision": 1,
  "status": "ready",          // 'ready' | 'abstain' | 'not_connected'
  "text": "≤4000 chars when status=ready; absent otherwise",
  "sourceRefs": [{"sourceId": "…", "sourceVersion": "…", "locator": "≤256 chars"}],
  "updatedAt": "ISO-8601"
}
```

### B2. Server invariants (owner: model-provider lane)

1. **Grounding:** the server assembles context solely from the session's
   authorized source record (`sourceId`/`sourceVersion` already stored on the
   session). If grounding is insufficient, respond `status: 'abstain'` — never
   an ungrounded answer. If the provider is unconfigured, `status:
   'not_connected'` — never a fabricated reply (mirrors BACKEND_CONTRACT.md
   `teaching.request`).
2. **Safety:** crisis/safety interception runs server-side on every input and
   output before persistence. No unrestricted free-form model access exists at
   any tier.
3. **Ownership:** the turn belongs to the session's owner; another account's
   `sessionId` is `404/403` — never a cross-account answer (E20, E26).
4. **Idempotency/cost:** one turn per `commandId`; retries after network loss
   return the same receipt, never a duplicate charge or a second generation.
   Provider `429`/timeout map to typed `503`/`status:'not_connected'`
   responses with retry guidance — the client renders bounded retry states.
5. **Durability:** the turn and its receipt are server records (survive
   reload, second device, E12); the client displays model text verbatim,
   labelled as model output, with `sourceRefs` when present.
6. **Locale:** `locale` is the interface/teaching locale type only; it never
   claims source-medium coverage (V6 §19 language truth).

### B3. Frontend commitments once the service lands

- The `/dashboard/ask` honest room is replaced by the connected Ask surface
  (route law: one new mounted connected surface), keeping the same shell
  patterns (focus management, keyboard, reduced motion).
- Turn states: sending → ready (model output, visually distinct from
  curriculum) / abstain (honest "I can't ground this in your source yet") /
  not_connected (the current truthful room copy) / error (retryable) /
  cancelled-on-navigation (the transport aborts in-flight turns on route
  change and account switch — existing behaviour).
- No optimistic model text ever renders before the server receipt; nothing is
  saved browser-locally.

---

## Part C — Acceptance gates for both lanes

1. Contract-compliance tests written together with the frontend owner (the
   `learning.contract.ts` idiom: strict key sets, bounded fields, UUIDv4
   command ids, revision chains).
2. L2 realm journey on the production build with the fenced backend: real
   published catalogue entry → session start → grounded turn → SQL readback →
   reload/second-device persistence → negative cases (withdrawn source, wrong
   account, provider outage, duplicate commandId).
3. `npm run verify:graph` + route-law test extended to the new mounted
   surfaces; `scope:audit` regenerated with the new control files reviewed.
4. No release claim beyond what the selected runtime serves: catalogue and
   teaching remain honest rooms until each service is registered, qualified
   and reviewed.
