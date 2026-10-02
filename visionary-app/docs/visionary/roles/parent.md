# Parent acceptance addendum — 01-PM / Wave 0.5

Authority: v2.2 F/J/M/X/Z. Inventory PA-01–03 and SH-08–12. Current consumers: Children, WorkspaceTools/Reports/Trust, Connections, FamilyBilling, familyReports/legacyConnections. Source review only; no frontend edits.

## Job and Home

Understand a child's learning and offer realistic support, not surveillance. Child selector shows relationship status before any summary. For the active child show ≤5 modules: weekly summary; what is going well; one support opportunity with evidence reason; upcoming work/transition; teacher/org update. One next action: **See this week's summary**, or **Request progress sharing** when unconnected. Early-years copy emphasizes concrete support; teen copy makes autonomy and private boundaries explicit. No rankings, opaque risk scores or punitive streak alerts.

## Acceptance

| ID / route | Required outcome | Deliberate states |
|---|---|---|
| PA-A1 `/child` | Two-child switching; request/invite, scope/approver/expiry and child-visible relationship | Pending, active, declined, expired, removed/revoked; only active authorized summaries. Existing local acceptance never claims verified guardianship |
| PA-A2 `/reports?child=…` | Overview, progress, retention, shared projects, assigned work, teacher updates, goals/transitions; period and source | No activity ≠ no ability. Unknown/unauthorized child never falls through to another child's report without clear selection; stale/partial data labelled |
| PA-A3 `/connections`, `/privacy` | One canonical relationship list and readable consent history | Preserve existing records, bridge legacy and v2; revoke removes report access immediately; no private doubts/notes/drafts by default |
| PA-A4 `/notifications` | Digest frequency and language, actionable lifecycle updates | Off/daily/weekly/urgent; local simulation visible; no email/push delivery claim |
| PA-A5 Ask from report | Explain what evidence means; suggest a helpful question for teacher or one support activity | Carry selected child and permitted summary, not transcript. Education-option research uses source placeholders, never fabricated school/cost results |
| PA-A6 `/subscription` family | Manage own billing without widening learning access | Payer is not guardian; invited member sees manager-owned entitlement and cannot cancel manager's plan |

All shared state classes apply where relevant. Switching children must cancel stale loads and remove the old child's content before rendering new data. An expired relationship can display its status and renewal action, never its cached private report. Teacher updates derive from assignment/returned-feedback events under scope; currently returned-work counts are a foundation, not a complete digest.

## Fixture acceptance and metrics

Retain Anika's two fictional children and separate progress-sharing scopes. Add each consent state, early-years and teen treatment, a billing-only relationship, filtered/period-empty report and revoked-after-load case. Parent summaries use denominators and dates, plain language, one practical action; confidence appears only if explicitly shared and self-reported. No inferred personality/diagnosis.

PA-F1 teacher returns feedback → permitted parent digest appears without response/private text → learner can see who receives their summary. PA-F2 child A and B remain separate through refresh/switch/revocation. PA-F3 Part W transition insight appears only after atomic commit, with diff and authorized undo/postpone behavior; membership alone grants no transition authority. PA-F4 billing accept/revoke never creates/deletes guardian consent.

Not yet approved as complete: source currently lacks all report sections, itemized consent history and lifecycle notification pipeline. Next owner: 02-UX; no QA/gate pass is asserted.

## 2026-10-01 — Notification failure recovery and retained history

Student/teacher/professional updates now have saved summary preference, All/Unread filtering, an empty-filter return to history and explicit read-status actions. Opening a saved destination does not depend on saving read status. Rejected preference/read writes show inline errors, retain the old saved state and allow retry. Parent sharing-history and other-notice read actions now use the same error recovery; opening a parent's notice does not mutate read status. Parent language/frequency selectors have explicit accessible labels. Organization updates already have scoped mutation recovery and retain their separate membership view.

The service now rejects missing/cross-workspace notification IDs and treats an already-read update as an idempotent no-op after workspace access validation. Failed persistence preserves unread records; a successful retry changes only the owned update. Full service regression: 269/269 pass. Combined focused ownership/notification suite: 15/15 pass. Final production browser/build/typecheck evidence follows. Read status is neither permission nor consent; current destination access remains separately checked. No scheduled notification delivery or backend is connected.


## 2026-10-02 — Canonical sharing, expiry integrity, activity-view export and Profile languages

Privacy now links to the canonical Connections center instead of exposing a second request/accept/revoke workflow. Existing records remain intact; the center retains scopes, approvers, lifecycle/history and actual mutation outcomes. A shared derived expiry state distinguishes unavailable metadata from expired permissions without inventing a transition or repairing bytes. Unreadable/blank/non-string dates block approval and summary/resource/organization access, including legacy readers. Explicit decline/cancel/revoke remains available for affected open records; original date fields are retained. Children shows the unavailable state without a report link or Invalid Date and allows closing before a new learner-approved request. Billing requests with invalid deadlines cannot activate a plan; this does not merge billing with learning consent.

An already-open learning activity's recovery export is now production-browser verified: visible question/options/current selection only, no assessment keys, no replacement of unreadable storage and no scored evidence. Restoring a valid saved copy and retrying restores the saved selection. Profile labels, accessible names and recovery/success messages now have Hindi/Bengali copy driven by interfaceLocale. User learning-area titles stay unchanged; teaching language remains independently scoped. Unmapped service errors retain their English fallback; no full translation claim.

316/316 full service tests and 6/6 focused connection-integrity tests pass. Final production build, both typechecks and scoped lint pass. Production browser checks pass for Privacy link/export/no permission mutation, valid request acceptance, unavailable legacy/v2 records and explicit close/date retention/refresh; parent blank-expiry report denial/close/renewal, malformed billing denial/Leave/date retention; already-open activity export/retry; Hindi/Bengali Profile draft recovery/export/name save/area duplicate/discard at 320px. Zero page errors/document overflow in these scenarios. A first parent browser run used the wrong /plans test URL; the corrected /subscription final run passes. Standard lint retains only the existing scripts-tmp/copyaudit/scan.js:84 parser error.

Evidence: scripts-tmp/connection-final-tests.txt, connection-integrity-focused.txt, connection-access-build.txt, connection-final-typecheck.txt, connection-final-lint.txt, connection-final-lint-full.txt, connection-integrity-browser.txt, parent-access-integrity-final-browser.txt, learning-view-export-browser.txt, profile-language-browser.txt. The shared expiry projection adds no storage namespace or fabricated lifecycle history. Broader curriculum/category/state/language/assistive-technology/native-device and full frontend gates remain open; no backend or founder-book request yet.
