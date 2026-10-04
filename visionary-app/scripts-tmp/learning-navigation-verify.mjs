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
 const originalUrl=page.url();const originalId=new URL(originalUrl).searchParams.get('unit');
 const before=await page.evaluate(()=>localStorage.getItem('visionary_learning_pipeline_v1'));
 await page.getByRole('link',{name:c('Learning outline'),exact:true}).click();
 await page.getByRole('region',{name:c('Subject chapters'),exact:true}).getByRole('button').nth(1).click();
 await page.getByRole('button',{name:/^(Start |शुरू |শুরু )/}).first().click();
 await page.getByLabel(c('Teaching language'),{exact:true}).waitFor();
 const destination=page.url(),nextId=new URL(destination).searchParams.get('unit');assert.notEqual(nextId,originalId);
 const title=await page.locator('header h1').innerText();
 await page.evaluate(()=>window.releaseTeaching());
 // The browser-local adapter promise remains resolvable after the UI cancels it.
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
 assert.equal(page.url(),destination);assert.equal(await page.locator('header h1').innerText(),title);
 const units=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_learning_pipeline_v1')).spaces['representation-student:student'].units);
 assert.equal(units.find(unit=>unit.id===originalId).response,undefined,'navigation must cancel the old teaching write');
 assert.equal(JSON.parse(before).spaces['representation-student:student'].units[0].response,undefined);
 assert.equal(await page.getByRole('alert').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS '+locale+': pending teaching cancelled on activity navigation; current concept/url retained; old activity unmodified; no leaked error.');
 }catch(error){console.log(await page.locator('body').innerText({timeout:5000}).catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}
