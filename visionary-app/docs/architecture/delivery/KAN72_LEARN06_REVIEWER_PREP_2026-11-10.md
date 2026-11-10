# KAN-72 / LEARN-06 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-72-change-cursors` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections `8d0a286b`, stack integration `1e04c3c0` (merge of dev `2e0b1fbb`; package.json scripts unioned — all twelve family checks live), data-04 rolling-clock fix `500b148b` (byte-identical), settled review artifacts.

## Corrections

1. **Cross-device stale-rejection misfire fixed**: `acceptResponse` compared against ONE global generation while each device's delivery sequence is independently monotonic — device A's progress falsely marked device B's fresh response stale. Generations are now per device (the single-device contract and tests are unchanged).
2. **Cursor tokens and draft ids use `randomUUID`**: the `Math.random+Date.now` tokens were guessable authorization-ish artifacts.

## Review finding (verified, no further defect)

The device state machine reviewed clean: cursors issued per (device, workspace, surface) and identity-bound (other device/workspace refuses uniformly, no leak); refetch replays the exact ordered suffix; per-device independent workspace selection (switching on one device never affects another; a workspace/account switch rebinds identity and drops old-scope cursors); offline drafts bind the BASE revision — a matching base applies cleanly, a moved base becomes an explicit CONFLICT with both versions retained (no silent overwrite); sign-out wipes ALL device state; account switch isolates per account.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Device-state suite (LEARN-06's own acceptance) | `node --test frontend/tests/learning-device-state.test.mjs` | **6/6 pass** (post-merge) |
| Coupled review-artifact chain | surface-audit:write → authority-audit --write → contracts build | **all exit 0; check EXIT 0 — 859 ok lines, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- This slice is device-side state; its server counterpart (authorized cursor issuance/refetch endpoints) rides the SYNC family (KAN-139/140, separate Testing candidates).
- Real cross-device journeys over hosted sessions stay founder-gated as originally recorded (ACCEPT-01's chain covers the released-slice journey).
