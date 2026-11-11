# KAN-88 / AI-06 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-88-ml-output-gate` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-seven family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## Review finding (verified, no defect)

The permission-filtered retrieval + ML output gate reviewed clean and enforces the AI-06 law:

- **Permission-filtered retrieval server-side, before any model call**: only eligible sources the caller MAY retrieve enter the model context; the filtered-out set is recorded for the audit trail.
- **Five ordered fail-closed output validations**: (1) pinned context/prompt/tool versions must match EXACTLY (no version drift); (2) schema — all required fields present; (3) every citation must resolve to the PERMITTED (filtered) source set only; (4) locale must match the request; (5) every action must be on the allowed-action list. First failure throws with its typed code.
- The accepted output carries the pinned versions + citations — the audit trail of exactly what was permitted and used.
- No counters, no client flags, no secret material.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| ML-gate suite (AI-06's own acceptance) | `node --test backend/tests/contracts/mlgate/ml-gate.test.mjs` (after `npx tsc -p tsconfig.mlgate.json`, exit 0) | **7/7 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The source lookup is injected (maps onto the retrieval/permission stores). Hosted ML flows at scale stay founder-gated as originally recorded.
