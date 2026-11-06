# FAP-59 public-surface convergence — phase 2 evidence

Senior Staff Frontend Product Engineer pass, 2026-10-31. Branch
`opencode/fap59-frontend-design`, worktree
`New_Visionary-worktrees/opencode-fap59-frontend-design`, based on `beta` @ `7bad81e1`.

## What phase 1 left open

The phase-1 receipt (`continuity-2026-10-31/fap59-design-convergence/EVIDENCE.md`)
recorded the CTA pill and hero rhythm converged in *source*, with imagery
generation reserved to the founder. Re-measuring the rendered product showed the
law had been restored at the **call sites that were edited**, but the law
**string itself was copy-pasted** into the rest-set pages, so the remaining
off-law call sites were still free to re-declare geometry.

## Measured findings (this pass, live dev server)

Raw baseline: `before/design-audit-results.json` (24 routes × 5 widths).

| Finding | Evidence | Disposition |
| --- | --- | --- |
| CTA law string duplicated in 6 files (`quietLink` ×6, `inkPill` ×6, `chipPill` ×2, `greyPill` ×2) | `grep -c "const inkPill"` across `src/pages/landing` | **fixed**: one definition in `system/tokens.js` (`CTA_LAW`), imported by every page |
| `/help` email pills off-law (`h-12 / px-8 / 16px / tracking-0.24px`) | `SchoolPage.jsx:286,303,306` | **fixed**: `mailPill` derived from the law (`inkPill` re-toned to support blue) |
| `/updates` submit off-law (`h-12 / px-8 / 16px`) | `UpdatesPage.jsx:349` | **fixed**: `inkPill` |
| `/community` CTA off-law (`h-12 / px-8`) | `CommunityPage.jsx:300` | **fixed**: `inkPill` |
| Sub-copy tier drift to 18px on `/research`, `/about` | `ResearchNewsPage.jsx:185`, `AboutUsPage.jsx:91` | **fixed**: 17px law tier |
| `/help` hero missing the shared `data-section="01-hero"` marker 11 other pages carry | `grep -L 'data-section="01-hero"'` | **fixed**: marker added |
| CTA "47px" on `/how-it-works` | `CoachingPage.jsx:240` | **not drift**: it is the phone-mock sign-in button inside `MockShell`, a device illustration, not a page control |
| 14px hero pill on `/pricing` | `AILearningPage.jsx` plan tabs | **not drift**: segmented plan selector, not the hero CTA |
| policy "12px padding" pills | policy in-page contents rows | **not drift**: contents rows, not CTAs |

## Result (measured after the change)

`verification/verification.json` — 24 routes × 5 widths (1440/1024/768/390/320):

- **law failures: 0**; **page errors: 0**; **document overflow: 0** on every route and width.
- Hero CTA anatomy on every page that renders one: **44px / 17px / px-21 / pill**.
- Sub-copy tier on the rest set: **17px**.

## Evidence index

```
artifacts/research/fap59-frontend-design/
├── before/design-audit-results.json   audit before the change (24 routes)
├── verification/
│   ├── verification.json               measured after: 0 failures
│   ├── <route>@1440.png                24 desktop captures
│   └── <route>@390.png                 24 phone captures
└── EVIDENCE.md                         this file
```

Reproduce:

```bash
# from frontend/ with the dev server running on 5173
AUDIT_URL=http://127.0.0.1:5173 AUDIT_OUT=artifacts/research/fap59-frontend-design/before \
  node scripts/fap59-public-design-audit.mjs
VERIFY_URL=http://127.0.0.1:5173 VERIFY_OUT=artifacts/research/fap59-frontend-design/verification \
  node scripts/fap59-browser-verify.mjs
```

## Open in this ticket

Imagery generation per the FAP-59 prompts remains a **founder action** (§ phase-1
receipt). The hero structures already accept the generated AVIF/WebP. This pass
is source + rendered evidence only: it does not certify hosted acceptance, and
the ticket stays In Progress until the imagery lands and a separate reviewer
approves the exact candidate commit.
