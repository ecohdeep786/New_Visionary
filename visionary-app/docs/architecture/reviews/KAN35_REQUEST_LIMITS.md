# KAN-35 request-limit preparation and review handoff

24 October 2026. Source ID SCOPE-08. Implementer: Codex backend executor, chat `01a16c45-13e0-7af2-becc-edeca7a281cb`.

This candidate delivers a proposed, executable limit contract and runtime enforcement handoff. Verification also identified existing deployed parser dependency advisories, requiring compatible dependency corrections before integration. Product routes, JSON byte caps and frontend journeys stay unchanged. It does not freeze KAN-30 schemas, establish KAN-31 authority, or complete ingress/load/hosted acceptance. Separate review of the dependency correction is pending; earlier approval covers only implementation `c785248a`.

## Ownership and candidate

- Base: verified `origin/dev` at `0306703e7eabb996cfdd3f13d12b655a1899fa2b`, containing current `origin/main` (`592d47527d2fd8d414041aace2393b7c0d7b7898`).
- Branch: `codex/codex-kan-35-request-limits`.
- Checkout: `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/codex-kan-35-request-limits` (product in `visionary-app/`). Branch creation and push verified against the remote ref.
- Owns `integration/contracts/request-limits.v1.json`, `request-limits.examples.json`, `scripts/request-limits.mjs`, `scripts/tests/request-limits.test.mjs`, the single test-registration line in `scripts/check.mjs` and this report. Jira comment `10169` extends ownership to the two `infrastructure/gcp/runtime/package*.json` files for compatible parser security corrections; the added `infrastructure/gcp/tests/request-parser.test.mjs` verifies actual middleware behavior in an isolated local process. Existing auth/controller/schema/frontend and other owners' contracts remain read-only.
- Jira ownership receipt: comment `10164`. Live board check found no backend Testing issues. KAN-31 already had a worker claim; this task was explicitly unclaimed preparation (comment `10145`).
- No native blocking task links were present in the initial KAN-35 board result. The current preparation addendum allows independent work; runtime adoption waits for accepted schema/authority/file policy and scope ownership.

## Source findings and design

`src/main-auth.ts` registers a 256 KiB raw parser for `/api/billing/webhooks/razorpay` before the global 24 KiB JSON parser. The inventory covers all 37 decorators in the six controllers registered by `FirebaseProductModule`, including existing learning/knowledge enablers. A drift check compares both controller registration and exact method/path coverage; it does not imply those enablers' full product gates are accepted.

Current auth transport starts a 20,000 ms timer before serialized write/lock waits and shares it across CSRF fetch, request and its specific pre-command CSRF refresh. Safe reads can retry once within that timer. Domain `backendTransport.ts` defaults to 20,000 ms, includes two session checks, and permits a configured maximum of 120,000 ms. Razorpay uses a separate 12,000 ms provider timeout per request. There is no observed server whole-operation budget; sequential provider calls can exceed the client window. The proposed 18,000 ms server budget therefore requires propagated remaining-time budgets and durable reconciliation, with no blanket mutation retries.

The existing profile serialized limit is 16,000 UTF-16 units, each preference is at most 2,000 units, and nested preference values have depth 3 and up to 50 items/keys. Feedback comments allow 1,000 UTF-16 units. Auth tokens allow 12,000 units. These coexist with the parser's UTF-8 body-byte cap: Hindi/Bengali and emoji can hit the HTTP limit sooner. Existing field validators remain authoritative and are not replaced by the offline evaluator. Generic profile structure/response/deadline caps are proposals; `observed` names the actual enforced subset.

Proposed project saves allow 24,000 Unicode codepoints in a 128 KiB JSON envelope; submission revisions allow 12,000 in 64 KiB. Worst-case four-byte characters fit, while escaping, additional fields and whole-body caps still apply. The existing project draft/editor paths have no observed numeric body cap; adoption must retain oversize local drafts and provide explicit reduction/file workflow. These sizes require bounded method/path-specific parsers before the global parser; raising the global limit is not part of this change. KAN-30 owns final operation names, URLs and DTOs. Byte fixtures intentionally test serialization budgets only, not DTO admissibility.

File bytes/base64 never enter JSON. Private upload intent, approved MIME/size, quarantine/scan/finalize and downloads need their own accepted authority and policy scope. Webhook enforcement must retain raw bytes, verify signatures before processing, and explicitly review compression (inflation changes signed bytes). The offline evaluator never verifies webhook signatures or invokes providers.

Pagination has a 20-item default and 50-item maximum. A proposed response-byte budget also applies; future cursor scope/expiry and overflow-safe continuation need owning-store implementation. Existing cursor formats remain compatible. Response limits are **not currently enforced**, and legacy large histories/provider records must be measured and paginated compatibly before adoption.

Proposed streams cap framed events at 8 KiB, 256 events and 1 MiB total, with an 18 s total and 10 s idle budget. The evaluator reserves 256 bytes per event for framing; runtime must count actual framed bytes, including heartbeats. Complete events cannot claim durable commit. Disconnect/cancellation/timeout preserve partial output as an uncommitted draft, abort downstream work, and require current authority/receipt refetch. No stream endpoint is added here. Voice chunk/session and private file sizes remain separate policy gates.

The implementer's review pass corrected response-limit handling: request overflow proposes 413 before side effects, while invalid/oversize generated responses propose a bounded 503. A failed response after a write is an unknown outcome and requires receipt/status lookup before replay. Tests distinguish both directions; a client-input error must not blame the user for oversized server output.

## CI security correction

[PR #23](https://github.com/ecohdeep786/New_Visionary/pull/23) initially failed its unchanged `npm audit --omit=dev --audit-level=high` gate in [run 40066021726](https://github.com/ecohdeep786/New_Visionary/actions/runs/40066021726). It reported three high and three moderate affected dependency entries; build/test steps were skipped, not passed. The two underlying high advisories affect the existing overrides: [body-parser GHSA-27r3-jxmh-p828](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828) (patched in 1.20.9) and [multer GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m) (patched in 2.5.0). The proposed correction keeps Nest 10 and body-parser 1.x; multer 2.4 to 2.5 is a compatible minor security update. No automatic force upgrade or security gate relaxation is allowed. Registry lock generation, renewed exact-SHA review and fresh CI remain required before any acceptance claim.

The new deployed-lock middleware regression runs in an isolated child process: normal JSON at 24 KiB and raw webhook at 256 KiB, each below/at/above; exact raw-body signature versus reserialized bytes; expanded gzip byte cap; malformed gzip trailing bytes followed by a healthy request to detect process termination. This is framework/dependency evidence, not a live payment/Firebase or full hosted-product test. No multipart upload endpoint is introduced; deployed lock audit covers the multer pin while future upload behavior retains its separate gate.

## Acceptance and evidence

| Criterion | Evidence | Scope |
| --- | --- | --- |
| Current parser/routes/constraints measured | Source references and drift checks in task test | Local source inventory |
| Per-operation request/response caps | Complete current route mapping plus proposed project/submission/teaching/file profiles | Proposed contract |
| Byte and text boundaries | Below/at/above all profiles, both directions, ASCII/Hindi/Bengali/emoji; all named text caps | Offline synthetic checks |
| Structural abuse and pagination | Depth/key/array boundaries, malformed JSON/UTF-8, page bounds and wrong types | Offline synthetic checks |
| Streams and recovery | Event/framing/total/count/time caps, partial/cancel/disconnect and commit distinction | Proposed observation contract |
| Safe retry | Reauthorization, unchanged command/payload and receipt-first unknown outcomes | Proposed recovery contract |
| Frontend/API/store/job/device outcome | N/A to contract-only change; runtime entrypoints and journeys unchanged | Existing regression checks only |

Initial contract run: `node --test scripts/tests/request-limits.test.mjs`, exit 0, 40 tests passed. `npm run product:verify-layout` and `npm run product:verify-imports` both passed (3,842 import files, three recorded patches). Backend/frontend build and regression results are recorded after completion in the verification section below. The source inventories are not hosted verification.

## Review, integration and remaining gates

Reviewer: pending, must differ from implementer. Candidate SHA is the pushed commit accompanying this report; Jira records its full identity rather than a self-referential hash inside this file. Reviewer must inspect exact candidate, tests and compatibility with current `dev`. Verification and published `dev` integration are pending. KAN-35 remains open until that accepted scope and actual Jira transition are recorded. No next implementation task starts before acceptance.

Rollback for the contract/check additions is a source revert; dependency corrections additionally revert the two runtime package files together and rebuild/retest the image, retaining the advisory risk explicitly. No migration, provider call, protected record or product route changes. KAN-30 contract freeze, KAN-31 authority, actual limit/response/deadline/stream enforcement, file policy, hosted/load/provider/privacy and connected product acceptance stay open. Main promotion remains the founder's separate release decision.
