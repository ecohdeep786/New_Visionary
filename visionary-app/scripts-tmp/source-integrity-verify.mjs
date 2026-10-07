import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {learningCopy} from '../src/lib/learningCopy.js';

const setup=fs.readFileSync('scripts-tmp/learning-2d-verify.mjs','utf8').replaceAll('\r\n','\n');
const start=setup.indexOf('await context.addInitScript(')+'await context.addInitScript('.length;
const identity=Function('return ('+setup.slice(start,setup.indexOf('const page =',start)).trim().replace(/\);$/,'')+')')();
const source=fs.readFileSync('scripts-tmp/learning-source-verify.mjs','utf8').replaceAll('\r\n','\n');
const begin=source.indexOf('await context.addInitScript(locale=>{')+'await context.addInitScript('.length;
const content=Function('return ('+source.slice(begin,source.indexOf('},locale);',begin)+1)+')')();
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4253';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn'])for(const scenario of ['incomplete','ambiguous']){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
 await context.addInitScript(identity);await context.addInitScript(content,locale);
 await context.addInitScript(scenario=>{
  if(localStorage.getItem('source-integrity-fixture'))return;
  const key=scenario==='incomplete'?'visionary_learning_pipeline_v1':'visionary_content_v1';
  const valid=localStorage.getItem(key),db=JSON.parse(valid);
  if(scenario==='incomplete')db.spaces['representation-student:student'].units[0].sourceContext={selection:null,provenance:null};
  else{const other=structuredClone(db.spaces['representation-student:student'].graphs[0]);other.syllabus.id='other:syllabus';other.syllabus.subject='Another source';db.spaces['representation-student:student'].graphs.push(other);}
  localStorage.setItem('source-integrity-valid',valid);localStorage.setItem(key,JSON.stringify(db));localStorage.setItem('source-integrity-fixture','1');
 },scenario);
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(String(error)));const c=learningCopy(locale);
 try{
  await page.goto(base+'/dashboard/learn?unit=source%3Aactivity-v1',{waitUntil:'domcontentloaded'});
  const heading=scenario==='incomplete'?'Saved learning unavailable':'Teaching content unavailable';
  await page.getByRole('heading',{name:c(heading),exact:true}).waitFor();
  const originals=await page.evaluate(()=>['visionary_learning_pipeline_v1','visionary_content_v1'].map(key=>localStorage.getItem(key)));
  assert.equal(await page.getByRole('radio').count(),0);assert.equal(await page.getByRole('button',{name:c('Apply this in Build'),exact:true}).count(),0);
  if(scenario==='ambiguous'){
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:c('Export current activity view'),exact:true}).click();
   const download=await pending,exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.source.provenance.version,'1');assert.equal(exported.question.answerIndex,undefined);
  }
  const retry=scenario==='incomplete'?'Retry saved learning':'Retry content';
  await page.getByRole('button',{name:c(retry),exact:true}).click();await page.getByRole('heading',{name:c(heading),exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>['visionary_learning_pipeline_v1','visionary_content_v1'].map(key=>localStorage.getItem(key))),originals);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`scripts-tmp/source-integrity-${scenario}-${locale}.png`,fullPage:true});
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:c(heading),exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>['visionary_learning_pipeline_v1','visionary_content_v1'].map(key=>localStorage.getItem(key))),originals);
  await page.evaluate(scenario=>localStorage.setItem(scenario==='incomplete'?'visionary_learning_pipeline_v1':'visionary_content_v1',localStorage.getItem('source-integrity-valid')),scenario);
  await page.getByRole('button',{name:c(retry),exact:true}).click();await page.getByRole('button',{name:c('Apply this in Build'),exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log(`PASS ${locale}/${scenario}: original bytes retained through retry/reload; no stale answer/build controls; explicit restore/retry; 320–1440 reflow${scenario==='ambiguous'?'; source export excludes answer key':''}.`);
 }finally{await context.close();}
}}finally{await browser.close();}
