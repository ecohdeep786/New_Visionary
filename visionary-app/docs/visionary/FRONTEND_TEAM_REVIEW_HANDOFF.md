# Frontend team review handoff

Prepared 2026-10-05 at the owner's request. This is a review procedure, not an acceptance result. Record results in QA.md using FRONTEND_REVIEW_WORKSHEET.md. The twelve gates in PRODUCT_GATE.md remain authoritative. Backend work stays deferred until the owner accepts the frontend.

## Current review candidate — 2026-10-06

Use [FRONTEND_FINAL_REVIEW.md](FRONTEND_FINAL_REVIEW.md) and [FRONTEND_REVIEW_SNAPSHOT.json](FRONTEND_REVIEW_SNAPSHOT.json) for the frozen candidate identity and current automated results. All 464 service tests, build/lint/both types, 18 sequential browser suite executions, production policy and 756 fingerprint checks pass. Human review dispositions below remain OPEN. Run `node --test tests/*.test.mjs` for the complete service suite. Rebuilding or editing candidate files requires recording a new identity before accepting new evidence.

## Review setup

1. Use this checkout and `npm run dev -- --host 127.0.0.1`. Open the displayed localhost URL in a real supported browser. `/dev/scenarios` is available only in development: select fictional Aarav/Maya/Dev/Nila/Anika/Sam/Ira and organization personas. Never use real child, employer or curriculum data in this local preview.
2. For production-device verification run `npm run build`, then `npm run preview -- --host 127.0.0.1`. The scenario selector is deliberately absent from production. Prepare fictional accounts through normal onboarding, or ask the QA owner to supply the isolated fixture used by the relevant browser suite. Do not assume development-only verification proves the production headers work.
3. Set interface and teaching languages independently in `/dashboard/personalization`. Keep the same fictional records while switching language. Confirm which text is authored teaching and which is interface copy. Synthetic test translations below have not been certified by native reviewers.
4. Record commit/dirty snapshot, build log, browser/version, OS/device, reviewer, date, both languages, persona/workspace and evidence. Review on desktop and a physical narrow-screen device. Each failed task needs a reproducible case and a named corrective owner.

## Required team reviews

| Owner | Task and acceptance evidence | Current disposition |
| --- | --- | --- |
| English reviewer | Source → wrong check → retry → practice → project criteria → save/reload/return; teacher revision/return; parent scoped digest; organization recovery. Confirm meaning, status and source distinction. | Reviewer required |
| Hindi reviewer | Repeat with Hindi interface and Hindi teaching; also inspect an English-authored assignment without translating its source implicitly. Check script, wrapping, terminology and long feedback. | Reviewer required |
| Bengali reviewer | Repeat with Bengali interface and Bengali teaching; also inspect an English-authored assignment. Check script, wrapping, terminology and long feedback. | Reviewer required |
| Accessibility reviewer | Complete the same learning task, dialog, workspace switch and failed-save recovery using a physical keyboard and screen reader. Record focus order/return and announced errors/results. | Physical task evidence required |
| Device reviewer | Use browser zoom controls at 200%; perform learning, project editing, teacher review, parent report and governance recovery. Record actual zoom and reachable controls. | Actual browser-zoom evidence required |
| Device reviewer | Explicitly start/stop microphone; allow/deny permission; review/edit a transcript; use text fallback; navigate/change workspace/sign out while listening. Verify no late transcript crosses context. | Actual hardware/permission evidence required |
| Device reviewer | Play/pause audio, navigate during playback, copy/deny clipboard and open an exported draft on the device. Record understandable sound, actual copied contents and fallback outcomes. | Actual audio/clipboard/download evidence required |
| Design/public owner | Review current public changes and internal learning, project, review, parent and organization screens against the approved baseline. Automated comparisons cover only controlled viewport snapshots. | Owner acceptance required |
| Product owner | Recheck G1–G12 against all current QA evidence and the reviews above; name an owner for any failure. Record a signed frontend decision before the founder-book/backend sequence. | Final decision required |

## Automated evidence to use

Use FRONTEND_ACCEPTANCE_MATRIX.md and the latest QA.md entry for actual results and snapshot limits. The current execution includes nine categories × three independent interface/teaching-language pairs, original-source retention after change/withdrawal, source/legacy recovery, organization delivery/publication, linked teacher/learner/parent recovery, Work membership and governance, simulated speech lifecycle and keyboard focus checks. Tests establish those browser-local behaviors only. Native meaning, real curriculum quality, physical assistive technology and hardware outcomes require the team reviews above.

The development/preview microphone policy permits the same origin while retaining browser permission and an explicit listening action. This does not demonstrate real recognition availability, vendor connectivity or hardware success. Production hosting must preserve the reviewed policy when deployment is implemented.

## Result template

Append to QA.md: `reviewer / date / snapshot / device / browser / assistive technology / interface language / teaching language / role + workspace / task / expected / observed / PASS or FAIL / evidence / corrective owner`.

When a review finds a defect, retain the original fictional record, capture the failure, fix its narrow cause and repeat that task. Do not mark missing reviewer/device evidence N/A. Return the completed record to the product owner; it is the concrete input to frontend sign-off.

## D-046 follow-up for language reviewers

On the current build, also review a Hindi/Bengali saved explanation and question after a failed remediation request, then reload and inspect its source label, attempt history and private export. An explicit switch to the authored source language should replace available content and its language labels together. Synthetic automation checks six interface/teaching pairs; confirm real wording and screen-reader pronunciation with your team's reviewed content. Older saved units without payload metadata remain readable, but missing historical provenance is not reconstructed. The D-046 manifest is scripts-tmp/content-language-snapshot.json; D-045 broad comparisons remain historical evidence.

## D-047 follow-up for clipboard reviewers

On the current class page, copy the class code successfully, deny the next clipboard attempt, then allow and retry. The failure must clear the previous success indicator; successful retry must clear the failure message. Change or leave the class while permission/copy is pending: its eventual completion must not mark a newer class code copied. The current code stays visible and selectable when copying is unavailable. Record actual clipboard contents on your device; simulated browser tests do not complete this task.

## D-048 follow-up for microphone reviewers

Speak a question in two completed phrases, with an interim phrase between them. All completed words should remain in the review field without repeated finals. Edit the question: recording must stop and late results must leave the edit intact. Explicitly start listening again to append words, then send once. A successful saved turn clears the review for a new question; a failed save keeps the words recoverable. Check the 6000-character bound and Use text instead with the full reviewed question. Record real-device recognition behavior and wording/pronunciation; controlled callbacks do not establish those outcomes.

D-048 review detail: also delete the complete transcript and type a replacement. The editor should remain available; an empty question cannot be sent. You do not need to restart the microphone to rewrite it.

## D-049 voice-panel language review

Review the new Hindi/Bengali voice-panel controls, status and microphone recovery messages. Set interface and speech languages independently, including Hindi interface/Bengali speech and Bengali interface/English speech. Interface labels should follow the interface choice; greeting/transcript content should keep its speech language. Untranslated local errors remain English with localized recovery guidance beside them. The transcript tag expresses the chosen input language; it does not detect or translate manually entered text. Check actual screen-reader pronunciation and wording with native reviewers. These catalog translations have not received native sign-off.
