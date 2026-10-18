import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from '../tests/fixtures/classCurriculum.mjs';
import {classworkTranslator} from '../src/lib/classworkCopy.js';

const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4252';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const locale of ['en','hi','bn']){
  reset();const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
  const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data[f.learner.workspaceId].preferences.interfaceLocale=locale;storage.set('visionary_workspace_v2',JSON.stringify(db));
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.addInitScript(entries=>{if(localStorage.getItem('visionary_workspace_v2'))return;for(const [key,value] of entries)localStorage.setItem(key,value);},[...storage]);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  const t=classworkTranslator(locale);
  const url=base+'/dashboard/practice?assignment='+f.assignment.id;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.getByRole('radio',{name:'One half',exact:true}).waitFor();
  const originalStudy=await page.evaluate(person=>localStorage.getItem('visionary_classwork_study_v1:'+person),f.learner.personId);
  await page.screenshot({path:`scripts-tmp/practice-${locale}-before.png`,fullPage:true});
  await page.evaluate(()=>{
   const rows=JSON.parse(localStorage.getItem('visionary_entity_Assignment'));rows[0].description='Changed fictional fixed instructions';localStorage.setItem('visionary_entity_Assignment',JSON.stringify(rows));window.dispatchEvent(new Event('storage'));
  });
  await page.getByRole('alert').getByText(t('The assigned source changed. Your private study is retained. Reopen the current source before continuing.'),{exact:true}).waitFor();
  assert.equal(await page.getByRole('radio').count(),0);
  assert.equal(await page.getByText('Which is the midpoint?',{exact:true}).count(),0);
  assert.equal(await page.evaluate(person=>localStorage.getItem('visionary_classwork_study_v1:'+person),f.learner.personId),originalStudy);
  await page.screenshot({path:`scripts-tmp/practice-${locale}-source-recovery.png`,fullPage:true});
  await page.getByRole('button',{name:t('Retry source'),exact:true}).click();
  await page.getByRole('radio',{name:'One half',exact:true}).waitFor();
  // Hold the real asynchronous hash, then revoke access without notifying the UI.
  // The service must recheck rather than relying on a storage event.
  await page.evaluate(()=>{
   const original=crypto.subtle.digest.bind(crypto.subtle);
   window.practiceHashes=[];
   crypto.subtle.digest=async(...args)=>{
    const hash=await original(...args);
    if(new TextDecoder().decode(args[1]).includes('Which is the midpoint?'))await new Promise(resolve=>{window.practiceHashes.push(resolve);});
    return hash;
   };
  });
  await page.getByRole('link',{name:t('Return to assigned activity'),exact:true}).click();
  await page.getByRole('link',{name:t('Rehearse this objective'),exact:true}).click();
  await page.waitForFunction(()=>window.practiceHashes.length>0);
  await page.evaluate(()=>{
   const rows=JSON.parse(localStorage.getItem('visionary_entity_Enrollment'));rows[0].status='left';localStorage.setItem('visionary_entity_Enrollment',JSON.stringify(rows));window.practiceHashes.forEach(release=>release());
  });
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('radio').count(),0);
  assert.equal(await page.getByText('Which is the midpoint?',{exact:true}).count(),0);
  assert.equal(await page.evaluate(person=>localStorage.getItem('visionary_classwork_study_v1:'+person),f.learner.personId),originalStudy);
  assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS ${locale}: displayed-source change hides old question; explicit retry; enrollment withdrawal during held real hash denies question without storage event; retained bytes; four widths/no page errors`);
  await context.close();
 }
}finally{await browser.close();}
