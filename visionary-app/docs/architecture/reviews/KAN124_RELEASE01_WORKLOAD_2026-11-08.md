# KAN-124 / RELEASE-01 — measured workload distributions review handoff

8 November 2026. Implementer: Senior Principal Backend & ML Engineer (ZCode lane).
Branch `zcode/kan-124-release01-workload` off `dev` (`2e0b1fbb`). Reviewer:
**pending per D-095**. Not merged into `dev`; worktree left for the reviewer.

## Acceptance scope

Replaces the D-075 cost model's point "workload guesses" with a measured-distribution
path: a full law suite for beta request/token/duration/byte profiles (polling,
synchronized class starts, retries, chunked turns, declarative Build/offline
reconnect, voice/ASR/TTS), with fail-closed provenance and a bridge into the existing
`estimate()`. Full statement:
[RELEASE01_WORKLOAD_DISTRIBUTIONS.md](../delivery/RELEASE01_WORKLOAD_DISTRIBUTIONS.md).
Evidence: [release01/evidence.json](../delivery/release01/evidence.json), the captured
projection and TAP under `docs/architecture/delivery/release01/`.

## What changed

- `scripts/workload-model.mjs` — pure engine: histogram summary, `deriveWorkload`
  (every counting law), `workloadToCostOverrides` (bridge to the D-075 cost engine).
- `scripts/tests/fixtures/workload-profile.synthetic.json` — the committed schema
  demo (explicitly synthetic).
- `scripts/tests/workload-model.test.mjs` — 10/10 law suite, registered
  `npm run workload:test` and wired into `scripts/check.mjs`.
- `package.json`, `scripts/check.mjs` — registration only.

No backend or frontend source module changed; the authority inventory and surface
audit are re-verified clean by `npm run check` (no regen needed).

## Findings corrected

- **`buildAdmissions` double- (under-) count bug** — the admission surface used the
  histogram observation count (2400 runs) instead of the weighted chunk total
  (6120). Fixed in the engine; the test now pins both numbers.
- **Float exactness** — `1.095 − 1` is not exactly `0.095`; assertions use tolerance.

## Verification at this branch head

`npm run workload:test` 10/10 · `npm run cost:test` 10/10 (existing engine untouched)
· `npm run check` exit 0 (script-tests 124/124 incl. the workload suite,
continuity/motion/taps laws, 3842-file import baseline, surface audit, lint, typecheck,
`npm test` 672/672, production build).

## Explicitly not accepted here

The profile and all projections use a **synthetic** demo. Real beta
request/token/duration/byte distributions require capture from the hosted beta with
`capture.source: 'beta'` and complete window/users/days metadata — that is a hosted
acceptance step, not something this branch can produce. Nothing here is passed off as
a beta measurement; the fail-closed provenance rule enforces that.
