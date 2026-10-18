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

## Product acceptance still required

Pin the first real release slices across role, age/admission, category, source ID/version/rights, board/exam/medium, six language identities, modality, device, connectivity and entitlements. Record accountable founder/source/provider/admission acceptance and actual UI-to-owning-store recovery/deny evidence. Current local account/test-billing availability is not learning coverage. The report preserves all exposed categories rather than silently removing unsupported ones. KAN-29 remains open until its stated accepted matrix exists.

The inspector returns engineering reasons and always `runtimeAuthorization: false`; it is not wired to application permission checks. Existing backend UID, workspace, consent, source, billing and admission authority remains unchanged.

## Source anchors

- `integration/contracts/product-surface-review.json` — normalized SHA-256 `f4e339d9b8836d3d473259caab5c5c2042d35f37980684c042ac300a096f02c0`
- `frontend/src/components/onboarding/stepConfigs.jsx` — normalized SHA-256 `aacb7dbccb8c704f15708a638701428ec411aad8e0559bf0b6950e59f840ba1c`
- `frontend/src/components/onboarding/ProductSetupFields.jsx` — normalized SHA-256 `909ceb2cb2f7a4d4cda2935aab9c94efb8c66f4f802cf3d4abc534596f9327f8`
- `frontend/src/domain/workspace.ts` — normalized SHA-256 `cd820b052fc31c17c1f86f2c0919d259cb2b6019f0517f8d9f5100ca9eddb87d`
- `frontend/tests/curriculum-category-acceptance.test.mjs` — normalized SHA-256 `8c7380c8b01a5aefb016fe527461a610740b5c8c186f37b60c4255ccf112d303`
- `backend/upstream/backend/src/auth/firebase-product/profile.ts` — normalized SHA-256 `fa05afdff5429cb192b3188501ae3a690fc89b0621228fb67d49daf2c6de0e9c`
- `frontend/src/lib/onboardingLearningContext.js` — normalized SHA-256 `db69839445a86dcc7d084acb9beb9f6de79a804f87c44bad6d5775e1bd7c4d06`
