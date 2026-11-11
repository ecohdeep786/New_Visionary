# FAP C4 — Forms delivery honesty (partners, updates, downloads)

**Jira / source ID:** FAP-52 (FAP-C4) · moved Idea → To Do → In Progress on claim (transitions 21/31, history 12430/12431 @ 2026-10-29T12:34:35+0530, start comment 10343)
**Acceptance scope:** partners enquiry + updates signup either ship real delivery or render as an intentional plan-released-later state per PRODUCT_SURFACE_AUDIT semantics; download "coming soon" controls become disabled-with-reason or removed. AC: surface audit flags flip to `connected` or `intentionally-unreleased` with receipts; no lying affordances.
**Implementer:** opencode (FAP lane)
**Reviewer:** **PENDING** — a separate agent/founder must accept responsibility and record the exact reviewed commit per D-095. The implementer cannot approve its own work.
**Lane:** worktree `New_Visionary-worktrees/opencode-fap-c4-forms`, branch `opencode/fap-c4-forms`, base `beta@6883a844` (= verified `origin/beta` tip; checked clean/matching before branch). Per founder delivery amendment: lane merges to `beta` first, then `dev`; both pushed and remote-verified before receipt.

## What changed (evidence side)

1. **Review registry receipts (the AC's audit-flag flip).**
   `integration/contracts/product-surface-review.json`:
   - `public-enquiry-careers-partners` `missing → intentionally-unreleased` (execution unchanged `client-or-mail-link`). Reason records: server-backed public enquiry delivery is deliberately not part of the current release; the published channel is a manual mail draft the visitor opens and sends themselves; pages must present the draft openly and must not treat device drafts/mail-client links as server-delivered applications; PRIV-07 and the paired backend intake task still gate real delivery.
   - `public-updates-distribution` `missing → intentionally-unreleased` (execution unchanged `client`). Reason records: no registered mailing/community/research publication service certifying distribution or membership is part of the current release; the published signup channel prepares a manual mail draft, so updates membership is intentionally not offered from the page; PRIV-07 + CONTENT-05 still gate real distribution.
   - `download-installation` stays `intentionally-unreleased` (unchanged row; the page now matches it better, below).
   - Follow-ups unchanged — the flip records design intent, not acceptance of the capability; gates stay open.
2. **Regenerated audit receipts.** `npm run scope:audit:write` refreshed `docs/architecture/PRODUCT_SURFACE_AUDIT.md` + `docs/architecture/tracking/product-surface.json`; `npm run scope:audit` (read-only) passes and both match. Rows 37–39 of the audit doc now carry the flipped states with the reasons above.
3. **DownloadPage — genuinely disabled controls with visible reasons (no lying affordances).**
   `frontend/src/pages/landing/DownloadPage.jsx`:
   - The five native/store "coming soon" buttons were `aria-disabled="true"` without a real `disabled` attribute — still focusable/clickable, still running hover-scale motion, action semantics contradicting the label. They now render real `disabled` buttons (`cursor-not-allowed`, hover/active/transition classes removed because there is nothing to hover into) plus a visible reason line `Coming soon — not available yet` under each control, per card.
   - Honest copy repairs in the same file (unavailable-claim cleanup, not redesign): "Get the app" card no longer promises "faster, offline-friendly" apps that do not exist; the notify section no longer claims native apps are "in final testing" (now "still being prepared"; web is live today); the sync band no longer claims sync "across web, desktop, and mobile" (now account-based sync, "web today, with apps as they launch"); the trust band states signed builds + automatic updates are *planned* per platform while the web is live today.
   - The web card (real `/register` navigation) is untouched; pill geometry, classes and reveal handlers are unchanged so D1 motion law / E1 continuity counts stay valid.
4. **Partners enquiry + updates signup honesty.** Both pages already publish the honest draft flow and state it in copy ("Nothing is submitted from this page"); C4 records that state in the audit receipts (item 1) and changes nothing misleading in their copy. Their server-backed delivery stays the paired backend task; the intentionally-unreleased rows are their honest state.

## Rebaseline carried in this lane (recorded finding)

Beta tip failed `npm run scope:audit` before this lane started: D3's monolith split (FAP-55, beta merge e9d04f05) replaced `LandingNav.jsx` / `PersonaSections.jsx` / `PremiumPersonaSections.jsx` with 19 split control files but did not rebaseline the review registry (`Unreviewed control file: frontend/src/components/landing/LandingNav/index.jsx`; also 2 more obsolete rows). The C4 lane carried the minimal rebaseline so its AC receipts could regenerate: the 19 split files inherited the three monoliths' identical `client-presentation / connected / client` boundary rows (same reason, same `SCOPE-06`, `PLAT-01` follow-ups) and the 3 obsolete rows were removed. No state/boundary semantics changed in that step; it is registry guidance moving with the source split, visible to the reviewer as one diff block in this lane.

## Checks

- `npm run scope:audit:write` then `npm run scope:audit` — green, regenerated receipts match (237 control files, 1656 declarations, 68 routes, 37 endpoints).
- `npm run check` (root layout/import integrity + frontend lint + tests + typechecks + audit) and `npm test` — run on the lane candidate; results recorded in the Jira delivery comment and the beta delivery-record commit.

## Remaining gates (unchanged by this flip)

- Backend intake task for public enquiry/updates delivery (pairs with this task); PRIV-07, CONTENT-05, ACCEPT-05 still gate real distribution/delivery/native stores.
- Native app store/installer availability per platform remains an ACCEPT-05 parent gate (`download-installation`).
- D-095: separate reviewer records the exact reviewed commit; unresolved findings return the lane to In Progress.
