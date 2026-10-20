# KAN-145 storage and scope repair

20 October 2026. Implementer Codex; prior implementer DeepSeek. Acceptance submitted: development backend enabler, not a connected learner release. Separate exact-SHA review pending.

Resumed matching task instance `codex/deepseek-kan-145-knowledge-projection`, previous head e017118c2fe912e2c502e0e5eff55d1542f1e4bd, integrated accepted dev e089319a24953bcadb522fcfef0e795065dd0c29. Own knowledge service, command/contract, transactional fixture/regressions, deployed-lock test inclusion and task evidence. Unrelated primary landing work is preserved.

## Defect repairs and evidence

- Four knowledge collections are valid direct subcollections of the verified account UID document: knowledgeCommands, knowledgeReceipts, knowledgeProjections, knowledgeOutbox. The fictional transactional repository now rejects invalid collection/document parity, so it cannot hide the actual SDK defect. An offline installed-SDK regression validates the service's constructed references and every resulting document path without credentials/network/database operations.
- Scope keys hash the JSON-serialized ordered workspace/concept/source/criteria tuple. Reads, existing projection updates and both replay paths require every stored UID/scope field to match. Two formerly colliding delimiter-containing accepted tuples retain independent projections; corrupted scope is rejected without writes.
- Replayed assessed evidence remains bound to its original session and receipt. Same evidence under another own session is rejected without an idempotency write. Reference-only commands still cannot supply a verdict, score, timestamp or identity. New command IDs for the same exact evidence create only a command receipt; no duplicated evidence/projection/outbox.
- No silent old-key fallback or data deletion/migration. The old four-component collection paths could not persist through standard Firestore; this unreleased candidate has no accepted hosted learner records. If a separately deployed alternative store exists, audit it and explicitly rebuild from retained immutable assessments before rollout. HTTP version remains1.
- Deployed-lock production checks require knowledge source and its test file together and run those regressions alongside the accepted platform suite. Accepted KAN-162 workflow, image/runtime lock, project and HTTP entrypoint are retained.

## Verification at candidate source

`npm run backend:build`: EXIT0. Focused knowledge regression:11/11,0failed/skipped. Full backend `node --test --test-concurrency=2 backend/tests/*.test.cjs`:84/84,0failed/skipped. Root `npm run check`:EXIT0,18script and532frontend tests, lint/typechecks/layout/import/sourceaudit/build pass; frontend build84s. Isolated deployed-lock test execution is still pending at this source checkpoint; its completed receipt will follow before review approval/integration. Local logs: ignored artifacts/qa/kan145-repair.

## Required acceptance and dependencies

Live KAN-144 and KAN-74 remain To Do. KAN-145 still lacks SQL owning-store migration/authority, authoritative published criteria/content, held-out calibration, connected UI, current-project hosted transaction/concurrency/IAM and real two-device browser acceptance. The source catalog's reference parameters do not establish educational calibration or mastery. Existing account-directory marks learning unconnected. KAN-146 assessment-store dependency also remains separately owned and unaccepted. No production deployment, full feature Done or prerequisite completion is claimed.

Source approval and local tests alone do not establish the full task acceptance. Integrator must retain these gates and obtain the required scope acceptance before dev integration/native Done/cleanup. Any conflict resolution or runtime change requires a new exact-SHA review.
