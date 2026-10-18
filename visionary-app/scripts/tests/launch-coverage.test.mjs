import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverageReport, inspectCoverageCase, selectorValues, sha256, validateCoverage } from '../lib/launch-coverage.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const matrix = JSON.parse(read('integration/contracts/launch-coverage.v1.json'));
const copy = () => structuredClone(matrix);
const adult = { role: 'student', category: 'higher-education', interfaceLocale: 'en', ageBand: 'adult', modality: 'text', device: 'desktop-browser', connectivity: 'online' };

test('source-backed candidate retains five roles, nine categories and separate language identities', () => {
  assert.deepEqual(validateCoverage(matrix, read), { task: 'KAN-29 / SCOPE-02', status: 'candidate', roles: 5, categories: 9, interfaceLocales: 3, sourceAnchors: 7, releasedSlices: 0 });
  assert.equal(read('docs/architecture/LAUNCH_COVERAGE_MATRIX.md').replaceAll('\r\n', '\n'), coverageReport(matrix));
  assert.equal(matrix.categories.find(row => row.id === 'vocational').stage, null);
});

test('missing or duplicate exposed role/category rows cannot quietly shrink coverage scope', () => {
  for (const mutate of [m => m.categories.pop(), m => m.roles.pop(), m => m.categories.push(m.categories[0]), m => m.dimensions.categories.pop(), m => m.dimensions.roles.push('superadmin')]) {
    const candidate = copy(); mutate(candidate); assert.throws(() => validateCoverage(candidate, read));
  }
});

test('selector labels cannot become accepted source coverage or implicit language fallback', () => {
  for (const mutate of [m => { m.catalog.boards[0] = 'Invented board'; }, m => { m.catalog.exams = ['JEE Main']; }, m => { m.catalog.languageChoices.pop(); }, m => { m.dimensions.languageAxes = ['interface', 'output']; }, m => { m.catalog.choicesAreCoverage = true; }]) {
    const candidate = copy(); mutate(candidate); assert.throws(() => validateCoverage(candidate, read));
  }
});

test('literal extraction rejects dynamic or ambiguous catalogs after source hashes are refreshed', () => {
  assert.deepEqual(selectorValues('export const VALUES = [{ id: "[a]", label: "b]" }];', 'VALUES'), ['[a]']);
  assert.deepEqual(selectorValues('export const VALUES = ["en", "hi"].map((l) => ({ id: l, label: l }));', 'VALUES', 'strings'), ['en', 'hi']);
  for (const declaration of [
    'export const VALUES = [{ id: "a" }, ...extra];',
    'export const VALUES = [{ id: "a" + suffix }];',
    'export const VALUES = [{ id: enabled ? "a" : "b" }];',
    'export const VALUES = [{ id: "a", id: "b" }];',
    'export const VALUES = [{ label: "id: fake" }];',
    'export const VALUES = [/* { id: "a" } */ actual];',
    'export const VALUES = [{ id: "a" }].filter(enabled);',
    'export const VALUES = [{ id: "a" }].concat(extra);',
  ]) assert.throws(() => selectorValues(declaration, 'VALUES'));
  assert.throws(() => selectorValues('export const VALUES = ["a"].map((l) => ({ id: prefix + l, label: l }));', 'VALUES', 'strings'));
  const file = 'frontend/src/components/onboarding/stepConfigs.jsx';
  const changed = read(file).replace('id: "CBSE"', 'id: "CBSE" + suffix');
  const candidate = copy(); candidate.sourceAnchors.find(anchor => anchor.file === file).sha256 = sha256(changed);
  assert.throws(() => validateCoverage(candidate, anchor => anchor === file ? changed : read(anchor)), /non-literal selector/);
});

test('source anchors, actual category mappings and every required acceptance gate cannot be dropped', () => {
  for (const mutate of [
    m => { m.sourceAnchors.pop(); },
    m => { m.categories.find(row => row.id === 'vocational').stage = 'professional'; },
    m => { m.categories.find(row => row.id === 'primary').stage = 'higher_ed'; },
    m => { m.gates = m.gates.filter(gate => gate.key !== 'KAN-116'); m.categories.forEach(row => { row.requiredGates = row.requiredGates.filter(key => key !== 'KAN-116'); }); },
    m => { m.categories[0].requiredGates = ['KAN-60']; },
    m => { m.categories[0].requiredGates = m.categories[0].requiredGates.filter(key => key !== 'KAN-34'); },
    m => { m.categories[0].requiredGates.push('KAN-60'); },
  ]) { const candidate = copy(); mutate(candidate); assert.throws(() => validateCoverage(candidate, read)); }
});

test('source changes and non-source/private/path-traversal anchors require explicit review', () => {
  assert.throws(() => validateCoverage(matrix, file => read(file) + '\nchanged'), /source drift/);
  for (const file of ['backend/upstream/backend/.env', '../README.md', '/README.md', 'frontend\\src\\private.js']) {
    const candidate = copy(); candidate.sourceAnchors[0].file = file; assert.throws(() => validateCoverage(candidate, read), /invalid/);
  }
});

test('synthetic fixtures, role preferences and admission declarations cannot close real release gates', () => {
  for (const mutate of [m => { m.releaseQualified = true; }, m => { m.releasedSlices.push({ sourceId: 'synthetic', accepted: true }); }, m => { m.categories[0].released = true; }, m => { m.categories[0].coverage = 'supported'; }, m => { m.roles[1].preferenceGrantsAccess = true; }, m => { m.admission.minorActivation = 'active'; }, m => { m.gates[0].state = 'accepted'; }, m => { m.boundaries.speechFromUiLocale = true; }]) {
    const candidate = copy(); mutate(candidate); assert.throws(() => validateCoverage(candidate, read));
  }
});

test('diagnostic cases distinguish unknown locale, guardian, speech, native, offline and relationship gates', () => {
  const reason = changes => inspectCoverageCase(matrix, { ...adult, ...changes }).reason;
  assert.equal(reason({ interfaceLocale: 'ta' }), 'unsupported-interfaceLocale');
  assert.equal(reason({ ageBand: 'minor' }), 'guardian-admission-not-connected');
  assert.equal(reason({ modality: 'voice' }), 'speech-qualification-required');
  assert.equal(reason({ device: 'native-client' }), 'native-client-not-released');
  assert.equal(reason({ connectivity: 'offline' }), 'online-domain-authority-required');
  assert.equal(reason({ role: 'parent', verifiedRelationship: true }), 'server-verified-relationship-required');
  assert.equal(reason({ category: 'employer-sponsored' }), 'server-verified-relationship-required');
  assert.equal(reason({ category: 'secondary', board: 'State' }), 'state-board-state-required');
  assert.equal(reason({ category: 'primary' }), 'school-board-required');
  assert.equal(reason({ category: 'primary', board: 'CBSE' }), 'school-class-required');
  assert.equal(reason({ category: 'competitive' }), 'competitive-target-required');
  assert.equal(reason({ category: 'vocational' }), 'category-source-mapping-required');
  assert.equal(reason({}), 'source-and-language-provenance-required');
});

test('curriculum context and source identifiers cannot masquerade as qualification', () => {
  const source = { sourceId: 'claimed-source', sourceVersion: '1', sourceLanguage: 'en', inputLanguage: 'en', outputLanguage: 'en', script: 'Latn' };
  for (const context of [{ category: 'primary', board: 'CBSE', class: 'Class 1' }, { category: 'competitive', exam: 'Other' }]) {
    assert.equal(inspectCoverageCase(matrix, { ...adult, ...source, ...context }).reason, 'release-source-provider-and-founder-acceptance-required');
  }
  for (const value of [null, {}, [], 1, true, '   ']) assert.equal(inspectCoverageCase(matrix, { ...adult, ...source, sourceId: value }).reason, 'source-and-language-provenance-required');
});

test('all declared role/category/locale/admission/delivery combinations remain non-authorizing', () => {
  const d = matrix.dimensions; let checked = 0;
  for (const role of d.roles) for (const category of d.categories) for (const interfaceLocale of d.interfaceLocales) for (const ageBand of d.ageBands) for (const modality of d.modalities) for (const device of d.devices) for (const connectivity of d.connectivity) {
    const result = inspectCoverageCase(matrix, { role, category, interfaceLocale, ageBand, modality, device, connectivity });
    assert.equal(result.runtimeAuthorization, false); assert.equal(result.releaseQualified, false); checked++;
  }
  assert.equal(checked, 9720);
});

test('a complete self-asserted source/language tuple is still not founder/provider/source acceptance', () => {
  const result = inspectCoverageCase(matrix, { ...adult, sourceId: 'claimed-source', sourceVersion: '1', sourceLanguage: 'en', inputLanguage: 'en', outputLanguage: 'en', script: 'Latn', founderAccepted: true, providerQualified: true });
  assert.equal(result.reason, 'release-source-provider-and-founder-acceptance-required');
  assert.equal(result.runtimeAuthorization, false); assert.equal(result.releaseQualified, false);
});
