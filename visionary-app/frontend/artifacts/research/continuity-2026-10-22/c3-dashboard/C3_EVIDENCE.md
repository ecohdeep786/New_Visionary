# C3 — Dashboard v-token completion (FAP-51) — evidence

Date: 2026-10-22 · Task: FAP-51 (KAN-201 chain, C3) · Branch: `gl-kan-201-c3-dashboard` · Base: verified `origin/beta` tip `0a01fb58` (post-C2 + founder AGIIntro review copy)

## What shipped (D-104 decision recorded in DECISIONS)

1. **Token retire, seven surfaces + shared sheets:** every raw `#4285F4` → `var(--v-action)` and `#dadce0` → `var(--v-border)` in Ask, Build, StudentClasses, Subscription, Settings, RoleWorkspace, Guide (page files) plus `workspace.css`/`workspace-design.css`, including lower-case variants and gradient stops. Result: case-insensitive grep of the two values across all nine files = **0**.
2. **Decision:** dashboard action blue = `#0071e3` (light) with hover `#0077ed` — the FAP-42 commerce family, the non-Material candidate of the two offered. `--v-on-action` stays `#fff`; links keep the C1 `#0066cc`; dark keeps its on-dark `#aac7ff`. The old action blue (`#0b57d2`) is retired from the token system and from the chrome that paints the seven surfaces (its remaining computed appearances are the documented user-preference accent, below).
3. **Token fork retired:** `workspace.css` no longer redefines `--v-border`/`--v-action`/`--v-action-hover`; the canonical values load from `workspace-design.css` only. `--v-brand` aliases `var(--v-action)` so its remaining consumers resolve through the one decision.
4. **Subscription.jsx to v-cards:** plan, usage and current-plan containers now ride the `v-card` panel law (canonical border/radius/padding); accent chips ride `--v-soft`; the "Back to workspace" pill rides `v-button`.
5. **Chrome hidden leaks caught by probes:** rgb(11,87,210)=#0b57d2 was still computed on the topbar audio/connect chrome (`workspace.css` ×6, `workspace-design.css` ×5, `DashboardTopbar.jsx` ×4, plus the topbar's two ticket values and one in `DashboardLayout.jsx`). All retired to tokens in this pass (probe-driven, script `c3-chrome-tokens.mjs`).

## Probes (`c3-probes.mjs`, production preview :4197, 21 samples PASS)

Seven live routes — `/dashboard/home` (ask surface), `/dashboard/build`, `/dashboard/classes`, `/dashboard/subscription`, `/dashboard/settings`, `/dashboard/people` (RoleWorkspace), `/dashboard/support` (guide presence) — × light/1440, light/390, dark/768:

- **Banned computed colors = 0 everywhere** for `#4285F4` rgb(74,133,244) and `#dadce0` rgb(218,220,224) (color, background, borders, outlines).
- `v-card` samples resolve the law: light border rgb(226,229,235), dark rgb(60,67,80).
- Stale accent rgb(11,87,210): only the **account-accent preference** surfaces (settings swatch span, classes "Join with a code" button — `accent = useThemeColor().accent`, user-selectable palette per D-104); zero on home/build/subscription/people/support. Light+dark behave identically there.
- Zero page errors in all samples. Captures: `c3-<surface>-<1440|390>.png` + `c3-<surface>-dark-768.png` (21) committed beside this file.

## Gates (final code)

- lint 0; typecheck (jsconfig + tsconfig.domain) 0.
- npm test **609/609** exit 0 (`c3-tests-tap.txt`).
- Production build 0 (24.1s). qa:fonts **PASS** on :4197 (Google Sans product law, public tokens stay independent, 390/1440).
- **qa:design PASS** (empty/populated evidence, real local sample check/practice→project, eight theme/viewport samples, 200% text) — runs against :5192 dev per its service contract.
- **qa:navigation PASS** (47 role/theme/width + large-text samples; selection, groups, search, focus; no page errors) — also :5192.
- scope:audit:write regenerated: **controlDeclarations 1654 unchanged** (C3 adds/removes no controls; only declaration hashes refreshed); product-surface.json + PRODUCT_SURFACE_AUDIT.md committed.

## Surface archaeology (recorded)

- Route mapping: `/dashboard/ask`→DashboardHome, `/dashboard/build`→ArtifactStudio, `/dashboard/subscription`→Plans; the SEVEN-FILES-NAMED by the ticket (Ask.jsx, Build.jsx, Subscription.jsx, Guide.jsx plus StudentClasses/Settings/RoleWorkspace live) — **Ask/Build/Subscription/Guide page files have no live import path** (scope audit: `not-route-reachable`; importer sweep zero). Their token/v-card changes make them correct for revival; the LIVE equivalents were already token-clean (verified 0 raw hits in DashboardHome/ArtifactStudio/Plans) except the shared chrome, which this pass cleaned.
- Guide presence (GuideMark, guideIdentity.js, AudioPresence, MentorGreeting, GuideActivity, GuideEntry, RoleMentorPanel): verified 0 hits — no changes needed.
- **Census for the founder (out of scope, recorded):** the two ticket values survive in ~80 further files across home/learn/teacher/practice/onboarding/landing families (worst: role homes, teacher tabs, learn components, dashboard cards). C3's letter covered the seven named files + the two shared sheets + the chrome the probes exposed; a value-wide extension needs direction (extend C3, or distribute across the D-cycle tasks). `GoogleIcon`'s Google-logo blue is brand artwork, not a leak.
- Theme palette (`hooks/useThemeColor.jsx`): user-selectable accents (blue `#0b57d2`, green, amber, red, purple, teal) = preference content; D-104 defers any palette change to a later cycle.
- Probe tooling in this folder: `c3-token-sweep.mjs` (7 pages), `c3-css-tokens.mjs` (sheets + decision), `c3-css-case.mjs` (case variants + conjugate states), `c3-chrome-tokens.mjs` (chrome), `c3-probes.mjs` + `c3-probe-after.json` (results), `append-d104.mjs`, `C3_TESTS` tap. A first PowerShell `-replace` sweep **was reverted wholesale**: PS 5.1 read BOM-less UTF-8 as ANSI and corrupted non-ASCII content (mojibake + BOMs); the redone node sweep is byte-safe — recorded as a PowerShell lesson alongside the existing ones.

## Delivery amendment (founder instruction, 2026-10-22)

Task branches merge to **`beta` first, then `dev`**, pushed and remote-verified in that order; receipts record both refs.
