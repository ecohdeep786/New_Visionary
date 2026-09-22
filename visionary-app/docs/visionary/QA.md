# QA — record per wave
| Wave | Agent | Checks run | Result | Blockers | Gate ref |
|---|---|---|---|---|---|
| 0 | 07 | baseline screenshots, route inventory, landing diff | pending | — | — |

## 2026-09-19 — Wave 0.5 / 01-PM evidence intake (not 07-QA)

- Fully read operative contract Parts A–AB and legacy pack; read canonical protocol/PM charter and last STATUS after bootstrap. No internal prior wave completion was found. Original pending QA row above remains pending.
- Source-inspected App routes, navigation, shell, token sources, Radix primitives, onboarding, current role surfaces, domain/services, and existing test organization. DESIGN_INVENTORY distinguishes source inspection from captured runtime evidence.
- Started local Vite preview at 127.0.0.1:5174. Initial sandbox launch failed on esbuild parent-directory access; approved outside-sandbox launch succeeded with Vite 6.4.3. Current five role Homes were opened using fictional local scenarios for before-state evidence. See baseline/wave-0.5/README.md.
- No frontend implementation, no user-data deletion, no real model/auth/payment/notification calls. Scenario selection changes only existing local fictional account context; no privacy permission or billing mutation performed.
- No fresh unit/typecheck/lint/build suite, seven-width sweep, accessibility certification or public pixel diff performed by PM. Those remain 07/06/08 responsibilities at the correct stage. Successful preview is not launch readiness.
- No G1–G12 pass asserted. Known gaps include stageProfile/transition engine, role Home hierarchy, canonical connections/lifecycle notifications, structured role workflows and complete states. Screenshots are current-build baselines, not approved final design.

## 2026-09-20 — PM evidence reconciliation after interruption

Exactly four baseline PNGs are present: student, teacher, parent and professional at 1440×900. The earlier statement that five Homes were opened describes navigation, **not five completed captures or verified rendered states**. Organization capture was blocked by a browser approval-review usage-limit failure; no bypass attempted. The baseline README records this and the outstanding viewport reset. Remaining visual inventory and all formal QA gates are pending.

PM deliverables are documentation only. No new source-code verification or product-completion claim is made on resumption. The next agent must read the final STATUS handoff and complete its own charter, not infer acceptance from these documents.

Documentation checks: 18 active Markdown files checked for local Markdown links; none broken. Archived pack and operative contract compared with discovery commit after normalizing Git LF / working-tree CRLF line endings; text content unchanged. Raw byte comparison against Git blobs differed due to line endings and is not presented as a byte-identity verification. One initial read-only check command had a syntax error and was corrected; no files were affected.

## 2026-09-20 — 02-UX / Home and Ask design evidence

Read full v2.2, handoff/inventory and role acceptance; inspected DashboardHome/Guide, existing App aliases, role navigation and scoped workspace hook. UX_HOME_FLOW maps touched Home/Ask states and specifies exact resume, permission-safe reasons, direct destination actions, narrow layouts and keyboard/status behavior. No application edits, browser checks, screenshots or automated runs by02. One source-read path initially pointed to components/dashboard/dashboardNavigation.js; corrected to the actual src/lib/dashboardNavigation.js. No files affected by that read error. Formal06/07 verification and all twelve gates remain pending.

## 2026-09-20 — 03 design-system / Home and Ask

Additive scoped stylesheet parsed with installed PostCSS (72 top-level nodes); `git diff --check` on owned stylesheet/handoff returned success. Existing selectors were not edited. New classes await04 consumers, so no rendered equivalence or accessibility certification inferred. No public or protected Frontend files touched. Scoped component co-sign and class API live in DESIGN_HOME_HANDOFF.md; full responsive/state tests and before/after capture remain04/06/07 work.

## 2026-09-20 — 04 implementation smoke evidence

- Six added Home/entry regressions; all30 Node tests pass. Lint, both type checks and production build pass. Existing ambiguous easing utility warning remains outside this slice.
- Five role Home states rendered under the School administrator demo account's separate role workspaces. `after-*-home-1440.png` captures these new/empty states; identities differ from four earlier persona baselines, so this is design-inheritance evidence, not a same-data pixel comparison.
- `after-ask-organization-1440.png`: intent-first entry. Plan/material/question survive browser refresh. Text material is explicitly not analyzed by a live model.
- Cube activity → explaining → Hindi → private note → Home → Continue restores stage, language and note. `after-resume-hi-390.png` shows compact activity-first resume; Ask switches to Hindi draft and focuses composer. Automated tests cover exact position/model state and cross-workspace rejection.
- Browser preview initially retained stale import-resolution errors after unrelated repository changes. Restarting the owned Vite process restored the running app; production build already passed. A separate hidden testing tab avoided navigation conflict with the user's open tab.
- Full07 matrix, actual screen-reader review, reduced-motion/zoom and public pixel comparison remain pending. No production capability, complete wave or twelve-gate pass claimed.

## 2026-09-21 — 05 motion / Home and Ask

- Static review of DecisionHome, GuideEntry, Guide, GuideActivity, workspace.css and shared dialog motion: no new decorative animation, automatic cube rotation, shimmer or timed stage animation. Immediate pane/stage changes preserve equivalent content under reduced motion. Guide's requestAnimationFrame schedules focus only.
- workspace.css disables dashboard animations/transitions under prefers-reduced-motion. Portalled dialogs sit outside that scope but inherit the global 0.01ms duration, zero delay and single-iteration reduction. Runtime computed-style/interaction parity remains unverified by05.
- **M-01, existing shared-style defect / G9 pending:** src/index.css later html scroll-behavior:smooth overrides the earlier reduced-motion html scroll-behavior:auto at equal specificity. Route the fix through the shared-style owner/chief with public-preservation checks. No public/shared source edited by05.
- No code change required in the newly added Home/Ask motion; no tests or browser checks claimed. Initial GuideEntry read used the wrong directory and was corrected to components/dashboard without changing files. Logs only;06 and07 retain their verification responsibilities.

## 2026-09-21 — 06 accessibility / Home and Ask

- Scoped semantic/focus patches: tabs support arrows/Home/End and roving tab stops; named panels; history closes to its trigger or compact Activity tab; delete cancellation returns to its row, deletion to history title; helper text is a description rather than the material field's name; complete history is no longer a live region. Localized Home title uses the saved session locale, tested independently of the current English preference.
- Full30 Node tests, lint and typecheck passed during implementation; focused7 Home tests including the added locale regression and final typecheck/scoped lint passed. Whitespace check passed. Final material-label and1200px heading refinements are source-reviewed, pending07 browser/build confirmation.
- No runtime screen-reader/zoom/reduced-motion result asserted. Main owns browser review. M-01 unchanged.04 follow-ups: historical messages lack locale provenance; editable material count currently says saved even if persistence fails. No public or protected Frontend changes; no G9 or wave completion claim.

## 2026-09-21 — 07-QA / Home and Ask

- Fresh31 Node tests pass; lint, both typechecks and production build pass. Scoped diff whitespace check passes. Known ambiguous Tailwind easing warning remains. Additional isolated service probes pass for in-flight cancellation, parent revocation during pending Home load, and stored selection preservation on failed writes.
- QA_HOME_RESULTS.md records applicable states and four blocking04 findings: false saved-character wording after failed material writes (QA-H01), professional fallback activity returned to a minor despite entry filtering (QA-H02, reproduced), missing historical message-language provenance (QA-H03), and uncaught/partially optimistic conversation selection writes (QA-H04). No application fixes by07.
- Attributed coordinator browser evidence: Home/Ask no horizontal DOM overflow at all seven specified widths; connected parent child routing; post06 compact ArrowLeft/End tab selection/focus and named history dialog opening. Prior04 role/refresh/exact-resume smoke remains separately attributed. Geometry is not a complete seven-width visual pass. Escape/delete-cancel focus return, actual SR,200% zoom,reduced-motion runtime and public pixel parity remain unverified in this handoff.
- M-01 shared smooth-scroll defect is source-confirmed and unchanged. Full stageProfile, PartW and connection requirements remain pending. No twelve-gate pass, complete wave or merge/release authorization. Protected Frontend folder not opened; unrelated public/scripts-tmp/shots edits preserved.

## 2026-09-22 — 04 corrective implementation / Home and Ask

- Retained the interrupted04 fixes already in the current build: neutral material character count, a shared role/age eligibility policy for initial and response suggestions, optional locale on known authored response blocks, and persist-first History/New view selection with visible handled failures. Legacy message language and arbitrary user text are not inferred from the current preference.
- Completed one `openGuideLocation` view snapshot and one hydration effect. Exact session entry now obtains the matching conversation/draft/canvas/pane together; ordinary Ask entry retains its Conversation-first pane. Material persistence success clears previous save feedback. No visual language, public source, shared CSS or06 keyboard/focus pattern changed.
- 36/36 Node tests pass; five added regressions cover fallback eligibility across minor/unknown/all roles, mixed en/hi/bn plus legacy-unknown history, exact-session composer ownership, failed History/New selection preserving prior UI-contract/stored state with retry, and failed material save followed by successful retry. Full lint and both typechecks pass; scoped whitespace check passes. The final focused12 Home tests also pass. A service/view-contract test does not establish rendered storage-failure focus or screen-reader pronunciation.
- Attributed main-coordinator browser evidence on the partial fixes: minor unsupported question offers cube/fractions only; fractions draft A and another conversation's draft B remain separate through Home exact resume, reload and history switching. Final single-effect consolidation remains for coordinator/07 browser recheck. This04 agent did not operate the browser or run a new production build.
- 06 language review,07 corrective rerun/build and chief re-gate remain required. M-01, stageProfile/Part W, full connection/state coverage and outstanding SR/zoom/reduced-motion/public-pixel checks are not waived. No wave-completion, merge/release, production capability or AGI claim.
- Known bounded recovery limitation: a failed exact-route opening is not automatically retried under the same location key; the existing Return Home/reopen or page reload is required after resolving the failure. History selection has its own modal-local alert and can retry by selecting the row again. No stored records are cleared to recover.

## 2026-09-22 — 06 corrective semantics review / Home and Ask

- Read the operative contract fully and the latest04 corrective handoff before review. Source-verified QA-H03's optional block provenance: known English explanatory/disclosure copy is English; prepared Hindi/Bengali text and activity labels retain their authored locale; legacy records and arbitrary user text remain unguessed. Guide applies that provenance on each text/button block, not the entire conversation. Saved Home activity heading continues to use its session locale.
- Source-verified QA-H04's modal-local error visibility: history and delete dialogs contain their own role=alert. Their existing Radix names/descriptions, close focus restoration, contextual Delete names and complete prior-view retention remain present. Guide's arrow/Home/End roving tabs, panel relationships, narrow response announcement and material field label/description were preserved. No new scoped semantic blocker found in the correction; no application edits required by06.
- Coordinator-attributed runtime evidence: prepared en/hi/bn rendered block attributes are correct, unknown/user blocks are untagged, Bengali Home heading has its known locale, and Guide has no horizontal DOM overflow at the seven target widths. This is not independent06 browser or full visual acceptance. Coordinator continues focus/failure checks.
- No automated suite or browser run by06. Actual screen-reader pronunciation,200% zoom and reduced-motion runtime remain unverified. M-01 shared-style cascade, public pixel evidence and the wider product gates remain open.07 must execute the corrective checks/build before the chief re-gates; this review does not certify G9, the wave, release readiness or a real model capability.
