# KAN-51 — PLAT-07 — redacted traces/metrics, synthetic health checks and bounded dashboards

## Task review and verification handoff

Jira key / source ID: KAN-51 (PLAT-07, parent KAN-4)
Acceptance scope: enabler (backend-owned observability log-hygiene domain: fail-closed redaction, bounded dashboards, synthetic health checks; hosted dashboards/alerting wire at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer) — **TAKEOVER DISCLOSURE**: the founder's 2026-10-24 directive assigned KAN-51 isolated implementation to Manus with Codex as reviewer; Manus made no progress for 6 days (branch `manus/kan-51-observability-spec` still at base 9d6d2b5b, verified 2026-10-30) and the founder repeatedly directed continued work, so this lane took over the implementation per that sustained direction. CONSEQUENT CONSTRAINT: the reviewer for this candidate must be someone OTHER than this lane and OTHER than Manus (D-095 + the original assignment's reviewer logic).
Worker branch / base commit / candidate head commit: `codex/principal-kan-51-observability`; based on the latest lane head `38ff896b` (KAN-207 VMM-R0 + signoff package), per D-098 (lane lineage …207 → 51).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-51-observability`, D-098; `dev` owns integration).
Owned files / contracts:
- `backend/upstream/backend/src/observability/observability-types.ts` (Operator, LogLevel, LogEvent, LogRecord, RedactionPolicy, HealthObservation, DashboardSummary, ObservabilityError)
- `backend/upstream/backend/src/observability/observability-lookups.ts` (ObservabilityStore seam + InMemoryObservabilityStore contract-true state; command-dedup ledger)
- `backend/upstream/backend/src/observability/observability-service.ts` (ObservabilityService — definePolicy, emit, runHealthCheck, readHealth, dashboard)
- `backend/upstream/backend/src/observability/index.ts`
- `backend/upstream/backend/tsconfig.observability.json`
- `backend/tests/contracts/observability/observability.test.mjs` (PLAT-07 suite, 7 tests)
- `scripts/observability-check.mjs`, `package.json` (`observability:check`)
Prerequisites: none native (P00 phase-level). Unblocks: hosted dashboards/alerting wiring (later cutover). Composes the lane stances: KAN-91 redaction-resilience, KAN-139 record discipline, KAN-45 bounded-metrics semantics.

## Requirement

Add redacted traces/metrics, latency/error/queue/cost dashboards, synthetic health checks and alerts. Keep prompt bodies, payment secrets and raw private learning text out of routine logs. (source: BACKEND_LAUNCH_CHECKLIST.md PLAT-07; KAN-51)

## Acceptance criteria → evidence (backend/tests/contracts/observability/observability.test.mjs, 7 tests)

- FAIL-CLOSED REDACTION — prompt bodies, payment tokens and raw private learning text in field keys refuse the WHOLE record (`redacted_field_forbidden`); payment secret VALUES hiding under safe-looking keys also refuse (denied-value patterns); the stream stays EMPTY after refused emits — redaction is refusal, never a silent drop or partial write.
- POLICY GATE — emission requires an APPROVED versioned policy: unknown refuses (`policy_unknown`), unapproved refuses (`policy_not_approved`).
- BOUNDED VOCABULARY — only declared levels and event kinds emit; anything else refuses (`log_invalid`).
- SYNTHETIC HEALTH CHECKS — within budget = healthy; over budget auto-degrades with the budget recorded (`degraded` + budgetMs); invalid budgets/latencies refuse (`check_invalid`).
- OPERATOR-SCOPED READS — dashboards, health reads and health runs refuse product actors uniformly (`not_operator`, no leak).
- BOUNDED DASHBOARD — p50/p95 latency, error rate, queue depth and cost estimate derive only from the redaction-cleared stream; out-of-bounds metrics refuse (`metric_out_of_bounds`); the summary carries the stream digest (tamper-evident: same prefix → same digest).
- COMMAND DEDUP — replayed emits/health checks converge to the original record; changed payload refuses.
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — ObservabilityService composes the approved redaction policy, the append-only cleared stream and the operator boundary. Data — owning-store adapter at integration resolves from log_streams (append-only) and health_checks tables. Hosted — dashboards/alerting remain a later cutover (below).

## Commands, exit codes, test counts and timestamps

- Observability compile + suite: `node scripts/observability-check.mjs` → tsc `tsconfig.observability.json` exit 0; `node --test` → 7 tests, 7 pass, 0 fail (2026-10-30).
- Lane context: candidate based on lane head 38ff896b, whose lineage carries the whole 9-candidate stack (whole-repo `npm run check` green at dcc9c11a; integrated-tree validation: `npm run check` + 44 backend suites + research gate 6/6 green — comment 10371).

## Remaining defects, limitations and linked open gates

- Hosted dashboards, alert routing, metrics retention and any hosted evidence remain open (later cutover); the cost estimate is a bounded illustrative derivation from record counts, never from logged content.
- Enabler completion never closes hosted, provider, privacy or feature acceptance gates.
- No secrets, prompts, payment details or learner content were embedded in any test or artifact.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence; reviewer must be neither this lane nor Manus per the takeover disclosure above)
