import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const base = process.env.DESIGN_REVIEW_URL || 'http://127.0.0.1:4197';
const productRoot=fileURLToPath(new URL('../../',import.meta.url));
const evidence = path.resolve(productRoot,process.env.DESIGN_EVIDENCE_DIR || 'docs/visionary/baseline/design-quality-2026-10-12');
await fs.mkdir(evidence, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context = await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
await context.addInitScript(() => {
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const user={id:'design-quality',email:'quality@example.test',full_name:'Alex',identity:'student',roles:['student'],age_band:'adult',onboarding_complete:true};
 const now=Date.now(),id=user.id+':student';
 const data={conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date(now).toISOString().slice(0,10)},legacyImported:false};
 localStorage.setItem('visionary_users',JSON.stringify([user]));
 localStorage.setItem('visionary_sessions',JSON.stringify([{token:user.id,userId:user.id,email:user.email,expiresAt:now+86400000}]));
 localStorage.setItem('visionary_session_token',user.id);
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['student']}],workspaces:[{id,personId:user.id,role:'student',name:'Personal'}],active:{[user.id]:id},relationships:[],data:{[id]:data}}));
});
const page=await context.newPage(),errors=[],samples=[];
page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(90000);
page.on('pageerror',error=>errors.push(String(error)));
const ctx={personId:'design-quality',workspaceId:'design-quality:student',role:'student',locale:'en'};
try {
 await page.goto(`${base}/dashboard/progress`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Your evidence starts with an activity'}).waitFor();
 assert.equal(await page.locator('.v-progress-overview').count(),0,'empty history must not invent achievement');
 // Development setup uses the real local services; a compiled run imports an isolated snapshot.
 if(process.env.DESIGN_FIXTURE_PATH) {
  const fixture=JSON.parse(await fs.readFile(process.env.DESIGN_FIXTURE_PATH,'utf8'));
  await page.evaluate(fixture=>{for(const [key,value] of Object.entries(fixture.storage))localStorage.setItem(key,value);},fixture);
 } else {
  const fixture=await page.evaluate(async ctx=>{
   const p=await import('/src/services/learningPipelineService.ts');
   const c=await import('/src/services/contentRepository.ts');
   const syllabus=await p.selectLearningSyllabus(ctx,c.SAMPLE_SELECTION);
   const repo=c.getContentRepository(ctx),topics=await repo.getTopics(syllabus.chapters[1].id),concepts=await repo.getConcepts(topics[0].id);
   let unit=await p.startLearningUnit(ctx,concepts[0].id);
   await p.requestUnitTeaching(ctx,unit.id,'explanation');
   unit=await p.beginComprehension(ctx,unit.id);
   await p.answerLearningQuestion(ctx,unit.id,unit.question.answerIndex);
   unit=await p.nextLearningQuestion(ctx,unit.id,true);
   await p.answerLearningQuestion(ctx,unit.id,unit.question.answerIndex);
   return {unitId:unit.id,storage:Object.fromEntries(Object.keys(localStorage).map(key=>[key,localStorage.getItem(key)]))};
  },ctx);
  await fs.writeFile(`${evidence}/fictional-fixture.json`,JSON.stringify(fixture,null,2));
 }
 const fixture=JSON.parse(await fs.readFile(process.env.DESIGN_FIXTURE_PATH||`${evidence}/fictional-fixture.json`,'utf8'));
 await page.goto(`${base}/dashboard/learn?unit=${fixture.unitId}`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Practice step recorded'}).waitFor();
 await page.screenshot({path:`${evidence}/practice-recorded-390.png`});
 assert.equal(await page.getByRole('button',{name:'Apply this in Build',exact:true}).count(),1);
 await page.getByRole('button',{name:'Apply this in Build',exact:true}).click();
 await page.getByRole('heading',{name:'Put the idea to work',exact:true}).waitFor();
 await page.getByRole('link',{name:'Open your project',exact:true}).waitFor();
 await page.goto(`${base}/dashboard/progress`,{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Your work in this period'}).waitFor();
 assert.match(await page.locator('.v-progress-overview').innerText(),/2 correct/);
 for(const scheme of ['light','dark'])for(const width of [320,390,768,1440]) {
  await page.emulateMedia({colorScheme:scheme});await page.setViewportSize({width,height:900});
  const geometry=await page.evaluate(()=>({document:document.documentElement.scrollWidth>innerWidth,main:document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1,font:getComputedStyle(document.querySelector('.workspace-shell')).fontFamily}));
  assert.equal(geometry.document||geometry.main,false,`${scheme}/${width} overflow`);
  assert.equal(geometry.font.split(',')[0].replaceAll('"','').trim(),'Google Sans');
  samples.push({scheme,width,...geometry});
  await page.screenshot({path:`${evidence}/progress-${scheme}-${width}.png`});
 }
 await page.setViewportSize({width:390,height:900});
 await page.getByLabel('Find an objective',{exact:true}).fill('no matching title');
 await page.getByRole('heading',{name:'No matching objectives'}).waitFor();
 assert.match(await page.locator('.v-progress-overview').innerText(),/2 correct/,'search cannot rewrite period totals');
 await page.getByLabel('Find an objective',{exact:true}).fill('');
 const backup=await page.evaluate(()=>({workspace:localStorage.getItem('visionary_workspace_v2'),mentor:localStorage.getItem('visionary_mentor_v1')}));
 await page.evaluate(()=>{
  const store=JSON.parse(localStorage.getItem('visionary_workspace_v2'));
  store.data['design-quality:student'].sessions=[{id:'fictional-earlier',journeyId:'cube',stage:'checking',locale:'en',position:0,answers:{},canvas:{size:3,rotation:25},notes:'',updatedAt:new Date().toISOString(),interrupted:false,evidence:[{id:'fictional-check',objectiveId:'cube',kind:'check',correct:1,total:1,at:new Date().toISOString(),delayed:false}]}];
  localStorage.setItem('visionary_workspace_v2',JSON.stringify(store));localStorage.setItem('visionary_mentor_v1','Fictional unreadable evidence');
 });
 await page.reload({waitUntil:'networkidle'});
 await page.getByText('Some sources are unavailable. This summary includes only the records that could be read.').waitFor();
 assert.match(await page.locator('.v-progress-overview').innerText(),/1 correct/);
 await page.evaluate(backup=>{localStorage.setItem('visionary_workspace_v2',backup.workspace);localStorage.setItem('visionary_mentor_v1',backup.mentor);},backup);
 await page.reload({waitUntil:'networkidle'});
 await page.getByLabel('Evidence period',{exact:true}).selectOption('all');
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await page.screenshot({path:`${evidence}/progress-large-text.png`});
 assert.equal(await page.evaluate(()=>document.querySelector('#main').scrollWidth>document.querySelector('#main').clientWidth+1),false);
 await page.goto(`${base}/dashboard/settings`,{waitUntil:'networkidle'});
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await page.getByRole('combobox',{name:'Interface language',exact:true}).selectOption('hi');
 await page.waitForFunction(()=>document.querySelector('.workspace-shell').lang==='hi');
 await page.getByRole('button',{name:'और पृष्ठ',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 const type=await page.evaluate(()=>{
  const dialog=document.querySelector('[role="dialog"]'),title=document.querySelector('#main h1');
  const probe=document.createElement('span');probe.className='text-[17px]';probe.textContent='Type';document.querySelector('#main').append(probe);
  const out={dialog:getComputedStyle(dialog).fontFamily,dialogLeading:getComputedStyle(dialog).lineHeight,titleLeading:getComputedStyle(title).lineHeight,titleSize:getComputedStyle(title).fontSize,legacy:getComputedStyle(probe).fontSize};probe.remove();return out;
 });
 assert.equal(type.dialog.split(',')[0].replaceAll('"','').trim(),'Google Sans');assert.equal(type.legacy,'34px');
 assert.ok(parseFloat(type.titleLeading)/parseFloat(type.titleSize)>=1.49,'Indic heading leading');
 await page.evaluate(()=>document.documentElement.style.setProperty('--font-product','Georgia, serif'));
 assert.match(await page.locator('[role="dialog"]').evaluate(e=>getComputedStyle(e).fontFamily),/Georgia/,'shared font token updates portals');
 assert.match(await page.locator('#main h1').evaluate(e=>getComputedStyle(e).fontFamily),/Georgia/,'shared font token updates product headings');
 await page.evaluate(()=>document.documentElement.style.removeProperty('--font-product'));
 await page.screenshot({path:`${evidence}/hindi-navigation-large-text.png`});
 await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${evidence}/review-results.json`,JSON.stringify({samples,type,errors},null,2));
 console.log('PASS empty/populated evidence, real local sample check/practice -> project, eight theme/viewport samples, filtered totals, 200% text, shared brand font and Hindi portal typography.');
}catch(error){console.error(error);await page.screenshot({path:`${evidence}/failure.png`}).catch(()=>{});throw error;}finally{await browser.close();}
