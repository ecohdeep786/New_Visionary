# BACKEND CONTRACT — Visionary AGI (backend phase, v1)

2026-10-02 class-publication handoff: the local client now publishes a complete reviewed curriculum delivery to an owned class with an expected publication revision. Future server operations must resolve the authorized original delivery themselves, strip banks/keys/editorial notes, validate complete chapter/prerequisite/source structure and atomically append a fixed learner-safe copy. Use opaque server revision tokens, authenticated actor IDs and trusted timestamps. Withdrawal/restore appends availability history without rewriting source or existing assignments. Invited/closed/revoked readers receive no body; a read begun before withdrawal must not return that withdrawn copy afterward. Enforce these rules independently for list/get/export, not only in UI controls. Publication is distinct from assignments, attempts, grades and mastery. No server operation is deployed by this frontend milestone.

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


2026-10-01 sourced bridge boundary: return approved one-to-one mappings tied to source concept/selection/provider/ID/version, exact target source and reviewer/review time/reason. Archive declarations need a reason and accessible original work. Verify review authority and source rights on the server; client `official` flags and review actor strings are only preview metadata. Enforce unambiguous target identity, active-stage revision and locale before starting new work. Preserve per-activity source context for event/outcome attribution, due dates and source-version resumption. Never infer an old origin or copy old answer correctness to a replacement source. A changed source opens a separate activity; guidance alone does not regrade or transfer mastery. No deployed API/server/model is added here.

## 2026-10-01 — Stage trigger and profile-editor handoff

Stage APIs must use authenticated actor/source authority, stable source event IDs, expected profile/notice revisions and trusted server time. Calendar/evidence events cannot override pending user decisions; inferred evidence is suggestion-only. Explicit suggestion acceptance follows boundary confirmation and cannot update account age, consent or safety permissions. Institution/stage changes need a separately validated policy; server ownership, guardian requirements and organization authority remain open. The preview teacher event key (class/level/year) is not a durable server event identity.

Draft recovery is private person/workspace data with expected draft revision on saves/clears. Preserve malformed originals, export/recovery and current edits after conflicts. Commit stage/profile/history and superseded suggestion atomically in the server; browser rollback is only local recovery. Preserve institution in exact Undo/profile restoration. No backend or live model/scheduler is implemented by this slice.

## 2026-10-01 — Auxiliary ownership inventory handoff

The local inspector returns counts-only personal/connected/unresolved/unreadable classifications for supporting stores. Source ownership is separate from schema integrity, source rights, current classroom/organization authorization and transfer consent. Server cutover must validate every draft/source/attempt revision and exact membership before mapping; connected school/company/community/seat records need their own scope review. Reject ambiguous review-key ownership rather than parsing a guessed longest prefix. Empty validated stores create no record-transfer obligation. Never migrate malformed originals or assign unknown scopes automatically. Counts exports are reports, not backups or approved transfer manifests; no migration endpoint is implemented.

Auxiliary classification correction: legacy response draft keys identify a person but omit workspace identity. Their counts are unresolved pending assignment/classroom reconciliation; they are not automatically classified as personal work. Counts-only reports remain read-only and do not approve schema/source integrity or transfer. Later server migration must resolve these exact assignment, enrollment and Work/personal scopes under current authorization.

Notification read mutations require exact authenticated workspace/update ownership, current membership, idempotent read acknowledgments and rejected missing IDs. Preference failures must not report saved success. Opening authorized work must remain possible without first persisting read status. A read flag grants no consent or destination access. This frontend saves only local preferences and read flags; scheduling and delivery remain later service capabilities.

2026-10-01 voice cutover: input requires explicit start and transcript confirmation. Use one scoped session generation, request cancellation, partial/final sequence IDs and deduplicated final delivery. Navigation, sign-out or workspace/language changes terminate recognition/output and abort pending responses. Discard old response/utterance completion after cancellation; release device streams that arrive late. Pending transcript text is private and reaches mentor/history only after user Send. Text fallback carries unsent words without automatic submission. Never equate saved audio-output preference with microphone permission or background capture. These are browser-local boundaries; later speech/model providers must preserve them under server authorization and native-device acceptance.


### Career direction revision boundary (2026-10-01)
Frontend saves carry the revision of the active career target, including an explicit no-target revision for first creation. A future service must atomically reject stale updates and concurrent first creation within the authenticated person/workspace; return a conflict with an authorized current version. Browser editor recovery is separate private local work, not shared content or a server goal. Backup/export failures do not grant company access. No credential, hiring prediction or independent reviewer is connected.


### Portfolio self-review conflict boundary (2026-10-02)
The frontend submits both the reviewed project version and expected self-review-history revision. A future API must atomically reject either mismatch within the authenticated adult professional workspace, including revoked company membership, without creating a review. Return an authorized latest version for explicit review/reload. Private local editor recovery is separate from saved self-review records; shared portfolio copies do not convey self-review notes or credential status. No independent reviewer or verification service is connected.


### Organization settings boundary (2026-10-02)
Owner-only settings mutation submits expected revision and approved fields. Future server authorization must resolve the authoritative organization owner and active administrative permission, atomically persist configuration and actor/before/after audit, and reject stale revisions without partial changes. Academic members consume owner defaults, not their own private workspace defaults. New content delivery must check the current pause policy; existing fixed delivery/import retries remain idempotent. A pause does not revoke existing copies or assignments. Organization type and source-language default do not grant personal-data, guardian, model, billing or retention permissions. Live domain/retention/model controls remain disconnected.


### Bridge and unsubmitted answer boundary (2026-10-02)
Explicit reviewed-objective start must revalidate active profile/transition and pinned source immediately before creating/resuming a unit. An async read cannot commit against a postponed, superseded or cancelled transition. Unsubmitted answer selections are private drafts keyed by objective/unit, exact question payload and retry round; they create no evidence. Grading must reject stale expected question/round atomically and keep prior attempts immutable. A new-source objective does not acquire original-source answers/mastery by mapping alone.


### Scoped promotion audit boundary (2026-10-02)
New authoritative teacher promotions must attest class/organization scope at the action time. Organization audit may project class/event/actual actor/action time and current notice-state counts under audit permission. Exclude private learner identities/profiles, personal transitions, foreign scopes and unscoped legacy records. Current state counts do not substitute for recorded undo/postpone actions. Future immutable server events must supply their own actors/times and reject fabricated client scope.


2026-10-02 curriculum-template seam: organization content create accepts immutable lesson/curriculum kind. Both categories require source/version/language, author, optimistic revision and a different authorized reviewer. Delivery pins category/content/source to current accepted membership. Teacher import creates a private lesson-preparation draft with immutable sourceSnapshot; it is not automatic learner curriculum publication. Legacy OrganizationCurriculum entity notes remain read-only until explicit reviewed mapping. Server cutover must preserve original notes and drafts and authenticate editorial authority.


2026-10-02 Progress report seam: authenticated owner/workspace/role and period must produce separately identified evidence sources, stable objective IDs, measured counts, application counts, original activity/source-version links and current all-history stage/review dates. Partial-source failure must not return invented zero totals or partial aggregates. No question/answer text, private messages or memory events belong in this summary. Period counts do not recalculate current mastery. Live adapter must preserve these semantics under server ownership and cancellation.


2026-10-02 Profile saves carry expected authenticated account ID and loaded name/revision, reject stale changes before write and preserve unrelated account fields. Frontend recovery is per workspace/tab with export and explicit latest reload. Server replacement should use a proper profile revision rather than relying on display-name equality. Changing roles or accounts must not authorize a different-account response or mutation.


2026-10-02 learning integrity: adapters must validate scope/collection/identity metadata before persistence, reject ambiguous duplicate activities, retain originals on unreadable data and expose retryable states. A current-view recovery export omits assessment keys and does not create an outcome. Server migration must separately validate full unit/source/question schema and cannot interpret container checks as source approval.


2026-10-02 structured template seam: validate hierarchy IDs, source metadata, representation/rubric schema and acyclic prerequisite graph before write; require complete structure at review. Persist template with each optimistic revision/history and fixed accepted-teacher delivery. Teacher objective import is idempotent per delivery/objective and must return a private draft with exact reviewed-status source/section/version, prerequisite titles and criteria. Preserve narrative-only legacy templates. No editorial record establishes official source certification; publication and question-bank rights require separate authoritative services.


2026-10-02 reviewed practice seam: authenticate the exact learner/Work/enrollment/assignment source and immutable delivery/objective, grade on the server, expose only prompt/options/opaque question token, require expected source/question/round revisions and preserve private attempt history. Keys currently exist only in browser-local editorial/grading records; this is not production key security. New editorial revisions must not rewrite old deliveries, private studies, responses or mastery. Missing bank returns explicit unavailable state, never generated exercises.

### Derived presentation and account appearance boundary (2026-10-02)

Teaching PromptPacket adds a service-derived stagePresentation policy: category, age safety tier, vocabulary, abstraction/intensity guidance, optional session-minute range, check cadence, representation preference order and inherited layout treatment. The frontend replaces a supplied stagePresentation with the authorized profile's policy for all four teaching modes. This policy includes no raw person record or ability score and cannot establish source availability or model quality. A production server must derive the same policy from authenticated authoritative profile and consent; never trust a client safety claim or arbitrary prompt context. Stage transitions and original-source sessions retain their existing version boundaries. Disconnected teaching returns localized en/hi/bn status with no fabricated response/activity; adapters may explicitly return an English unavailability fallback, preserving its language metadata.

Account accent mutation carries expected account and loaded accent. Reject account/color mismatch before writes and preserve unrelated current preferences. Local equality comparison demonstrates conflict handling; the server replacement needs an authenticated account revision and atomic field mutation. UI keeps the selected color on failure and offers explicit saved-color review, never silent replacement or unconditional overwrite.

Teaching cutover addendum: revalidate stage/age policy at response time as well as request time. A response produced under a superseded age safety or presentation policy cannot be committed to the current activity. Preserve drafts and offer an explicit current-stage retry; do not reinterpret the old response as new-stage content. Server enforcement must compare authenticated authoritative profile revisions, not client payload assertions.

2026-10-03 Role/project/privacy seam: family status projection must preserve original connection records, support cancelled/unreadable/unknown closed states, and distinguish restricted progress summaries from expiry. Only current consent/scope authorizes report URLs. Client retry is an explicit new authorized read, never a repair or bypass. Preserve exact project/source revisions, fixed recipient copies and parent summary-only disclosure on every server write; recheck latest consent and account/workspace ownership. Memory deletion removes retained observations while preserving required events/evidence, and ownership review exports scoped counts without private document, answer, feedback or summary text. Interface localization does not translate authored/user content. Local behaviors are contract requirements for future backend implementation, not server enforcement today.

2026-10-03 Parent/organization seam: return stable parent guidance topic kind and measured authorized report counts independently of display language; recheck live child consent per request and invalidate withdrawn answers. Partial-source failures cannot become measured zero. Authenticated recovery is a new authorized read, not permission expansion or automatic repair. Organization acknowledgement is planning only. Preserve original source language and audit attribution. Cohort updates must compare the captured resource version after asynchronous roster/access checks; stale writes, including archive reversal, fail without overwriting either version. Enforce all scopes/versions/seat activation/retention on the later backend.

2026-10-03 Teacher continuation seam: separate interface and authored objective/source language. Preserve copied assignment revisions after author edits. Roster/evidence reads must recheck current enrollment and active workspace; revoked evidence and class code/header are removed from the client. Assignment read/write failures retain owned options and expose authorized retry. Class code is returned only by a current authorized read. Generation-guarded UI reads are not server authorization; enforce every teacher/class/source/version/recipient transaction on the later backend.


### 2026-10-03 — Class-tab frontend continuity

D-023 adds one validated recorded-score summary, localized class controls and teacher moderation of reported posts. Preserve absent-versus-zero grades, positive original point totals, assignment/learner scope, unique authored topic coverage and fixed source text. Fetch failure must hide stale evidence without replacing records; retry must preserve composer/review inputs. Model analysis remains unconnected. Reported posts stay hidden for learners during direct teacher removal; removed posts are not restored via the reported-post action. Browser-local tests are not backend or production authorization acceptance.


### 2026-10-04 — Editorial/issue/earlier-question frontend seam

Preserve independent interface/teaching/source locales and immutable reviewed/delivered versions. Validate editorial resource identity, revisions, authors, history and retained versions before mutations; unreadable records must not be silently repaired or overwritten. Validate scoped issue collections independently so auxiliary failures do not erase source concepts. Server cutover must preserve exact-source/category/language dedup, current authorization before and after pending work, raw-data recovery and appropriate cancellation.

Earlier questions can remain in their original owned entity store while an explicit Open in Ask copies the exact text into a private conversation draft. This is user-controlled resume, not automatic submission, source migration or consent expansion. Existing resource-editor recovery keys are private to their workspace/tab. Native browser-output lifecycle and fallback remain frontend responsibilities; no connected model, backend implementation or founder-book processing was added.


2026-10-04 primary UI seams: server subscription commands must return current entitlement independently of failed/pending checkout, atomic cancellation/resume and validated invoice metadata, with idempotency and authoritative account ownership. The client preview rejects unreadable metadata and retains drafts/errors; it never collects payment details. Connections keep status/role enums and current authority distinct from localized labels. Class summaries must return unique authorized learners, while counts remain unavailable on failed reads. Class creation and practice writes require final authenticated workspace checks; private unsaved class-form backups are recovery data, not automatic server imports.


2026-10-04 learner goal seam: existing-goal edits require an expected resource revision and conflict response without replacing the client draft. Pending parent summary edits are private client recovery metadata, never an approved share. Confirm/revoke must atomically recheck the authenticated learner, owned source/version and active guardian relationship/scope; retained fixed-copy fields require validation before projection or mutation. Restore unreadable originals explicitly, without silent repair. Keep the existing personal-workspace parent projection and consent renewal isolation. A cleanup failure after a successful save/share must not be represented as loss of the completed write.
