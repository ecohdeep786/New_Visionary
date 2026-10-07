import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {workspaceText} from '../src/lib/workspaceStrings.js';
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
 await page.evaluate(async()=>{const w=await import('/src/services/workspaceService.ts');w.addRole('representation-student','professional');const {configureTeachingInterface}=await import('/src/services/teachingInterface.ts');configureTeachingInterface({request:async(_mode,packet)=>{window.pendingTeaching=true;return new Promise(resolve=>{window.releaseTeaching=()=>resolve({status:'ready',source:'adapter',text:'Delayed fictional explanation',locale:packet.language,promptVersion:'browser-delayed-1'});});}});});
 await page.getByRole('button',{name:c('Start this learning unit'),exact:true}).click();
 await page.waitForFunction(()=>window.pendingTeaching);
 const before=await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1'));
 await page.getByRole('combobox',{name:workspaceText(locale,'activeWorkspace'),exact:true}).selectOption('representation-student:professional');
 await page.waitForURL('**/dashboard/home');
 await page.evaluate(()=>window.releaseTeaching());
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1')),before);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).active['representation-student']),'representation-student:professional');
 assert.ok(!(await page.locator('body').innerText()).includes('Delayed fictional explanation'));
 assert.deepEqual(errors,[]);
 console.log('PASS '+locale+': pending teaching cancelled through the real workspace selector; prior activity bytes retained; no response leaks into professional Home.');
 }catch(error){console.log(await page.locator('body').innerText({timeout:5000}).catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}
