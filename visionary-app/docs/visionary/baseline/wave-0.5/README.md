# Current-build baseline evidence

Captured 2026-09-19 from the local Vite preview at `http://127.0.0.1:5174`, using fictional existing demo accounts. Viewport override: 1440×900. These are before-state screenshots, not final designs or responsive/a11y test passes. Existing browser-local activity was preserved, not reset to create a prettier baseline.

| File | Account/context | Observed state |
|---|---|---|
| [student-home-1440.png](student-home-1440.png) | Aarav, personal learner workspace | Existing fractions activity beside Guide; saved composer text refers to cube volume. Context mismatch is baseline evidence to investigate, not corrected here |
| [teacher-home-1440.png](teacher-home-1440.png) | Dev, personal teacher workspace | Guide greeting, preparation/review/evidence suggestions and composer |
| [parent-home-1440.png](parent-home-1440.png) | Anika, parent workspace | Guide greeting and support/connection suggestions; no decision-led child summary on Home |
| [professional-home-1440.png](professional-home-1440.png) | Sam, professional workspace | Data-interpretation journey, career/portfolio suggestions and composer |

Organization Home was navigated to but its screenshot was **not captured**: the browser approval reviewer stopped the next action due to an account usage-limit/review failure. No alternate browser or screenshot mechanism was used to bypass that failure. Four saved files, not five completed captures.

Outstanding: organization capture, remaining screen/state baselines before enhancement, seven-width coverage, long Hindi/Bengali labels, zoom and accessibility, and public regression evidence. No after screenshots are appropriate yet because PM did not change the UI. The temporary browser viewport reset was also not completed before the approval interruption; reset it when approved browser work resumes.

## 2026-09-20 continuation

Browser testing resumed normally. Added `organization-home-1440.png` and `ask-organization-1440.png` at 1440×900 before Home/Ask source changes. Both show the existing Guide-first organization surface. Earlier interruption is historical, not a current blocker. Broader responsive/accessibility and after-state evidence remain separate QA work.
