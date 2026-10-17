import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const ledger = read('docs/architecture/tracking/founder-spec-review.json');
const map = read('docs/architecture/tracking/jira-issue-map.json');
const link = id => { const key = map.issues[id]?.key; if (!key) throw Error('Unmapped founder requirement ' + id); return `[${id} / ${key}](${map.site}/browse/${key})`; };
const lines = [
'# Founder specifications: product and launch reconciliation', '',
'16 October 2026 · D-086 · Internal engineering review. [Launch checklist](BACKEND_LAUNCH_CHECKLIST.md) · [Feature delivery](FEATURE_DELIVERY_MATRIX.md) · [Jira tracking](tracking/JIRA_SYNC.md).', '',
'## Decision', '',
'Improve the current product through one authorized learning-to-Build evidence path. Keep its existing frontend journeys, premium UI, five roles, source/language distinctions, Firebase UID/auth/onboarding, test billing/invoices, account/device synchronization and optional feedback. Historical company drafts supply product intent, not executable instructions or evidence that capabilities already work. No automatic adoption of old auth, cloud stacks, prices, model names, contracts, legal deadlines or launch dates.', '',
'VATS describes what the learner needs; AIRA coordinates how the system responds through deterministic, bounded state transitions and typed tools. Nineteen logical responsibilities do not require nineteen deployed services. A broad AGI ambition is distinct from integration readiness and demonstrated cognitive capability. No ticket count, generated response, model confidence or posterior establishes AGI or assessed mastery.', '',
`Reviewed **${ledger.sourceFiles} source files**, **35 numbered topics**, **${ledger.extractedWords.toLocaleString('en-US')} extracted words** and **${ledger.imagesInspected} embedded PNGs**. Body/tables and document XML parts were extracted read-only; all extracted text and images were inspected. The two Doc03 variants were reviewed separately. The two Doc17 files have different bytes but identical extracted text. Originals remain unchanged. ${ledger.limitations}`, '',
'The [per-file ledger](tracking/founder-spec-review.json) retains SHA-256, extracted-text hash, text-block/image counts and decisions. Raw extracts/images stay in ignored `artifacts/research/founder-spec-review-2026-10-16/`; Jira receives derived implementation requirements, not the private source documents. The ledger and this report also contain internal requirements and should remain in the private engineering workspace.', '',
'## Current runtime and proposed connection', '',
'The active auth bootstrap connects account/onboarding/device sessions, test billing and feedback only. Imported legacy application/ML startup remains disconnected. The new learning policy is a pure module with offline tests; there are no live learning controllers, SQL transactions, new frontend facades or provider calls from this change.', '',
'```mermaid',
'flowchart TD',
'  UI[Existing frontend journeys and device drafts] --> API[Versioned Nest API]',
'  API --> AUTH[Verified Firebase UID and session]',
'  AUTH --> POLICY[Current workspace object consent source and entitlement policy]',
'  POLICY --> ACCOUNT[Firestore account billing feedback]',
'  POLICY --> CMD[Idempotent command and expected revision]',
'  CMD --> SQL[SQL canonical learning Build and assessment evidence]',
'  SQL --> OUTBOX[Owning-store outbox and durable jobs]',
'  OUTBOX --> AIRA[Deterministic AIRA state machine]',
'  AIRA --> CTX[P0 policy P1 permitted learner P2 session P3 retrieval]',
'  CTX --> TOOLS[Allowlisted retrieval model and bounded tools]',
'  TOOLS --> GUARD[Typed output source and safety validation]',
'  GUARD --> RECHECK[Recheck current authority before commit or delivery]',
'  RECHECK --> SQL',
'  SQL --> OBS[Authorized cursor polling or SSE and refetch]',
'  ACCOUNT --> OBS',
'  OBS --> UI',
'  TOOLS --> OBJECTS[Private versioned assets and approved scene manifests]',
'```', '',
'This is a target design. Retain the GCP-first modular plan: public load balancer/WAF and static CDN, bounded Cloud Run API/private workers, Firestore for current identity/account/billing records, Cloud SQL/PostgreSQL with pgvector for transactional product domains, private object storage and owning-store outbox/managed jobs. Redis and richer bidirectional transport are optional after measured need; neither cache nor socket grants authority. Current frontend caches still require account-switch/invalidation tests. Cloud resource activation, live webhooks, recovery, capacity and cost evidence remain release work; the 100,000-MAU target is not a tested capacity claim. This review does not provision services or quote current prices.', '',
'Keep original backend/ML imports as provenance/reference. Add product-owned modules and adapters incrementally; retire a legacy entry point only after a reachable-import audit and accepted replacement. No bulk deletion, replacement database or model replatform was performed.', '',
'## Evidence and state ownership', '',
'One opaque Firebase UID links each user across devices. The readable account tree is a projection, not one unbounded document or a name-based key. Learning and Build records carry UID/workspace/object ownership, source and criteria versions, command/receipt identity and revision. Teacher/guardian/employer access requires separately verified, purpose-scoped relationships; Family payment is not guardian consent.', '',
'Assessment transaction → immutable scored receipt → ordered knowledge projection → separately reviewed mastery projection → next teaching/review recommendation. Commit projection, receipt deduplication and outbox in the owning SQL transaction. Firestore↔SQL handoffs reconcile durably; there is no assumed atomic distributed commit. Rebuild projections from approved evidence on model/criteria change or sequence gaps. Browser completion, a conversation, elapsed reading time, a Build artifact or a BKT posterior cannot silently create mastery.', '',
'Learning state: explain → validated check → immutable assessment → check passed, different remediation, or review suggested after at most three failed checks. A passed check is not a mastery certificate. Current-source prerequisites, approved pedagogy, due review and readiness use pinned versions; due dates and mock timers survive reconnect. The UI must explain unavailable source, insufficient evidence and pending review without fabricated metrics, ranks or history.', '',
'Context memory is scoped by purpose, relationship, source and retention policy despite the shared UID. Each observation needs provenance and correction/control. P0 policy and required source grounding cannot be dropped merely to meet a token/latency budget. No default raw conversation training, hidden chain-of-thought storage, automatic weekly fine-tuning, model promotion, contact harvesting, data purge or imported TTL was enabled.', '',
'## Implemented locally in this review', '',
'| Change | Local evidence | Remaining integration |',
'| --- | --- | --- |',
'| Product-owned knowledge/teaching policy | `backend/upstream/backend/src/learning/teaching-policy.ts`; five tests in `backend/tests/teaching-policy.test.cjs`; independent Bayes calculations, receipt conflicts, scope/replay/order/version checks and three-failure bound | Authorized SQL receipt transaction/global deduplication, criteria calibration, controllers, frontend, scoped observation and two-device acceptance remain LEARN-09/10. The pure module is not an authentication or receipt-signature verifier. |',
'| Shared `retrieval-binary-v2` metrics | Python and Go use unique IDs before K, unique gold IDs and log2 discount; thirteen independent shared fixture cases; zero/negative K handled; report contract version; dummy CLI requires explicit `--demo` | Requalify historical reports and run approved real retrieval on held-out source/version slices. Fixture success is not a model benchmark. |',
'| NLI client evidence contract | Unavailable/malformed/partial/out-of-range/mismatched responses return error and no grounded success; bounded response body and redacted failure body; short nonempty claims are included | Gateway callers still ignore some errors and streaming/cache paths lack complete current-policy guards. AI-06/08 remain open; imported gateway stays disconnected. NLI is neither factual truth nor child-safety assurance. |', '',
'No new feature is marked Done. AI-11 may enter Testing for the local metric repair; LEARN-09/10 may enter In Progress for the pure policy implementation. Durable adapters, source publication, actual browser workflows and hosted gates require their own acceptance evidence.', '',
'## Per-file decisions', ''
];
for (const r of ledger.records) {
  lines.push(`### ${r.id} — ${path.basename(r.source, '.docx')}`, '',
    `Disposition: **${r.disposition}**. Read ${r.textBlocksReviewed} extracted blocks and inspected ${r.embeddedImagesInspected} embedded images.`, '',
    `Retain: ${r.retain}`, '', `Correction or gate: ${r.correction}`, '',
    `Delivery: ${r.tickets.map(link).join(', ')}.`, '',
    ...(r.duplicateNote ? [r.duplicateNote, ''] : []));
}
lines.push('## Ordered launch work', '',
'1. Finish the existing Now queue: route/control and released audience inventory, API/schema/error contracts, current source admission and relationship/consent authority, canonical domain database/outbox, and bounded API admission. Founder documents do not bypass those decisions.',
'2. Publish one approved source/concept/criteria snapshot. Connect assessed practice to the durable receipt and learner projection, then bounded teaching, due review and exact resume. Demonstrate the same authorized committed state on two devices; retry never double-scores or double-charges.',
'3. Add purpose-scoped context and the deterministic AIRA workflow over an evaluated API/model adapter. Required citations, typed scenes, safety, cancellation, usage settlement and invalidation cover batch/stream/cache alike. Keep own-model training later until founder strategy, rights and held-out evidence qualify it.',
'4. Complete teacher/guardian/professional/organization privacy projections and Build exact-revision artifact workflows with their linked acceptance. The current UI may remain broader than the first released slice only when unavailable actions explain their status truthfully.',
'5. Test actual released UI→API→store→job/model→committed outcome, denial/revocation, disconnect/retry, source/model change, provider outage, account switch, payment reconciliation, accessible device/language fallback and optional simple feedback. Measure outcome quality, cost, load and restore/rollback before controlled hosting.', '',
'The updated backlog has 137 source tasks: 12 historical local Done, 119 open launch items and 6 Later. Nine added tasks are CONTENT-08, LEARN-09/10/11/12, AI-15/16, SAFE-01 and LATER-06. The target prerequisite graph has 75 task edges plus 30 phase edges, with no task cycles. Final Jira read-back and actual statuses are recorded in JIRA_SYNC; this paragraph states scope rather than claiming hosted readiness.', '',
'Marketplace/B2G/referrals/native expansion/22-language coverage remain subject to explicit released scope, privacy, rights, commercial and device/provider acceptance. No new launch promise, dated schedule or commercial policy follows from the old drafts. Keep a small work-in-progress queue and use verified outcomes, not quantity of generated features, as completion evidence.', '');
fs.writeFileSync(path.join(root, 'docs/architecture/FOUNDER_SPEC_RECONCILIATION.md'), lines.join('\n'));
console.log(JSON.stringify({ reviewedFiles: ledger.records.length, report: 'docs/architecture/FOUNDER_SPEC_RECONCILIATION.md' }));
