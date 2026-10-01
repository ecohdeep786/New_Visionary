# BACKEND CONTRACT — Visionary AGI (backend phase, v1)

The client boundary already exists and has frontend contract tests: `src/services/backendTransport.ts` (team Gate 1).
No backend exists yet (founder direction D-015, 2026-09-27). Complete the local product gate first.
The exchange shape and operations below are a **proposal for the later backend phase**, to reconcile
with the actual server design before implementation. The client installs a transport through
`configureBackendTransport`; compatibility without changes cannot be guaranteed until real integration tests pass.

## Session and authorization (every operation, no exceptions)
- `getSession()` returns the authenticated `{ personId, workspaceId, role, expiresAt? }` from
  the real credential (token/cookie) — never from preview storage. The client re-checks the
  session **before and after** every exchange and rejects changed sessions.
- The server independently authorizes every operation and object:
  student → own data only · teacher → assigned classes only · parent → connected children,
  `progress-summary` scope only · professional → own data · organization → aggregate only.
- Deadline: the whole exchange (both session checks included) defaults to 20s, max 120s.

## Operations live in the client today
### `content.syllabus`
request `{ selection: { board, classLevel, subject } }` → response `ContentGraph | null`.
A miss is `null` (the client serves provisional mode) — **never invented curriculum**.
Graphs must carry status `official`, unique ids, intact hierarchy (client validates and
rejects incomplete graphs), and per-concept language availability (team Gate 2).

### `content.concept`
request `{ conceptId }` → response `ContentConcept | null`. Same validation; concept
responses must respect audience eligibility (`adult` gating) and locale variants.

### `teaching.request`
request `{ mode: 'explanation'|'practice'|'feedback'|'project', packet: PromptPacket }` →
response `TeachingResponse { status, text, question?, representations?, promptVersion? }`.
The server runs its own crisis/safety interception on every input. When the model is
unavailable the response is `status: 'not_connected'` — **never a fabricated answer**.

### `mentor.turn`
request `{ input, context: MentorContextPacket (promptVersion mentor-context-v1) }` →
response `MentorModelReply { status:'ready', source:'connected_model', locale, promptVersion,
text, actionIds[] }`. `actionIds` must be within the role's allowed list
(`mentorModelService.ts`). The client speaks/displays `text` verbatim.

## Operations required for launch (specified now, wired after founder decisions)
### `auth.session`
register / sign-in / sign-out / refresh against the real account store, replacing the local
preview users store. Issues the credential that `getSession()` resolves. Age band and
guardian links are part of the account record (minor eligibility depends on it).

### `data.sync`
Owner-scoped pull/push of the local stores inventoried by `localMigrationService.ts`
(workspace, learning pipeline, cognition/evidence, community) using its target-owner mapping.
Incremental and resumable; **never destructive** — the local originals stay until the server
acknowledges ownership. Supports the DPDP-style view/export/delete the client already exposes.

### `classroom.entity`
Classes, enrollments, assignments, submissions and announcements (today's
`visionary_entity_*` rows) with the Gate 5 rules enforced server-side: teacher-ownership
filters, active-enrollment checks, immutable assignment snapshots on publish.

### `community.post`
List / post / remove for class communities. The server enforces enrollment and assignment
exactly like `communityService.ts`, stores moderation (`removedById`), and keeps post text
out of telemetry.

### `notifications.push`
Delivery of due reviews, classwork, and live-class updates (the client's notifications feed
is local today).

## Non-negotiables carried from the mission
PII never enters telemetry · crisis interception on every input path, client and server ·
minors only in teacher-moderated/guardian-scoped spaces · no invented curriculum or model
output · the local preview keeps working whenever the transport is absent.

## 2026-09-30 frontend handoff inventory addendum

See [LOCAL_STORE_INVENTORY.md](LOCAL_STORE_INVENTORY.md) for the current store shapes, ownership and exclusions. Administrative capability changes, versioned organization editorial review, seat planning, authored number-line/chart descriptors and optimistic project revisions now have local service boundaries. Future APIs must preserve these permission decisions, sources, history, distinct-author review and failed-write semantics. A seat acknowledgment is not access activation; editorial approval is not source-rights verification or curriculum distribution. Project recovery copies remain private and add no learning evidence. The local Privacy inspector is a read-only core-store review and now blocks mapping when auxiliary stores still need ownership reconciliation. No server contract is deployed by this addendum.

2026-09-30 classroom cutover: preserve the fixed submitted project text/source criteria and each revision attempt; use atomic class/assignment/learner uniqueness, expected saved project revision and expected assignment state. Scheduling must use trusted server time for visibility and both create/revision authorization, with cancellable publication and idempotent notifications. Archive retains submitted learner access to their own response/feedback. Organization assignment-state audit exposes IDs, actor/time/from/to only; private instructions, learner answers and feedback stay outside that DTO. Current browser background refresh and editable local history are previews, not server guarantees.

2026-09-30 classroom Learn player: read the authorized assignment, class and learner's own submission together under current membership/workspace scope. Submission requires the expected assigned-content revision as well as the existing attempt and availability rules. Draft updates and clears compare the saved assignment-specific draft revision; other assignment drafts must survive. Understand/respond/review is recoverable navigation state and creates no mastery or scoring evidence. The player currently uses saved written instructions and teacher-authored questions; curricular objective/version and reviewed representation attachment remain a frontend acceptance gap. No new server operation is deployed by this preview.

2026-10-01 objective attachment supersedes the attachment gap above for the local sourced-content path. Future teacher assignment writes require the expected full resource revision plus the selected concept/source/version/language. The server must resolve authorized source content itself, validate actual language and representation availability, and freeze a learner-safe objective copy. Client source labels are not proof of source rights or curriculum approval. Exclude assessment answer keys, audience/member lists, unrelated preparation, private learner drafts and evidence. Returned assignment reads include the immutable `objective_snapshot`; later resource/source edits cannot rewrite it. Assigned-content concurrency includes the objective payload, and assignment idempotency must distinguish different payloads even at an identical timestamp. Use server revision tokens rather than trusting the preview's JSON fingerprints. Draft view state is bounded, source-version-specific and separate from grading/mastery. No server implementation is added here; real book, objective rubric, contextual Ask/Practice and wider distribution acceptance remain pending.


## 2026-10-01 — Assignment Ask, rehearsal and criterion review handoff

The local assignment-scoped Ask/Practice and rubric paths supersede their local attachment gaps above. Source buttons return the frozen assigned copy. Free questions require a connected teaching adapter and only send the authorized assigned source and current question; private rehearsal, learner answers and grades are excluded. Recheck current access/source after asynchronous output. Backend work must independently enforce this scope, safety handling, cancellation and trusted source versions.

Private rehearsal uses source-authored questions and an expected question/round/source token. It remains distinct from classroom grading and mastery. Store its progress privately under authenticated person/workspace/assignment ownership, with conflict recovery and revoked-access behavior. No automatic migration is authorized by the preview.

Submission includes exact assigned criterion IDs and explicit learner self-review. Teacher returns require a rating and note for every criterion; revision requests may address selected criteria. Only the authorized class teacher can write criterion feedback. Resubmission atomically preserves the previous attempt and ratings and clears current ratings. Review draft recovery is attempt-specific. Use server revision tokens, transactions and authenticated ownership rather than trusting client JSON fingerprints or browser timestamps. Same-attempt concurrent teacher review conflict handling remains a frontend acceptance item. No API/server/model implementation is deployed here.


Teacher review drafts optionally carry the loaded `reviewRevision`. The current review UI checks this token against the saved submission before returning and retains stale edits for explicit export/load-latest recovery, including after refresh. Backend review writes must make revision checks mandatory and atomic; direct preview entity writes are not server security or a transaction.


2026-10-01 stage continuity: future transition operations require expected profile/transition versions, trusted action-window time, authoritative event precedence and an atomic profile/mapping/audience commit. Confirm and reversal must reject stale notices; later work remains accessible. Return reviewed per-objective mapping/archive reasons and a sourced prerequisite bridge plan separately from retained learning and original assignment deadlines. The new local continuity DTO reports mapping unavailable and preserves original source/position/review dates; it is not a completed curriculum remap or server transaction.
