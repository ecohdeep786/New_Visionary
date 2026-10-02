// Fictional two-concept chapter, rendered through the production frontend.
import { chromium } from 'playwright-core';

const base = process.env.VISIONARY_BASE || 'http://127.0.0.1:4190';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
 if (localStorage.getItem('visionary_workspace_v2')) return;
 const id = 'chapter-learner'; const email = `${id}@visionary.test`; const workspaceId = `${id}:student`;
 const selection = { board: 'QA authored', classLevel: '6', subject: 'Geometry' };
 const source = { provider: 'Fictional chapter QA', sourceId: 'qa:geometry', version: '1' };
 const question = (id, prompt, options, answerIndex) => ({ id, prompt, options, answerIndex, source: 'authored-sample' });
 const graph = {
  syllabus: { ...selection, id: 'qa:syllabus', status: 'sample', contentLocale: 'en', availableLocales: ['en'], provenance: source, textbooks: [{ id: 'qa:book', title: 'Fictional geometry book', chapterIds: ['qa:chapter'] }], chapters: [{ id: 'qa:chapter', title: 'Cubes and volume', textbookId: 'qa:book', topicIds: ['qa:topic'], status: 'sample' }] },
  topics: [{ id: 'qa:topic', title: 'Cube ideas', chapterId: 'qa:chapter', conceptIds: ['qa:dimensions', 'qa:volume'], status: 'sample' }],
  concepts: [
   { id: 'qa:dimensions', title: 'Name the cube dimensions', topicId: 'qa:topic', prerequisiteIds: [], status: 'sample', locale: 'en', availableLocales: ['en'], provenance: source, explanation: 'A cube has equal length, width and height.', check: question('qa:dimensions:check', 'How many dimensions does a cube have?', ['Three', 'Two'], 0), practice: [question('qa:dimensions:practice', 'Which measurement tells you how tall the cube is?', ['Height', 'Area'], 0)], project: { title: 'Sketch a cube', brief: 'Sketch a cube and label length, width and height.' }, representations: [{ id: 'qa:dimensions:text', kind: 'text', alternative: 'Describe the three equal directions of a cube.' }] },
   { id: 'qa:volume', title: 'Calculate cube volume', topicId: 'qa:topic', prerequisiteIds: ['qa:dimensions'], status: 'sample', locale: 'en', availableLocales: ['en'], provenance: source, explanation: 'Volume multiplies the three equal side lengths.', check: question('qa:volume:check', 'What is the volume of a cube with side 2?', ['8 cubic units', '4 cubic units'], 0), practice: [question('qa:volume:practice', 'What is the volume when the side is 3?', ['27 cubic units', '9 cubic units'], 0)], project: { title: 'Plan a storage box', brief: 'Compare the capacity of two cube-shaped boxes.' }, representations: [{ id: 'qa:volume:cube', kind: 'cube', alternative: 'A cube grows in three directions. Multiply side length three times.' }] },
  ],
 };
 const user = { id, email, full_name: 'Aarav', identity: 'student', onboarding_complete: true, age_band: 'adult', roles: ['student'], board: selection.board, grade_level: selection.classLevel, subjects: [selection.subject] };
 const person = { id, email, name: 'Aarav', ageBand: 'adult', roles: ['student'], learningContext: { classLevel: 'Class 6', stage: 'school', board: selection.board, subjects: [selection.subject] } };
 const data = { conversations: [], sessions: [], artifacts: [], resources: [], notifications: [], audit: [], preferences: { locale: 'en', interfaceLocale: 'en', bilingual: false, lowBandwidth: false, notifications: 'weekly', memory: true, voice: false }, subscription: { plan: 'Free', state: 'active', invoices: [], usage: 0, usageDay: '2026-09-28' }, legacyImported: false };
 localStorage.setItem('visionary_users', JSON.stringify([user]));
 localStorage.setItem('visionary_sessions', JSON.stringify([{ token: 'chapter-session', userId: id, email, expiresAt: Date.now() + 86400000, createdAt: Date.now() }]));
 localStorage.setItem('visionary_session_token', 'chapter-session');
 localStorage.setItem('visionary_workspace_v2', JSON.stringify({ version: 2, people: [person], workspaces: [{ id: workspaceId, personId: id, role: 'student', name: 'Learner', lastPath: '/dashboard/learn' }], active: { [id]: workspaceId }, relationships: [], data: { [workspaceId]: data } }));
 localStorage.setItem('visionary_content_v1', JSON.stringify({ version: 1, spaces: { [workspaceId]: { graphs: [graph], aliases: {}, gaps: [] } } }));
 localStorage.setItem('visionary_learning_pipeline_v1', JSON.stringify({ version: 1, spaces: { [workspaceId]: { selection, syllabusId: graph.syllabus.id, units: [] } } }));
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
 await page.goto(`${base}/dashboard/learn?chapter=qa%3Achapter`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Cubes and volume' }).waitFor();
 await page.getByText('0 of 2 concepts started.').waitFor();
 await page.getByRole('button', { name: 'Review Name the cube dimensions' }).click();
 await page.getByRole('heading', { name: 'Name the cube dimensions' }).waitFor();
 const firstUnit = new URL(page.url()).searchParams.get('unit');
 if (!firstUnit) throw Error('Prerequisite review did not open the earlier concept');
 await page.getByRole('link', { name: 'Learning outline' }).click();
 await page.getByRole('button', { name: 'Open', exact: true }).click();
 await page.getByRole('heading', { name: 'Calculate cube volume' }).waitFor();
 await page.getByRole('button', { name: 'Review Name the cube dimensions' }).waitFor();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-prerequisite-guidance-390.png' });
 if ((await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['chapter-learner:student'].units)).length !== 2) throw Error('Exploring ahead did not preserve separate units');
 await page.getByRole('button', { name: 'Review Name the cube dimensions' }).click();
 await page.getByRole('heading', { name: 'Name the cube dimensions' }).waitFor();
 await page.getByRole('button', { name: 'Start this learning unit' }).click();
 await page.getByRole('button', { name: 'Check my understanding' }).click();
 await page.getByRole('radio', { name: 'Three' }).check();
 await page.getByRole('button', { name: 'Check answer' }).click();
 await page.getByRole('button', { name: 'Continue practice' }).click();
 await page.getByRole('radio', { name: 'Height' }).check();
 await page.getByRole('button', { name: 'Check answer' }).click();
 await page.getByRole('button', { name: 'Apply this in Build' }).click();
 await page.getByRole('link', { name: 'Open your project' }).click();
 await page.getByRole('textbox', { name: 'Your working document' }).fill('I sketched a cube and labelled length, width and height. Each side has the same length.');
 for (const label of ['Define the idea and success criteria', 'Create and check your artifact', 'Reflect on evidence and limitations']) await page.getByRole('checkbox', { name: label }).check();
 await page.getByLabel('Project status').selectOption('completed');
 await page.getByRole('button', { name: 'Save', exact: true }).click();
 await page.getByText(/Unverified application evidence recorded/).waitFor();
 await page.goto(`${base}/dashboard/learn?chapter=qa%3Achapter&unit=${encodeURIComponent(firstUnit)}`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Your application is recorded' }).waitFor();
 await page.getByRole('heading', { name: 'Next: Calculate cube volume' }).waitFor();
 const evidenceBeforeReview = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence));
 await page.getByRole('button', { name: 'Review this concept again' }).click();
 const reviewUnit = new URL(page.url()).searchParams.get('unit');
 if (!reviewUnit || reviewUnit === firstUnit) throw Error('Completed project review did not open a new activity');
 await page.getByRole('heading', { name: 'Name the cube dimensions' }).waitFor();
 if (await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence)) !== evidenceBeforeReview) throw Error('Opening a review created assessment evidence');
 await page.goto(`${base}/dashboard/learn?chapter=qa%3Achapter&unit=${encodeURIComponent(firstUnit)}`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Your application is recorded' }).waitFor();
 await page.getByRole('button', { name: 'Continue to next concept' }).click();
 const secondUnit = new URL(page.url()).searchParams.get('unit');
 if (!secondUnit || secondUnit === firstUnit) throw Error('Next concept did not open a distinct saved unit');
 await page.getByRole('heading', { name: 'Calculate cube volume' }).waitFor();
 await page.getByRole('region', { name: 'Concept representation' }).getByRole('button', { name: 'Interactive 3D' }).waitFor();
 await page.reload({ waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Calculate cube volume' }).waitFor();
 const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['chapter-learner:student'].units);
 if (saved.length !== 3 || saved.find(unit => unit.id === firstUnit)?.stage !== 'completed' || saved.find(unit => unit.id === reviewUnit)?.stage !== 'explain' || saved.find(unit => unit.id === secondUnit)?.conceptId !== 'qa:volume') throw Error('Chapter progress, prior project or review activity was lost');
 if (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) > 1) throw Error('Chapter path overflows at 390px');
 if (errors.length) throw Error(`Page errors: ${errors.join('; ')}`);
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-two-concept-chapter-390.png' });
 await page.evaluate(() => { const db = JSON.parse(localStorage.getItem('visionary_content_v1')); const graph = db.spaces['chapter-learner:student'].graphs[0]; graph.syllabus.status = 'official'; for (const concept of graph.concepts) concept.status = 'official'; localStorage.setItem('visionary_content_v1', JSON.stringify(db)); });
 const evidenceBeforeLanguage = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence));
 await page.reload({ waitUntil: 'networkidle' });
 await page.locator('header select.v-field').selectOption('hi');
 await page.getByText(/saved teaching content is not loaded in Hindi/).waitFor();
 await page.getByRole('button', { name: 'Use available English teaching' }).waitFor();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-language-unavailable-390.png' });
 await page.getByText('Report a content problem').click();
 await page.getByLabel('What is the problem?').selectOption('translation');
 await page.getByRole('button', { name: 'Save issue locally' }).click();
 await page.getByText(/has not been sent to a content team/).waitFor();
 await page.getByText(/has not been sent to a content team/).scrollIntoViewIfNeeded();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-language-source-recovery-390.png' });
 if (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) > 1) throw Error('Language and issue recovery overflows at 390px');
 await page.reload({ waitUntil: 'networkidle' });
 await page.getByText('Report a content problem').click();
 await page.getByText('1 issue saved for this concept and language on this device.').waitFor();
 await page.getByRole('button', { name: 'Use available English teaching' }).click();
 await page.getByRole('button', { name: 'Check my understanding' }).waitFor();
 if (await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence)) !== evidenceBeforeLanguage) throw Error('Language switch or issue report changed assessment evidence');
 const beforeNoQuestion = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence));
 await page.evaluate(() => { const db = JSON.parse(localStorage.getItem('visionary_content_v1')); const concept = db.spaces['chapter-learner:student'].graphs[0].concepts.find(item => item.id === 'qa:volume'); delete concept.check; localStorage.setItem('visionary_content_v1', JSON.stringify(db)); });
 await page.reload({ waitUntil: 'networkidle' });
 await page.getByRole('button', { name: 'Check my understanding' }).click();
 await page.getByText('No verifiable question is available yet.').waitFor();
 await page.getByRole('button', { name: 'Review explanation' }).click();
 await page.getByRole('heading', { name: 'Understand one idea' }).waitFor();
 if (await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence)) !== beforeNoQuestion) throw Error('Missing question changed learning evidence');
 const evidenceBefore = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence));
 await page.evaluate(() => { const db = JSON.parse(localStorage.getItem('visionary_content_v1')); db.spaces['chapter-learner:student'].graphs[0].concepts = db.spaces['chapter-learner:student'].graphs[0].concepts.filter(item => item.id !== 'qa:volume'); localStorage.setItem('visionary_content_v1', JSON.stringify(db)); });
 await page.reload({ waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Teaching content unavailable' }).waitFor();
 await page.getByRole('button', { name: 'Retry content' }).click();
 await page.getByRole('heading', { name: 'Teaching content unavailable' }).waitFor();
 if (await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['chapter-learner:student'].evidence)) !== evidenceBefore) throw Error('Unavailable content changed learning evidence');
 if ((await page.evaluate(() => JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['chapter-learner:student'].units)).length !== 3) throw Error('Unavailable content removed saved activity');
 await page.getByRole('link', { name: 'Open learning outline' }).waitFor();
 await page.screenshot({ path: 'docs/visionary/baseline/design-2026-09-27/student-content-unavailable-390.png' });
 await page.goto(`${base}/dashboard/learn?unit=not-in-this-workspace`, { waitUntil: 'networkidle' });
 await page.getByRole('heading', { name: 'Learning activity unavailable' }).waitFor();
 await page.getByRole('link', { name: 'Open learning outline' }).waitFor();
 if (errors.length) throw Error(`Page errors: ${errors.join('; ')}`);
 console.log('chapter path: prerequisite, review, source-language fallback, local issue report, missing question/content recovery, invalid link; 0 page errors');
} finally {
 await context.close(); await browser.close();
}
