# KAN-110 / PRIV-01 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-110-privacy-core` — **superseded-variant reconciliation**; Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Finding

PRIV-01 (approve purpose/minimization/retention by data class + age/admission) is **already integrated in dev** via the earlier `codex/principal-kan-110-policy-rework` merge (PR #38): dev carries a complete, human-approved privacy baseline —

- `backend/upstream/backend/src/privacycore/privacy-policy.service.ts` — approved-reference service reading the pinned manifest, digest-pinned (`BASELINE_POLICY_DIGEST`), attributed to the Founder & CEO (`Md Shahid Ali`), enrichment boundary explicit (`policyReference: true, cloudErasure: false, guardianVerification: false, automaticTraining: false`).
- `privacy-preservation-policy.v1.json` — the approved, versioned policy (`priv-preservation-2026-11-02.v1`), per-class purpose/permittedFields/access/retention for all five data classes, admission `minimumSelfServeAge: 18`, `under18Activation: 'blocked'`.
- `privacy-policy.controller.ts` — `GET /api/account/privacy/policy` (auth-verified).
- `firestore-privacy-store.ts` + `privacy-core-service.ts` — owning store/service composition.
- Tests: `backend/tests/privacycore.test.cjs` (52 checks incl. negative authorization, digest tamper, real HTTP boundary) + `teaching-policy.test.cjs`.

The `principal-kan-110-privacy-core` branch carries a **different, less-evolved variant** of the same ticket (a bare `shippedPrivacyPolicy()` + in-memory lookups, no human-approval manifest, no controller, no owning store). Merging it would conflict with and risk regressing dev's approved baseline.

## Resolution (on the branch, record only — dev unchanged)

- Merged `origin/dev` into the branch; resolved the add/add `privacycore` conflicts **to dev's version** (approved baseline wins).
- package.json resolved to the union (branch's 30 family-check scripts ∪ dev's scripts; the only diff was a trailing comma).
- Removed the superseded variant's branch-only artifacts so the merged tree only carries dev's baseline: `privacy-core-lookups.ts`, `index.ts`, and the branch's own `privacy-core.test.mjs` (it targeted the removed variant; dev's `privacycore.test.cjs` covers the ticket).
- **Harness asset law (no product change):** `nest build` omits the JSON manifest from `dist/` — the privacycore suite needs `privacy-preservation-policy.v1.json` copied into `dist/src/privacycore/` before running (KAN-108 precedent: deployed `tsconfig.product.json` emits it; the harness copy is not a product defect). `dist/` is git-ignored.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Privacycore suite (pinned Firestore emulator) | `node scripts/provision-check.mjs --suite privacycore` | **52/52 pass** (policy invariance, digest tamper, admission, HTTP boundary) |
| Data contracts + backend compile | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live journey

The privacy baseline's user surface — `GET /api/account/privacy/policy` and the account privacy screen — is auth-gated (founder-gated credentials); the reference policy's integrity is pinned by the 52-check suite over the real emulator + real HTTP composition. The live public marketing privacy statement is unchanged by this branch (no product source change net).

## Recommended disposition for the reviewer

Close **KAN-110 / PRIV-01** against **dev's integrated privacycore** (already approved + tested); do **not** merge this branch's variant. This branch after reconciliation is dev's tree plus this record — safe to discard or keep as reference.
