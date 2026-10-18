import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverageReport, inspectCoverageCase, validateCoverage } from '../lib/launch-coverage.mjs';
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
  assert.equal(reason({}), 'source-and-language-provenance-required');
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
