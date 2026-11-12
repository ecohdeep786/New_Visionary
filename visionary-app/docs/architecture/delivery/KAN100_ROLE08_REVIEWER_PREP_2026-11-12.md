# KAN-100 / ROLE-08 — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-100-role-screen-adapters` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e`; package.json scripts unioned — all thirty-eight family checks live), data-04 settled to dev's evolved version, settled review artifacts.

## Correction

Operation ids use the **browser-safe `globalThis.crypto.randomUUID()`** — this frontend service had NO id-generation fix at all (the instance-counter class applies to the browser side too), and the obvious `node:crypto` import is not browser-safe for a frontend service. The suite (node) still passes because node also exposes globalThis.crypto.

## Review finding (verified, no further defect)

The device-side role gate reviewed clean: ONE membership gate for every released role screen (per-device state machine: pending refuses writes, expired allows reads only, revoked stops everything immediately); role screens must be REGISTERED for their locale (`role_screen_unregistered` otherwise); feed-driven membership transitions move both devices; mid-flight revocation aborts operations as honest partials; in-flight snapshot shows what a revocation would abort.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Role-screen-adapters suite (ROLE-08's own acceptance) | `node --test frontend/tests/role-screen-adapters.test.mjs` | **7/7 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after the coupled artifact chain) | **exit 0 — 866 ok lines, frontend build ok** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

All four stages re-verified: pricing renders; register renders all three reviewed methods; the email-entry step renders on click; the protected-route guard renders in-place with the Create-account link preserving the full `returnTo` deep link. Credential step founder-gated as always.

## Notes for the reviewer

- This slice is device-side state; its server counterpart rides the SYNC family. The membership states arrive from the server feed (never client-claimed).
- Real device journeys at scale stay founder-gated as originally recorded.
