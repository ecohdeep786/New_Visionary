# Conversation-first implementation ledger

Public pages and their shared styles are protected. Existing unrelated asset edits and shots are not part of this change.

## Baseline

React/Vite, React Router, React Query, Radix, Lucide and local persistence retained. Existing class submission/grading and connections retained. The six existing regression tests, lint and typecheck passed before this implementation. Prior browser QA is recorded in internal-workspace.md; this does not constitute exhaustive acceptance of the new specification.

## Traceability

| Wave | Requirement | Implementation status |
|---|---|---|
| 0 | Source/route/token audit, preservation boundary | Source audit complete; visual baseline pending |
| 1 | Typed services, workspace identity, scoped persistence, states | In progress |
| 2 | Guide, resumable activities, evidence, curated journeys | Pending |
| 3 | Teacher preparation and organization operations | Pending |
| 4 | Family reports and professional goals | Pending |
| 5 | Simulated subscriptions, trust and gated capabilities | Pending |
| 6 | Tests, responsive/accessibility verification, handoff | Pending |

## Component decisions

- Retain: Radix dialogs/menus, classwork/grader, join/connection workflows, cube manipulation, account settings.
- Extend: Dashboard shell/navigation, AuthContext, onboarding, learning metrics, repository boundaries.
- Replace: separate Home/Ask surfaces with one persisted Guide conversation and activity canvas.
- Keep public routes and existing dashboard deep links compatible.
- New demo records and responses must be labelled. No backend, network model, payments, email, monitoring, or real guardian verification.
