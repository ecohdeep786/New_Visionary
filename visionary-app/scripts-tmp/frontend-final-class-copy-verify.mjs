import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {fixture,reset,storage} from '../tests/fixtures/classCurriculum.mjs';
import {teacherCopy} from '../src/lib/teacherCopy.js';
reset();const f=await fixture();const initial=[...storage];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try {for(const locale of ['en','hi','bn'].filter(value=>!process.env.VISIONARY_LOCALE||value===process.env.VISIONARY_LOCALE)){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(({initial,workspace,locale})=>{if(!localStorage.getItem('visionary_session_token')){for(const [key,value] of initial)localStorage.setItem(key,value);const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data[workspace].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));}window.copyMode='success';window.copyCalls=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copyCalls.push(text);if(window.copyMode==='deny')throw Error('Denied');if(window.copyMode==='held')await new Promise(resolve=>window.releaseCopy=resolve);}}});},{initial,workspace:f.teacher.workspaceId,locale});
 const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));const t=teacherCopy(locale),failure=t('Copy is unavailable. Select the class code and copy it manually.');
 const click=async()=>{const button=page.getByRole('button',{name:new RegExp(t('Copy class code')+'|'+t('Class code copied'))});await button.focus();await page.keyboard.press('Enter');};
 try{
 await page.goto((process.env.VISIONARY_BASE||'http://127.0.0.1:4262')+'/dashboard/class/'+f.classroom.id);await page.getByRole('heading',{name:'Fractions class',exact:true}).waitFor();
 await click();await page.getByText(t('Copied'),{exact:true}).waitFor();assert.deepEqual(await page.evaluate(()=>window.copyCalls),['CURRICULUM']);
 await page.evaluate(()=>window.copyMode='deny');await click();await page.getByText(failure,{exact:true}).waitFor();assert.equal(await page.getByText(t('Copied'),{exact:true}).count(),0,'denial must clear previous success');
 await page.evaluate(()=>window.copyMode='success');await click();await page.getByText(t('Copied'),{exact:true}).waitFor();assert.equal(await page.getByText(failure,{exact:true}).count(),0,'successful retry must clear failure');
 await page.evaluate(()=>window.copyMode='held');await click();await page.waitForFunction(()=>typeof window.releaseCopy==='function');
 await page.evaluate(id=>{const rows=JSON.parse(localStorage.getItem('visionary_entity_Classroom'));rows.find(row=>row.id===id).join_code='CHANGED';localStorage.setItem('visionary_entity_Classroom',JSON.stringify(rows));window.dispatchEvent(new CustomEvent('visionary:workspace-change'));},f.classroom.id);
 await page.getByText('CHANGED',{exact:true}).waitFor();await page.evaluate(()=>window.releaseCopy());await page.getByRole('button',{name:t('Copy class code'),exact:true}).waitFor();assert.equal(await page.getByText(t('Copied'),{exact:true}).count(),0,'late old-code completion must not mark new code copied');
 await page.evaluate(()=>window.copyMode='success');await click();await page.getByText(t('Copied'),{exact:true}).waitFor();assert.equal((await page.evaluate(()=>window.copyCalls)).at(-1),'CHANGED');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));await click();await page.getByText(failure,{exact:true}).waitFor();assert.equal(await page.getByText(t('Copied'),{exact:true}).count(),0);assert.equal(await page.getByText('CHANGED',{exact:true}).evaluate(node=>getComputedStyle(node).userSelect),'all');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'scripts-tmp/frontend-final-class-copy-'+locale+'-recovery.png'});assert.deepEqual(errors,[]);
 console.log('PASS '+locale+': keyboard copy success, denial clears success, retry clears failure, delayed old-code completion rejected after class refresh, fresh new-code copy, missing API retains selectable code, four widths/no page errors. Clipboard is simulated, not physical-device evidence.');
 }finally{await context.close();}
}}finally{await browser.close();}
