import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {storage,reset} from '../tests/fixtures/classCurriculum.mjs';
import * as workspace from '../src/services/workspaceService.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import {configureContentRepository} from '../src/services/contentRepository.ts';
import {configureTeachingInterface} from '../src/services/teachingInterface.ts';
import {learningCopy} from '../src/lib/learningCopy.js';

const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4262';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn'].filter(value=>!process.env.VISIONARY_LOCALE||value===process.env.VISIONARY_LOCALE))for(const teaching of ['hi','bn'].filter(value=>!process.env.VISIONARY_TEACHING||value===process.env.VISIONARY_TEACHING)){
 reset();workspace.configureMock({latency:0,fault:'none',now:()=>new Date()});workspace.seedDemo('adult');
 const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:teaching};
 const selection={board:'Synthetic language review',classLevel:'7',subject:'Mathematics'},provenance={provider:'Synthetic source',sourceId:'language:book',version:'fixture-1'};
 const question={id:'source-check',prompt:'Choose one half.',options:['One half','One quarter'],answerIndex:0,source:'database'};
 const concept={id:'language:concept',title:'Synthetic equal parts',topicId:'language:topic',status:'official',locale:'en',availableLocales:['en'],prerequisiteIds:[],representations:[{id:'text',kind:'text',alternative:'Two equal parts make a whole.'}],explanation:'Two equal parts make one whole.',check:question,practice:[{...question,id:'source-practice'}],project:{title:'Source application',brief:'Explain equal parts.',criteria:[{id:'parts',label:'Equal parts',prompt:'Explain your evidence.'}]}};
 const graph={syllabus:{...selection,id:'language:syllabus',status:'official',contentLocale:'en',availableLocales:['en'],provenance,textbooks:[{id:'language:book',title:'Synthetic book',chapterIds:['language:chapter']}],chapters:[{id:'language:chapter',title:'Equal parts',textbookId:'language:book',topicIds:['language:topic'],status:'official'}]},topics:[{id:'language:topic',title:'Equal parts',chapterId:'language:chapter',conceptIds:[concept.id],status:'official'}],concepts:[concept]};
 const responseText=teaching==='hi'?'दो बराबर हिस्से मिलकर एक पूरा बनाते हैं।':'দুটি সমান অংশ মিলে একটি সম্পূর্ণ হয়।';
 const translatedQuestion={id:'translated-check',prompt:teaching==='hi'?'आधा चुनें।':'অর্ধেক বেছে নিন।',options:teaching==='hi'?['आधा','चौथाई']:['অর্ধেক','এক চতুর্থাংশ'],answerIndex:0,source:'database'};
 configureContentRepository({async getSyllabus(){return graph;}});await pipeline.selectLearningSyllabus(ctx,selection);
 const unit=await pipeline.startLearningUnit(ctx,concept.id);
 configureTeachingInterface({async request(mode){return {status:'ready',source:'adapter',locale:teaching,promptVersion:'synthetic-language-1',text:responseText,...(mode==='practice'?{question:translatedQuestion}:{})};}});
 await pipeline.requestUnitTeaching(ctx,unit.id,'explanation');await pipeline.beginComprehension(ctx,unit.id);configureTeachingInterface(null);await pipeline.answerLearningQuestion(ctx,unit.id,1);configureContentRepository(null);
 const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data[ctx.workspaceId].preferences.interfaceLocale=locale;db.data[ctx.workspaceId].preferences.locale=teaching;storage.set('visionary_workspace_v2',JSON.stringify(db));
 const person=db.people.find(row=>row.id===ctx.personId),user={id:person.id,email:person.email,full_name:person.name,identity:'student',roles:['student'],age_band:'adult',onboarding_complete:true};
 storage.set('visionary_users',JSON.stringify([user]));storage.set('visionary_sessions',JSON.stringify([{token:user.id,userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));storage.set('visionary_session_token',user.id);
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});await context.addInitScript(entries=>{if(localStorage.getItem('visionary_workspace_v2'))return;for(const [key,value] of entries)localStorage.setItem(key,value);},[...storage]);
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(String(error)));const t=learningCopy(locale);
 const press=async name=>{const button=page.getByRole('button',{name,exact:true});await button.focus();await page.keyboard.press('Enter');};
 try{
  await page.goto(base+'/dashboard/learn?unit='+encodeURIComponent(unit.id),{waitUntil:'domcontentloaded'});
  await page.getByText(t('Not yet. Review the idea and try a smaller step.'),{exact:true}).waitFor();
  assert.equal(await page.locator('legend').filter({hasText:translatedQuestion.prompt}).getAttribute('lang'),teaching);
  assert.equal(await page.locator('fieldset').getByText(translatedQuestion.options[1],{exact:true}).getAttribute('lang'),teaching);
  await press(t('Review explanation and model'));await page.getByText(responseText,{exact:true}).waitFor();
  assert.equal(await page.getByText(responseText,{exact:true}).getAttribute('lang'),teaching);await page.getByText(t('Source: connected teaching adapter.'),{exact:true}).waitFor();
  await page.reload({waitUntil:'domcontentloaded'});await page.getByText(responseText,{exact:true}).waitFor();assert.equal(await page.getByText(responseText,{exact:true}).getAttribute('lang'),teaching);
  await page.getByLabel(t('Teaching language'),{exact:true}).selectOption('en');await page.getByText(concept.explanation,{exact:true}).waitFor();assert.equal(await page.getByText(concept.explanation,{exact:true}).getAttribute('lang'),'en');
  assert.equal(await page.getByText(concept.representations[0].alternative,{exact:true}).getAttribute('lang'),'en');assert.equal(await page.getByText(t('Source: connected teaching adapter.'),{exact:true}).count(),0);
  await press(t('Check my understanding'));await page.getByRole('radio',{name:'One quarter',exact:true}).focus();await page.keyboard.press('Space');await press(t('Check answer'));await page.getByText(t('Not yet. Review the idea and try a smaller step.'),{exact:true}).waitFor();
  const summary=page.locator('summary').filter({hasText:t('Review {count} saved attempts',{count:2})});await summary.focus();await page.keyboard.press('Enter');
  const history=page.locator('.v-attempt-history');assert.equal(await history.getByText(translatedQuestion.prompt,{exact:true}).getAttribute('lang'),teaching);assert.equal(await history.getByText(question.prompt,{exact:true}).getAttribute('lang'),'en');
  const retained=await page.evaluate(()=>({content:localStorage.getItem('visionary_content_v1'),learning:localStorage.getItem('visionary_learning_pipeline_v1')}));
  await page.screenshot({path:'scripts-tmp/content-language-'+locale+'-'+teaching+'-history.png'});
  await page.evaluate(space=>{const db=JSON.parse(localStorage.getItem('visionary_content_v1'));db.spaces[space].graphs[0].concepts=[];localStorage.setItem('visionary_content_v1',JSON.stringify(db));},ctx.workspaceId);
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:t('Teaching content unavailable'),exact:true}).waitFor();
  const pending=page.waitForEvent('download');await press(t('Export current activity view'));const exported=JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));
  assert.equal(exported.explanationLocale,'en');assert.equal(exported.explanationSource,'authored');assert.equal(exported.questionLocale,'en');assert.deepEqual(exported.attempts.map(attempt=>attempt.locale),[teaching,'en']);assert.ok(!JSON.stringify(exported).includes('answerIndex'));
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),retained.learning);
  await page.evaluate(value=>localStorage.setItem('visionary_content_v1',value),retained.content);await press(t('Retry content'));await page.locator('legend').filter({hasText:question.prompt}).waitFor();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}assert.deepEqual(errors,[]);
  console.log('PASS interface '+locale+'/teaching '+teaching+': failed remediation retains exact question/explanation language and adapter origin; keyboard review/reload; explicit English source and text alternative; keyboard check/history keeps both languages; withdrawn source retains bytes, key-free export retains language metadata; explicit restore; four widths/no errors.');
 }catch(error){console.log(await page.locator('body').innerText().catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}

