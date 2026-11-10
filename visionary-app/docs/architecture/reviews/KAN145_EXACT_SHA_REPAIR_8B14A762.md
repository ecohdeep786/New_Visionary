# KAN-145 independent storage/scope repair review

20 October 2026. Reviewer/verifier: `/root/kan145_repair_review`, separate from implementers DeepSeek and Codex. I accept responsibility for the independent inspection, rebuild, tests and probes attributed to me below.

**Decision: approved for the reviewed development backend enabler at exact implementation `8b14a762c6bb102f5034de2bb107520a03442fbd`. No blocking defect was found in the reported storage/scope repairs. This is not full KAN-145 feature acceptance, prerequisite completion, production approval, Jira Done or worktree cleanup approval.**

## Candidate and ownership

The implementing branch is `codex/deepseek-kan-145-knowledge-projection`; its prior documentation head was `e017118c2fe912e2c502e0e5eff55d1542f1e4bd` and earlier implementation was `98ce3e5916e61b3c76a01b732f29d9b49b692af6`. The new exact candidate merges accepted dev `e089319a24953bcadb522fcfef0e795065dd0c29`. The candidate remote ref was independently read back at the exact reviewed SHA.

I resumed the matching clean reviewer worktree `C:/Users/Administrator/New_Visionary/New_Visionary-worktrees/qa-review-kan-145-knowledge-projection/visionary-app`, branch `codex/qa-review-kan-145-knowledge-projection`, initially `924ab6c5a1ebba523be0667c8c508fd239ebb04e`. A conflict-free review synchronization preserves the earlier review report and its historical decisions. `git diff --quiet 8b14a762... -- backend frontend scripts integration infrastructure` returned0 before verification: the reviewed product source equals the exact implementation. My changes are review/evidence only.

## Findings resolved

The 20 October changes-requested addendum in `docs/architecture/delivery/KAN145_INDEPENDENT_REVIEW.md` remains historical evidence for the older candidate. Its P1 and P2 findings are resolved at this replacement SHA:

- The four knowledge collections are now `visionary_accounts/{uid}/knowledgeCommands`, `knowledgeReceipts`, `knowledgeProjections` and `knowledgeOutbox`: three-component collection paths and four-component document paths. The service's real constructed references and resulting documents pass installed Firestore SDK validation offline. The transactional fixture enforces collection/document parity, and its negative checks reject the former invalid hierarchy.
- Scope keys hash an ordered JSON array of workspace, concept, source version and criteria version. Opaque references containing `|` remain accepted. The formerly aliasing tuples now maintain independent probabilities, counts and receipt references, and an unprojected distinct scope returns404. UID and all four scope fields must match on reads, existing-state updates and both replay paths; corrupted state fails without writes.
- Evidence replay also checks original session/receipt identity and the command's exact projection key. An already-projected receipt cannot be referenced under another own session. A new command for the same exact evidence may add only its own idempotency receipt; it does not double-count evidence, mutate the projection or duplicate outbox records. Missing continuity data returns a redacted503; changed command/scope bindings return409.
- The reference-only command boundary, owner/session/expected-UID/Origin/CSRF controls, immutable assessment inputs, bounded policy calculation, transactional receipt/projection/outbox and model-rebuild refusal are retained. No browser verdict, knowledge probability or reference calibration parameter becomes assessed mastery.

I compared eight accepted platform/runtime/workflow files against dev, including the product entrypoint, platform production HTTP, product tsconfig, Dockerfile/ignore, isolated runtime package/lock and production workflow: all are byte-identical. The only production-check addition requires the knowledge source and its test file together and includes its regressions in the isolated deployed-lock suite. No production project, publication or deployment boundary changes.

A byte-level script confirmed STATUS, QA and DECISIONS each retain the exact common base followed by the previous task tail and accepted dev tail before the new repair addendum. Source audit generation preserves operation/authority declarations; it does not infer hosted readiness.

## Verification and attribution

Independently executed on the candidate source in the reviewer checkout:

| Check | Actual result |
| --- | --- |
| `npm run backend:build` | EXIT0, freshly compiled candidate |
| `node --test backend/tests/knowledge-projection.test.cjs` | EXIT0,11/11 pass,0failed/skipped;4.713s |
| Additional compiled-service corrupt-record probes |7/7 pass; each UID/workspace/concept/source/criteria corruption rejects a fresh evidence update with409 and zero writes; changed replay projection key409; missing immutable ledger503; no network/credentials |
| `npm run scope:audit` | EXIT0;68routes,29endpoints,1645control declarations,219control files; hostedVerified false |
| Product-source equivalence, eight platform files and exact append-history preservation | Pass |

The focused suite includes actual installed-SDK reference construction, fixture parity negatives, the formerly colliding opaque tuples, corrupt read/replay scope and original-session replay refusal. It also exercises reference-only command injection denials, independently calculated posterior, missing/foreign/tampered assessment records, concurrent duplicate submissions, lost-response retry, persisted model mismatch and loopback HTTP authority. The fixture serializes transactions; these results do not establish actual Firestore retry/concurrency or IAM behavior.

I inspected the implementing checkout's actual ignored logs under `artifacts/qa/kan145-repair/` and attribute these longer checks to Codex rather than claiming to rerun them:

- Backend build and full backend suite:84/84 pass,0failed/skipped;14.781s.
- Root check: EXIT0;18script and532frontend tests pass, layout/import/sourceaudit/lint/typechecks/build pass; frontend build84s.
- Runtime lock installation:302packages; isolated product/test TypeScript compilations and deployed-lock regressions:76/76 pass,0failed/skipped;21.605s. I inspected the complete TAP log and the parent confirmed command exit0 before this decision.

Reviewer-local logs/probes are ignored under `artifacts/qa/kan145-repair-review/`. No live Firebase account, password, credential, production store or deployment was accessed by this reviewer. The separate synthetic password-auth verification reported by the integrator does not qualify KAN-145 learning acceptance.

## Remaining gates and integration decision

Live Jira was independently read during this review: KAN-145 Testing; KAN-144 and KAN-74 To Do. Full acceptance still lacks the accepted owning-store/content/criteria path, held-out calibration, connected UI, current-project hosted transactions/IAM and a real two-device learner outcome. The pending KAN-146 assessment-store integration is separately owned; any changed assessment/session contract or combined module conflict requires integration review. Existing account-directory still marks learning unconnected.

The old invalid collection layout is not used as a fallback and no stored learner data is deleted or migrated. The new contract requires an owner audit and explicit immutable-evidence rebuild before rollout if any alternative older deployment persisted data. No current-project hosted learner-record migration was verified by this review.

Minor nonblocking documentation note: `integration/KNOWLEDGE_PROJECTION_CONTRACT.md` still labels its verification paragraph as8tests; the current suite has11. An evidence-only follow-up may correct that count while retaining the reviewed implementation SHA explicitly.

The founder's scope clarification is pending at review time. This technical approval supports only the repaired development enabler. It does not redefine the full Jira acceptance or authorize assuming completed prerequisites. The integrator must record any explicit scoped-enabler acceptance, retain linked full-feature gates, perform checked dev integration and obtain actual native Jira status before claiming Done/cleanup. Without that acceptance, keep full KAN-145 open. Main promotion and production remain separately gated.

Any later runtime/shared-contract/conflict-resolution change invalidates this exact implementation approval and requires renewed review. No dev/main ref, Jira field/status, cloud resource or worktree registration was changed by this reviewer.
