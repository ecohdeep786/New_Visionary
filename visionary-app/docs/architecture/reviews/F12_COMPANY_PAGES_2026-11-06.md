# F-12 — Company and information pages (2026-11-06)

Jira key / source ID: F-12 (Visionary Frontend Agent task — company and information pages)
Acceptance scope: enabler (product + content review; findings only — no product changes required)
Implementer: ZCode agent (Product + Content Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f12-company-pages` / beta `fe421d20` (F-11 landing)
Owned files: `frontend/scripts/company-review.mjs` (new reusable harness), evidence directory,
this receipt. No product source file changed.

## Objective and method

Review About, Careers, Research, Community, Contact, Partners, Updates and the informational set
(`/privacy`, `/terms`, `/safety`, `/security`, `/accessibility`, `/cookies`, `/referral`,
`/download`). Two evidence streams against beta `fe421d20`:

1. **Live review harness** — new `frontend/scripts/company-review.mjs`: 15 pages × 2 sizes
   (desktop 1440 full-page with a slow reveal walk, mobile 390), verifying per page: h1, section
   inventory, image loading, internal doors (including authenticated `/dashboard/*` doors from the
   trust pages — all verified real: `privacy`, `personalization`, `settings`, `subscription`), and
   extracting the heading/button structure for the content review. Evidence + receipt:
   `docs/visionary/baseline/f12-company-2026-11-06/` (30 records).
2. **Content review** — each page's copy checked against the product's honest-boundary law (no
   invented capabilities, endpoints or claims), plus pixel inspection of captures.

## A. Verified-correct (protect)

| Area | Verified evidence |
| --- | --- |
| Honesty: careers | "Areas of work, honestly framed (not vacancies)"; the jobs hub is "honestly empty"; the introduce-yourself form submits via **mailto** (no invented backend) — `CareersPage.jsx:53,198,398` |
| Honesty: download | Web = "Live today · No install" → `/register`; Windows/Mac/Linux/iOS/Android **all "coming soon" with `UNRELEASED_REASON`** — no invented downloads; launch requests via mailto — `DownloadPage.jsx:79-84` |
| Honesty: research | Lists real shipped product updates (September 2026: mentor engine, two faces of one intelligence, teacher-moderated community — all match shipped history) and states explicitly: "**Visionary has not published formal research papers yet.**" with the future evidence standard (method, contributors, evidence, limitations) — `ResearchNewsPage.jsx:427` |
| Honesty: updates | The subscribe form is an honest mailto draft flow: "Your email app opened a draft… This page has not subscribed you automatically" — `UpdatesPage.jsx:290` |
| Honesty: trust pages | Privacy ("The essentials, at a glance" → what/why), Cookies ("**No advertising cookies.** Analytics with consent" — matches the product where analytics is disabled), Security (describes the real server-session architecture), Safety ("Consent-scoped progress summaries" — the real consent law), Accessibility (documents genuinely verified features: zoom/text scaling, reduced motion, voice) — each links signed-in users to their real dashboard controls |
| Contact | "We listen. We build." help-first structure with mailto contact links; no fake ticketing backend |
| Rendering | 30 records: every page renders its h1 and sections, **0 broken images**, all doors resolve at both sizes, 0 page errors |
| Pixel review | About desktop full-page capture reviewed: approved design throughout (hero fan, mission quote with the Guide bot, journey cards, AI-problems band, persona grid, closing CTA, full footer) |

## B. Findings

**F-12-F1 (INFO, content model):** the company/information pages are honest-by-construction —
every unreleased thing says "coming soon" with a reason, every form is mailto-backed (no invented
endpoints), and the research page disclaims unpublished work explicitly. No corrections needed.

**F-12-F2 (INFO, capture methodology):** the same fullPage-vs-reveal artifact as F-11-F1 applies;
the harness uses a slow walk (220 ms/step) so captures show revealed states.

**No new product defects.** No changes were needed or made.

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| `node scripts/company-review.mjs` | **PASS** — 30 records (15 pages × 2 sizes): headings render, 0 broken images, all doors resolve, 0 page errors |
| Content review | Honesty law verified on careers/contact/download/research/updates/trust pages (evidence column above) |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (19.00 s); qa:taps (243 controls/126 files) / qa:motion (439 files) / qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |

## D. Backend / ML dependencies

None.

## E. Remaining issues and risks

- The trust pages' authenticated doors (`/dashboard/privacy`, `/dashboard/personalization`,
  `/dashboard/settings`) land signed-in users correctly; anonymous visitors hit the auth gate —
  standard pattern, noted for completeness.
- The already-recorded precision lanes (F-01-N1 naming, F-05-F4 page-local COLORS) apply here too
  and remain owned by their receipts.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f12-company-pages` on `zcode/f12-company-pages` = beta `fe421d20` +
review harness + evidence + this receipt. Junction-based node_modules runtime arrangement (nothing
committed). Worktree removed after the beta landing per the operator's standing instruction;
branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-12
Acceptance scope: enabler (company & information pages review)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f12-company-pages / fe421d20 / <receipt commit>
Owned files: frontend/scripts/company-review.mjs; docs/visionary/baseline/f12-company-2026-11-06/ (30 PNG + receipt.json); this receipt
Verification: 30 records PASS (15 pages × 2 sizes) + content-honesty review verified (careers/download/research/updates/trust); battery all-exit-0; product on 4198 throughout
Findings: F-12-F1 (INFO honest-by-construction content model); F-12-F2 (INFO capture methodology); no product changes
Reviewer decision: pending
Dev integration commit: pending
```
