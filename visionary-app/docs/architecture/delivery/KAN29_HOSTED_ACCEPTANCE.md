# KAN-29 hosted engineering acceptance

19 October 2026. Implementer: Codex. Independent source reviewer: kan29_runtime_review. Exact approved application source: `79797d1ab21c64e4e2632703421ed5083b2fedab`; reviewer report `63166e36d42a597b346f93fa3f09c7be6b12f35d`, imported `a33a10bf585e16ec6b615e8a07e6f9de162c38b0`. This record supplies engineering verification, not founder approval of a narrower task or real learning release.

## Observed result

[Managed product host](https://visionary-product-1022011629348.asia-south1.run.app/login). Service visionary-product / project visionary-fd6d2 / asia-south1. Ready revision `visionary-product-kan29-79797d1a` serves 100%; immutable private registry image:

```text
asia-south1-docker.pkg.dev/visionary-fd6d2/visionary-product/product@sha256:daddef811b7d7817afb00f18ab2ffa115eb5c3d7574efa8590d49cd6994c2384
```

Source archive: 639 files / 9,739,449 bytes / SHA256 4832d4289a870a2f97dcd45139b58925f9191fb9552e069eed1272c215c6c08f matched actual upload. OCI source label matches the approved SHA. Locked Linux build succeeds; first regional push refusal resolves with unchanged-image retry, exit 0. Nine actual container checks pass under 1 CPU / 512 MiB, network disabled/read-only filesystem, UID 1000, RSS 123,002,880 bytes. No live Firebase/provider call occurs in that isolated check. Detailed build/deployment history: [Linux verification](KAN29_LINUX_IMAGE_VERIFICATION.md).

Actual service and revision maximum 1, minimum 0 (default), 1 CPU / 512 MiB, concurrency 20 / timeout 30 seconds, request CPU throttling/no startup boost, generation 2. Dedicated runtime identity and its existing one secret are preserved. Existing approved service-specific public invoker mode remains; organization policy unchanged. Existing named Firestore database default is retained. No DNS change, load balancer, SQL/Redis, model serving or live money. Maximum instances is not a hard spending cap or load-capacity certification. The checked-in budget-profile is a target recipe; this observed receipt records deployment state.

| Verification | Observed evidence and limit |
| --- | --- |
| Public boundaries | /login → 200 HTML/no-cache; /api/health → 200 JSON/no-store; anonymous protected account APIs → 401 JSON/no-store; unknown API → 404 JSON. Health is liveness, not Firebase readiness. |
| Real Auth/API/store | On earlier approved source 2d45f078 / image 3cef290f: genuine Firebase custom token→verified ID token→secure session→canonical UID account with nested billing/test and structure/account; persisted setup/introduction; minor/UID/CSRF/injected authority/stale revision denied; unqualified source unavailable; second independent session recovers same account and logout isolation passes. Synthetic identity disabled afterwards. |
| Current hosted browser | On 79797d1a / daddef811: actual authenticated Learn UI→real API→same persisted synthetic account; all 9 categories, honest unreleased state, 1280px desktop / 390px mobile without coverage overflow, no page errors, reload recovery/profile revision unchanged, logout denial. Captures/receipt retained in ignored artifacts/gcp/79797d1ab21c64e4e2632703421ed5083b2fedab. No response interception or fixture database. |
| Rollback/restoration | Actual traffic switched 100% to last verified 2d45f078 revision: login 200, anonymous auth 401, new API health 404. Restored 100% to 79797d1a: health 200. Both CLI commands exit 0; returned traffic confirms restored revision. Hosted browser/account verification passes again after restoration. No data migration/delete. |
| Independent/local checks | Previous full application source 7650049e: root check exit 0, 30 script/537 frontend/79 backend tests and 5 fixture browser groups. Packaging security suite expands to 31 script tests. Independent health replacement: product TypeScript compile exit 0 and 2 production HTTP tests pass. Earlier results remain attributed to their actual source/environment. |

Only the existing marked synthetic QA identity was used, re-enabled temporarily and disabled in finally; test sessions logged out. No existing real user records were read or changed. Credentials, ID/custom/session tokens and cookies stay out of receipts/Git/Jira. This does not certify email delivery or Google/Apple sign-in, real source rights, provider quality, minor admission, privacy/commercial acceptance or production load.

## Real source coverage still required

All five roles and all nine categories remain in scope: primary, secondary, higher secondary, competitive exams, vocational, higher education, independent adult learning, professional and employer sponsored. The release contract has **zero accepted real learning slices**, releaseQualified=false and no founder acceptance. Each visible category is explicitly unreleased; this is accurate availability and enforcement, not successful curriculum delivery. Source/version, rights, six distinct language axes, script/modality/device/connectivity, admission and verified relationships must be qualified for any future released slice.

These linked gates were read live on 19 October; all are To Do:

| Open gate | Remaining acceptance |
| --- | --- |
| [KAN-60](https://visionary-team.atlassian.net/browse/KAN-60) | Stable source/version/rights/visibility/language metadata and content ownership. |
| [KAN-34](https://visionary-team.atlassian.net/browse/KAN-34) | Every exposed real sign-in provider/method configured and tested. |
| [KAN-44](https://visionary-team.atlassian.net/browse/KAN-44), [KAN-96](https://visionary-team.atlassian.net/browse/KAN-96) | Approved admission/guardian workflow and verified purpose/expiry/revocation relationships. |
| [KAN-116](https://visionary-team.atlassian.net/browse/KAN-116) | Accountable privacy/commercial disclosures and content/model/provider rights approval. |
| [KAN-121](https://visionary-team.atlassian.net/browse/KAN-121), [KAN-127](https://visionary-team.atlassian.net/browse/KAN-127) | Real released category/source/language/device/accessibility/recovery outcomes and measured quality/latency/error/cost. |
| [KAN-156](https://visionary-team.atlassian.net/browse/KAN-156), [KAN-158](https://visionary-team.atlassian.net/browse/KAN-158) | Indian-language speech qualification and released equitable-access/continuity policy. Native prerequisite semantics remain; no blanket unblock. |

Independent review approves the exact engineering source and does not supply founder/source acceptance. The founder explicitly retains the full KAN-29 requirement until real source coverage is accepted. Enabler-only closeout is not accepted. Successful denial of unqualified content does not meet that release criterion.

Current dev 99d67efd585e9e9d48d838b1dcc0c4fd755c658d adds landing work after the tested task base c960aba0. Eventual integration must preserve it and run relevant checks/review; no merge, Jira Done or worktree removal is claimed. Reviewable engineering is pushed, and the next implementation task waits for actual accepted disposition under the repository workflow.

## Founder disposition — 19 October 2026

Founder explicitly chose: “Keep full KAN-29 scope open until real source coverage is accepted.” Native Jira comment 10037 records it. KAN-29 stays Testing with the full matrix/source acceptance criteria. Technical source approval and the passed hosted engineering checks remain useful evidence, without whole-ticket completion, dev/main merge, worktree cleanup or next implementation task. Linked open gates and native prerequisite semantics remain as listed.

Selected local test scripts, receipts and screenshots are copied outside the task checkout to primary ignored artifacts/qa/kan29-hosted-20261019; all eight SHA256 copies match. Sanitized operational receipts remain in Cloud Shell /home/shahidali/kan29-hosted-evidence-20261019.zip, 7,890 bytes, SHA256 e91d334d0a0e3ea31ae111596ab10cfee0267cd65407f585feeab85077b14246. The UI reports exact-ZIP download success, but no local archive path/bytes were independently verified; no local ZIP backup is claimed. Earlier mistakenly selected home-folder transfer was cancelled with zero items transferred.
