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
  const content=await page.evaluate(()=>localStorage.getItem('visionary_content_v1'));
  for(const aliases of [[],{first:'same',second:'same'},{'source:concept':'unavailable:legacy-target'}]){
   await page.evaluate(({content,aliases})=>{const db=JSON.parse(content);db.spaces['representation-student:student'].aliases=aliases;localStorage.setItem('visionary_content_v1',JSON.stringify(db));},{content,aliases});
   const corrupt=await page.evaluate(()=>localStorage.getItem('visionary_content_v1'));
   await page.reload({waitUntil:'networkidle'});await page.getByRole('heading',{name:c('Teaching content unavailable'),exact:true}).waitFor();assert.equal(await page.getByRole('radio').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_content_v1')),corrupt);assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),original);
   const downloading=page.waitForEvent('download');await page.getByRole('button',{name:c('Export current activity view'),exact:true}).click();const download=await downloading;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.source.provenance.version,'1');assert.equal(exported.question.answerIndex,undefined);
   await page.evaluate(content=>localStorage.setItem('visionary_content_v1',content),content);await page.getByRole('button',{name:c('Retry content'),exact:true}).click();await page.getByRole('button',{name:c('Apply this in Build'),exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),original);
  }
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  assert.deepEqual(errors,[]);console.log('PASS '+locale+': malformed/ambiguous mappings and unavailable legacy target disclosed; original content/activity bytes retained; private export excludes answer key; explicit restored-source retry resumes; 320–1440 reflow.');
 }catch(error){console.log(await page.locator('body').innerText({timeout:5000}).catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}
