# Shared product acceptance and integration boundary — 01-PM

Wave 0.5, 2026-09-19. Product requirements for subsequent UX/engineering, **not implemented architecture or QA sign-off**. v2.2 Parts F–O/W/Z remain authoritative. All role addenda inherit this file.

## One lifelong product, user-controlled intelligence

Visionary Guide supports a continuing learning/building relationship: goal, current understanding, next useful activity, permitted history, language and pace. Role and stage change the treatment, not the person's ownership of their work. An enduring relationship does not mean a dependency claim, guaranteed general intelligence, background surveillance, or access across privacy boundaries.

- Home identifies the role/workspace and gives an evidence-backed next action. Guide can explain, teach, check, remediate, plan or help build in context. Forms and review controls remain directly usable.
- The future model may offer broader understanding; this frontend uses curated, labelled journeys and honest unsupported-topic alternatives. No claim that AGI is implemented.
- Memory is inspectable and optional: item, source/provenance, reason, scope, last use, edit/disable/delete. User-told vs inferred vs organization-provided data is explicit. Declining personalization is not equivalent to deleting their work.
- Voice is user-invoked. Required states: unavailable, permission explanation, listening indicator, stop/cancel, processing, transcript review, error/retry, text fallback. No passive microphone activation, unsupported generated audio, or claim that the app is always listening. Listening stops on navigation/sign-out unless a separately designed and authorized session contract says otherwise.
- Interface, teaching, source, input, voice and bilingual preferences are distinct. English/Hindi/Bengali fixtures and script-appropriate layout are the starting coverage, not an all-language capability claim.
- Future device sync is capability-gated: show this-device-only now. Later show syncing/saved/offline/conflict, explain authoritative version and recovery. Never say cloud saved before acknowledgment.

## Existing architecture and incremental target

Keep React/Vite, Router, Query, Radix and Lucide. `App.jsx` retains dashboard URLs; `AuthContext` and WorkspaceSwitcher retain identity/context handling. `domain/workspace.ts`, `workspaceService.ts`, `journeys.ts`, `classroomService.js`, `legacyConnections.ts` and scoped `appClient` are foundations, not disposable prototypes.

| Boundary | Current foundation | Required next acceptance |
|---|---|---|
| Account/workspace | Person, five roles, per-workspace records, lastPath, local auth | Explicit RoleProfile/stageProfile, membership capability and consent state; role vocabulary and personal/org isolation |
| Learning/Guide | Persistent conversation/session, curated representations and question evidence | Goal/objective identity, guided intents, representation availability, mapped exact resume, cancellation and durable failure states |
| Evidence/planning | Named mastery function, first-answer records, delayed review | Versioned objective rubrics, application evidence, due queue, explained recommendations, no grade-as-mastery |
| Projects | Document/milestones/versions/export, explicit relationship sharing | Durable edits, artifact criterion/evidence, versioned share preview and role-specific portfolio |
| Classes/org | Scoped classroom policies, reviewed lesson snapshot, submissions/grades, accepted cohort selectors | Full lifecycle, permitted view models, organization least privilege, content review, audience-specific derived summaries |
| Connections | Legacy relationship bridge and v2 scopes/reports | One canonical all-role center; scope/approver/expiry, lifecycle events and immediate revocation in every consumer |
| Commercial | Central plan prices, mock usage, family entitlements/invoices | Owner vs beneficiary, complete checkout/limit outcomes, flag-gated marketplace, adult-only discovery sponsorship rules |
| Trust | Local disclosures, explicit preference controls, workspace export | Itemized consent/memory, safe report/voice states, retention/request placeholders, no legal certification |
| Transition | No stageProfile/atomic transition record in current domain | Part W engine through services; no isolated UI-only class increment |

The UI must receive already-scoped view models, not fetch broad sensitive entity collections and hide fields afterward. Person/workspace/role/locale/cancellation belong in request context and cache keys. Context switches abort stale work; late responses cannot render in another workspace. Client-side mock checks are demonstrative, not server security.

## State acceptance (all data-bearing screens)

For each touched screen 02 designs, 04 implements and 07 verifies: loading skeleton; background refresh retaining content; populated; new-empty with next action; filtered-empty with clear/reset; partial with missing sources; retryable error retaining drafts; terminal/permission without leaking object details; offline cached with saved status; daily quota preserving saved/required work; unavailable entitlement with explanation; consent pending/revoked; org invitation pending/expired; preparing content; unavailable content with alternative; destructive review; success with undo where safe. Explicitly justify N/A rather than adding meaningless UI.

Every mutation has a clear pending state and honest success/error. Navigation, refresh, cancellation and storage failure must not silently discard input. An accessible status message must not claim success on rejected persistence. Repeated submit/retry is idempotent where appropriate.

## Part W product clarifications awaiting 00 arbitration

The automatic policy is settled by the user: eligible stage changes need zero action, then notice + diff + Postpone 7d / Undo 14d. Evidence inference alone is suggestion-only. Safety-tier, institution/board, multi-stage and policy boundaries keep blocking confirmation.

Two edge semantics need the chief's recorded decision before implementation, not a new user preference questionnaire:

1. Postpone after an already committed change should restore the old active mapping and schedule reapplication in seven days, not merely hide the notice; do not let a lower-priority calendar trigger bypass that postponement.
2. Undo should restore the exact prior active mapping/snapshot but preserve any new work created since transition in a separate accessible history branch. Never delete legitimate new work to obtain snapshot equality.

These are PM proposals, not amendments to the master. Required evidence regardless: 1:1-or-archived objectives, reasoned Bridge Plan, due dates retained, original-stage open assignments, mapped resume, preferences retained, audience updates only after commit, auditable idempotency and rollback on storage failure. Do not notify people without valid existing scopes.

## Commercial/trust acceptance

Prices remain config-only: Premium ₹299/month, Family ₹499 provisional, ≤6 separate profiles; org TBD, marketplace commission 30% provisional. No annual offer, live taxes or production allowance invented. No card/UPI collection. Mock failures/cancellation preserve saved work. Family payer never becomes guardian implicitly; beneficiary cannot cancel manager-owned billing.

Adult Free discovery sponsorship is a required **labelled mock scenario**, not an integrated ad network. No ads for child/unknown-age users or inside explanation, doubt, assessment, feedback, reports or safety. Marketplace and live-teaching simulation remain disabled by default; any active scenario visibly states what is simulated. No covert device monitoring. Privacy/regulatory assertions need later expert review; frontend success is not legal compliance.

## Backend/model cutover and test-data retirement

The user's goal is replacement of temporary demo data when backend/model integration begins. This stage performs **no deletion or live integration**.

Required future cutover acceptance:

1. Adapter choice explicitly separates mock and live environments; no silent fallback from failed live service to fictional success. No mixed mock/live person, consent, invoice or evidence records.
2. Services provide capabilities for model, speech, representation, persistence, verification, billing and delivery. Unsupported capabilities show truthful alternatives.
3. Maintain a fixture manifest: storage namespace, schema version, deterministic fixture IDs, service owner and production replacement. Current examples include `visionary_workspace_v2`, `visionary_entity_*`, auth/onboarding keys and `visionary_connected_demo_v1`; inventory exact keys before deletion. A key prefix alone is **not** proof every record is disposable.
4. Identify seeded fictional records by manifest/provenance. Retire only those records in the explicit test environment, with count/preview and recovery where practical. Never run `localStorage.clear()` or wipe all accounts/owned drafts. Non-fixture user work requires export/migration or an explicit discard choice.
5. Disable demo entry/fixtures and prove they cannot pollute live requests. Replace mock authorization with server-enforced ownership/consent/roles, deterministic cancellation/retry semantics and migration checks.
6. Contract tests run against both adapters: same view-model shape, boundary decisions, state machine and errors. Model evaluation separately covers factuality, pedagogy, native languages, age/safety and unsupported requests; a plugged-in model is not proof of human-level ability.

Part T maps account/workspace/curriculum/learning/representation/Ask/mastery/practice/project/class/organization/connection/notification/subscription/payment/sponsorship/marketplace/analytics/safety/privacy to future services. 04 defines technical contracts; 08 publishes the final integration and fixture-removal checklist only at Wave 6.
