import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {learningCopy} from '../src/lib/learningCopy.js';
const source=fs.readFileSync('scripts-tmp/learning-2d-verify.mjs','utf8').replaceAll('\r\n','\n');
const start=source.indexOf('await context.addInitScript(')+'await context.addInitScript('.length,end=source.indexOf('const page =',start);
const fixture=Function('return ('+source.slice(start,end).trim().replace(/\);$/,'')+')')();
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4239';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn']){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});await context.addInitScript(fixture);
 await context.addInitScript(locale=>{
  if(localStorage.getItem('source-recovery-fixture'))return;
  const workspaceId='representation-student:student',selection={board:'Synthetic review',classLevel:'7',subject:'Source recovery'},provenance={provider:'Synthetic source',sourceId:'source:book',version:'1'};
  const question={id:'practice',prompt:'Original authored question',options:['A','B'],answerIndex:0,source:'database'};
  const concept={id:'source:concept',title:'Reviewed source activity',topicId:'source:topic',prerequisiteIds:[],status:'official',locale:'en',availableLocales:['en'],explanation:'Original explanation',representations:[],check:question,practice:[question],project:{title:'Original project',brief:'Original source brief',criteria:[{id:'evidence',label:'Evidence',prompt:'Describe your evidence'}]}};
  const graph={syllabus:{...selection,id:'source:syllabus',status:'official',contentLocale:'en',availableLocales:['en'],provenance,textbooks:[{id:'source:book',title:'Fixture book',chapterIds:['source:chapter']}],chapters:[{id:'source:chapter',title:'Reviewed source chapter',textbookId:'source:book',topicIds:['source:topic'],status:'official'}]},topics:[{id:'source:topic',title:'Reviewed source topic',chapterId:'source:chapter',conceptIds:['source:concept'],status:'official'}],concepts:[concept]};
  const unit={id:'source:activity-v1',conceptId:concept.id,title:concept.title,locale:'en',sourceContext:{selection,provenance},stage:'practice',checkPassed:true,practicePassed:true,difficulty:1,practiceRound:1,question,answer:{index:0,correct:true,id:'fixture-answer'},explanation:concept.explanation,updatedAt:'2026-10-04T12:00:00Z'};
  const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data[workspaceId].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));
  localStorage.setItem('visionary_content_v1',JSON.stringify({version:1,spaces:{[workspaceId]:{graphs:[graph],aliases:{},gaps:[]}}}));localStorage.setItem('visionary_learning_pipeline_v1',JSON.stringify({version:1,spaces:{[workspaceId]:{selection,syllabusId:graph.syllabus.id,units:[unit]}}}));localStorage.setItem('source-recovery-fixture','1');
 },locale);
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(String(e)));const c=learningCopy(locale);
 try{
  const oldUrl=base+'/dashboard/learn?unit=source%3Aactivity-v1';await page.goto(oldUrl,{waitUntil:'networkidle'});await page.getByRole('button',{name:c('Apply this in Build'),exact:true}).waitFor();
  const original=await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1'));
  await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_content_v1'));const graph=db.spaces['representation-student:student'].graphs[0];graph.syllabus.provenance.version='2';graph.concepts[0].project.title='New source project';localStorage.setItem('visionary_content_v1',JSON.stringify(db));});
  const work=await page.evaluate(()=>localStorage.getItem('visionary_workspace_v2'));
  await page.getByRole('button',{name:c('Apply this in Build'),exact:true}).click();await page.getByRole('heading',{name:c('Saved source changed'),exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),original);assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_workspace_v2')),work);assert.equal(await page.getByRole('radio').count(),0);
  await page.evaluate(()=>{const original=URL.createObjectURL;URL.createObjectURL=()=>{throw Error('Fictional export failure');};window.restoreSourceExport=()=>URL.createObjectURL=original;});await page.getByRole('button',{name:c('Export current activity view'),exact:true}).click();await page.getByText('Fictional export failure',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),original);await page.evaluate(()=>window.restoreSourceExport());
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:c('Export current activity view'),exact:true}).click();const download=await downloading;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(await page.getByText('Fictional export failure',{exact:true}).count(),0);assert.equal(exported.source.provenance.version,'1');assert.equal(exported.explanation,'Original explanation');assert.equal(exported.selectedIndex,'0');assert.equal(exported.question.answerIndex,undefined);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'scripts-tmp/learning-source-recovery-'+locale+'.png',fullPage:true});
  await page.reload({waitUntil:'networkidle'});await page.getByRole('heading',{name:c('Saved source changed'),exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),original);
  await page.getByRole('link',{name:c('Open learning outline'),exact:true}).click();await page.getByRole('region',{name:c('Subject chapters'),exact:true}).getByRole('button').first().click();await page.getByRole('button',{name:c('Continue')+' Reviewed source activity',exact:true}).first().click();await page.getByLabel(c('Teaching language'),{exact:true}).waitFor();
  const units=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['representation-student:student'].units);assert.equal(units.length,2);assert.equal(JSON.stringify(units.find(unit=>unit.id==='source:activity-v1')),JSON.stringify(JSON.parse(original).spaces['representation-student:student'].units[0]));assert.equal(units.find(unit=>unit.id!=='source:activity-v1').sourceContext.provenance.version,'2');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_mentor_v1')).spaces['representation-student:student'].evidence.length),0);
  assert.deepEqual(errors,[]);console.log('PASS '+locale+': changed source blocks project with exact original bytes retained; localized reload/export excludes answer key; current source starts a separate activity; no scoring; 320–1440 reflow.');
 }catch(error){console.log(await page.locator('body').innerText({timeout:5000}).catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}
