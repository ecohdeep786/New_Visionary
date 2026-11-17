# V6 FHE journey matrix — one source of truth for the FHE-00…FHE-24 program

Created 2026-11-17 (FHE-00) on `origin/dev` = `786c0d1e`. Supersedes no accepted receipt;
it indexes them and classifies what remains. Update the matching row before starting any
work order; classify by **outcome**, not file name. Status classes (V6 §6):
**A** accepted production-integrated · **B** implemented, locally/fixture verified ·
**C** preview-only (design kept, server authority missing) · **D** backend/ML prerequisite
missing · **E** actual frontend defect · **F** explicitly deferred.

Evidence levels: L0 static · L1 unit/fixture · L2 locally integrated (prod build + real
registered services) · L3 hosted acceptance. Nothing is L3 yet; hosted identity, RUM field
data and staging qualification are separate gates (FHE-23).

| # | Journey (routes) | Intended operation | Authority today | Class | Evidence / next step |
|---|---|---|---|---|---|
| 1 | Public home + personas (`/`, `/student`, `/teacher`, `/parent`, `/professional`, `/organization`, `/pricing`, `/how-it-works`, trust/editorial routes) | Understand the promise; reach the real next action | Public, static content; auth-aware CTAs (`1dc86eff`) | A (frontend) | T13 entry floor (ae4cde7c) LCP <2.5s on all four doors; post-unification CWV re-proof (`0010d954`); 25-surface walkthrough (`786c0d1e`). FHE-01/02 regression checks only unless a defect is shown. |
| 2 | Register / Login / Verify / Reset (`/register`, `/login`, `/auth/action`, `/forgot-password`, `/reset-password`) | Create, verify, recover, sign out | Firebase Auth + server HttpOnly session (`authTransport`) | A (frontend, L2) | Prod-build identity journeys (FAP-69, `0010d954` §2). Hosted provider/delivery = FHE-23 gate. No mock identity in prod. |
| 3 | Onboarding (`/onboarding`) | Role, age band, language; server-authoritative completion | Server profile via `completeOnboarding` | A (frontend, L2) | Onboarded learners/teachers across walkthrough receipts. Preferences ≠ permissions preserved. |
| 4 | Internal shell (`/dashboard/*`) | Coherent connected home; role navigation; honest access | **Was:** prod = flat `ConnectedAccountLayout` (7 links, unavailable rooms); dev = preview store shell. **Slices 1–2 (FHE-05):** connected composition root `ConnectedWorkspaceLayout` + server-backed `ConnectedWorkspaceProvider`; preview becomes a DEV-only lazy boundary | C → **implemented, L2 (slices 1–2)** | Slice 1: prod shell + provisioning + SQL readback (`7570e536`). Slice 2: mobile 390px full journey (register→verify→onboard→shell→every routed area→reload persistence), desktop keyboard walk (skip link→`#main`, tab order, route-change focus, account menu open/Escape/focus-return), consent capability-off state made honest, dark-shell brand-mark contrast fixed. QA/Codex review still pending; not merged to dev. |
| 5 | Workspaces & membership (`/dashboard/connections`) | List/join/provision workspaces | Server: `/api/overview/workspaces`, `/api/account/workspace/provision`, `/api/account/invitations/accept` (`connectedWorkspaces.js`) | B → shell-hosted in this slice | Provision/invitation receipts (KAN-3x era + FAP lanes). Active-workspace selection = ephemeral client preference validated against the server list; server-reconciled persistence needs an account-preference contract (FHE-06 follow-up). |
| 6 | Saved learning (`/dashboard/learn`) | See durable learning sessions | Server: `/api/account/learning/sessions` (`connectedLearning.js`, `ConnectedLearningHistory`) | B → shell-hosted in this slice | L1 client validation tests; re-verify in prod build journey. |
| 7 | Published curriculum (`Learn` catalogue) | Board → subject → book → chapter → topic | **No catalog controller in the product backend module**; frontend `contentRepository` ships sample/local graphs (preview-class only, never executed in prod — pinned by the route law + `verify:graph`) | D | Honest unavailability proven live in the prod shell (`/dashboard/learn` renders the server-backed Saved-learning surface). **Contract handoff written 2026-11-18:** `docs/visionary/FHE07_08_CONTENT_TEACHING_HANDOFF.md` Part A (catalog read + invariants + acceptance gates). Backend data lane to implement. |
| 8 | Teaching / Ask (`/dashboard/ask`, Guide) | Grounded, cancellable teaching turns | Server learning-session loop + knowledge projections connected (owner-scoped receipts); **teaching model turn unregistered** — prod renders the honest room; the model seam is a fail-closed stub (`appClient.InvokeLLM`) | B (loop) + D (model) | **Contract handoff written 2026-11-18:** `docs/visionary/FHE07_08_CONTENT_TEACHING_HANDOFF.md` Part B (session-bound grounded guide-turn with abstain/not_connected semantics, idempotency, server-side safety). ML lane to implement. |
| 9 | Practice / assessment (`/dashboard/practice`) | Server-issued checks; authoritative scores | Same learning-session server loop | B (loop) → prod reachability with shell slice | Never compute mastery in the browser. |
| 10 | Build (`/dashboard/build`) | Durable projects, revisions, sharing | Preview `ArtifactStudio` on browser-local drafts; **no durable Build service registered** | C + D | FHE-10: keep honest unavailable states in prod; contract handoff. |
| 11 | Teacher classrooms (`/dashboard/classes`, `class/:classId`) | Class, assignment, grading lifecycle | Preview class entities browser-local (`classroomService`); **no class controllers in the product module** | C + D | FHE-12: carry the accepted UX; server-owned class authority required before any prod claim. |
| 12 | Guardian (`/dashboard/child`, reports) | Verified relationships, permitted summaries | Preview only | C + D | Under-18 admission stays blocked regardless (FHE-13). |
| 13 | Professional (`/dashboard/career`, portfolio) | Private goals, reviewable portfolio | Preview only | C + D | FHE-14. |
| 14 | Organization (`/dashboard/people`, `cohorts`, `curriculum`) | People, cohorts, content lifecycle | Preview only (`organizationAccess` is a preview derivation — gated DEV-only in the shell) | C + D | FHE-15. |
| 15 | Privacy & consent (`/dashboard/privacy`) | Policy readback, consent ledger | Server: privacy policy + consent controllers (`privacyPolicyClient`, `consentClient`) | B → shell-hosted in this slice | FHE-17 regression via prod journey. |
| 16 | Security (`/dashboard/settings`) | Sessions, devices, sign-out-all | Server: account/session controllers (`accountDevices.js`) | B → shell-hosted in this slice | FHE-17. |
| 17 | Plans & billing (`/dashboard/subscription`) | Understand plans; test checkout | Server billing controller (`billingClient`); TEST checkout only | B (test realm) | **No real money** until legal/PSP/tax gates (FHE-18). Honest "Test billing is not configured" state verified in walkthrough. |
| 18 | Feedback / support | Server receipt or honest channel | Server feedback controller (`feedbackClient`) | B → shell-hosted in this slice | FHE-16 partial. |
| 19 | Cross-role notifications | Real events reach the right person | Preview only | C + D | FHE-16. |
| 20 | CI source integrity (`npm run check`) | Green provenance on `dev` | **Failing**: `backend/upstream/backend/nest-cli.json` imported-source hash mismatch | D (backend owner) | FHE-22: owner records/repairs provenance; frontend must not touch the hash inventory. |
| 21 | Staging/hosted qualification | Deploy exact artifact, qualify | Not started | D (release owner) | FHE-23. |

## Worktree ownership (FHE-00)

- Primary checkout `C:/Users/Administrator/New_Visionary` on `dev` — integration only.
- **This task:** `C:/Users/Administrator/nv-worktrees/zcode-fhe05-connected-shell`, branch
  `zcode/fhe05-connected-shell`, base `786c0d1e`. Scope: FHE-05 slice 1 (connected shell +
  workspace context + shell-hosted connected surfaces + preview isolation gates) and the
  FHE-06 personal-workspace journey on the server. No other worktree may be touched.
- Stale registrations pruned 2026-11-17 (dirs removed previously; branches preserved).
- Backend/ML lane remains **PAUSED** per founder interrupt #2; this matrix does not resume it.
- 2026-11-18: the **no-dead-code law** is now binding and mechanically enforced on this
  lane (`docs/architecture/FRONTEND_NO_DEAD_CODE_LAW.md`, `npm run verify:graph`,
  `tests/production-graph.test.mjs`). 93 orphaned files removed, the demo fixture moved
  to `tests/fixtures/`, `backendTransport.ts` registered as the intentional seam; the
  surface inventory shrank to 1532 live control declarations. Every later work order
  must pass `verify:graph` + the route law test before acceptance.
- 2026-11-18 (integration): the FHE-05 lane (`7570e536`→`bb7d5ff5`) was end-to-end
  self-reviewed per the founder's directive and **integrated into `dev`**: fast-forward
  to `bb7d5ff5`, root `npm run check` green on integrated dev after recording the
  FAP-69 v7 `nest-cli.json` provenance in the upstream patch ledger (the known CI
  integrity failure is resolved without weakening the guard) and refreshing the KAN-31
  authority inventory; published as `dev` = `c02faddb`.
- **Current task:** worktree `C:/Users/Administrator/nv-worktrees/zcode-fhe07-content-truth`,
  branch `zcode/fhe07-content-truth`, base `c02faddb`. Scope: FHE-07/08 — verify
  content/teaching truth in the production graph and deliver the exact backend/ML
  contract handoff (`docs/visionary/FHE07_08_CONTENT_TEACHING_HANDOFF.md`). No other
  worktree may be touched.
