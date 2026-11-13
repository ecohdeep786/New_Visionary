# V6 independent review round — 2026-11-12/13 (epic FAP-69, Testing backlog)

Reviewer: D-098 independent review (assistant). Scope: every ticket the authors moved to **Testing** (FAP-70, FAP-80–FAP-90) plus the zcode-agent candidate **FAP-72**. Method: each verdict reproduced live by the reviewer on a dedicated review checkout — a fresh D-098 worktree from verified `origin/beta` `f8c3fd1d` serving **beta on 127.0.0.1:5175** (`C:\Users\Administrator\nv-worktrees\review-beta-serve`, branch `zcode/review-round-2026-11-12`), and the FAP-72 candidate served from its own dedicated worktree on **127.0.0.1:5176** (`C:\Users\Administrator\nv-worktrees\fap72-serve`, branch `zcode/fap-72-onboarding-language-truth` @ `224a5048`). Probes are msedge headless `--no-proxy-server` journeys written by the reviewer (not the author probes); every JSON/figure is `getComputedStyle` or DOM state captured in the page. Evidence root: `docs/visionary/baseline/review-round-2026-11-12/` (scripts + JSON + shots, committed with this receipt).

Process notes (disclosed):

- The primary checkout was switched to `zcode/fap-72-onboarding-language-truth` overnight by the zcode agent, which wiped the reviewer's then-uncommitted first-round evidence from that checkout; the round was rebuilt in the dedicated review worktree above. Later the primary checkout was switched back to `beta` by the same flow — the first FAP-72 A/B run therefore unknowingly compared beta against beta (5174 served beta). The A/B was re-run against the candidate served from its own worktree (5176); the verdict below is from that re-run.
- OTP journeys use the disclosed preview simulation (`000000`; the product's own law: no email is sent in preview).

## Verdicts on beta `f8c3fd1d` (server 5175)

| ticket | verdict | reviewer evidence (live, this round) |
| --- | --- | --- |
| FAP-70 | **PASS** | `rev-b-auth.json` — /register → OTP step title "Finish creating your account"; copy "Local preview — verification is simulated; no email is sent. Any 6-digit code completes signup…"; no Resend control; Verify('000000') lands `/onboarding`. Shot `rev-fap70-otp-1440.png`. |
| FAP-81 | **PASS** | `rev-a-public.json` — /community under `prefers-reduced-motion: reduce`: 0 running animations at t+2.5s and t+3.9s, row transforms frozen between samples; no-preference: 2 running. Console clean. Shots `rev-fap81-*.png`. |
| FAP-82 | **PASS** | `rev-a-public.json` + `rev-a2-pricing-rail.json` — at 320 and 390 with 200% root text: 0 FAQ controls offscreen; first FAQ `aria-expanded` flips true on click and the answer is visible with content; no horizontal page overflow. Disclosure: the 3 h1/h2 found offscreen at 320 ("Start", "Personal", "Family") are the plan-card headings inside the **by-design** `overflow-x-auto` plans rail (`AILearningPage.jsx:135`, `data-overflow`); the rail is scrollable (`scrollWidth` 860 vs client 256/326) and each heading becomes visible by rail scroll (`rev-a2` measured visible:true for all three after `scrollIntoView`). This is the authored swipe-rail pattern, not clipped content. |
| FAP-83 | **PASS** | `rev-a-public.json` — all 5 persona pages: language section eyebrow exactly "Your language"; chips present exactly Hindi/English/Bengali; none of Tamil/Kannada/Punjabi present; no "every language" claim; "English, Hindi, and Bengali" + roadmap line present; 0 console errors across the 5 visits. |
| FAP-84 | **PASS** | `rev-a-public.json` — 7 CinematicHero routes (`/`, `/research`, `/privacy`, `/terms`, `/security`, `/cookies`, `/accessibility`): 0 "React does not recognize" warnings, no page errors; hero `img` carries lowercase `fetchpriority="high"` + `loading="eager"`. |
| FAP-85 | **PASS** | `rev-b-auth.json` — /forgot-password copy and "Create reset token" button; success view "Finish resetting your password" + no-email-is-sent disclosure; continue link `/reset-password?token=<uuid>`; setting a new password ends at "Password updated / Your saved account and learning setup will be kept". |
| FAP-86 | **PASS** | `rev-b-auth.json` — dispatched `toast()` via the real module; toast renders (title visible), the `×` control (`button[toast-close]`) dismisses it, 0 `onOpenChange`/unknown-prop warnings during the round. |
| FAP-87 | **PASS** | `rev-c-identities.json` — student: `/dashboard/prepare` and `/dashboard/child` keep their URL and open the teaching/family-workspace explanations; professional: both deep links likewise; screenshots beside. |
| FAP-88 | **PASS** | `rev-d-fap80-88.json` — learner + added Teacher role, class created twice through both entry points: 0 duplicate-key warnings, 0 console issues, 2 distinct cards (`Set` size 2). |
| FAP-89 | **PASS** | `rev-c-identities.json` — organization identity: all four personal-learning deep links (`learn/practice/build/ask`) keep their URL with the honest "Not available in this workspace … personal learning workspaces" page; capability routes (`/dashboard/people`, `/dashboard/analytics`) open without permission errors. |
| FAP-90 | **PASS** | `rev-c-identities.json` — organization `/dashboard/classes` keeps its URL with the "Classes … teaching workspace" explanation; parent `/dashboard/classes` keeps its URL with the family-workspace explanation; control: teacher sees the real Classes page (no rewrite). |
| FAP-80 | **PASS** | `rev-d2-fap80.json` (fresh learner, dark context, legacy Learn surface `?legacy=1&subject=Mathematics`, topic created through Add topic, topic detail opened) — dark "Not started" badge paints token bg `rgb(37,42,52)` with `rgb(182,189,202)` text = **7.62:1** (the FAP-80 defect was the light pair 182,189,202-on-218,220,224 at 1.38:1; the reviewer asserts measured contrast per the FAP-30 4.5:1 law, not a literal); card border token `rgb(60,67,80)`; "Learning area", "Open lab →", "Practice this topic", "Request explanation" all paint the receipt's after-value `rgb(170,199,255)`; 0 console errors. |

Reviewer probe scripts: `rev-a-public.mjs`, `rev-a2-pricing-rail.mjs`, `rev-b-auth.mjs`, `rev-c-identities.mjs`, `rev-d-fap80-88.mjs`, `rev-d2-fap80.mjs`, `rev-e-fap72.mjs` (playwright-core driven, committed beside the JSONs).

## FAP-72 review (zcode candidate `224a5048`, served from its own worktree on 5176)

Source review: `git diff f8c3fd1d..224a5048` — deletes `auth/LanguageSelector.jsx` (65 lines) and its two render sites (AuthLayout, OnboardingLayout); adds `SERVED_UI_LANGUAGES` (en/hi/bn) + `UI_LANGUAGE_NOTE` to `stepConfigs.jsx`; renders the honest note under the language select on both preference surfaces (`ProductSetupFields.jsx`, `steps/student/StudentContextForm.jsx`); the 14-language content-interest list and its save path are untouched; `git grep LanguageSelector` on `224a5048` → empty (no dangling refs); law test `fap72-onboarding-language-truth.test.mjs` (4 tests) read and understood.

Live A/B (`rev-e-fap72.json`, before = beta 5175, after = candidate 5176, both through the real register → OTP → onboarding journey):

| aspect | BEFORE beta `f8c3fd1d` | AFTER candidate `224a5048` |
| --- | --- | --- |
| register-page language selector | present; clicking **Español** relabels the button to "Español" while the page heading stays "Create a Visionary account" — the fake-switch proof, reproduced | **absent** |
| onboarding steps carrying a listbox switch | 5/5 (one per step) | **0/5** |
| honest UI-language note | 0/5 steps | **2/5** — exactly the two preference surfaces (student context, product setup), both of which still show the full 14-option "Preferred learning language" select (15 with placeholder) |
| full 14-language content-interest list | preserved | **preserved** (Tamil/Bengali/Assamese all present on both preference steps) |

Build/test gates run by the reviewer on the candidate checkout `fap72-serve` @ `224a5048`: `npm test` → **792/792 pass, 0 fail** (12.9 s, exit 0; includes the 4/4 FAP-72 law test), `npm run check` → **exit 0** (battery + production build, build ✓ 7.9 s).

Verdict: **PASS — recommend merge into beta.**

## Observations (not blockers, recorded for the wave)

1. **Pre-existing `saveLastPath` console noise.** The sweep's sign-out/storage-clear transitions produce 12 `PAGEERROR`s ("You do not have access to this workspace") thrown by `DashboardLayout.jsx:94` → `saveLastPath` → `workspaceService.access`, caught and reported by the app's own Resilience Diagnostic. The effect dates to `e5fbe302 version 1.0.38` (`git log -L` verified) and is untouched by FAP-87/89/90 — pre-existing, transition-only, app-caught; no reviewed behavior is affected. Suggested follow-up candidate for the board (guard the autosave when the session is being torn down).
2. **FAP-82 disclosure** — the three offscreen plan headings are the by-design swipe rail (measured reachable by scroll); no further work.
3. **Process** — review evidence now lives only in dedicated worktrees; uncommitted files in the primary checkout are not safe across agent branch switches (this round lost one evidence set that way and was rebuilt).

## Round summary

12/12 Testing tickets **independently verified** on merged beta `f8c3fd1d`; FAP-72 candidate **verified** end-to-end (source diff, live A/B, battery, check). This receipt is the D-098 independent-review evidence for moving FAP-70 and FAP-80–90 to **Done**, and for merging `zcode/fap-72-onboarding-language-truth` into beta and moving FAP-72 to **Done** after the merge's GitHub Product checks are green. No author probe outputs were reused as reviewer evidence; where the author's claims could not be reproduced verbatim (FAP-80 badge literal), the reviewer re-derived the assertion from the ticket's own law (contrast ≥ 4.5:1) and measured it passing.
