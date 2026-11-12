# KAN-122 / ACCEPT-06 build purity — reviewer-corrector pass (2026-11-13)

Reviewer-prep for `codex/principal-kan-122-build-purity` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e` into the impl commits `189b7b5f`+`6881cfb5`, old base `f61292ef`), settled review artifacts, receipt.

## Corrections (forced by the dev merge — dev removed the demo activation surface)

**Merge interaction discovered by the gate, not the author**: dev REMOVED the demo client surface entirely (`enterDemo` method gone from `appClient.js`, `DemoPreview` route gone from `App.jsx`) — but dev's `workspaceService.ts` STILL carried the ungated fictional-persona fixture data + `seedDemo` sealer. The branch's DEV-gating of that data (KAN-122's original correction) then **broke dev's merged test suites** in three distinct ways, each fixed honestly:

1. **`appClient.js` conflict → take dev's wholesale.** The branch's only appClient intent (demo gating) is superseded by dev's complete removal; the merged `auth` object must have NO demo surface at all. Purity law upgraded: absent is stronger than gated.
2. **`demoStages` gated on `import.meta.env?.DEV` crashed the plain-node test runner.** The SCOPE-06 and stage-presentation fixtures seed through `seedDemo`; in the check's `node --test` runner `import.meta.env` is undefined, so a DEV-gated `seedDemo` threw "Demo seeding is available only in development." (all 6 SCOPE-06 tests) and an empty `demoStages` returned `'independent'` instead of `'competitive'` (stage-presentation). Environment-sniffing gates are the wrong tool when the honest law is structural.
3. **The honest final law: NO production activation path + real-build elimination proof.** With both callers removed upstream, no `src` file imports `seedDemo`/`scenarioPersonas`/`demoFixtures` other than `workspaceService.ts` itself — so the fixture surface is unreachable in the production graph and tree-shaken. The checker now enforces: (a) appClient carries zero demo surface, (b) App.jsx has no DemoPreview route (or DEV-only if reintroduced), (c) a source walk proves NO other src file references the fixture surface, (d) the REAL production build's dist is scanned for `demoFixtures`/`seedConnectedFixtures`/`DemoPreview`/`seedDemo`/`scenarioPersonas`/`demoStages` and must carry NONE. `demoStages` was added to the marker set precisely because it is now intentionally ungated.

**Backend law evolved for dev's three new emulator readers.** Dev added three files that read the emulator env; none configures a client — each is a REFUSAL/CONSISTENCY read carrying its own fail-closed contract (`product-overview.store.ts` fences the emulator realm to the disposable test schema and refuses outside test; `production-runtime.ts` refuses every emulator env in production; `firestore-provision-links.ts` requires the runtime mode to agree with the intent's declared `firestoreMode` or 409). The checker now allows them ONLY as registered `EMULATOR_REFUSERS`, each with its verified contract markers — a returning `ungated` reader fails the suite.

## Review finding (original implementation sound in its intent)

The original KAN-122 correction was correct for the leak it closed (the demo implementation shipping fictional personas in production bundles); dev's surface removal changed the correct door — the fixes above reconcile the branch with the post-merge tree.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Backend compile | `npm run build` (upstream backend, `nest build`) | **exit 0** |
| Build-purity suite (emulator fail-closed + no-activation-path + real-build dist scan + negative) | `node --test backend/tests/contracts/authority/build-purity.test.mjs` | **3/3 pass** |
| SCOPE-06 fixtures (post-fix) | `node --test frontend/tests/contracts/scope-06/scope-06.test.mjs` | **6/6 pass** |
| stage-presentation (post-fix) | `node --test frontend/tests/stage-presentation.test.mjs` | **11/11 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` (after coupled-artifact regen) | **exit 0 — 114/114 + contracts 35/35 + script tests + 672 frontend battery + surface/contracts hash-only** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

Pricing renders the full released catalog (Start ₹0 / Personal ₹249 yearly ₹2990 / Family ₹415 yearly ₹4990, billing toggle, feature matrix) with the sign-in guard on the subscription surface carrying the full `returnTo` deep link and truthful payment copy — the production bundle being served is exactly the class this task guards: no fictional personas, no fixture activation, no demo surface. Credential + Razorpay checkout founder-gated as always.

## Notes for the reviewer

- This branch is now the ONLY carrier of the workspaceService fixture-surface law; dev's post-KAN-122 tree would fail the no-activation-path walk and dist scan (ungated or gated-by-env forms both break). Merge this branch's `scripts/build-purity.mjs` + the reconciled `workspaceService.ts`/`appClient.js`/`App.jsx` when integrating.
- The dist-scan marker set deliberately includes `demoStages` — the intentional un-gating is offset by the elimination proof.
