import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {learningCopy} from '../src/lib/learningCopy.js';

// Source-mode browser fixture uses the actual app's adapter module to defer a response.
// Production coverage is separately recorded by learning-controls-verify.mjs.
const source=fs.readFileSync('scripts-tmp/learning-2d-verify.mjs','utf8').replaceAll('\r\n','\n');
const start=source.indexOf('await context.addInitScript(')+'await context.addInitScript('.length,end=source.indexOf('const page =',start);
const fixture=Function('return ('+source.slice(start,end).trim().replace(/\);$/,'')+')')();
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4237';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn']){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(fixture);
 await context.addInitScript(locale=>{if(localStorage.getItem('conflict-locale-fixture'))return;const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data['representation-student:student'].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));localStorage.setItem('conflict-locale-fixture','1');},locale);
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(String(e)));
 try{
 const c=learningCopy(locale);
 await page.goto(base+'/dashboard/learn',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:c('Try authored learning sample'),exact:true}).click();
 await page.getByRole('heading',{name:'Mathematics',exact:true}).waitFor();
 await page.getByRole('region',{name:c('Subject chapters'),exact:true}).getByRole('button').first().click();
 await page.getByRole('button',{name:/^(Start |शुरू |শুরু )/}).first().click();
 await page.getByLabel(c('Teaching language'),{exact:true}).waitFor();
 await page.evaluate(async()=>{const {configureTeachingInterface}=await import('/src/services/teachingInterface.ts');configureTeachingInterface({request:async(_mode,packet)=>{window.pendingTeaching=true;return new Promise(resolve=>{window.releaseTeaching=()=>resolve({status:'ready',source:'adapter',text:'Delayed fictional explanation',locale:packet.language,promptVersion:'browser-delayed-1'});});}});});
 await page.getByRole('button',{name:c('Start this learning unit'),exact:true}).click();
 await page.waitForFunction(()=>window.pendingTeaching);
 const second=await context.newPage();await second.goto(base+'/dashboard/home',{waitUntil:'networkidle'});
 await second.evaluate(async()=>{const p=await import('/src/services/learningPipelineService.ts');const ctx={personId:'representation-student',workspaceId:'representation-student:student',role:'student',locale:'en'};const unit=p.getLearningWorkspace(ctx).units[0];await p.updateLearningLanguage(ctx,unit.id,'hi');p.updateLearningRepresentation(ctx,unit.id,{rotation:90});});
 const latest=await second.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1'));
 await page.bringToFront();
 await page.evaluate(()=>window.releaseTeaching());
 await page.getByRole('heading',{name:c('Saved activity changed'),exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),latest);
 assert.equal(await page.getByRole('radio').count(),0);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
 await page.getByRole('button',{name:c('Retry saved learning'),exact:true}).click();
 assert.equal(await page.getByLabel(c('Teaching language'),{exact:true}).inputValue(),'hi');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['representation-student:student'].units[0].representation.rotation),90);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['representation-student:student'].units[0].attempts?.length||0),0);
 assert.deepEqual(errors,[]);console.log('PASS '+locale+': delayed response rejected, exact newer saved bytes retained, stale controls removed, explicit localized reload, 320–1440 reflow, no recorded answer.');
 }catch(error){console.log(await page.locator('body').innerText({timeout:5000}).catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}
