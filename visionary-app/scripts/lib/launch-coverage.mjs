import { createHash } from 'node:crypto';

export const sha256 = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');
const equalSet = (actual, expected) => Array.isArray(actual) && actual.length === expected.length && new Set(actual).size === actual.length && expected.every(value => actual.includes(value));
const requireCondition = (condition, message) => { if (!condition) throw new Error(`Launch coverage: ${message}`); };

// Deliberately restricted to the current flat literal selector catalogs. A
// refactor or dynamic expression must receive a reviewed extractor update.
export function selectorValues(source, name, kind = 'ids') {
  const body = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\]`).exec(source)?.[1];
  requireCondition(typeof body === 'string', `cannot inspect selector ${name}`);
  const pattern = kind === 'ids' ? /\bid:\s*["']([^"']+)["']/g : /["']([^"']+)["']/g;
  const values = [...body.matchAll(pattern)].map(match => match[1]);
  requireCondition(values.length > 0 && new Set(values).size === values.length, `ambiguous selector ${name}`);
  return values;
}

export function validateCoverage(matrix, read) {
  requireCondition(matrix?.schemaVersion === 1 && matrix.task === 'KAN-29 / SCOPE-02', 'unknown contract');
  requireCondition(matrix.status === 'candidate' && matrix.releaseQualified === false && matrix.founderAcceptance === null, 'candidate cannot claim accepted release coverage');
  requireCondition(Array.isArray(matrix.releasedSlices) && matrix.releasedSlices.length === 0, 'release slices require separately accepted, provenance-qualified evidence');
  const anchors = matrix.sourceAnchors;
  requireCondition(Array.isArray(anchors) && anchors.length >= 6, 'source anchors missing');
  const seen = new Set();
  for (const anchor of anchors) {
    const file = anchor?.file;
    requireCondition(typeof file === 'string' && /^(frontend\/(src|tests)\/|backend\/upstream\/backend\/src\/|integration\/contracts\/)/.test(file) && !file.includes('..') && !file.includes('\\') && !seen.has(file), 'invalid or duplicate source anchor');
    requireCondition(/^[a-f0-9]{64}$/.test(anchor.sha256) && sha256(read(file)) === anchor.sha256, `source drift: ${file}`);
    seen.add(file);
  }
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
  requireCondition(gates.size === matrix.gates?.length && gates.size >= 6, 'unique acceptance gates required');
  for (const gate of matrix.gates) requireCondition(/^KAN-\d+$/.test(gate.key) && gate.state === 'open' && typeof gate.reason === 'string' && gate.reason.length > 10, 'gate requires explicit open scope');
  for (const row of matrix.categories) {
    requireCondition(row.coverage === 'unqualified' && row.fixtureEvidence === 'synthetic-only' && row.released === false, `category ${row.id} cannot turn fixtures into launch evidence`);
    requireCondition(row.stage === null || d.educationStages.includes(row.stage), `unknown stage in ${row.id}`);
    requireCondition(typeof row.mappingNote === 'string' && row.mappingNote.length > 15 && Array.isArray(row.requiredGates) && row.requiredGates.length > 0 && row.requiredGates.every(key => gates.has(key)), `missing mapping/acceptance gates: ${row.id}`);
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
  if (['primary', 'secondary', 'higher-secondary'].includes(input.category) && input.board === 'State' && !matrix.catalog.states.includes(input.state)) return result('state-board-state-required');
  if (!input.sourceId || !input.sourceVersion || !input.sourceLanguage || !input.inputLanguage || !input.outputLanguage || !input.script) return result('source-and-language-provenance-required');
  return result('release-source-provider-and-founder-acceptance-required');
}

export function coverageReport(matrix) {
  const lines = ['# Launch coverage matrix — KAN-29', '', 'Generated from `integration/contracts/launch-coverage.v1.json`. Run `npm run coverage:check`; regenerate with `npm run coverage:write` after review.', '', '**Candidate only. No released curriculum/provider slice is accepted by this contract.** Five-role account preferences and nine synthetic category scenarios remain distinct from real source rights, verified linked-role admission, speech qualification and hosted feature acceptance.', '', '## Category coverage', '', '| Category | Actual setup stage | Source evidence | Current release state | Mapping boundary |', '| --- | --- | --- | --- | --- |'];
  for (const row of matrix.categories) lines.push(`| ${row.id} | ${row.stage || 'No distinct stage'} | Synthetic fixtures only | Unqualified | ${row.mappingNote} |`);
  lines.push('', '## Role authority', '', '| Role | Account setup | Domain/relationship requirement |', '| --- | --- | --- |');
  for (const row of matrix.roles) lines.push(`| ${row.id} | Connected locally | ${row.relationshipRequirement} |`);
  lines.push('', '## Independent language and delivery dimensions', '', `- Interface locales: ${matrix.dimensions.interfaceLocales.join(', ')}. Teaching locale types: ${matrix.dimensions.teachingLocaleTypes.join(', ')}.`, `- Setup language labels: ${matrix.catalog.languageChoices.join(', ')}. These are preferences, not supported source/speech declarations.`, `- Language identities: ${matrix.dimensions.languageAxes.join(', ')}; each released slice must qualify them explicitly without silent substitution.`, `- Boards: ${matrix.catalog.boards.join(', ')}. State Board needs its state; all boards/exams still need exact source/edition/rights qualification.`, `- Modalities: ${matrix.dimensions.modalities.join(', ')}. Devices: ${matrix.dimensions.devices.join(', ')}. Connectivity: ${matrix.dimensions.connectivity.join(', ')}.`, '', 'Current server activation is adult-only. Under-18 activation remains blocked until verified guardian admission is implemented. Adult school-profile selection does not qualify school curriculum or certify age. Native delivery, offline inference and speech coverage are not inferred from browser controls or translations.', '', '## Open acceptance gates', '', '| Jira gate | Required evidence |', '| --- | --- |');
  for (const gate of matrix.gates) lines.push(`| [${gate.key}](https://visionary-team.atlassian.net/browse/${gate.key}) | ${gate.reason} |`);
  lines.push('', '## Product acceptance still required', '', 'Pin the first real release slices across role, age/admission, category, source ID/version/rights, board/exam/medium, six language identities, modality, device, connectivity and entitlements. Record accountable founder/source/provider/admission acceptance and actual UI-to-owning-store recovery/deny evidence. Current local account/test-billing availability is not learning coverage. The report preserves all exposed categories rather than silently removing unsupported ones. KAN-29 remains open until its stated accepted matrix exists.', '', 'The inspector returns engineering reasons and always `runtimeAuthorization: false`; it is not wired to application permission checks. Existing backend UID, workspace, consent, source, billing and admission authority remains unchanged.', '', '## Source anchors', '');
  for (const anchor of matrix.sourceAnchors) lines.push(`- \`${anchor.file}\` — normalized SHA-256 \`${anchor.sha256}\``);
  return lines.join('\n') + '\n';
}
