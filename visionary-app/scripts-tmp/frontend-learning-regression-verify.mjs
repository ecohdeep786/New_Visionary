import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {storage,fixture,reset,template} from '../tests/fixtures/classCurriculum.mjs';
import {publishClassCurriculum} from '../src/services/classCurriculumService.js';
import {learningSurfaceCopy} from '../src/lib/learningSurfaceCopy.js';
import {classworkTranslator} from '../src/lib/classworkCopy.js';

reset();const curriculum=template();
curriculum.chapters[0].objectives[1].representations=[{id:'cube',kind:'cube',alternative:'A cube has equal sides.'}];
curriculum.chapters[0].objectives.push({id:'chart',title:'Compare recorded values',explanation:'Compare the supplied values.',prerequisiteIds:[],representations:[{id:'chart',kind:'diagram',alternative:'Recorded values are 20, 30 and 25.',series:[{label:'Week 1',value:20},{label:'Week 2',value:30},{label:'Week 3',value:25}]}],criteria:[{id:'compare',label:'Comparison',prompt:'Explain the comparison.'}]});
const f=await fixture({curriculumTemplate:curriculum});
const published=await publishClassCurriculum(f.teacher,{classId:f.classroom.id,deliveryId:f.delivery.id,expectedRevision:'[]'});
const initial=Object.fromEntries(storage),origin=process.env.VISIONARY_PREVIEW_ORIGIN||'http://127.0.0.1:4191';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const errors=[];
try {
 for(const locale of ['en','hi','bn']) {
  const labels=learningSurfaceCopy(locale);
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.addInitScript(({initial,workspaceId,locale})=>{if(localStorage.getItem('visionary_session_token'))return;for(const [key,value] of Object.entries(initial))localStorage.setItem(key,value);localStorage.setItem('visionary_session_token','demo-adult');const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data[workspaceId].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},{initial,workspaceId:f.learner.workspaceId,locale});
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(String(error)));
  const narrowReflow=async()=>{for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,locale+' connected flow reflow '+width);}};
  await page.goto(origin+'/dashboard/classes?class='+f.classroom.id+'&curriculum='+published.id,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:labels.title,exact:true}).waitFor();
  const outline=page.getByRole('heading',{name:labels.title,exact:true}).locator('..');
  await outline.getByLabel(labels.find,{exact:true}).fill('no-match');await outline.getByText(labels.noMatch,{exact:true}).waitFor();
  await outline.getByRole('button',{name:labels.clear,exact:true}).click();
  await outline.getByRole('link',{name:labels.open+': Equal intervals',exact:true}).waitFor();
  await page.getByRole('button',{name:/Equal intervals$/,exact:false}).click();
  const visual=page.getByRole('region',{name:labels.representation,exact:true});
  const slider=visual.getByRole('slider');await slider.focus();await page.keyboard.press('ArrowRight');assert.equal(await slider.inputValue(),'5');
  assert.match(await visual.getByRole('img').getAttribute('aria-label'),/0.625/);
  await visual.getByRole('button',{name:labels.resetLine,exact:true}).click();assert.equal(await slider.inputValue(),'4');
  await visual.getByRole('button',{name:labels.description,exact:true}).click();
  assert.equal(await visual.getByText('One half lies halfway from zero to one.',{exact:true}).getAttribute('lang'),'en');
  await visual.getByRole('button',{name:labels.line,exact:true}).click();
  await page.getByRole('button',{name:/Locate a fraction$/,exact:false}).click();
  await visual.getByRole('slider').first().focus();await page.keyboard.press('ArrowRight');assert.equal(await visual.getByRole('slider').first().inputValue(),'4');
  assert.match(await visual.getByRole('img').getAttribute('aria-label'),/64/);
  await visual.getByRole('button',{name:labels.resetModel,exact:true}).click();assert.equal(await visual.getByRole('slider').first().inputValue(),'3');
  await page.getByRole('button',{name:/Compare recorded values$/,exact:false}).click();
  const table=visual.getByRole('table',{name:labels.table,exact:true});await table.waitFor();
  assert.match(await table.getByRole('row').last().innerText(),/25/);
  assert.equal(await table.getByRole('rowheader',{name:'Week 1',exact:true}).getAttribute('lang'),'en');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,locale+' reflow '+width);}
  // 640 CSS pixels models the reflow viewport of a 1280px desktop at 200% zoom.
  await page.setViewportSize({width:640,height:450});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.equal(await visual.evaluate(region=>getComputedStyle(region.querySelector('button')).transitionDuration),'0s');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`scripts-tmp/frontend-continuation-learning-surface-${locale}-390.png`});
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_mentor_v1')),null);
  // Follow the original assignment through localized response/review recovery.
  const t=classworkTranslator(locale);
  await outline.getByRole('link',{name:labels.open+': Equal intervals',exact:true}).click();
  await page.getByRole('link',{name:t('Ask about this assignment'),exact:true}).click();
  await page.getByRole('textbox',{name:t('Your private classwork question'),exact:true}).fill('A fictional saved source question.');
  await page.getByRole('button',{name:t('Save private question'),exact:true}).click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.getByRole('textbox',{name:t('Your private classwork question'),exact:true}).inputValue(),'A fictional saved source question.');
  await page.getByRole('button',{name:t('Review assigned explanation'),exact:true}).click();
  await page.getByRole('heading',{name:t('From the assigned copy'),exact:true}).waitFor();
  await page.getByText('Divide the whole into equal intervals.',{exact:true}).waitFor();
  await narrowReflow();
  await page.getByRole('link',{name:t('Return to assigned activity'),exact:true}).click();
  await page.getByRole('link',{name:t('Rehearse this objective'),exact:true}).click();
  await page.getByRole('radio',{name:'One half',exact:true}).check();
  await page.getByRole('button',{name:t('Check rehearsal answer'),exact:true}).click();
  await page.getByText(t('Correct for this authored exercise.'),{exact:true}).waitFor();
  await narrowReflow();
  await page.getByRole('link',{name:t('Prepare my class response'),exact:true}).click();
  await page.getByRole('button',{name:t('Continue to response'),exact:true}).click();
  const response=page.getByRole('textbox',{name:t('Class activity response'),exact:true});
  await response.fill('A fictional retained learner response.');
  assert.equal(await page.getByRole('button',{name:t('Review my response'),exact:true}).isEnabled(),false);
  await page.getByRole('textbox',{name:t('Criterion review')+': Equal parts',exact:true}).fill('A fictional criterion note.');
  await page.reload({waitUntil:'domcontentloaded'});assert.equal(await response.inputValue(),'A fictional retained learner response.');
  await narrowReflow();
  await response.focus();
  // A refresh retains controls/focus. Access loss removes the source immediately
  // after the read completes, without deleting the owned response draft.
  const second=await context.newPage();await second.goto(origin+'/dashboard/home',{waitUntil:'domcontentloaded'});
  await second.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('visionary_entity_Classroom'));rows[0].name='Refreshed fictional class';localStorage.setItem('visionary_entity_Classroom',JSON.stringify(rows));});
  await page.bringToFront();await page.getByText('Refreshed fictional class · '+t('Teacher-authored activity'),{exact:true}).waitFor();
  assert.equal(await response.evaluate(field=>field===document.activeElement),true);
  assert.equal(await response.inputValue(),'A fictional retained learner response.');
  await page.getByRole('button',{name:t('Review my response'),exact:true}).click();
  await page.getByRole('heading',{name:t('Review the copy your teacher will receive'),exact:true}).waitFor();
  await narrowReflow();
  await page.screenshot({path:`scripts-tmp/frontend-continuation-learning-player-${locale}-390.png`});
  assert.equal(await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:t('Edit response'),exact:true}).click();
  await second.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('visionary_entity_Enrollment'));rows[0].status='left';localStorage.setItem('visionary_entity_Enrollment',JSON.stringify(rows));});
  await page.getByRole('heading',{name:f.assignment.title,exact:true}).waitFor({state:'hidden'});
  assert.equal(await response.count(),0);
  assert.match(await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:demo-adult')),/retained learner response/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
  console.log(`PASS ${locale}: localized outline/search/status/player/Ask/practice, source language, keyboard number line/cube reset, chart table/mean, 320–1440px and 640px zoom-equivalent reflow, reduced motion, saved private question/source reply/authored-key rehearsal, criterion-gated draft/review/reload, focus retained on refresh, no submissions/mastery and real second-tab enrollment revocation with owned draft retained.`);
  await context.close();
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close();}


