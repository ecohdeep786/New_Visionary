# Launch coverage matrix — KAN-29

Generated from `integration/contracts/launch-coverage.v1.json`. Run `npm run coverage:check`; regenerate with `npm run coverage:write` after review.

**Candidate only. No released curriculum/provider slice is accepted by this contract.** Five-role account preferences and nine synthetic category scenarios remain distinct from real source rights, verified linked-role admission, speech qualification and hosted feature acceptance.

## Category coverage

| Category | Actual setup stage | Source evidence | Current release state | Mapping boundary |
| --- | --- | --- | --- | --- |
| primary | school | Synthetic fixtures only | Unqualified | School stage exists; primary class-range acceptance and exact sources remain unqualified. |
| secondary | school | Synthetic fixtures only | Unqualified | School stage exists; secondary class-range acceptance and exact sources remain unqualified. |
| higher-secondary | school | Synthetic fixtures only | Unqualified | School stage exists; higher-secondary class-range acceptance and exact sources remain unqualified. |
| competitive | competitive | Synthetic fixtures only | Unqualified | A target-exam preference is saved; no exam syllabus, edition or provider coverage is inferred. |
| vocational | No distinct stage | Synthetic fixtures only | Unqualified | Synthetic category exists; a distinct vocational stage/source mapping is not encoded and needs acceptance. |
| higher-education | higher_ed | Synthetic fixtures only | Unqualified | Course/degree is optional user context, not an approved university curriculum. |
| independent-adult | professional | Synthetic fixtures only | Unqualified | Student independent-learning focus uses professional stage; content and model coverage remain unqualified. |
| professional | professional | Synthetic fixtures only | Unqualified | Professional account role/context exists; career content and private AI require domain acceptance. |
| employer-sponsored | professional | Synthetic fixtures only | Unqualified | Personal/professional context never proves employer membership or employer access to private history. |

## Role authority

| Role | Account setup | Domain/relationship requirement |
| --- | --- | --- |
| student | Connected locally | Current server-owned workspace/source authority; a profile role grants no shared membership. |
| teacher | Connected locally | Verified teacher/class membership, owned assignments and current publication/source scope. |
| parent | Connected locally | Verified guardian/child relationship, explicit permitted summary scope and current consent. |
| professional | Connected locally | Personal ownership plus separately verified employer membership for employer-scoped work. |
| organization | Connected locally | Verified organization membership and least-privilege shared-content/aggregate authority. |

## Independent language and delivery dimensions

- Interface locales: en, hi, bn. Teaching locale types: en, hi, bn.
- Setup language labels: English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese, Others. These are preferences, not supported source/speech declarations.
- Language identities: interface, source, input, output, script, speech; each released slice must qualify them explicitly without silent substitution.
- Boards: CBSE, CISCE, IB, Cambridge, State. State Board needs its state; all boards/exams still need exact source/edition/rights qualification.
- Modalities: text, voice, visual, build. Devices: desktop-browser, mobile-browser, native-client. Connectivity: online, offline, reconnecting.

Current server activation is adult-only. Under-18 activation remains blocked until verified guardian admission is implemented. Adult school-profile selection does not qualify school curriculum or certify age. Native delivery, offline inference and speech coverage are not inferred from browser controls or translations.

## Open acceptance gates

| Jira gate | Required evidence |
| --- | --- |
| [KAN-60](https://visionary-team.atlassian.net/browse/KAN-60) | Approved source ID/version/edition/provenance and publication rights for every actual slice. |
| [KAN-34](https://visionary-team.atlassian.net/browse/KAN-34) | Provider/output/safety capability qualification; UI names and fixtures are insufficient. |
| [KAN-44](https://visionary-team.atlassian.net/browse/KAN-44) | Verified guardian-first under-18 admission; preserve current adult-only activation. |
| [KAN-96](https://visionary-team.atlassian.net/browse/KAN-96) | Verified guardian relationship and purpose-bound, expiring/revocable summary sharing. |
| [KAN-156](https://visionary-team.atlassian.net/browse/KAN-156) | Independent input/output language, script, ASR/TTS and pedagogical-meaning qualification. |
| [KAN-158](https://visionary-team.atlassian.net/browse/KAN-158) | Founder acceptance of Free/paid/institution access, retained history and bounded usage promises. |
| [KAN-121](https://visionary-team.atlassian.net/browse/KAN-121) | Actual released category/locale/device/connectivity and recovery qualification. |
| [KAN-127](https://visionary-team.atlassian.net/browse/KAN-127) | Measured capability/release acceptance with accountable reviewers and held-out evidence. |
| [KAN-116](https://visionary-team.atlassian.net/browse/KAN-116) | Launch privacy/commercial disclosures and content/provider rights acceptance. |

## Unsupported states and recovery to validate

These are proposed product acceptance requirements for downstream wiring. The offline inspector supplies reason codes; it does not display these states or enforce product permissions.

| Scenario / diagnostic reason | Required visible outcome | Recovery boundary |
| --- | --- | --- |
| Minor / guardian-admission-not-connected | Explain that verified guardian admission is required. | Preserve the current admission block; no DOB/profile bypass. |
| Native / native-client-not-released | Identify native delivery as unavailable. | Offer the supported browser journey only when independently available. |
| Offline or reconnecting / online-domain-authority-required | Show saved draft and pending server validation separately. | Reconnect, revalidate current UID/workspace/consent/source/revision and refetch; no silent inference or duplicate commit. |
| Voice / speech-qualification-required | Explain that speech for the chosen language/script/device is not qualified. | Offer text only if that exact text slice is independently accepted and the user chooses it. |
| Linked role / server-verified-relationship-required | Show the missing class/guardian/organization/employer verification. | Verify current scoped membership; never expose private learner history from a selected role. |
| Vocational / category-source-mapping-required | Keep the category visible and identify missing curriculum mapping. | Obtain an accepted vocational/source mapping; never silently use professional content. |
| School / school-board-required, state-board-state-required, school-class-required | Request the missing curriculum context. | Preserve input; board/state/class labels still require exact source edition and rights. |
| Competitive / competitive-target-required | Request the target exam and exact syllabus/source context. | Other is a preference, not an approved exam or source. |
| Missing provenance / source-and-language-provenance-required | Identify the missing source/version/language/script. | No substituted source, language or edition; retain the original selection. |
| Complete candidate / release-source-provider-and-founder-acceptance-required | Explain that current coverage is unqualified. | Require reviewed source/provider/admission/entitlement and product acceptance before learning delivery. |
| Unknown dimension / unsupported-* | Identify the unsupported selection without a support claim. | Preserve input and offer only separately accepted choices. |

## Product acceptance still required

Pin the first real release slices across role, age/admission, category, source ID/version/rights, board/exam/medium, six language identities, modality, device, connectivity and entitlements. Record accountable founder/source/provider/admission acceptance and actual UI-to-owning-store recovery/deny evidence. Current local account/test-billing availability is not learning coverage. The report preserves all exposed categories rather than silently removing unsupported ones. KAN-29 remains open until its stated accepted matrix exists. See [the decision worksheet](../visionary/design/KAN29_LAUNCH_COVERAGE_DECISIONS.md) for the concrete first-slice proposal and remaining decisions.

The inspector returns engineering reasons and always `runtimeAuthorization: false`; it is not wired to application permission checks. Existing backend UID, workspace, consent, source, billing and admission authority remains unchanged.

## Source anchors

All seven normalized source revisions are also pinned independently in the checker. A matrix-only digest refresh cannot certify a changed producer, consumer or authority mapping; inspect the changed source and submit the updated tooling/contract for exact-SHA review.

- `integration/contracts/product-surface-review.json` — normalized SHA-256 `d0bf58700adb35e87d3a7f9b9d076b9853506e740a53ebaf852750f8e2802882`
- `frontend/src/components/onboarding/stepConfigs.jsx` — normalized SHA-256 `aacb7dbccb8c704f15708a638701428ec411aad8e0559bf0b6950e59f840ba1c`
- `frontend/src/components/onboarding/ProductSetupFields.jsx` — normalized SHA-256 `909ceb2cb2f7a4d4cda2935aab9c94efb8c66f4f802cf3d4abc534596f9327f8`
- `frontend/src/domain/workspace.ts` — normalized SHA-256 `cd820b052fc31c17c1f86f2c0919d259cb2b6019f0517f8d9f5100ca9eddb87d`
- `frontend/tests/curriculum-category-acceptance.test.mjs` — normalized SHA-256 `8c7380c8b01a5aefb016fe527461a610740b5c8c186f37b60c4255ccf112d303`
- `backend/upstream/backend/src/auth/firebase-product/profile.ts` — normalized SHA-256 `fa05afdff5429cb192b3188501ae3a690fc89b0621228fb67d49daf2c6de0e9c`
- `frontend/src/lib/onboardingLearningContext.js` — normalized SHA-256 `db69839445a86dcc7d084acb9beb9f6de79a804f87c44bad6d5775e1bd7c4d06`
