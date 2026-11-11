# KAN-91 / AI-09 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-91-redaction-resilience` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all thirty family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## Review finding (verified, no defect)

The redaction/resilience slice reviewed clean and enforces the AI-09 law:

- **Provably raw-free logging**: `redactForLog` replaces every string field with a typed length-noting placeholder (`learner_text:<len:N>`) — the original content is gone in any form (not hashed, not truncated), and `containsRawText` proves the record free of the tested raw strings. Deliberately conservative: even operational string metadata is redacted (over-redaction is fail-safe; the interface carries no private/operational distinction).
- **Classroom/NAT fairness**: the shared-egress window caps the aggregate rate with a synchronous check-and-consume critical section (no await between check and write); exhausted windows refuse with `egress_window_exhausted` — one learner cannot starve the classroom.
- **Honest provider failure**: a 429 refuses `provider_rate_limited`, a 5xx refuses `provider_outage` — no retry storm inside the request; the caller retries deliberately.
- **Mid-run revocation**: the policy checkpoint composes KAN-90 semantics (partial stays partial, `final: false`, no further provider work).

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| ML-resilience suite (AI-09's own acceptance) | `node --test backend/tests/contracts/mlresilience/ml-resilience.test.mjs` (after `npx tsc -p tsconfig.mlresilience.json`, exit 0) | **4/4 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The egress-window and policy seams are injected (the SQL adapter keeps the window's critical section atomic). Hosted provider resilience against real providers stays founder-gated as originally recorded.
