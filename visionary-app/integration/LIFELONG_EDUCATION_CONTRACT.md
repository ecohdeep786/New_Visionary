# Lifelong education delivery contract

17 October 2026 · D-090 · Target implementation contract derived from the founder's clarified vision and [source audit](../docs/architecture/VISION_ALIGNMENT_REVIEW.md). [Launch checklist](../docs/architecture/BACKEND_LAUNCH_CHECKLIST.md) · [current implementation plan](../docs/architecture/EDUCATION_LAUNCH_PLAN.md) · [VATS contract](VATS_CONTRACT.md).

This defines work and acceptance, not connected endpoints, deployed tables or new commercial terms. Keep the existing journeys, verified UID/account/onboarding, test billing, source/privacy boundaries and retained records. The saved source audit remains a dated D-089 checkpoint.

## Deliverable owners and boundaries

| Deliverable | Primary task | Owning responsibility | Closure evidence |
| --- | --- | --- | --- |
| Equitable access and continuity promise | SCOPE-09 | Product/commercial with backend usage and cost review | Accepted benefit/coverage matrix, cost scenarios, retained-record versus model-context definitions, payment-lapse/recovery cases and accurate public/internal copy; unresolved decisions block release |
| Durable stage and curriculum progression | LEARN-14 | Backend/data, source review and current frontend adapters | Real authorized profile/event/mapping transactions and projections; exact resume/replay/undo and institution-exit tests across devices |
| Teacher personal learning/coaching | ROLE-10 | Role/backend/ML evaluation and current teacher UI | One private teacher goal→practice→evidence→recommended action→saved resume journey with independent usefulness review and isolation from class/employer data |
| Child admission and verified relationship | Existing PRIV-01, DATA-04/05, ROLE-04/06/08 | Policy/admission and backend relationship owners | Eligible child account activation only after reviewed verified relationship/consent requirements; denied/pending/revoked and in-flight cases remain restricted |
| Parent support recommendations | Existing ROLE-04/07 | Scoped summaries/report owner | Current permitted evidence→understandable suggested support action→explicit user choice; no private doubt disclosure or automatic message |

All five use the existing eleven-layer delivery contract: frontend, API, authority, database, jobs/outbox, cache, real-time recovery, permitted ML, usage/entitlements, operations and acceptance. An enabler can close only its scoped evidence; it cannot declare a dependent user feature complete.

## One identity with separate authorities

The Firebase UID remains the person key. Role/workspace/context are not identity replacements. Onboarding answers remain attributed self-report and cannot establish institutional membership, guardian proof, assessed ability or entitlement. Personal learning may continue through a school/employer change; that does not transfer institutional confidential materials or grant new access. Same-person data from multiple roles is assembled only for the current authorized purpose.

| Logical record | Required references and versions | Authority |
| --- | --- | --- |
| Learning profile | person UID, personal workspace, stage/source preferences, current profile revision, last accepted transition ID | Product domain owner; current onboarding facts retained as history, not a second mutable authority |
| Stage change event | event/command ID, payload digest, actor UID, target person/workspace, expected profile revision, trigger, effective time, policy/consent references | Backend derives current actor/membership and allowed trigger; browser and inference cannot supply authority |
| Mapping manifest | immutable ID/version, from/to source and criteria versions, concept dispositions, reviewed provenance, approval/withdrawal state | Source/content owner; split/merge/non-equivalence must be explicit, not a guessed title match |
| Transition receipt | accepted revision, pinned mapping, retained original references, due-queue/plan projection version, notification state, undo/postpone references | One owning-store transaction plus outbox; Firestore/SQL effects reconcile durably without a fictitious distributed transaction |
| Personal learning/coaching goal | person/workspace, declared goal, approved source/rubric, assessed receipts, reflection/self-report provenance, recommendation and policy versions | Private personal workspace; employer/class view gets only explicitly permitted records |
| Permitted summary/action | relationship/purpose/policy revision, source evidence period, freshness, audience, reason and allowlisted action | Authorized summary owner; rechecked at creation, retrieval and delivery |

These are proposed logical records. DATA-01/SCOPE-03 select reviewed SQL/API schemas and explicit projection ownership before implementation. Do not overwrite current Firestore onboarding facts with ML guesses or let both stores independently authorize a stage. Current profile APIs need compatible projections and recovery; no migration/reset is performed here.

## Stage transition command and state behavior

1. Receive a bounded schema with command identity, expected profile revision, requested change and allowed trigger reference. Derive actor/UID/workspace from the current session. Reject reuse with a changed payload.
2. Recheck source/mapping publication, current membership/consent, safety boundary and the target person's permissions. Evidence inference alone can create a suggestion. Calendar events are accepted only under the approved current policy, respect a newer explicit decision/postponement and never invent an institutional promotion.
3. For an eligible ordinary change, commit its receipt/profile revision and outbox atomically in the owning store. Boundary changes remain awaiting confirmation. An unknown or ambiguous mapping is exposed as unresolved; the original work remains available only under current source rights. The user may still pursue an eligible new source without an invented equivalence or mastery carryover.
4. Project current plan/review/resume pointers and permitted audience notices after commit. Preserve original attempt/check/source/rubric versions, old assignment labels, accepted project revisions and due dates unless an explicit reviewed remap provides a justified schedule change. Derived jobs are fenced and idempotent.
5. Show a small notice/diff, Postpone 7 days and Undo 14 days under the existing Part W policy. Use authoritative timestamps and a stable decision ID. Undo/postpone checks the current revision/window and creates a new receipt; it preserves later work instead of restoring an old database snapshot. Do not silently undo other subsequent decisions.
6. Reconnect/focus/second-device reads refetch current authorized revisions. A missing receipt triggers recovery of the same command, not a new action. Pending projection state remains visible as pending; it cannot be labelled fully synchronized.

| State | Allowed next behavior | Required protection |
| --- | --- | --- |
| Suggested | User dismisses or explicitly chooses an eligible change | No inferred grade, age-tier, permission or official promotion |
| Awaiting confirmation | Current authorized confirmation or rejection | Exact intended target/source/policy revision; no implicit acceptance on refresh |
| Applied | View diff, continue mapped work, eligible undo/postpone | Source-specific original history retained; only committed current pointer is presented |
| Postponed | Scheduled reevaluation under current rules | Seven-day interval and newer decisions respected; no repeated calendar bypass |
| Undone/superseded | History remains inspectable | Old events cannot reactivate the change; later evidence and drafts remain intact |
| Mapping unresolved/projection pending | Clear explanation, existing authorized checkpoint or deliberate new-source start | No fabricated equivalence, mastery or successful background completion |

Board/institution switches, safety-tier transitions, larger jumps and organization-policy changes retain their existing confirmation/authority rules. Grade progression and role membership are separate actions. Becoming a teacher/parent or employer member does not automatically expose the person's private learning history.

## Equitable access and commercial reconciliation

SCOPE-09 produces a versioned decision matrix for Free, paid and explicitly eligible institution-supported access. Include supported learner/category/source/input/output languages, modality, accessibility, meaningful authored/AI-assisted learning/check/Build operations, generation limits, actual usage/cost, retained personal records and recovery after a subscription lapse. Payment authority, sponsored entitlement and guardian/class permissions remain separate.

The acceptance decision must answer how an intended low-income user can complete a meaningful supported learning-to-Build journey within a funded budget. Assess device/storage/bandwidth burden and authored/offline alternatives; do not assume a paid 3D or voice dependency for every learning objective. No price, subsidy, aid eligibility or new entitlement is granted by this contract. Unsupported subsidy/benefit decisions remain explicit blockers rather than invented operational services. Voluntary access needs do not justify inferred income, caste, protected traits or lower-quality teaching.

Reconcile public/internal seven-day-memory and paid Practice/Build/voice copy with accepted behavior. Bound model context separately from durable history, assessments, due queues and artifacts. A billing lapse or model-context eviction is not permission to erase saved work. Existing keep-data instruction remains; retention/export/deletion policy is separately reviewed, with no purge performed. Advertised language/voice/board coverage must match the accepted support matrix. Current school-age admission stays unavailable until its own gate passes even if a family pays.

## Teacher learning and parent support

The teacher chooses a personal subject/pedagogy goal. The system may use their permitted personal evidence and an explicitly selected authorized class-summary signal, explain the recommendation, offer a short study/practice/teach-back task and preserve the resulting evidence/reflection. Self-rating, class score and a tip being clicked are not a teaching-quality rank or qualification. No evidence yields an honest generic authored suggestion. A random tip cannot be presented as personalized. Personal goals and class preparation remain separately scoped even when the user has both roles.

Parent guidance uses a verified current relationship and permitted summary: what was observed, the period/freshness, uncertainty and a small action such as discussing an explanation, establishing a practice routine or preparing a question for the teacher. Suggesting a question does not send it. Private doubts/chats/drafts remain hidden unless a separately permitted explicit share applies. A withdrawn relationship cannot be revived by a cached summary or stale background job; stale actions must be reauthorized and refetched.

Before any school-age release, PRIV-01 accepts the actual admission/verification/consent policy; DATA-04/05 and ROLE-04/06 implement its matching relationship/admission proof and activation/revocation behavior. A parent role picker, Family payment, invitation code alone or claimed organization ID is insufficient. Retain minimal reviewed proof metadata and purpose versions; do not automatically collect sensitive identity documents. Keep the current under-18 activation guard until the connected replacement is accepted. No legal compliance certification or universal age-assurance claim follows from this contract.

## Cross-component acceptance cases

| Case | Required observed outcome | Gate |
| --- | --- | --- |
| New device or long absence | Same authorized personal history and exact saved checkpoint/project revision; reclarify stale goals; preserve unknown evidence | LEARN-14, AI-15, SYNC-02, ACCEPT-01 |
| Two devices promote/undo concurrently | One accepted conditional revision or explicit conflict; no lost later work or duplicate notices | LEARN-14, DATA-06, ACCEPT-04 |
| Crash or lost response after transition commit | Same command yields the accepted receipt; fenced projections converge without duplicate side effects | LEARN-14, SYNC-01/02, ACCEPT-04 |
| Board/source changes, withdrawn mapping or split/merged concepts | Reviewed disposition or clear unresolved bridge; old evidence/assignment retains original criteria; no guessed mastery | CONTENT-08, LEARN-09/14, ACCEPT-01/05 |
| Leave school/employer while jobs/audio are in flight | Old grant/cached output fails current authority; personal lawful records remain scoped; no automatic confidential-content transfer | DATA-05, ROLE-05/06/08, LEARN-14, ACCEPT-02/04 |
| Teacher studies privately and prepares a class | Separate evidence/context, useful reasoned next step, explicit allowed share and accurate unavailable/generic fallback | ROLE-10, AI-15, ACCEPT-02/08 |
| Parent or sponsor loses access | No new summary/action or in-flight delivery under a revoked grant; paying never restores education authority | ROLE-04/07/09, BILL-04, ACCEPT-02 |
| Free/paid/sponsored lapse or limit reached | Accepted benefit matrix enforced server-side; saved work retained and limit/recovery state honest; no duplicate charge or hidden benefit grant | SCOPE-09, BILL-04, RELEASE-04, ACCEPT-05/08 |
| School admission not yet qualified | Activation remains denied/pending and no model/workspace action bypasses the boundary | PRIV-01, ROLE-04/06/08, SAFE-01, ACCEPT-02/05 |

Use synthetic histories for multi-stage/concurrency/long-absence tests before any eligible pilot. Such tests demonstrate software continuity, not years of educational benefit. ACCEPT-08 separately evaluates independent learning and teacher/parent usefulness in the actual released cohort. No model training, provider choice, hosted capacity, AGI result or completed runtime task is implied by this contract.
