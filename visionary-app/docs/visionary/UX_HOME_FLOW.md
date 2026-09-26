# Home and Ask — implementable UX handoff

02-UX · Wave 0.5 patch-forward · 2026-09-20. Scope: ST-01/ST-04, TE-01, PA-01, PR-01, OR-01. Authority: v2.2 A/B/G/J/K/O/V/X; D-003/D-007. This is an enhancement of the current shell and Guide, not approval to rebuild role destinations. No frontend or token edits in this handoff.

## 1. Route and purpose

- `/dashboard` and `/dashboard/home`: **decision Home**. Identify active workspace, show one useful next action with its reason, then at most four supporting modules. No empty composer hero and no requirement to send a message to open a tool.
- `/dashboard/ask`: **guided Ask**. Keep the existing Guide messages, composer, history, session and operational canvases. Introduce intent/context entry before the first question; existing conversations open without forcing an onboarding step.
- Existing `/dashboard/home?journey=…&stage=…` remains an activity entry. Render the existing Guide/player for a valid journey rather than swallowing the query into the new Home. Do not automatically reset position on ordinary resume. An explicit practice entry may request its distinct practice stage.
- Keep incoming `topic` and `location.state.initialQuestion`; preserve them as an editable draft. Never send automatically. Old Home links carrying these Ask contexts resolve to Guide, not a blank Home. Home without these parameters never creates an empty conversation.
- Preserve `/dashboard/guide` if already defined; do not invent an additional primary destination. No duplicated floating Ask button. Student/professional Ask is a primary destination; teacher secondary; parent primary as specified by G. Keep compact four frequent items plus More, with Ask reachable from Home and More when not one of those four.

## 2. Home grammar and service boundary

Inside the retained bounded white workspace: role/workspace eyebrow → compact page title → one-line context → priority surface → supporting rows. Use existing `v-page`, title, card, button, notice and disclosure grammar pending 03 approval. No new illustration system, gradient, color family or typography. Context row may include an organization badge; it does not expose other workspaces' data.

Priority surface: title of actual activity/job, concise outcome or saved point, one primary **verb + object** action, secondary **Why this?** disclosure, optional **Choose another** destination. Do not present every destination as a card. Supporting modules use low-emphasis rows and appear only when their data is available. No upsell or streak leads the page.

The scoped service returns a Home view model: workspace label/boundary, supported role/stage profile, one recommendation (stable ID, title, action target, reason, evidence references/date, availability), and ordered modules. It excludes private audience fields before the UI sees it. Pages must not import fixture lists or read all users' entities. Use an explicit no-evidence reason: “A starting point for your selected goal.” Never invent gaps, readiness, accuracy or personalized certainty.

Use existing saved activity ID/snapshot for Continue; a conversation title alone is not an activity. If no meaningful stage profile is available, show a conservative role-safe starting choice and disclose incomplete setup; do not infer stage from a persona's name. Full stage adaptation and transition acceptance remain pending subsequent implementation, not satisfied by role labels.

## 3. Role next-action selection

Within each active workspace, user-selected plan overrides the default when valid. Otherwise prefer saved unfinished relevant work; select due/review work only from actual permitted records. Ties resolve deterministically, not randomly on refresh.

| Role | Returning priority and direct action | New/insufficient-data priority | Supporting modules and boundaries |
|---|---|---|---|
| Student | Resume saved learning activity, or explicit required-work priority → original activity/class destination | Choose an age/stage-eligible starting idea → Learn; no professional data scenario for a child | Today ≤3 tasks with available time estimate; needs-attention reason only with evidence; subjects; build. Primary max3, secondary max4, other stages max5, per role addendum. Connected space is a compact boundary row. |
| Teacher | Continue preparation → Prepare; otherwise review pending submission → authorized class, not chat | Prepare a lesson → Prepare | Feedback count with source, class changes, own growth; omit empty queues. Never retrieve learner private doubts. |
| Parent | Selected active child's permitted weekly summary → Reports with child context | Request progress sharing → Children | Child switch/status, period, support opportunity, teacher update. One support action, no child comparisons. Pending/expired/revoked relationships show status only, not cached report. |
| Professional | Continue skill activity/artifact → saved activity or Build | Choose a skill goal → Career | Skill evidence, review due, portfolio milestone; employer section only within explicit authorized boundary. No board/class terminology in personal career context. |
| Organization | First incomplete supported setup item → People/Cohorts/Curriculum; returning required review from scoped data | Set up people → People | Ordered setup checklist, scoped operational follow-up, content review. Only call checklist items complete if persisted evidence exists. Do not treat a curriculum draft as approved. |

If the target cannot address a specific object yet, label the action honestly (“Open preparation”, “View submissions”), not “Resume lesson X”. Direct navigation uses existing controls and does not create a Guide conversation or require Send. Consequential changes remain inside their existing reviewed forms.

**Why this?** is an inline disclosure, not a modal: one plain sentence, date/source where available, and **Choose another**. “Choose another” opens the role's relevant existing selection surface; it does not promise a persisted plan change unless that editor exists. Personal learning is never suggested to a teacher, parent or organization as if it were shared evidence.

## 4. Ask entry and activity continuity

New Ask starts with “What would you like help with?” and visible context choices: Continue activity (only when saved), Topic/goal, Paste material, Outside my plan. Material entry is paste text; upload stays explicitly unavailable unless supported, never a fake upload success. Context is visible and removable before Send.

Intent choices: **Understand**, **Solve with guidance**, **Check my attempt**, **Plan**, **Build**. Display at most the role-relevant subset initially; the complete set can be expanded. Teacher labels refer to preparing/explaining/checking teaching work; parent to understanding a permitted report or supporting this week; organization to planning/reviewing permitted work. Intents establish mode/context, not a promise of model capability. Existing known curated activities open immediately; unsupported requests receive the current honest demo fallback.

Composer has a persistent visible label and selected intent/context summary; draft persists through refresh, history and workspace return. No automatic request on intent selection. Existing conversation can change intent without losing its messages. History remains behind its labelled control; full rename/export/detach requirements are tracked separately if not implemented in this slice.

Activity remains owned by the existing session. Resume opens the saved stage, position, answer, model state, notes and teaching language. Ask from activity pauses without resetting; **Back to activity** restores it. Context removal does not delete the session. Conversation deletion retains the existing explicit warning about linked lesson-session removal; failed deletion must retain the item and show Retry, never optimistic disappearance.

At desktop ≥1200 keep the current split canvas/Guide and focus mode. At 768–1199 keep switchable panels. Below768, entry into an activity selects **Activity** first; Ask selects **Conversation** and returns focus appropriately. Do not shrink two panels onto a narrow screen. Selected tab/panel is labelled and keyboard-operable; don't hide focused content without moving focus to the selected panel heading or composer.

## 5. Required states for touched Home/Ask

| State | Designed behavior |
|---|---|
| Initial loading | Reserved priority/row skeleton, named loading status, no fake numeric values or empty-state flash. |
| Refresh | Retain same-workspace content with discreet updating status; do not retain prior workspace/child data while its new request loads. |
| New empty | Role-specific first action above; no fabricated recent lesson or queue. Ask has context/intents, not empty-input-only opening. |
| Filtered empty | Applicable to history/topic selection: explain no matching results and Clear search. Home itself has no filter, so N/A there. |
| Partial/stale | Render available authorized sources and label unavailable section/date; unknown is not zero. One failed queue does not erase unrelated saved work. |
| Recoverable error | Inline error + Retry; preserve draft and last safe same-context state; no Plans link for unrelated errors. |
| Terminal/missing/permission | Safe unavailable wording without object title/child details; Return Home or switch workspace. Invalid journey is not silently substituted. |
| Offline cached | “Saved on this device” only for acknowledged local persistence; explain unavailable response and retain question. No cloud-sync claim. |
| Storage failure | “Couldn't save on this device” + Retry, retain visible input/session; do not show Saved or discard draft. |
| Limit/feature unavailable | Explain actual capability/limit and reset if supplied; saved activity and required assignment remain accessible. No paywall inside child teaching; no invented upgrade benefit. |
| Consent/invite pending, expired or revoked | Status plus permissible connection action. No formerly authorized report rendered, including during refresh. |
| Preparing/unavailable representation | Local progress label, cancel where supported; Text/2D alternative. No endless spinner or fabricated audio. |
| Mutation pending/success | Disable duplicate submission, named status; success only after save; restore focus. Undo only for an actually reversible service action. |
| Destructive action | Existing accessible review dialog; clear exact effects, Cancel first, return focus on close; retain data on failure. |
| Transition notice | Reserved future inline slot only. Do not ship inert diff/postpone/undo controls or imply transition engine exists in this slice. Part W and G12 remain open. |

## 6. Accessibility and verification handoff

Keep semantic main/section headings, visible text links/buttons and no nested interactive card targets. One h1 per rendered route. All icon-only controls have names; recommendation disclosures use native details/summary or equivalent expanded/controls semantics. Primary actions, chips, tabs and dialog controls need practical 44px targets and visible focus. Announce response/save/error status without making the whole history repeatedly read aloud. Mark teaching text with its actual language; do not claim full interface translation.

Rows stack without fixed heights at360/390 and200% zoom. Long Hindi/Bengali labels wrap, source/teaching language distinctions persist, Indic line-height≥1.6. Reduced motion removes nonessential transitions without hiding state changes. Focus returns after history/delete dialogs; keyboard can enter Home action, inspect reason, open Ask intent, send/stop and resume activity.

03 must co-sign inherited components and scoped token choices before04. 04 preserves deep-link/session compatibility and captures before/after per enhanced screen referencing D-007. 05/06 review only touched controls;07 verifies five role new/returning Homes, unsupported Ask, all applicable states, workspace/child isolation, exact resume, seven widths, keyboard/zoom/languages and public regression. This document is not any gate pass. Transition engine, complete role workflows and full-stage fixture approval remain outside this bounded slice.
