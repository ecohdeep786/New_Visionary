# FAP-9 (A4) — PageMeta preload invalid-href warnings + React `fetchPriority` warning — closeout evidence

Receipt date: 2026-10-31 · Lane: `opencode/fap-a4-preload-warnings` · Base: `beta@1d408e73` (verified origin tip; the receipt-refresh merge of the 2026-10-30 late gate re-run sweep)
Implementer: opencode (FAP lane) · **D-095**: the ticket is Done per the founder's reconciliation receipt (FAP-9 comment **10395**, 2026-10-30); no status was changed in this lane. This receipt completes the remaining **code fact** that closure comment described, for the D-095 reviewer to see in the next round.

## What the ticket named (audit 2026-10-20)

1. **Preload invalid-href warnings** — per-route LCP preload hints emitted from `lib/PageMeta.jsx`.
2. **React `fetchPriority` dev warning** — the camelCase `fetchPriority` prop on `<img>` under React 18.2 (`react: ^18.2.0`), which logs `React does not recognize the fetchPriority prop on a DOM element…` on every render of any prioritized image.

## Delivered state

| Part | Receipt |
| --- | --- |
| Preload hint handling (invalid-href guard, `data-page-lcp` lifecycle, `src/SrcSet/Sizes/Imagesrcset/Type` passthrough through `<link>`, imperative lowercase `setAttribute("fetchpriority", "high")`) | already delivered in `frontend/src/lib/PageMeta.jsx` (`upsertPreload`, ~L40–70; setAttribute @ L66) — present on beta; cited by closure comment 10395 |
| React 18.2 camelCase img-prop warning | **this lane**: `LazyImage.jsx` reworked — the caller-facing prop stays `fetchPriority` (API unchanged; call sites `NewPersona.jsx:380,440` untouched) but the img receives the standard lowercase custom attribute via `{...priorityAttrs}` (custom-attr passthrough, no dev warning). No dependency bump; the code comment records the >=18.3 camelCase upgrade path if that bump is ever taken. |

Diff: 3 hunks in `frontend/src/components/landing/LazyImage.jsx` — (1) prop doc reworked; (2) `priorityAttrs` const; (3) camelCase img prop removed, spread added.

## DOM readback (rendered landing page, dev server 127.0.0.1:4197, 2026-10-31)

- `img[fetchpriority]` on the hero cast: **5 of 5 eager images** carry `fetchpriority="high"` from the initial DOM — `professional-800w.avif`, `teacher-800w.avif`, `student-800w.avif`, `parent-800w.avif`, `organization-800w.avif` (NewPersona's 5 priority call sites).
- `loading="eager"` preserved on all 5. Placeholder `role=img` (FAP-31 fix) still applies on the placeholder branch.
- **0 images** on the page carry any mixed-case (camelCase) DOM attribute — no React passthrough leaks.

## Full check battery at candidate `6395f1ae` (on `beta@1d408e73`)

`npm run check` exit 0, 2026-10-31:

- verify-layout **PASS**; verify-imports **3842 files match baseline + 3 recorded patches** (10 changed files)
- qa:continuity **all recorded public-surface laws pass** (77 files); qa:motion **holds** (438 files); qa:taps **holds** (245 controls / 125 files / 3 law exceptions)
- script tests **54/54 PASS**
- scope:audit green after `scope:audit:write` rebaseline: 68 routes / 37 endpoints / **1656 control declarations / 237 control files**; the only audit move is the LazyImage operation offset `72:5 → 81:5` (×5 site occurrences) caused by the +9-line comment block; `PRODUCT_SURFACE_AUDIT.md` regenerated content-identical (EOL-only churn reverted, file byte-stable)
- eslint **0**; typecheck **×2 (jsconfig + tsconfig.domain) 0**
- node tests **656/656 PASS** (69.5s)
- vite build **✓ 40.19s**

## Git receipts

- Branch `opencode/fap-a4-preload-warnings` (D-098 own branch, own worktree) — candidate commit **`6395f1ae`** rebased on `beta@1d408e73`, pushed to origin + `ls-remote` verified **before** beta merge; delivery-record commit (this doc + audit rebaseline) follows on the same branch.
- Beta merge: lane merged into `beta` `--no-ff`, pushed + `ls-remote` verified (merge SHA recorded in the commit subject). CI: `.github/workflows/production.yml` product checks run on every beta push (deploy remains `refs/heads/main`-gated).

## Reviewer note

FAP-9 was closed at the reconciliation round (10395: "fetchPriority handled by LazyImage/NewPersona"). The beta tree at that time still carried the camelCase img prop, so the dev warning the ticket named still existed in code. This lane lands exactly the missing piece; **no Jira status was touched** (Done is the reviewer's decision, and 10395's closure intent is unchanged). Any finding → the normal return path.
