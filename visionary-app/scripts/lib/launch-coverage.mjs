import { createHash } from 'node:crypto';

export const sha256 = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');
const equalSet = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && new Set(actual).size === actual.length && expected.every(value => actual.includes(value));
const requireCondition = (condition, message) => { if (!condition) throw new Error(`Launch coverage: ${message}`); };
// This is a reviewed snapshot, not a general JavaScript data-flow analyzer.
// Pin both producers and consumers independently of the editable matrix. A
// matrix-only rehash must not bless later mutations, aliases or inline options.
// Updating these revisions requires source inspection and a new exact-SHA review.
const reviewedSources = {
  'integration/contracts/product-surface-review.json': '566001b1989e4ee7fb5e7174931480fff4da866a35097d2bb8b7a57db48caae4',
  'frontend/src/components/onboarding/stepConfigs.jsx': 'aacb7dbccb8c704f15708a638701428ec411aad8e0559bf0b6950e59f840ba1c',
  'frontend/src/components/onboarding/ProductSetupFields.jsx': '909ceb2cb2f7a4d4cda2935aab9c94efb8c66f4f802cf3d4abc534596f9327f8',
  'frontend/src/domain/workspace.ts': 'cd820b052fc31c17c1f86f2c0919d259cb2b6019f0517f8d9f5100ca9eddb87d',
  'frontend/tests/curriculum-category-acceptance.test.mjs': '8c7380c8b01a5aefb016fe527461a610740b5c8c186f37b60c4255ccf112d303',
  'backend/upstream/backend/src/auth/firebase-product/profile.ts': 'fa05afdff5429cb192b3188501ae3a690fc89b0621228fb67d49daf2c6de0e9c',
  'frontend/src/lib/onboardingLearningContext.js': 'db69839445a86dcc7d084acb9beb9f6de79a804f87c44bad6d5775e1bd7c4d06',
};
const requiredAnchors = Object.keys(reviewedSources);
const categoryStages = { primary: 'school', secondary: 'school', 'higher-secondary': 'school', competitive: 'competitive', vocational: null, 'higher-education': 'higher_ed', 'independent-adult': 'professional', professional: 'professional', 'employer-sponsored': 'professional' };
const commonGates = ['KAN-60', 'KAN-34', 'KAN-156', 'KAN-158', 'KAN-121', 'KAN-127', 'KAN-116'];
const requiredGates = [...commonGates, 'KAN-44', 'KAN-96'];

// Deliberately restricted to the current flat literal selector catalogs. A
// refactor or dynamic expression must receive a reviewed extractor update.
export function selectorValues(source, name, kind = 'ids') {
  requireCondition(/^[A-Z_]+$/.test(name) && ['ids', 'strings'].includes(kind), 'unknown selector grammar');
  const declarations = [...source.matchAll(new RegExp(`^export const ${name} = ([\\s\\S]*?);`, 'gm'))];
  requireCondition(declarations.length === 1, `cannot inspect selector ${name}`);
  const body = declarations[0][1];
  // Parse every token of the current literal catalog without executing source.
  // Comments, spreads, expressions, duplicate properties and arbitrary .map /
  // .filter / .concat transforms fail closed, even if an anchor was refreshed.
  const token = /\s*("[^"\\\r\n]*"|'[^'\\\r\n]*'|[A-Za-z_$][\w$]*|[\[\]{},:])/y;
  let offset = 0;
  const next = () => { token.lastIndex = offset; const match = token.exec(body); requireCondition(match, `non-literal selector ${name}`); offset = token.lastIndex; return match[1]; };
  const expect = expected => requireCondition(next() === expected, `non-literal selector ${name}`);
  const string = value => { requireCondition(/^("[^"\\\r\n]*"|'[^'\\\r\n]*')$/.test(value), `non-literal selector ${name}`); return value.slice(1, -1); };
  const values = [];
  expect('[');
  let item = next();
  while (item !== ']') {
    if (kind === 'strings') values.push(string(item));
    else {
      requireCondition(item === '{', `non-literal selector ${name}`);
      const properties = new Map();
      let key = next();
      while (key !== '}') {
        requireCondition(/^[A-Za-z_$][\w$]*$/.test(key) && !properties.has(key), `ambiguous selector ${name}`);
        expect(':'); properties.set(key, string(next()));
        key = next();
        if (key === ',') key = next();
        else requireCondition(key === '}', `non-literal selector ${name}`);
      }
      requireCondition(properties.has('id'), `missing id in selector ${name}`);
      values.push(properties.get('id'));
    }
    item = next();
    if (item === ',') item = next();
    else requireCondition(item === ']', `non-literal selector ${name}`);
  }
  const suffix = body.slice(offset).trim();
  const identityMap = /^\.map\(\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*=>\s*\(\s*\{\s*id:\s*\1\s*,\s*label:\s*\1\s*\}\s*\)\s*\)$/;
  requireCondition(kind === 'strings' ? identityMap.test(suffix) : suffix === '', `unsupported selector transform ${name}`);
  requireCondition(values.length > 0 && new Set(values).size === values.length, `ambiguous selector ${name}`);
  return values;
}

export function validateCoverage(matrix, read) {
  requireCondition(matrix?.schemaVersion === 1 && matrix.task === 'KAN-29 / SCOPE-02', 'unknown contract');
  requireCondition(matrix.status === 'candidate' && matrix.releaseQualified === false && matrix.founderAcceptance === null, 'candidate cannot claim accepted release coverage');
  requireCondition(Array.isArray(matrix.releasedSlices) && matrix.releasedSlices.length === 0, 'release slices require separately accepted, provenance-qualified evidence');
  const anchors = matrix.sourceAnchors;
  requireCondition(Array.isArray(anchors), 'source anchors missing');
  const seen = new Set();
  for (const anchor of anchors) {
    const file = anchor?.file;
    requireCondition(typeof file === 'string' && /^(frontend\/(src|tests)\/|backend\/upstream\/backend\/src\/|integration\/contracts\/)/.test(file) && !file.includes('..') && !file.includes('\\') && !seen.has(file), 'invalid or duplicate source anchor');
    requireCondition(/^[a-f0-9]{64}$/.test(anchor.sha256) && sha256(read(file)) === anchor.sha256, `source drift: ${file}`);
    requireCondition(anchor.sha256 === reviewedSources[file], `reviewed source revision drift: ${file}; matrix-only rehash is insufficient`);
    seen.add(file);
  }
  requireCondition(equalSet([...seen], requiredAnchors), 'required source anchors missing or replaced');
  const inventoryPath = 'integration/contracts/product-surface-review.json';
  requireCondition(seen.has(inventoryPath), 'source inventory anchor missing');
  const inventory = JSON.parse(read(inventoryPath)), d = matrix.dimensions;
  requireCondition(d && equalSet(d.roles, inventory.roles), 'five-role coverage drift');
  requireCondition(equalSet(d.categories, inventory.categories), 'category coverage drift');
  requireCondition(equalSet(d.interfaceLocales, inventory.interfaceLocales) && equalSet(d.teachingLocaleTypes, inventory.teachingLocaleTypes), 'locale dimensions drift');
  requireCondition(equalSet(d.languageAxes, ['interface', 'source', 'input', 'output', 'script', 'speech']), 'language identities must remain separate');
  requireCondition(equalSet(d.ageBands, ['adult', 'minor']) && equalSet(d.educationStages, ['school', 'higher_ed', 'competitive', 'professional']), 'admission/stage dimensions incomplete');
  requireCondition(equalSet(d.modalities, ['text', 'voice', 'visual', 'build']) && equalSet(d.devices, ['desktop-browser', 'mobile-browser', 'native-client']) && equalSet(d.connectivity, ['online', 'offline', 'reconnecting']), 'modality/device/connectivity dimensions incomplete');
  requireCondition(Array.isArray(matrix.categories) && equalSet(matrix.categories.map(row => row.id), d.categories), 'every category needs one explicit matrix row');
  requireCondition(Array.isArray(matrix.roles) && equalSet(matrix.roles.map(row => row.id), d.roles), 'every role needs an authority row');
  requireCondition(matrix.admission?.currentServer === 'adult-only' && matrix.admission.minorActivation === 'blocked' && matrix.admission.ageDeclarationIsVerification === false, 'current guardian admission cannot be promoted by a matrix');
  requireCondition(matrix.catalog?.choicesAreCoverage === false && Array.isArray(matrix.catalog.boards) && matrix.catalog.boards.length === 5 && Array.isArray(matrix.catalog.languageChoices) && matrix.catalog.languageChoices.length === 14, 'selector choices are not source qualification');
  const choicesPath = 'frontend/src/components/onboarding/stepConfigs.jsx';
  requireCondition(seen.has(choicesPath), 'selector source anchor missing');
  const choices = read(choicesPath);
  for (const [key, name, kind] of [['boards', 'BOARDS', 'ids'], ['languageChoices', 'LANGUAGES', 'strings'], ['states', 'INDIAN_STATES', 'strings'], ['classes', 'CLASSES', 'strings'], ['teacherCategories', 'TEACHER_CATEGORIES', 'ids'], ['organizationTypes', 'ORG_TYPES', 'ids']]) requireCondition(equalSet(matrix.catalog[key], selectorValues(choices, name, kind)), `selector drift: ${key}`);
  requireCondition(equalSet(matrix.catalog.exams, [...selectorValues(choices, 'COMPETITIVE_TARGETS'), 'Other']), 'active competitive-exam choices drift');
  const gates = new Set(matrix.gates?.map(gate => gate.key));
  requireCondition(equalSet(matrix.gates?.map(gate => gate.key), requiredGates), 'all acceptance gates must remain explicit');
  for (const gate of matrix.gates) requireCondition(/^KAN-\d+$/.test(gate.key) && gate.state === 'open' && typeof gate.reason === 'string' && gate.reason.length > 10, 'gate requires explicit open scope');
  for (const row of matrix.categories) {
    requireCondition(row.coverage === 'unqualified' && row.fixtureEvidence === 'synthetic-only' && row.released === false, `category ${row.id} cannot turn fixtures into launch evidence`);
    requireCondition(row.stage === categoryStages[row.id], `source stage mapping drift in ${row.id}`);
    const expected = row.stage === 'school' ? requiredGates : commonGates;
    requireCondition(typeof row.mappingNote === 'string' && row.mappingNote.length > 15 && equalSet(row.requiredGates, expected), `missing mapping/acceptance gates: ${row.id}`);
  }
  for (const row of matrix.roles) requireCondition(row.accountProfile === 'connected-local' && row.domainAuthority === 'not-qualified' && row.preferenceGrantsAccess === false && typeof row.relationshipRequirement === 'string' && row.relationshipRequirement.length > 10, `role preference cannot grant linked access: ${row.id}`);
  requireCondition(matrix.boundaries?.runtimeAuthorization === false && matrix.boundaries.sourceRightsFromSelector === false && matrix.boundaries.speechFromUiLocale === false && matrix.boundaries.offlineInferenceQualified === false && matrix.boundaries.nativeClientReleased === false, 'matrix must not grant runtime/source/speech/offline/native authority');
  return { task: matrix.task, status: matrix.status, roles: d.roles.length, categories: d.categories.length, interfaceLocales: d.interfaceLocales.length, sourceAnchors: anchors.length, releasedSlices: 0 };
}

// Engineering diagnosis only. Never an endpoint permission or admission grant.
// Even a complete adult input remains unqualified without accepted release data.
export function inspectCoverageCase(matrix, input) {
  const result = reason => ({ releaseQualified: false, runtimeAuthorization: false, reason });
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result('invalid-input');
  const dimensions = { role: 'roles', category: 'categories', interfaceLocale: 'interfaceLocales', ageBand: 'ageBands', modality: 'modalities', device: 'devices', connectivity: 'connectivity' };
  for (const [key, dimension] of Object.entries(dimensions)) if (!matrix.dimensions[dimension].includes(input[key])) return result(`unsupported-${key}`);
  if (input.ageBand === 'minor') return result('guardian-admission-not-connected');
  if (input.device === 'native-client') return result('native-client-not-released');
  if (input.connectivity !== 'online') return result('online-domain-authority-required');
  if (input.modality === 'voice') return result('speech-qualification-required');
  if (['teacher', 'parent', 'organization'].includes(input.role) || input.category === 'employer-sponsored') return result('server-verified-relationship-required');
  if (categoryStages[input.category] === null) return result('category-source-mapping-required');
  if (categoryStages[input.category] === 'school') {
    if (!matrix.catalog.boards.includes(input.board)) return result('school-board-required');
    if (input.board === 'State' && !matrix.catalog.states.includes(input.state)) return result('state-board-state-required');
    if (!matrix.catalog.classes.includes(input.class)) return result('school-class-required');
  }
  if (input.category === 'competitive' && !matrix.catalog.exams.includes(input.exam)) return result('competitive-target-required');
  if (![input.sourceId, input.sourceVersion, input.sourceLanguage, input.inputLanguage, input.outputLanguage, input.script].every(value => typeof value === 'string' && value.trim().length > 0)) return result('source-and-language-provenance-required');
  return result('release-source-provider-and-founder-acceptance-required');
}

export function coverageReport(matrix) {
  const lines = ['# Launch coverage matrix — KAN-29', '', 'Generated from `integration/contracts/launch-coverage.v1.json`. Run `npm run coverage:check`; regenerate with `npm run coverage:write` after review.', '', '**Candidate only. No released curriculum/provider slice is accepted by this contract.** Five-role account preferences and nine synthetic category scenarios remain distinct from real source rights, verified linked-role admission, speech qualification and hosted feature acceptance.', '', '## Category coverage', '', '| Category | Actual setup stage | Source evidence | Current release state | Mapping boundary |', '| --- | --- | --- | --- | --- |'];
  for (const row of matrix.categories) lines.push(`| ${row.id} | ${row.stage || 'No distinct stage'} | Synthetic fixtures only | Unqualified | ${row.mappingNote} |`);
  lines.push('', '## Role authority', '', '| Role | Account setup | Domain/relationship requirement |', '| --- | --- | --- |');
  for (const row of matrix.roles) lines.push(`| ${row.id} | Connected locally | ${row.relationshipRequirement} |`);
  lines.push('', '## Independent language and delivery dimensions', '', `- Interface locales: ${matrix.dimensions.interfaceLocales.join(', ')}. Teaching locale types: ${matrix.dimensions.teachingLocaleTypes.join(', ')}.`, `- Setup language labels: ${matrix.catalog.languageChoices.join(', ')}. These are preferences, not supported source/speech declarations.`, `- Language identities: ${matrix.dimensions.languageAxes.join(', ')}; each released slice must qualify them explicitly without silent substitution.`, `- Boards: ${matrix.catalog.boards.join(', ')}. State Board needs its state; all boards/exams still need exact source/edition/rights qualification.`, `- Modalities: ${matrix.dimensions.modalities.join(', ')}. Devices: ${matrix.dimensions.devices.join(', ')}. Connectivity: ${matrix.dimensions.connectivity.join(', ')}.`, '', 'Current server activation is adult-only. Under-18 activation remains blocked until verified guardian admission is implemented. Adult school-profile selection does not qualify school curriculum or certify age. Native delivery, offline inference and speech coverage are not inferred from browser controls or translations.', '', '## Open acceptance gates', '', '| Jira gate | Required evidence |', '| --- | --- |');
  for (const gate of matrix.gates) lines.push(`| [${gate.key}](https://visionary-team.atlassian.net/browse/${gate.key}) | ${gate.reason} |`);
  lines.push('', '## Unsupported states and recovery to validate', '', 'These are proposed product acceptance requirements for downstream wiring. The offline inspector supplies reason codes; it does not display these states or enforce product permissions.', '', '| Scenario / diagnostic reason | Required visible outcome | Recovery boundary |', '| --- | --- | --- |',
    '| Minor / guardian-admission-not-connected | Explain that verified guardian admission is required. | Preserve the current admission block; no DOB/profile bypass. |',
    '| Native / native-client-not-released | Identify native delivery as unavailable. | Offer the supported browser journey only when independently available. |',
    '| Offline or reconnecting / online-domain-authority-required | Show saved draft and pending server validation separately. | Reconnect, revalidate current UID/workspace/consent/source/revision and refetch; no silent inference or duplicate commit. |',
    '| Voice / speech-qualification-required | Explain that speech for the chosen language/script/device is not qualified. | Offer text only if that exact text slice is independently accepted and the user chooses it. |',
    '| Linked role / server-verified-relationship-required | Show the missing class/guardian/organization/employer verification. | Verify current scoped membership; never expose private learner history from a selected role. |',
    '| Vocational / category-source-mapping-required | Keep the category visible and identify missing curriculum mapping. | Obtain an accepted vocational/source mapping; never silently use professional content. |',
    '| School / school-board-required, state-board-state-required, school-class-required | Request the missing curriculum context. | Preserve input; board/state/class labels still require exact source edition and rights. |',
    '| Competitive / competitive-target-required | Request the target exam and exact syllabus/source context. | Other is a preference, not an approved exam or source. |',
    '| Missing provenance / source-and-language-provenance-required | Identify the missing source/version/language/script. | No substituted source, language or edition; retain the original selection. |',
    '| Complete candidate / release-source-provider-and-founder-acceptance-required | Explain that current coverage is unqualified. | Require reviewed source/provider/admission/entitlement and product acceptance before learning delivery. |',
    '| Unknown dimension / unsupported-* | Identify the unsupported selection without a support claim. | Preserve input and offer only separately accepted choices. |');
  lines.push('', '## Product acceptance still required', '', 'Pin the first real release slices across role, age/admission, category, source ID/version/rights, board/exam/medium, six language identities, modality, device, connectivity and entitlements. Record accountable founder/source/provider/admission acceptance and actual UI-to-owning-store recovery/deny evidence. Current local account/test-billing availability is not learning coverage. The report preserves all exposed categories rather than silently removing unsupported ones. KAN-29 remains open until its stated accepted matrix exists. See [the decision worksheet](../visionary/design/KAN29_LAUNCH_COVERAGE_DECISIONS.md) for the concrete first-slice proposal and remaining decisions.', '', 'The inspector returns engineering reasons and always `runtimeAuthorization: false`; it is not wired to application permission checks. Existing backend UID, workspace, consent, source, billing and admission authority remains unchanged.', '', '## Source anchors', '');
  lines.push('All seven normalized source revisions are also pinned independently in the checker. A matrix-only digest refresh cannot certify a changed producer, consumer or authority mapping; inspect the changed source and submit the updated tooling/contract for exact-SHA review.', '');
  for (const anchor of matrix.sourceAnchors) lines.push(`- \`${anchor.file}\` — normalized SHA-256 \`${anchor.sha256}\``);
  return lines.join('\n') + '\n';
}
