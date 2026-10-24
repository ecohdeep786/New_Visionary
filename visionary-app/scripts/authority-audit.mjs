import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = 'backend/upstream/backend/src/';
const target = 'integration/contracts/operation-authority.v1.json';
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const controllerFiles = [
  'auth/firebase-product/firebase-product.controller.ts', 'auth/firebase-product/account.controller.ts',
  'billing/billing.controller.ts', 'feedback/feedback.controller.ts',
  'learning/learning.controller.ts', 'learning/knowledge-projection.controller.ts',
].map(file => backend + file);
const provenanceFiles = [...controllerFiles, ...[
  'auth/firebase-product/firebase-product.module.ts', 'auth/firebase-product/request-authority.ts',
  'auth/firebase-product/firebase-product.service.ts', 'auth/firebase-product/account-storage.ts',
  'auth/firebase-product/session-policy.ts', 'auth/firebase-product/identity-admission.ts',
  'billing/billing.service.ts', 'billing/billing.repository.ts', 'billing/razorpay.provider.ts',
  'feedback/feedback.service.ts', 'learning/learning.service.ts', 'learning/learning.contract.ts',
  'learning/knowledge-projection.service.ts', 'main-auth.ts', 'platform/production-http.ts',
].map(file => backend + file), 'integration/contracts/product-surface-review.json',
  'integration/contracts/request-limits.v1.json', 'integration/contracts/v1/openapi.json'];

const profile = (actor, workspace, object, source, consent, stores, state = 'observed') => ({ actor, workspace, object, source, consent, stores, state });
export const profiles = {
  public: profile('Anonymous public caller; no authenticated identity inferred', 'No workspace grant', 'Public methods/catalog/static status only', 'No private content/source access', 'No private-data consent inferred', ['none']),
  csrf: profile('Anonymous bootstrap; random CSRF cookie/token is not identity', 'No workspace grant', 'Current browser CSRF cookie only', 'Not applicable', 'Not consent to product/provider processing', ['none']),
  exchange: profile('Firebase-verified ID token, current identity admission and rate limits; existing cookie/device binding retained', 'Onboarding role/preferences grant no verified membership', 'Verified UID account/session/device; current session-policy epoch/cutoff', 'No educational source grant', 'No guardian or model-processing consent inferred', ['auth']),
  sessionRead: profile('Verified current session AND device; /me does not require expected-account header', 'No workspace membership inferred', 'Server-derived UID profile only', 'No source grant', 'No relationship consent inferred', ['auth']),
  ownerRead: profile('Verified current session/device and compared X-Visionary-Account hint', 'Account-level only; no workspace grant', 'UID-derived account/device/invoice records; cursors stay within owner collection', 'No educational source grant', 'No staff/guardian/payer-to-learning grant', ['auth', 'billing']),
  ownerWrite: profile('Verified current session/device, expected-account match, exact Origin and CSRF; rate limits', 'Self-reported role/workspace preferences are not membership', 'UID-owned profile/onboarding with transaction session-version check', 'No educational source grant', 'No guardian/organization proof inferred', ['auth']),
  logout: profile('Exact Origin/CSRF; device lookup plus expected UID OR matching cookie hash; no-op for absent/invalid device', 'No workspace grant', 'Only selected device/session revocation and cookie cleanup; not ordinary full-session authentication', 'Not applicable', 'No grant; revocation only', ['auth']),
  logoutAll: profile('Enabled action, verified session cookie/device binding and expected UID; transaction epoch and replay checks', 'No workspace grant', 'Current UID session-policy epoch/cutoff, device/session revocation and auth events', 'Not applicable', 'No grant; revocation only', ['auth']),
  billingRead: profile('Verified current session/device plus expected-account match; passive read', 'Billing account, not educational workspace', 'Current UID billing/test and owner invoice; Family invitation reads also match verified payer email/expiry/status', 'No educational source access', 'Family billing benefit is not guardian/learning-data consent', ['billing', 'auth']),
  billingWrite: profile('Browser writer helper requires current session/device/account, Origin/CSRF and billing rate limit', 'No educational workspace grant', 'Server UID payer/test subscription or owned Family seats; recipient acceptance checks addressed verified email and current seat state', 'No educational source access', 'Billing agreement/seat acceptance does not prove guardian relationship', ['billing', 'auth']),
  billingJob: profile('Configured reconciliation credential checked by provider.authorizeReconciliation; browser cookies are insufficient', 'No caller-selected tenant/workspace grant', 'Server due queue, UID-owned test billing and transactional leases; bounded reconciliation', 'No learning source access', 'No private educational access or support impersonation', ['billing']),
  billingWebhook: profile('HMAC over exact raw bytes, bounded event ID/digest; test merchant mapping; no browser CSRF requirement', 'No caller-selected workspace/UID', 'Server subscription/payment mapping, deduplicated provider event and due queue; unmapped event grants nothing', 'No educational source access', 'Provider event is not guardian/learning consent', ['billing']),
  feedbackRead: profile('Current session/device and expected-account match', 'Account-level only', 'Only UID-owned feedback page; bounded UUID cursor; no operator listing', 'No source/private lesson disclosure grant', 'Feedback is not training consent or an emergency/support case', ['feedback']),
  feedbackWrite: profile('Current session/device/account, exact Origin/CSRF; service admission and command identity', 'Account-level only', 'Only UID-owned optional feedback, command receipt and counters', 'No source grant', 'No automatic Jira export, model training or staff/guardian read', ['feedback']),
  learningRead: profile('Current session/device and expected-account match', 'workspaceId is an owner-collection filter/tag, not a verified membership grant', 'UID-nested learning sessions; stored UID checked; no raw answer-key projection', 'Stored source/criteria versions bind record consistency; published rights/withdrawal authority remains missing', 'No teacher/guardian/employer access or consent grant', ['learning']),
  learningWrite: profile('Current session/device/account plus Origin/CSRF', 'Owner records only; workspace tag consistency is not membership proof', 'UID-nested session/command/assessment transaction, expected revision and replay fingerprint; server scores stored authored key', 'Source/provider/criteria references and authored check input are bounded client input; no independent approved-source authority is established', 'No shared-classroom/guardian/model-provider consent established', ['learning']),
  knowledgeRead: profile('Current session/device and expected-account match', 'Owner projection scoped by workspace/concept/source/criteria; no verified membership added', 'UID-nested knowledge projection or selected model metadata; pKnown is not assessed mastery', 'Exact source/criteria/model compatibility, not published-source licensing', 'No cross-user reporting or model-data permission', ['knowledge']),
  knowledgeWrite: profile('Current session/device/account and Origin/CSRF', 'Scope derived from owned saved session/assessment; consistency checked', 'Owned immutable assessment receipt to projection/command/receipt/outbox transaction; bounded replay/rebuild checks', 'Pins stored source/criteria/model revisions; authoritative source/criteria service still gated', 'No cross-user or training permission', ['knowledge', 'learning']),
  domain: profile('REQUIRED: server-verified UID/session, expected account, action-specific admission; writes require Origin/CSRF', 'REQUIRED: current verified membership/capability, never preview role or caller workspaceId', 'REQUIRED: current owner/object/action and exact revision/digest; reauthorize duplicate and in-flight work', 'REQUIRED: current published source/version/rights and permitted action; withdrawal checked', 'REQUIRED: current purpose/relationship/consent/entitlement; payment is not a role', ['domain'], 'proposed'),
  privateFile: profile('REQUIRED: current authenticated UID and permitted action; signed URL possession alone is insufficient', 'REQUIRED: current workspace/object/source authority', 'REQUIRED: private object/asset/export ownership, quarantine/finalize checks; reauthorize downloads and issuance', 'REQUIRED: approved media/source rights and permitted offline/export use', 'REQUIRED: purpose/consent, expiry/revocation; downloaded bytes have residual-access limits', ['domain', 'privateObjects'], 'proposed'),
  privateJob: profile('REQUIRED: verified queue/service identity, scoped operation and accountable operator where applicable', 'REQUIRED: reload original current owner/workspace/action; never authorize by queue payload', 'REQUIRED: owning-store receipt/outbox, immutable command identity, revision and cancellation; no cross-store ACID claim', 'REQUIRED: source/rights recheck at execution and delivery', 'REQUIRED: current purpose/consent/entitlement; expired/revoked work cannot commit', ['domain', 'jobs'], 'proposed'),
  profileStage: profile('REQUIRED: current verified UID and action-specific confirmation; inferred stage is only a suggestion', 'REQUIRED: own personal profile; institution/guardian/employer grants stay separate', 'REQUIRED: one selected profile owning store, exact profile/mapping/receipt revision; undo/postpone cannot erase later work', 'REQUIRED: accepted immutable source/criteria mapping and current publication rights', 'REQUIRED: current admission/relationship/purpose/consent; no automatic promotion', ['profileTarget'], 'proposed'),
  privateCoaching: profile('REQUIRED: current verified UID acting on own private goal; teaching role does not grant another person access', 'REQUIRED: current personal scope; institutional membership does not expose private coaching', 'REQUIRED: UID-owned goal/history and exact revision; any separately shared summary needs current audience/purpose authorization', 'REQUIRED: accepted source/evidence rights for any grounded recommendation', 'REQUIRED: private purpose by default; no automatic publication, employer/guardian disclosure or model-data permission', ['domain'], 'proposed'),
  guardian: profile('REQUIRED: verified guardian identity and permitted relationship, not a payer/role string', 'REQUIRED: current approved relationship scope; no blanket child workspace access', 'REQUIRED: purpose/audience/freshness-limited summary; no raw private doubts or private chat access', 'REQUIRED: current source/summary evidence rights', 'REQUIRED: verified, unexpired and revocable relationship/consent; safeguarding disclosure rules', ['domain'], 'proposed'),
  institution: profile('REQUIRED: verified role-appropriate learner/teacher/org/employer actor and action capability', 'REQUIRED: current class/org/workspace membership; claimed category or admin UI is insufficient', 'REQUIRED: fixed assignment/submission ownership or explicitly shared professional object; no personal/private-learning dump', 'REQUIRED: approved publication/source/rubric and withdrawal scope', 'REQUIRED: role-specific purpose, consent and aggregate suppression; private coaching stays private', ['domain'], 'proposed'),
  support: profile('REQUIRED: approved strong/step-up operator identity, scoped capability and audited reason', 'REQUIRED: case-specific tenant/subject access, no default impersonation', 'REQUIRED: bounded case/export/redacted diagnostic access; no unrestricted account dump', 'REQUIRED: disclosure/minimization policy; no implicit source reuse', 'REQUIRED: accepted support/safeguarding purpose and applicable consent/exception policy; feedback is not emergency coverage', ['domain', 'jobs'], 'proposed'),
};

const storeDefinitions = {
  none: { state: 'observed', authority: 'No durable owning store for this operation; public config/static output or CSRF cookie only' },
  auth: { state: 'observed', authority: 'Firebase Auth verifies identity; Firestore visionary_accounts/{uid}, UID devices/authEvents, server session lookup and auth operational counters/events; IAM Admin SDK, not browser rules' },
  billing: { state: 'observed', authority: 'Firestore visionary_accounts/{uid}/billing/test plus commands/invoices; separate test queue, subscription/payment/event/invitation/membership indexes; provider verifies external payment facts' },
  feedback: { state: 'observed', authority: 'Firestore UID-nested feedback/commands and admission counters through current account authority' },
  learning: { state: 'observed', authority: 'Firestore visionary_accounts/{uid}/learningSessions with checks/assessments and learningCommands; owning transaction, no SQL cutover implied' },
  knowledge: { state: 'observed', authority: 'Firestore UID-nested knowledgeCommands/Receipts/Projections/Outbox; calibrated metadata is not a second learner-evidence owner' },
  domain: { state: 'proposed', authority: 'Selected reviewed owning domain store pending DATA-01 and authority/policy acceptance; legacy imported Prisma schema is not deployed authority' },
  privateObjects: { state: 'proposed', authority: 'Private object bytes plus owning-domain metadata; no upload/download service installed by this inventory' },
  jobs: { state: 'proposed', authority: 'Owning-domain transactional outbox/job receipt plus scoped worker orchestration; no independent queue authorization or cross-store transaction assumed' },
  profileTarget: { state: 'proposed', authority: 'One profile owning store must be selected; existing UID account remains Firestore and future account projections do not create dual mutable authority' },
};

const assignments = {
  public: ['GET /api/auth/methods', 'GET /api/billing/catalog'],
  csrf: ['GET /api/auth/csrf'], exchange: ['POST /api/auth/session'], sessionRead: ['GET /api/auth/me'],
  ownerRead: ['GET /api/account/overview', 'GET /api/account/devices', 'GET /api/account/invoices'],
  ownerWrite: ['POST /api/auth/onboarding', 'PATCH /api/auth/profile', 'POST /api/auth/onboarding/introduction'],
  logout: ['POST /api/auth/logout'], logoutAll: ['POST /api/auth/logout-all'],
  billingRead: ['GET /api/billing/account', 'GET /api/billing/invoices/:id', 'GET /api/billing/family/invitations/:id'],
  billingWrite: ['POST /api/billing/checkouts', 'POST /api/billing/verify', 'POST /api/billing/sync', 'POST /api/billing/cancel', 'POST /api/billing/family/invitations', 'POST /api/billing/family/accept', 'POST /api/billing/family/remove', 'POST /api/billing/family/leave'],
  billingJob: ['POST /api/billing/jobs/reconcile'], billingWebhook: ['POST /api/billing/webhooks/razorpay'],
  feedbackRead: ['GET /api/account/feedback'], feedbackWrite: ['POST /api/account/feedback'],
  learningRead: ['GET /api/account/learning/sessions', 'GET /api/account/learning/sessions/:sessionId'],
  learningWrite: ['POST /api/account/learning/sessions', 'POST /api/account/learning/sessions/:sessionId/checks', 'POST /api/account/learning/sessions/:sessionId/assessments', 'POST /api/account/learning/sessions/:sessionId/cancel'],
  knowledgeRead: ['GET /api/account/learning/knowledge/projections', 'GET /api/account/learning/knowledge/models'],
  knowledgeWrite: ['POST /api/account/learning/knowledge/project'],
};
const groupProfiles = {
  'public-discovery': 'public', 'public-enquiry-careers-partners': 'public', 'public-updates-distribution': 'public',
  'download-installation': 'public', 'referral-sharing': 'public', 'auth-session-profile': 'exchange',
  'phone-organization-sso-qualification': 'exchange', 'school-guardian-admission': 'guardian',
  'account-records-devices': 'ownerRead', 'subscription-test-checkout': 'billingWrite', 'test-invoice-and-family': 'billingRead',
  'feedback-receipt': 'feedbackWrite', 'workspace-role-switching': 'domain', 'content-catalog-source-choice': 'domain',
  'learning-check-practice-progress': 'learningWrite', 'durable-teaching-loop-sessions': 'learningWrite',
  'ask-guide-model-turn': 'domain', 'voice-and-visual-learning': 'domain', 'learn-to-build-private-project': 'domain',
  'build-execution-public-apps': 'domain', 'stage-change-bridge-continuity': 'profileStage', 'teacher-private-growth': 'privateCoaching',
  'classroom-assignment-submission': 'institution', 'parent-support-and-summary': 'guardian',
  'professional-career-and-portfolio': 'domain', 'organization-governance': 'institution',
  'privacy-memory-export': 'domain', 'notifications-and-support-delivery': 'domain',
  'equitable-free-paid-continuity': 'billingRead', 'offline-and-two-device-learning': 'privateFile',
  'account-records-ui-binding': 'ownerRead', 'knowledge-projection-calibration': 'knowledgeWrite',
};
const futureOperations = [
  ['project.list-and-revision-read', 'domain'], ['source.catalog-and-publication', 'domain'],
  ['private.asset-upload-finalize-download', 'privateFile'], ['export.request-status', 'domain'],
  ['export.worker-execute', 'privateJob'], ['export.download', 'privateFile'],
  ['run.status-events-cancel', 'domain'], ['queue.execute-reconcile-deliver', 'privateJob'],
  ['support.case-read-or-triage', 'support'], ['classroom.publish-submit-review', 'institution'],
  ['guardian.summary-create-read-revoke', 'guardian'], ['organization-or-employer.explicit-share', 'institution'],
  ['offline.pack-issue-download-reconnect', 'privateFile'], ['profile.stage-mapping-transition-undo', 'profileStage'],
  ['coaching.private-goal-summary', 'privateCoaching'], ['model.teaching-voice-activity-proposal', 'domain'],
];

export function generateMapping(readSource = read) {
  const registered = [], classes = [];
  for (const file of controllerFiles) {
    const source = readSource(file), prefix = source.match(/@Controller\('([^']+)'\)/)?.[1];
    const controller = source.match(/export class (\w+Controller)/)?.[1];
    if (!prefix || !controller) throw new Error(`Unsupported controller declaration: ${file}`);
    classes.push(controller);
    const methods = [...source.matchAll(/@(Get|Post|Patch|Put|Delete)\((?:'([^']*)')?\)/g)];
    const declarations = [...source.matchAll(/@(Get|Post|Patch|Put|Delete|Head|Options|All)\(/g)];
    if (methods.length !== declarations.length) throw new Error(`Unsupported HTTP decorator syntax: ${file}`);
    for (const match of methods) {
      const route = `${match[1].toUpperCase()} /api/${prefix}${match[2] ? '/' + match[2] : ''}`;
      const profileId = Object.keys(assignments).find(id => assignments[id].includes(route));
      if (!profileId) throw new Error(`Unmapped registered operation: ${route}`);
      registered.push({ route, profile: profileId, controller, sourceFile: file, exposure: 'registered-controller' });
    }
  }
  const module = readSource(backend + 'auth/firebase-product/firebase-product.module.ts');
  const active = [...(module.match(/controllers:\s*\[([^\]]+)\]/)?.[1] ?? '').matchAll(/\w+Controller/g)].map(m => m[0]);
  if (JSON.stringify(classes.sort()) !== JSON.stringify(active.sort())) throw new Error('Registered controller set drift');
  const assigned = Object.values(assignments).flat().sort();
  if (JSON.stringify(registered.map(x => x.route).sort()) !== JSON.stringify(assigned)) throw new Error('Registered operation missing or duplicated');
  const bounds = JSON.parse(readSource('integration/contracts/request-limits.v1.json'));
  if (JSON.stringify(assigned) !== JSON.stringify(Object.keys(bounds.currentRoutes).sort())) throw new Error('KAN-35 route inventory differs');
  const surface = JSON.parse(readSource('integration/contracts/product-surface-review.json'));
  if (JSON.stringify(surface.operations.map(x => x.id).sort()) !== JSON.stringify(Object.keys(groupProfiles).sort())) throw new Error('Product operation-group set drift');
  const openapi = JSON.parse(readSource('integration/contracts/v1/openapi.json'));
  const proposed = Object.entries(openapi.paths).flatMap(([route, methods]) => Object.entries(methods).map(([method, operation]) => ({
    route: `${method.toUpperCase()} ${route}`, operationId: operation.operationId,
    profile: operation.operationId === 'FileIntent' || operation.operationId === 'VoiceChunk' ? 'privateFile' : operation.operationId === 'StageEvent' ? 'profileStage' : operation.operationId === 'CoachingGoal' ? 'privateCoaching' : 'domain',
    exposure: 'draft-not-registered', sourceFile: 'integration/contracts/v1/openapi.json',
  })));
  return {
    schemaVersion: 1, jiraKey: 'KAN-31', baseCommit: '64a2cecb39d8f039151b6b459157a7415e183887',
    scope: 'Source-audited operation authority and store ownership enabler; not runtime authorization or contract freeze',
    runtimeEnforcementChanged: false, proposedAuthorityImplemented: false,
    inventoryRules: ['Controller registration is current source evidence; all other proposed grants require implementation and acceptance.', 'UI groups retain dated checkpoint metadata only; their state is not current runtime/provider acceptance.', 'Source fingerprints normalize CRLF to LF; drift requires renewed semantic review. Regeneration is not approval.', 'No client UID/role/workspace/consent flag, preview guard, signed URL, queue event, payer status or ML output independently grants authority.'],
    stores: storeDefinitions, profiles,
    registered: registered.sort((a,b) => a.route < b.route ? -1 : a.route > b.route ? 1 : 0),
    infrastructure: bounds.infrastructureSurfaces.routes.map(route => ({ route, profile: 'public', sourceFile: backend + 'platform/production-http.ts', exposure: 'production-public-fixed-shape' })),
    proposed,
    future: futureOperations.map(([operation, profileId]) => ({ operation, profile: profileId, exposure: 'unregistered-required-boundary' })),
    productGroups: surface.operations.map(group => ({ id: group.id, profile: groupProfiles[group.id], datedCheckpointClassification: group.state, currentAuthorityNotEstablishedByCheckpoint: true, summaryOnly: 'Route entries govern observed operations; future families separately distinguish end-user requests, worker execution, private downloads and scoped staff access. Public groups describe navigation only, not delivered forms/distribution/installers.', registeredRoutes: (group.endpoints ?? []).filter(route => assigned.includes(route)), followUpSourceIds: group.followUp ?? [] })),
    gaps: [
      { id: 'membership-source', gates: ['KAN-29', 'KAN-30', 'KAN-32'], detail: 'Current learning UID ownership and workspace/source/criteria consistency do not establish verified workspace membership, published-source rights or withdrawal/relationship/consent enforcement.' },
      { id: 'criteria-provenance', gates: ['KAN-29', 'KAN-33'], detail: 'Current present-check DTO accepts bounded authored prompt/options/answerIndex; storing/scoring that input is not authoritative source/rubric provenance or assessed educational validity.' },
      { id: 'future-authority', gates: ['KAN-30', 'KAN-32'], detail: 'New domain/read/list/file/export/support/voice/offline/stage operations need current action-specific authority, owning-store transactions and hosted/two-device negative evidence; none is registered by this inventory.' },
      { id: 'staff-and-policy', gates: ['KAN-110', 'KAN-114', 'KAN-116', 'KAN-129', 'KAN-151'], detail: 'Human ownership, retention/deletion, provider purpose, staff step-up/audit, safeguarding and incident/release acceptance stay separately gated.' },
    ],
    sourceEvidence: provenanceFiles.map(file => ({ file, sha256Lf: createHash('sha256').update(readSource(file)).digest('hex') })),
  };
}

export function verifyMapping(mapping, expected = generateMapping()) {
  if (JSON.stringify(mapping) !== JSON.stringify(expected)) throw new Error('Authority inventory drift: review source/route/profile/store/gate changes, then explicitly regenerate');
  return { registered: mapping.registered.length, infrastructure: mapping.infrastructure.length, proposed: mapping.proposed.length, future: mapping.future.length, productGroups: mapping.productGroups.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const generated = generateMapping();
  if (process.argv.includes('--write')) fs.writeFileSync(path.join(root, target), `${JSON.stringify(generated, null, 2)}\n`);
  const result = verifyMapping(JSON.parse(read(target)), generated);
  console.log(`KAN-31 authority inventory ${process.argv.includes('--write') ? 'generated' : 'verified'}: ${JSON.stringify(result)}; runtime changes=false`);
}
