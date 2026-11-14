# F-30 — Codex review and controlled integration (2026-11-07)

Jira key / source ID: F-30 (Visionary Frontend Agent task — codex review and controlled
integration)
Acceptance scope: enabler (quality lead closure review) + one harness race fix (F-30-F1) + one
runner default correction (F-30-F2); no product change
Implementer: ZCode agent (Quality Lead; lane completed by principal engineer)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f30-codex-integration` / beta `6722b1f9` (F-29 landing)
Owned files: `frontend/scripts/auth-ui-review.mjs` (race fix), `frontend/scripts/release-regression.mjs`
(evidence-dir default), evidence directory, this receipt.

## Objective and method

Review all evidence, inspect worktrees, resolve dependencies, run final checks — the closure review
of the F-16..F-29 validation program before the controlled beta → dev → main promotion. Method:

1. **Evidence review** — all fourteen lane receipts (F-16..F-29, `docs/architecture/reviews/`)
   verified present with their claimed evidence directories populated under
   `docs/visionary/baseline/` (14/14; F-17's evidence lives at `f17-shell-2026-11-06/`).
2. **Worktree and branch inspection** — no leftover F-series worktrees exist (`New_Visionary-worktrees/`
   holds only this lane's checkout); all fourteen `zcode/fNN-*` branches are pushed to origin and
   every branch tip is an ancestor of beta (nothing unmerged, nothing lost):
   f16 35398be, f17 6109287, f18 9499047, f19 8a7ab2a, f20 d95ebcc, f21 451b120, f22 d33064f,
   f23 1ca831b, f24 9f3cbeb, f25 b8244ec, f26 b59c8a8, f27 d52fcae, f28 700a630, f29 6722b1f.
3. **Topology** — beta = origin/beta `6722b1f9`; local dev is strictly behind origin/dev
   (`dc4f18be`, 64 commits — the backend/principal lanes' reviewed work lands on dev remotely);
   main (`18043dd1`) is strictly behind beta by 30 commits (clean promotion; the recorded pattern
   is an explicit `--no-ff` "Release promotion: merge beta into main — <scope>" merge, last done
   at `c147bb5f` 2026-11-05).
4. **Final checks** — the full 13-harness release-regression suite plus the complete battery in
   this worktree (below).

## A. Verified-correct (protect)

| Review point | Verdict |
| --- | --- |
| F-16..F-29 receipts + evidence | 14/14 present and populated; every receipt carries its findings, verification commands and review handoff |
| Branch hygiene | 14/14 F branches pushed and beta-ancestors; no orphan worktrees; no unmerged work |
| Regression posture | 13/13 harnesses PASS in this worktree (~250 live records / 175+ checks / 0 product defects) |
| Battery | all 10 stages exit 0 (653/653 tests, lint, typecheck, deterministic build, qa:perf 153 chunks with no re-record churn, taps 243/126, motion 439, continuity, check) |
| Deterministic build | 153-chunk budget holds across all F-28+ builds (F-28-F1 generalization effective) |
| CWV (production build) | FCP ~2.5 s, LCP ~3.0–3.6 s under the mobile throttle profile — consistent with the F-27 post-fix state |

## B. Findings

**F-30-F1 (P3 fixed, harness race):** the suite's first run in this worktree failed `auth-ui` on
`role-selection-coverage` (all five roles read as absent) while the captured screenshot showed the
role board fully rendered — the F-16 harness read `document.body.innerText` immediately after
`registerAccount`, before React painted the board (the newer harnesses wait for
"Make Visionary your own"; this one predated that pattern and had only raced through F-29's run by
timing luck). Fixed by adding the wait before the check; the suite then passed 13/13. A test race,
not a product defect — the screenshot is the proof the product renders all five roles.

**F-30-F2 (P3 fixed, runner default):** the regression runner's default evidence directory was
hardcoded to the F-29 label (`f29-release-regression-2026-11-07`), which mislabeled this lane's
first run and briefly overwrote the committed F-29 evidence copies in this worktree (restored to
HEAD before commit; the committed baseline on beta was never touched). The default is now
date-derived (`release-regression-<YYYY-MM-DD>`), and lanes pass `REG_EVIDENCE_DIR` explicitly.

**F-30-F3 (INFO, review posture):** every F-16..F-29 lane receipt records "Reviewer: pending per
D-095" — the program's evidence is complete and machine-verified end to end, but independent
human review remains the open gate for the whole series. Recorded as the standing handoff; this
receipt does not self-approve anything.

**F-30-F4 (INFO, integration plan):** the controlled promotion follows the recorded patterns:
beta → dev is the integration merge (dev additionally carries the backend/principal lanes' 64
reviewed commits from origin/dev), and main receives the recorded "Release promotion: merge beta
into main — <scope>" `--no-ff` merge. Local dev is first fast-forwarded to origin/dev so no
remote work is lost.

**No product defects. No product change.**

## C. Verification results (this run)

| Check | Result |
| --- | --- |
| `node scripts/release-regression.mjs` (into `f30-codex-integration-2026-11-07/`) | **13/13 harnesses PASS** (auth-ui 19 records after the race fix, student 16, teacher 21, parent 16, professional 12, organization 39, cross-role 37, ml 27/27, payments 29/29, cwv production FCP ~2.5 s / LCP ~3.0–3.6 s, a11y 24/24, contract audit 30/28/2/0, RELEASE GATE PASS 5/5) |
| Full battery | **PASS — all 10 stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0; qa:perf PASS (153 chunks); qa:taps PASS (243/126, 3 exceptions); qa:motion PASS (439); qa:continuity PASS; `npm run check` exit 0 |
| Evidence review | 14/14 receipts + evidence dirs verified |
| Branch inspection | 14/14 F branches pushed + beta-ancestors; no leftover worktrees |

## D. Backend / ML dependencies

None new. The dev branch carries the backend/principal lanes' reviewed work (64 commits ahead of
the old local dev) — that work's own promotion flow is owned by those lanes; this lane's integration
merges beta into dev without altering it.

## E. Remaining issues and risks

- **F-27/F-28-F3 (P2, open)**: landing carousel pager target-size — the one known red in the
  broader tooling; needs a UI-scoped `ProgressDots` fix lane. Does not affect the gate or any
  journey harness.
- D-095 independent review remains pending for the whole F-16..F-30 series (each receipt carries
  the handoff; nothing self-approved).
- Hosted-acceptance dependencies (firebase-mode billing/auth, connected ML adapters) remain
  recorded in CONTRACT_GAPS; unchanged by this program.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f30-codex-integration` on `zcode/f30-codex-integration` = beta
`6722b1f9` + `frontend/scripts/auth-ui-review.mjs` (wait-for-role-board fix) +
`frontend/scripts/release-regression.mjs` (date-derived evidence default) + evidence + this
receipt. No product source change. Junction-based node_modules runtime arrangement (nothing
committed). Worktree removed after the beta landing per the operator's standing instruction;
branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-30
Acceptance scope: enabler (codex review and controlled integration) + two tooling corrections
Implementer: ZCode agent (Quality Lead; lane completed by principal engineer)
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f30-codex-integration / 6722b1f9 / <receipt commit>
Owned files: frontend/scripts/auth-ui-review.mjs (race fix); frontend/scripts/release-regression.mjs (evidence default); docs/visionary/baseline/f30-codex-integration-2026-11-07/ (13 harness dirs + regression-receipt.json); this receipt
Verification: 13/13 harnesses PASS; battery all 10 stages exit 0 (653/653); evidence review 14/14; branch inspection 14/14 pushed + beta-ancestors
Findings: F-30-F1 P3 fixed auth-ui role-board race (screenshot proves product correct); F-30-F2 P3 fixed runner evidence-dir default (F-29 evidence restored to HEAD in-worktree; committed baseline untouched); F-30-F3 INFO D-095 review pending program-wide; F-30-F4 INFO promotion plan recorded
Reviewer decision: pending
Dev integration commit: pending
```
