# Home / Ask — 07-QA results

Wave 0.5 enhancement slice · 2026-09-21 · reviewed after the 06 handoff. This is bounded verification, not acceptance of the full product or a Part AA gate pass.

## Scope and method

Read MASTER_SPEC, full operative v2.2 Parts A–AB including Part V07, protocol, last STATUS, DECISIONS, QA, PRODUCT_GATE, UX_HOME_FLOW and DESIGN_HOME_HANDOFF. Inspected the changed Home/Guide components, scoped services, request hook, workspace boundary and relevant existing tests. No application source was edited. Protected Frontend documentation was not opened. Unrelated public, scripts-tmp and shots work was left untouched.

Evidence labels below distinguish automated execution, source inspection and browser execution. A service test does not establish that the corresponding rendered error, focus or status is correct.

## Fresh checks

| Check | Result |
|---|---|
| `node --test tests/*.test.mjs` | PASS: 31 tests, 0 failures, 0 skipped |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS: application and strict domain configurations |
| `npm run build` | PASS: Vite 6.4.3, 2,065 modules, 47.08 seconds |
| Scoped `git diff --check` | PASS for the touched Home/Ask source and regression test paths |

Build retains the previously recorded ambiguous Tailwind `ease-[cubic-bezier(0.22,1,0.36,1)]` warning. The generated Guide chunk was 28.00 kB / 8.77 kB gzip; this is bundle output, not a device-performance benchmark. No new dependency was needed for this QA.

Additional read-only Node probes, using an isolated in-memory storage adapter, passed:

- Abort an in-flight Guide request: no messages are committed and the acknowledged draft remains.
- Revoke Aarav's sharing while a parent Home request waits: the returned model excludes Aarav. Permission is checked after the wait, not only at request dispatch.
- Fail the write for conversation selection: the service throws and retains the stored active conversation. The UI's handling of that error is a separate failure below.

## Blocking findings for the touched slice

| ID / priority | Evidence and impact | Owner / acceptance for recheck |
|---|---|---|
| QA-H01 / P2 | `GuideEntry.jsx:14` renders `value.material.length` as **saved characters**. `value` is the local editable value set before persistence. If persistence fails, the parent shows an error but the context summary still calls unacknowledged text saved. This contradicts the designed storage-failure state and A9. Source-confirmed; service failure preservation is tested, rendered failure is not. | 04. Use neutral character count or distinguish acknowledged and unsaved text; retain the editable value and error. Verify failed save and successful retry. |
| QA-H02 / P2 | `workspaceService.ts:82` builds unsupported-question fallback activities from every journey, bypassing the role/age filtering used by `suggestedJourneys`. Fresh reproduction: a minor CBSE account, Bengali context, question “How do stars form?” receives `cube`, `fractions`, **`data`**. The professional scenario removed from the minor's initial entry is reintroduced after Send. | 04. Centralize the eligibility selection and apply it to fallback activity blocks; test minor and non-learner role responses. Broader stageProfile work remains separate. |
| QA-H03 / P2 | `Message` has no locale provenance (`domain/workspace.ts:13`), and historical message blocks in `Guide.jsx:46` have no language attribute. Curated Hindi/Bengali content therefore inherits the English document language. Setting it to today's teaching preference would also mislabel older messages. This is the 06 follow-up, confirmed by source and a newly created message lacking locale. | 04 domain/service, then 06 semantics. Store known language at creation/block level, mark only known text, and preserve legacy records without guessing. Verify mixed-language history and screen-reader pronunciation where tooling permits. |
| QA-H04 / P2 | `chooseConversation` (`Guide.jsx:33`) updates selected state before calling the throwing `selectConversation`, with no catch. New conversation (`Guide.jsx:41`) also invokes that write without error handling. On storage failure, history selection may change the selected conversation while leaving the prior canvas/input and no deliberate failure feedback; New conversation produces an uncaught event-handler error. Stored records remain intact, as independently probed above. | 04. Commit selection before changing related UI state, catch failure and keep the previous selected conversation/canvas/draft, with visible retryable feedback. Test both New and History selection under failed writes. |

These findings are not waived by the passing regression suite. No source fix was attempted by 07.

## Applicable state and invariant matrix

| Area/state | Verified evidence | Remaining work |
|---|---|---|
| Five role Homes, new state | Automated: direct role-appropriate action, reason, no conversation created, maximum module count. Source: separate boundary wording and no numerical ability claim. | Browser role-state coverage listed below; returning teacher/org records and all stage variants still need fuller fixtures. |
| Returning activity / exact resume | Automated: exact session ID, stage, position, language, answers/model controls/notes preserved; invalid and cross-workspace entry rejected before new conversation creation. | Browser refresh, back/forward and focus checks remain separate. |
| Parent active/revoked permissions | Automated: report excludes private notes; revoked child disappears; pending Home request rechecks current scope. Existing tests cover expired invitations and report periods. | Browser pending/expired/revoked refresh coverage; complete Part Z pairs remain outside this slice. |
| New and existing Ask / persisted context | Automated: intent, material and draft persist within the owning workspace, cross-role access fails, failed writes retain the last stored value. | QA-H01 and QA-H04 prevent full rendered storage-state acceptance. |
| Loading / refresh | Source: named loading status; workspace/person/locale/revision query key; abort signal passed; no prior-revision child model retained. | No reserved loading skeleton in DecisionHome; full visual loading/background-refresh behavior not certified. |
| Empty | Source and tests: role-specific new Home action; first conversation state and explicit no-history copy. | History has no filter, so filtered-empty is not applicable to the current slice; history search remains a wider requirement. |
| Partial/unavailable content | Source: unavailable saved journey gets preserved-record copy; unrelated work remains in storage. | No complete partial-service view model or per-module failure simulation. |
| Recoverable/offline error | Automated: failed Home/request rejects honestly and retains draft; source: Retry and Return Home surfaces. | Full browser offline/cache/retry and terminal permission states not certified. |
| Unsupported question | Automated: saved question and honest curated-demo response, not fabricated understanding. | QA-H02 eligibility leak in the offered activities. |
| Cancellation | Existing suite plus fresh in-flight abort probe preserve stored draft and avoid messages. | UI send/stop/history-switch timing and focus need browser coverage. |
| Limits / unavailable feature | Existing automated suite verifies daily per-account limits and access to saved activity; source does not add Home upsell or claim live voice/model. | Full rendered limit path and required assignment continuation outside this slice are not certified. |
| Destructive confirmation | Source: explicit linked-session deletion disclosure, catch/error retention and focus-return handlers added by06. | Browser cancel, successful delete, failure and nested-dialog focus coverage. |
| Language | Automated: curated en/hi/bn content and saved Home title locale independent from current preference. | QA-H03 historical messages; full long-label and screen-reader checks. Interface remains honestly English-first. |
| Safety / claims | Source: local-preview/no-live-model/cloud-sync copy; no checkout, advertisements or passive listening introduced by this slice. | No production security, verified consent, legal compliance or implemented AGI claim is established. |

## Browser and visual evidence

The coordinator owns the browser session. This 07 agent did not operate a browser or run a screen reader. The following evidence was supplied by the coordinator on September21 and is attributed, not independent07 browser certification:

| Coordinator check | Reported result and limit |
|---|---|
| Home and Ask geometry at 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080 | No horizontal DOM overflow. This is a geometry check, not full visual/interaction acceptance at every width. |
| Connected parent | Anika shows two permitted children; Maya's report link selects Maya. |
| Post06 compact tabs at360 | Activity + ArrowLeft selects/focuses Conversation with tabIndex0; End selects/focuses Activity with tabIndex0. |
| Post06 history opening | Enter opens a named history dialog. Escape and Delete-cancel focus return still pending at handoff. |
| Prior04 five role smoke | Five School account role Homes rendered appropriately. Organization Ask Plan/material/question persisted after reload. |
| Prior04 saved activity smoke | Cube start → explaining → notes → Hindi → Home Continue retained stage, notes and locale. |

Existing before/after PNGs are in `baseline/wave-0.5`; prior role captures use different identities, so they are not same-data pixel diffs. Prior04 screenshots remain dated smoke evidence, not fresh07 certification. Long-label visual review, full focus restoration, console check, actual screen-reader walkthrough,200% zoom, reduced-motion emulation and same-data public visual regression remain unverified here unless subsequently executed and documented.

## Carried boundaries and gate recommendation

- M-01 is source-confirmed and unchanged: later `html { scroll-behavior: smooth; }` in `src/index.css:376` overrides the earlier reduced-motion `auto` rule at line348. Shared-style owner/chief must resolve it with public-preservation evidence; 07 did not edit the public/shared stylesheet.
- StageProfile adaptation, primary-versus-competitive walkthroughs, Part W atomic remapping/Undo and broader role/connection completeness remain known unimplemented requirements. No G3/G4/G12 pass follows from this slice.
- Public pages were not changed by this QA. This is not proof of a clean public pixel diff across the entire dirty worktree.
- Recommend **merge/release remain blocked** for the chief's Part AA review: fix the owned findings, rerun relevant automated and rendered checks, then re-gate. This document does not execute the Head-of-Product gate or declare Wave0.5 complete.
