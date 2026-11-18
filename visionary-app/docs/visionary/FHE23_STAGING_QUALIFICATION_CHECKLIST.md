# FHE-23 — Hosted staging qualification checklist (release-owner lane entry package)

Status: **PREPARATION — nothing here promotes anything.** Certificate F
(frontend implementation complete) is the only certificate currently
satisfied. Certificates I (integrated product) and M (release) are open.
This checklist is the entry package for the release owner, independent
QA/Codex, and the founder, per V6 Stage D and the non-negotiable red gates.

## 1. What is already proven, locally, at exact SHAs

| Gate (V6) | Evidence | SHA / receipt |
|---|---|---|
| Production composition, no-demo bundle | 87 chunks; preview store/`PreviewDashboardLayout` chunks absent from the artifact; production-graph test enforces the route split | `d053bb69`+`3cc67c6e` |
| Route table integrity | 23/23 declared `/dashboard/*` routes render a connected surface or the honest room; zero page errors (`qa:route-sweep`) | `7289445f` |
| Core journeys, real persistence | register → OOB verify → onboard → home; profile rename survives reload; sign-out→sign-in continuity; unauthenticated `/api/auth/me` → 401 (`qa:realm-journeys`) | `79760c09` |
| Language completeness | 11 workspace surfaces, zero untranslated chrome in hi/bn; content-language marks counted per language (`qa:i18n`) | `7289445f` |
| Zoom 200%/400% | 24 surface checks PASS (`qa:zoom`) | `ca24c1ba` |
| Reduced motion | 0 animated elements under `prefers-reduced-motion: reduce` vs 25 baseline (`qa:reduced-motion`) | `ca24c1ba` |
| Keyboard / mobile / Devanagari craft | disabled control out of tab order; 390px no overflow, ≥48px targets; 1.50/1.70 line-heights, zero clipping | `950be3f0` |
| Source integrity + provenance | root `npm run check`: provenance inventory + 152/152 law tests | per-merge |
| CI at exact SHA | "Product checks and main production" workflow green on `dev` | per-merge (REST-verified) |
| Honest labeling of service-blocked surfaces | backend-dependent areas render the truthful "not available yet" room; no preview code in production paths | route-split law tests |

## 2. What only hosted staging can prove (the actual FHE-23 work)

- [ ] Staging provisioning: deployable image built from the exact release SHA; environment configuration recorded (owner: release owner/infra).
- [ ] Hosted identity: session cookies, CSRF origin pin set to the staging origin, providers (Google sign-in) verified against real domains, device/account recovery (owner: backend + release owner).
- [ ] Real database persistence: hosted Postgres migrations applied; the realm's emulator-backed flows re-verified against hosted services (owner: backend).
- [ ] ML adapters: real provider configuration, model safety constraints, cost/latency measurement (owner: ML lane).
- [ ] Billing/PSP: Razorpay (or chosen PSP) staging keys; the billing surface currently renders the server-owned "Test billing is not configured" error in the realm — hosted qualification must either configure it or exclude billing from the release scope explicitly (owner: backend/billing).
- [ ] Rollback + incident drills: restore from backup, revoke access, roll back a deployment, monitor major user errors (owner: release owner).
- [ ] Synthetic monitoring + post-deploy health verification (owner: release owner).
- [ ] Capacity, rate limits and expense measurement (owner: release owner).
- [ ] Real-browser end-to-end on the HOSTED origin for every approved launch journey (owner: QA/Codex; the local `qa:realm-journeys` factory is the template).
- [ ] Security/privacy review for the proposed audience: policy/legal/guardian/PSP requirements (owner: founder + release owner).

## 3. Certificate status (V6 §11)

- **Certificate F — Head of Frontend: SATISFIED.** All eligible frontend-only
  work is complete; service-blocked items are labeled, not passed.
- **Certificate I — Integrated Product: OPEN.** Requires the backend/ML
  lanes whose contracts are already written (`docs/visionary/FHE07_08_…`,
  `FHE10_12_…`, `FHE13_16_ROLES_EVENTS_HANDOFF.md`): learning catalogue,
  teaching turn, Build, classrooms, guardian/professional/organization,
  notifications, billing backend, and the one-field profile contract that
  enables the Interface-language switcher.
- **Certificate M — Release: OPEN.** Requires I + hosted staging + the three
  sign-offs below.

## 4. Sign-offs required before any promotion (V6 Stage D)

1. Release owner signs off the **exact artifact digest**.
2. Codex approves the independent technical review (exact SHA).
3. Founder approves the launch scope and every disclosed limitation.
4. Then, and only then: controlled PR dev→main (never force-push, never a
   direct replace), staged rollout, post-deploy verification.

## 5. Release-scope decision the founder must make

- **Option A — full scope after Certificate I.** Wait for the backend/ML
  lanes, qualify the integrated product in staging, promote.
- **Option B — narrow connected-account release (founder override).** Ship
  now with disclosed limitations: account, onboarding, profile, workspace
  shell, learning history, connections workspaces, subscription UI (billing
  backend unconfigured — the honest server error renders); catalogue,
  teaching/Ask, practice, build, classrooms, guardian, professional,
  organization and notifications remain honest rooms. Launch language and
  navigation must reflect the limitation and must not advertise the full
  platform (V6 line 638). Requires the same staging qualification for the
  narrowed scope plus the three sign-offs.
