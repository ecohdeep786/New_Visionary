import fs from 'node:fs';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from '../tests/fixtures/classCurriculum.mjs';
import {getClassworkStudy,saveClassworkStudyQuestion} from '../src/services/classworkStudyService.js';
import {classworkTranslator} from '../src/lib/classworkCopy.js';

const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4254';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const persona of ['minor-cbse','employee'])for(const locale of ['en','hi','bn'])for(const scenario of ['answer-key','removed-delivery']){
 reset();const f=await fixture({learnerPersona:persona});storage.set('visionary_session_token',f.learner.personId);
 const initial=await getClassworkStudy(f.learner,f.assignment.id);await saveClassworkStudyQuestion(f.learner,{assignmentId:f.assignment.id,expectedRevision:initial.revision,question:'Retained private question'});
 const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data[f.learner.workspaceId].preferences.interfaceLocale=locale;storage.set('visionary_workspace_v2',JSON.stringify(db));
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
 await context.addInitScript(entries=>{if(localStorage.getItem('visionary_workspace_v2'))return;for(const [key,value] of entries)localStorage.setItem(key,value);},[...storage]);
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(String(error)));const t=classworkTranslator(locale),studyKey=`visionary_classwork_study_v1:${f.learner.personId}`;
 try{
  await page.goto(base+'/dashboard/practice?assignment='+f.assignment.id,{waitUntil:'domcontentloaded'});await page.getByRole('radio',{name:'One half',exact:true}).waitFor();
  const originals=await page.evaluate(key=>({study:localStorage.getItem(key),submissions:localStorage.getItem('visionary_entity_Submission'),mentor:localStorage.getItem('visionary_mentor_v1'),workspace:localStorage.getItem('visionary_workspace_v2')}),studyKey);
  await page.evaluate(()=>{const original=crypto.subtle.digest.bind(crypto.subtle);window.savedPracticeDigest=crypto.subtle.digest;crypto.subtle.digest=async(...args)=>{const hash=await original(...args);await new Promise(resolve=>window.releasePracticeAnswer=resolve);return hash;};});
  await page.getByRole('radio',{name:'One half',exact:true}).check();await page.getByRole('button',{name:t('Check rehearsal answer'),exact:true}).click();await page.waitForFunction(()=>typeof window.releasePracticeAnswer==='function');
  await page.evaluate(({contentId,deliveryId,scenario})=>{
   const db=JSON.parse(localStorage.getItem('visionary_workspace_v2')),resource=db.data['demo-school-admin:organization'].resources.find(row=>row.id===contentId);
   if(scenario==='removed-delivery')resource.contentReview.deliveries=[];
   else resource.contentReview.deliveries.find(row=>row.id===deliveryId).curriculumTemplate.chapters[0].objectives[0].practice[0].answerIndex=1;
   localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));crypto.subtle.digest=window.savedPracticeDigest;window.releasePracticeAnswer();
  },{contentId:f.content.id,deliveryId:f.delivery.id,scenario});
  const message=scenario==='answer-key'?'The assigned practice source changed. Reopen the latest activity; your saved study is retained.':'Practice for the exact assigned reviewed curriculum is unavailable. The assigned copy and private study are retained.';
  await page.getByRole('alert').getByText(t(message),{exact:true}).waitFor();assert.equal(await page.getByRole('radio').count(),0);
  const retained=await page.evaluate(key=>({study:localStorage.getItem(key),submissions:localStorage.getItem('visionary_entity_Submission'),mentor:localStorage.getItem('visionary_mentor_v1')}),studyKey);assert.deepEqual(retained,{study:originals.study,submissions:originals.submissions,mentor:originals.mentor});
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:t('Export private study backup'),exact:true}).click();const exported=JSON.parse(fs.readFileSync(await (await downloading).path(),'utf8'));
  assert.equal(exported[f.learner.workspaceId][f.assignment.id].questionDraft,'Retained private question');assert.equal(exported[f.learner.workspaceId][f.assignment.id].attempts.length,0);assert.doesNotMatch(JSON.stringify(exported),/answerIndex/);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`scripts-tmp/practice-answer-${persona}-${locale}-${scenario}.png`,fullPage:true});
  await page.evaluate(workspace=>localStorage.setItem('visionary_workspace_v2',workspace),originals.workspace);await page.getByRole('button',{name:t('Retry source'),exact:true}).click();await page.getByRole('radio',{name:'One half',exact:true}).waitFor();
  // A storage failure must retain the reviewed selection for explicit retry.
  await page.evaluate(()=>{window.studyStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('visionary_classwork_study_v1:'))throw Error('Fictional rehearsal storage failure');return window.studyStorageSet.call(this,key,value);};});
  await page.getByRole('radio',{name:'One half',exact:true}).check();await page.getByRole('button',{name:t('Check rehearsal answer'),exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('radio',{name:'One half',exact:true}).isChecked(),true);assert.equal(await page.evaluate(key=>localStorage.getItem(key),studyKey),originals.study);
  await page.evaluate(()=>Storage.prototype.setItem=window.studyStorageSet);await page.getByRole('button',{name:t('Check rehearsal answer'),exact:true}).click();
  await page.getByRole('button',{name:t('Start a distinct retry'),exact:true}).waitFor();
  const saved=await page.evaluate(({key,workspaceId,assignmentId})=>JSON.parse(localStorage.getItem(key))[workspaceId][assignmentId],{key:studyKey,workspaceId:f.learner.workspaceId,assignmentId:f.assignment.id});assert.equal(saved.questionDraft,'Retained private question');assert.equal(saved.attempts.length,1);assert.equal(saved.attempts[0].correct,true);
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:t('Start a distinct retry'),exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),originals.submissions);assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_mentor_v1')),originals.mentor);assert.deepEqual(errors,[]);
  console.log(`PASS ${persona}/${locale}/${scenario}: held grading hash denies changed bank/delivery, hides old controls, preserves/export private question without keys; restored source and quota retry records exactly one private attempt; reload; no class grade/mastery; four widths.`);
 }finally{await context.close();}
}}finally{await browser.close();}
