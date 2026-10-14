import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

// Fictional authenticated accounts and intercepted APIs. No production writes.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'artifacts/tmp/product-onboarding-browser');
await fs.mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
const results = [], origin = 'http://localhost:5173';
let activePage;
const common = { full_name: 'Fixture Adult', age_band: 'adult' };
const profiles = {
  student: { ...common, identity: 'student', education_stage: 'school', board: 'CBSE', grade_level: 'Class 12', medium: 'English', study_routine: { time: 'evening', days: 'daily', duration: '30_60' } },
  professional: { ...common, identity: 'professional', education_stage: 'professional', preferred_language: 'English', career_goal: 'Build an app' },
  teacher: { ...common, identity: 'teacher', teacher_category: 'school', board: 'CBSE', medium: 'English', experience: '1_3', teacher_role: 'subject_teacher' },
  parent: { ...common, identity: 'parent', parent_relation: 'guardian', child_stage: 'school', board: 'CBSE', grade_level: 'Class 12', medium: 'English' },
  organization: { ...common, identity: 'organization', org_type: 'training', org_name: 'Fixture Training', org_focus: 'Software engineering', org_medium: ['English'] },
};
const click = async (page, label) => {
  await page.waitForFunction(label => [...document.querySelectorAll('button')].some(element => element.textContent.trim() === label && !element.disabled), {}, label);
  await page.evaluate(label => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === label && !element.disabled).click(), label);
};
const see = (page, value) => page.waitForFunction(value => document.body.innerText.includes(value), {}, value);
const text = page => page.$eval('body', element => element.innerText);
async function fixture(role, draft, width = 1280) {
  const context = await browser.createBrowserContext(), page = await context.newPage(); activePage = page;
  await page.setViewport({ width, height: width < 500 ? 640 : 900 });
  let account = { id: `onboarding-${role}`, email: `${role}@fixture.invalid`, full_name: '', auth_source: 'firebase', onboarding_complete: false };
  const errors = [], writes = []; let failSetup = false, failIntro = false;
  page.on('pageerror', error => errors.push(error.message));
  if (draft) await page.evaluateOnNewDocument(({ id, draft }) => { if (!sessionStorage.getItem('draft-seeded')) { localStorage.setItem(`visionary_onboarding_${id}`, JSON.stringify(draft)); sessionStorage.setItem('draft-seeded', 'yes'); } }, { id: account.id, draft });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const respond = (status, body) => request.respond({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/api/auth/me') return respond(200, account);
    if (url.pathname === '/api/auth/csrf') return respond(200, { token: 'fixture-csrf' });
    if (url.pathname === '/api/auth/onboarding' || url.pathname === '/api/auth/onboarding/introduction') {
      assert.equal(request.headers()['x-visionary-account'], account.id);
      if (url.pathname.endsWith('/introduction')) {
        if (failIntro) { failIntro = false; return respond(503, { message: 'PRIVATE server detail auth/internal' }); }
        account = { ...account, getting_started_complete: true };
      } else {
        if (failSetup) { failSetup = false; return respond(503, { message: 'PRIVATE server detail auth/internal' }); }
        const body = JSON.parse(request.postData()); writes.push(body);
        account = { ...account, ...body, onboarding_complete: true, getting_started_complete: false };
      }
      return respond(200, account);
    }
    if (url.origin !== origin) return request.abort();
    return request.continue();
  });
  await page.goto(`${origin}/onboarding`, { waitUntil: 'networkidle0' });
  return { context, page, errors, writes, failSetup: () => { failSetup = true; }, failIntro: () => { failIntro = true; } };
}
try {
  const select = async (page, label, value) => {
    const id = await page.evaluate(label => [...document.querySelectorAll('label')].find(e => e.textContent.trim() === label)?.htmlFor, label);
    assert.ok(id, `Missing label ${label}`); await page.select(`[id="${id}"]`, value);
  };
  const fill = async (page, label, value) => {
    const id = await page.evaluate(label => [...document.querySelectorAll('label')].find(e => e.textContent.trim() === label)?.htmlFor, label);
    assert.ok(id, `Missing label ${label}`); await page.type(`[id="${id}"]`, value);
  };
  const choose = (page, label) => page.evaluate(label => [...document.querySelectorAll('button')].find(e => e.textContent.includes(label)).click(), label);
  const cases = [
    ['professional','I am a Professional'], ['teacher','I am a Teacher'], ['parent','I am a Parent'], ['organization','We are an Organization'],
    ['school','I am a Learner'], ['higher_ed','I am a Learner'], ['competitive','I am a Learner'], ['independent','I am a Learner'],
  ];
  for (const [kind, role] of cases) {
    const current = await fixture(kind, null, ['school','parent','organization'].includes(kind) ? 390 : 1280), {page} = current;
    await see(page, 'Make Visionary your own');
    assert.ok(await page.$('[aria-current="step"]')); assert.ok(await page.$('aside svg'));
    if (kind === 'professional') await page.screenshot({path:path.join(output,'roles-desktop.png'),fullPage:true});
    await choose(page, role); await click(page, 'Continue'); await see(page, 'A little about you');
    await fill(page, 'What should we call you?', 'Fixture Adult'); await select(page, 'Your age range', 'adult'); await click(page, 'Continue');
    if (role === 'I am a Learner') {
      const focus = {school:'School',higher_ed:'Higher education',competitive:'Exam preparation',independent:'Independent learning'}[kind];
      await see(page, 'What are you learning?'); await choose(page, focus); await select(page,'Preferred learning language','Hindi'); await click(page,'Continue');
      if (kind === 'school') {
        await select(page,'School board','State'); await select(page,'Class','Class 12');
        assert.equal(await page.$eval('button[type="submit"]',e=>e.disabled),true); await select(page,'State or union territory','West Bengal');
        await fill(page,'Subjects or interests (optional)','Mathematics, Science');
        await page.screenshot({path:path.join(output,'learner-mobile.png'),fullPage:true});
        await click(page,'Continue');
      } else if (kind === 'competitive') { await select(page,'Exam','GATE'); await click(page,'Continue'); }
      else await click(page,'Skip for now');
    } else {
      await see(page,'Make Visionary work for you');
      if (kind === 'teacher') { await select(page,'Your teaching context','coaching'); await fill(page,'Subjects or interests (optional)','Physics, Mathematics'); }
      if (kind === 'organization') { await fill(page,'Organization name','Fixture Training'); await select(page,'Organization type','training'); assert.equal(await page.$eval('input',e=>e.value),'Fixture Training'); }
      await click(page,['professional','parent'].includes(kind)?'Skip for now':'Continue');
    }
    await see(page,'Ready to start with Visionary?'); assert.doesNotMatch(await text(page),/workspace/i);
    const progress=await page.$eval('[role="progressbar"]',e=>[+e.getAttribute('aria-valuenow'),+e.getAttribute('aria-valuemax')]); assert.ok(progress[0]<progress[1]); assert.ok(progress[1]<=5);
    assert.equal(await page.$eval('body',e=>e.scrollWidth<=innerWidth),true);
    if(kind==='professional') {
      await page.reload({waitUntil:'networkidle0'}); await see(page,'Ready to start with Visionary?');
      current.failSetup(); await click(page,'Start using Visionary'); await see(page,'Sign-in is temporarily unavailable'); assert.doesNotMatch(await text(page),/PRIVATE|auth\/internal/);
      await page.screenshot({path:path.join(output,'review-desktop.png'),fullPage:true});
    }
    await click(page,'Start using Visionary'); await page.waitForFunction(()=>location.pathname==='/dashboard/home'); await see(page,'Welcome to Visionary');
    assert.equal(current.writes.length,1); const payload=current.writes[0];
    assert.equal(payload.full_name,'Fixture Adult'); assert.equal(payload.age_band,'adult');
    assert.equal(payload.child_name,undefined); assert.equal(payload.semester,undefined); assert.equal(payload.experience,undefined); assert.equal(payload.parent_relation,undefined); assert.equal(payload.career_goal,undefined);
    if(kind==='school') { assert.deepEqual(payload.subjects,['Mathematics','Science']); assert.equal(payload.medium,'Hindi'); }
    if(kind==='teacher') assert.deepEqual(payload.teacher_subjects,['Physics','Mathematics']);
    const dialog = await page.$('[role="dialog"]'); assert.ok(dialog);
    assert.equal(await page.$eval('[role="dialog"]',e=>e.scrollWidth<=innerWidth),true);
    assert.doesNotMatch(await page.$eval('[role="dialog"]',e=>e.innerText),/workspace/i);
    if(kind==='professional') {
      await page.screenshot({path:path.join(output,'welcome-desktop.png'),fullPage:true});
      for(let i=0;i<12;i++){await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>!!document.activeElement.closest('[role="dialog"]')),true);}
      await click(page,'Continue'); await see(page,'Find your next step'); await page.screenshot({path:path.join(output,'tour-navigation-desktop.png'),fullPage:true});
      await click(page,'Back'); await see(page,'Welcome to Visionary'); await click(page,'Continue'); await click(page,'Continue'); await see(page,'You’re in control');
      current.failIntro(); await click(page,'Start exploring'); await see(page,'Sign-in is temporarily unavailable'); await click(page,'Start exploring');
      await page.waitForFunction(()=>!document.getElementById('getting-started-title')); await page.reload({waitUntil:'networkidle0'}); assert.equal(await page.$('[role="dialog"]'),null);
      await click(page,'Show getting started'); await see(page,'Welcome to Visionary'); await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));
      assert.equal(await page.evaluate(()=>document.activeElement.textContent.trim()),'Show getting started');
      await click(page,'Show getting started'); await click(page,'Skip introduction'); await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));
    } else {
      await page.screenshot({path:path.join(output,`${kind}-welcome.png`),fullPage:true});
      if (kind === 'parent') {
        await click(page,'Continue'); await click(page,'Continue'); await see(page,'You’re in control');
        await page.screenshot({path:path.join(output,'privacy-tour-mobile.png'),fullPage:true});
        const bounds = await page.$eval('[role="dialog"] footer button:last-child', e => { const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight; }); assert.equal(bounds,true);
        await click(page,'Start exploring');
      } else await click(page,'Skip introduction');
      await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));
      await page.reload({waitUntil:'networkidle0'}); assert.equal(await page.$('[role="dialog"]'),null);
    }
    assert.deepEqual(current.errors,[]); results.push({scenario:`${kind}-short-setup-and-welcome-dialog`,passed:true}); console.log(`PASS: ${kind}`); await current.context.close();
  }
  const minor=await fixture('minor',null,360); await choose(minor.page,'I am a Learner'); await click(minor.page,'Continue'); await fill(minor.page,'What should we call you?','Fixture Learner'); await select(minor.page,'Your age range','minor');
  await see(minor.page,'Under-18 setup needs a verified guardian'); assert.equal(await minor.page.$eval('button[type="submit"]',e=>e.disabled),true); assert.equal(minor.writes.length,0); assert.equal(await minor.page.$eval('body',e=>e.scrollWidth<=innerWidth),true);
  await minor.page.screenshot({path:path.join(output,'early-guardian-mobile.png'),fullPage:true}); assert.deepEqual(minor.errors,[]); await minor.context.close();
  results.push({scenario:'early-guardian-gate-preserves-account-and-draft',passed:true});
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2)); console.log(JSON.stringify(results));
} catch(error) {
  if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:path.join(output,'failure.png'),fullPage:true});await fs.writeFile(path.join(output,'failure.txt'),await text(activePage));} throw error;
} finally {await browser.close();}
