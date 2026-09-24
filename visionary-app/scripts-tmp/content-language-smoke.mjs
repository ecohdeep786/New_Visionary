import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
 const errors = [];
 page.on('pageerror', error => errors.push(String(error)));
 await page.goto('http://localhost:5184/dev/scenarios', { waitUntil: 'networkidle' });
 await page.getByRole('button', { name: /Asha/ }).first().click();
 await page.waitForURL('**/dashboard/home');
 await page.evaluate(() => {
  const workspace = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
  workspace.data['demo-adult:student'].preferences.locale = 'hi';
  localStorage.setItem('visionary_workspace_v2', JSON.stringify(workspace));
  const selection = { board: 'Local board', classLevel: '7', subject: 'Reasoning' };
  const graph = {
   syllabus: { ...selection, id: 'official:reasoning', status: 'official', contentLocale: 'en', availableLocales: ['en'], provenance: { provider: 'Reviewed syllabus fixture', sourceId: 'reasoning', version: '1' }, textbooks: [{ id: 'official:book', title: 'Book', chapterIds: ['official:chapter'] }], chapters: [{ id: 'official:chapter', title: 'Reasoning chapter', textbookId: 'official:book', topicIds: ['official:topic'], status: 'official' }] },
   topics: [{ id: 'official:topic', title: 'Reasoning topic', chapterId: 'official:chapter', conceptIds: ['official:concept'], status: 'official' }],
   concepts: [{ id: 'official:concept', title: 'Reasoning concept', topicId: 'official:topic', prerequisiteIds: [], status: 'official', locale: 'en', availableLocales: ['en'], explanation: 'English explanation only.', representations: [] }],
  };
  localStorage.setItem('visionary_content_v1', JSON.stringify({ version: 1, spaces: { 'demo-adult:student': { graphs: [graph], aliases: {}, gaps: [] } } }));
  localStorage.setItem('visionary_learning_pipeline_v1', JSON.stringify({ version: 1, spaces: { 'demo-adult:student': { selection, syllabusId: graph.syllabus.id, units: [] } } }));
 });
 await page.goto('http://localhost:5184/dashboard/learn', { waitUntil: 'networkidle' });
 await page.getByText('Sourced from Reviewed syllabus fixture · version 1.').waitFor();
 await page.getByRole('button', { name: 'Reasoning chapter' }).click();
 await page.getByText('Teaching content not loaded in Hindi').waitFor();
 await page.getByRole('button', { name: 'Open', exact: true }).click();
 await page.getByText(/This concept’s saved teaching content is not loaded in Hindi/).waitFor();
 assert.equal(await page.getByText('English explanation only.').count(), 0);
 for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 1, `${width}px viewport overflowed by ${overflow}px`);
 }
 assert.deepEqual(errors, []);
 console.log('Learn source/language smoke: provenance, honest Hindi gap, no leaked English explanation, no errors/overflow at 1440/390.');
} finally { await browser.close(); }
