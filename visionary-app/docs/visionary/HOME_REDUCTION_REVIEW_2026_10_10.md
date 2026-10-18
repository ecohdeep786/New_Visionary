# Home — choose or resume one useful next step

D-054 · 2026-10-10 · Implements the founder's attached reduction-first design brief on the actual `/dashboard/home` surface, `DecisionHome`, across all five roles. Existing catalogue, saved activity, sharing, source and permission behavior stays connected. Backend work remains deferred.

## A. Diagnosis

| Screen | Single job | Original friction |
| --- | --- | --- |
| Learner Home | Resume learning or choose a starting subject | Session guidance, stage guidance, project guidance and preview notes competed with the next task. A decorative illustration occupied the populated task panel. |
| Teacher Home | Prepare the next lesson | The next action competed with the full teaching summary, service explanation and growth notes. |
| Parent Home | Open an authorized child's shared progress | Repeated sharing explanations and the expanded child summary obscured the report action. |
| Professional Home | Continue toward a saved target or choose one | Home repeated the career workspace's explanation, assessment caveats and target controls. |
| Organization Home | Take the next permitted setup step | Setup guidance, operational totals and evidence policy appeared together before a clear next action. |

## B. Transformations — applies to each Home

- Large greeting + medium task → quiet 28px greeting + dominant 28–40px task.
- Explanations beside the main action → **Details and options**, retaining detail, recommendation reason, source/date and plan removal.
- Always-present illustration → existing Visionary artwork only for first-use/setup states; none for saved tasks/reports.
- Two first-use choices → one filled primary control; alternative inside Details and options.
- Plan title + sentence + action + Not today → linked title + right-aligned status/date + 44px overflow control.
- Long row detail → named popover with full authored title, original detail, Open and explicit **Remove from today’s plan**.
- Expanded role summaries → **Teaching overview**, **Shared family progress**, **Career overview**, **Organization overview**. Original controls and evidence remain inside.
- Separate help heading + instruction + button → quiet **Ask Visionary Guide** link, when permitted.
- Stage/session guidance, boundary and preview paragraphs → **About this workspace**. **Local preview** remains visible.
- Inline success paragraphs → dismissible dark bottom snackbar; errors remain visible with recovery.
- Decorative blue icon tiles → monochrome task symbols; omit them on narrow phones.

## C. Redesign spec

- Shell: existing accessible role navigation and top bar. No navigation controls removed in this pass.
- Canvas: centered, maximum 1040px including padding; desktop padding 48/40/72px; 64px semantic group gaps. At ≤600px: padding 32/20/48px; 40px group gaps.
- Header: workspace label 13px/500; greeting 28px/400, 1.3 line-height (24px on phone); quiet 12px Local preview at the opposite edge or below on phone.
- Decision surface: flat `#f7f8fa`, thin existing neutral border, 12px radius, 40px desktop /24px phone padding. No shadow. Label 12px/400. Task title `clamp(28px,3vw,40px)`/400, line-height 1.25, maximum 28ch; phone 28px. Internal rhythm 24px.
- Primary control: existing functional blue, 48px minimum height, 14px/500, 24px horizontal padding, pill radius. Saved-task alternative stays a secondary link; first-use alternative is disclosed.
- First use: one existing role-specific Visionary spot illustration; 160px to the right on desktop, 96px above the content on phone. No additional illustration or generated asset.
- Visible instructional sentence budget: **zero** in the default closed Home. Titles, labels, actions and record metadata carry the decision. Explanations remain in deliberate disclosures. Active stage confirmations, source failures and errors keep their existing visible information; they are not certified against the default-state text budget.
- Plan: 20px/400 section heading and thin divider. Rows have 20px vertical padding, 16px gaps; title 16px/400 on one line with ellipsis, full accessible text and full popover title; one 12px muted status/date aligned right; 44×44px overflow target. Status derives from recorded completion and due date, never an ability score.
- Task icons: 20px monochrome strokes within a 32px slot; absent on phones. Overflow: monochrome three dots. Button arrow: direction of the main action.
- Popover: up to 320px, constrained to viewport minus 32px; 20px padding; 12px radius; overlay-only shadow; full title 16px, detail 14px; 44px action targets; named for its exact task. Enter opens; Escape closes and restores trigger focus.
- Supporting summaries: native keyboard-operable details; role labels 14px/400, minimum 44px target. Expanded content uses existing authorized forms, child selector, metrics and evidence tables; it is outside this primary-screen reduction scope. Pre-existing English role-detail copy is marked `lang="en"`; new disclosure labels use the independent interface language.
- Footer: 24px internal gaps, top divider and 24px padding; Guide link 14px; About disclosure 13px. Stage settings and optional duration remain reachable within About.
- Feedback: dark `#202124`, white 14px text, 8px radius, 12/16px padding; dismiss control ≥44px; six-second lifetime. Desktop bottom 24px; phone above bottom navigation and safe area. Plan removal refocuses the new next-step heading after the scoped query reloads. Workspace changes clear the plan notice/error.
- Motion: existing brief entry/overlay transitions; existing reduced-motion override remains effective. No decorative animation added.

| Role | Primary control and destination | Supporting disclosure | Artwork |
| --- | --- | --- | --- |
| Learner | Continue learning → exact saved unit; or starting subject → Learn | Remembered activity; About workspace | First-use Learn only |
| Teacher | Open preparation → Prepare | Teaching overview | Document when no saved lesson draft |
| Parent | View shared report → exact permitted child; otherwise Connect with a child | Shared family progress | Handshake when no active child summary |
| Professional | Continue career path; otherwise Set a skill goal → Career | Career overview | Briefcase when no target or active task |
| Organization | Manage people / Open curriculum / Open insights, following existing setup rules | Organization overview | Community when no cohort |

## D. Self-critique

These are qualitative design self-review scores for the default closed Home variants, **not** results of a three-second study or measured quiet-pixel ratio. Revision brought rare actions into overflow, aligned metadata right, removed populated-state artwork and reduced competing copy before final review.

| Criterion (0–5) | Learner | Teacher | Parent | Professional | Organization |
| --- | --- | --- | --- | --- | --- |
| Glance test — design hypothesis | 4 | 4 | 4 | 4 | 4 |
| Paragraph audit — default primary surface | 5 | 5 | 5 | 5 | 5 |
| Row discipline | 4 | 4* | 4* | 4* | 4* |
| Whitespace — visual estimate | 4 | 4 | 4 | 4 | 4 |
| Color restraint | 4 | 4 | 4 | 4 | 4 |
| Icon/illustration leverage | 4 | 4 | 4 | 4 | 4 |
| Earning its place | 4 | 4 | 4 | 4 | 4 |

\* No default list row in the captured role state; shared plan-row treatment applies where that role has a daily plan. Expanded legacy evidence tables/lists are not covered by this score.

Rationale: repeated guidance became labelled disclosure; scale and 64px group spacing make the next action dominant. Saved tasks lose decorative art; first use keeps one useful Visionary illustration. Rows trade sentences and competing buttons for one title, one real status and an overflow control.

## Validation and limits

- 66 focused tests pass: Home, independent interface language, saved/due/completed plans, exact resume, scoped sharing, role mentor and stage transitions. New assertions cover first-use versus saved activity and translated status from recorded completion without changing original titles or storage.
- Full lint, both type configurations, production build and whitespace checks pass. Final build manifest: `index-j42nnFRh.js`; complete logs and observations are in [the evidence index](baseline/home-reduction-2026-10-10/README.md).
- Desktop 1440px and requested phone 320px (reported 321px) cover all five default Home variants. Learner Hindi/Bengali labels preserve English authored titles; all observed documents fit their viewport. Keyboard task options, role disclosures and source/boundary access were exercised.
- Saved cube unit, project and linked-child summaries are fictional fixtures on isolated preview origin :5176. Original :5173 user data and server remain intact. Wider populated/failure combinations, all stages/subcategories, actual devices, screen readers, representative-user glance testing and measured whitespace remain acceptance work.
- Final build rehearsal: removing the fictional project step shows the snackbar, removes its row for today and focuses `next-step-title`. The project remains private in Build; the exact cube URL still opens its saved Understand step. The demo deferral is day-scoped and returns tomorrow; no saved project was deleted.
- This completes a Home design pass; it does not certify the full frontend, backend readiness, Apple/Google product parity or AGI capability.
