# Deeper usability evidence — 2026-10-10

See [D-052 handoff](../../DEEPER_USABILITY_REVIEW_2026_10_10.md). All reviewed records belong to the fictional local Anika · Parent of two scenario on port 5176. Source and compiled observations are distinguished by their actual script URLs.

| Artifact | Coverage |
| --- | --- |
| `observations.json` | Eleven loaded source observations and five compiled observations. Each records the route, headings, rendered text, actual viewport/document width, script URLs and new disclosure state/target height. |
| `parent-report-desktop.png` | Source report entry at 1280×720. Top of the page; not proof of lower panels. |
| `parent-detail-phone.png` | Source phone report, 390×844; classwork expanded. |
| `career-desktop.png` | Source career entry, 1280×720. |
| `organization-insights-phone.png` | Source organization analytics, 390×844; authentic empty counts and small-group suppression. |
| `learner-progress-desktop.png` | Compiled learner progress, 1280×720; short visible policy and collapsed full explanation. |
| `parent-report-compiled-desktop.png` | Compiled report after actual main PageDown, 1280×720; metrics, period note and progress section. |
| `parent-disclosures-compiled-desktop.png` | Compiled report after keyboard project open/close, 1280×720. |
| `parent-classwork-compiled-phone.png` | Compiled Maya 30-day report, 390×844; expanded classwork, visible keyboard focus and private-feedback exclusion. |
| `career-compiled-desktop.png` | Compiled career entry, 1280×720; closed personal boundary and direction form. |
| `browser-errors.json` | Final captured error log is empty. |

Source coverage: parent selected child/period, project Enter/Space, classwork Enter, requested 320/measured 321 reflow; career closed/open; teacher and organization insights at desktop/phone; learner 30-day filters/full policy. All sixteen records have document width equal to actual viewport width. No populated learning evidence, returned classwork, shared project/goal or organization cohort was created for this pass.

Compiled coverage uses `/assets/index-DeuXM6i3.js`: learner progress reload and Enter disclosure (solid focus outline), Maya +30 days, project Enter/Space, phone classwork Enter, career closed/Enter open. The five retained compiled observations include actual collapsed/open states. Disclosure targets measured approximately 88–130px; the desktop report targets measured 90px. Fractions reflect browser geometry.

Reproduce through the dev scenario picker on an isolated origin: choose Anika · Parent of two, switch Personal Parent → Reports → Maya → Last 30 days, then use Enter/Space on details. Switch Personal Learner → Progress to review period/source controls. Switch Personal Professional → Career for boundary/form. Teacher → Insights and Owner My organization → Insights show current empty source totals. Use actual main scrolling; screenshots do not capture the whole internally scrollable page.

Final checks: 52 focused tests, build (2m53s), full lint and both type configurations pass. Build/check logs remain in `scripts-tmp/`. D-051's historical 483-test result is not counted as a new run. Wider populated/failure/language/device/accessibility acceptance is open.

Environment: the worktree lacked dependencies. Interrupted incomplete installations were held outside the app at `C:/Users/Administrator/.codex/worktrees/0b07/dependency-install-incomplete`; dependencies were reused through a directory junction to the existing original checkout. Development used a separate Vite cache, followed by final compiled preview on the same isolated port. Temporary servers were stopped. No new browser tab successfully attached; the user tab was temporarily reused and then restored to port 5173 learner Home with its default viewport. Original records were not edited.
