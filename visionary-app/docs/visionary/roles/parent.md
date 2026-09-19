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
