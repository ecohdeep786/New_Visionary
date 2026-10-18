import {guideCopy} from '../src/lib/guideCopy.js';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';import {reset,fixture,storage} from '../tests/fixtures/classCurriculum.mjs';
reset();const f=await fixture();const initial=[...storage];
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn'].filter(value=>!process.env.VISIONARY_LOCALE||value===process.env.VISIONARY_LOCALE)){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(({initial,workspace,locale})=>{if(!localStorage.getItem('visionary_session_token')){for(const [key,value]of initial)localStorage.setItem(key,value);const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data[workspace].preferences.locale=locale;db.data[workspace].preferences.interfaceLocale=locale;db.data[workspace].preferences.voice=true;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));}window.recognitions=[];class Recognition{constructor(){window.recognitions.push(this);this.started=false;}start(){this.started=true;}stop(){this.started=false;this.onend?.();}abort(){this.started=false;}emit(parts,index){this.onresult?.({resultIndex:index,results:parts.map(([text,isFinal])=>({0:{transcript:text},isFinal}))});}}Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:Recognition});Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:item=>queueMicrotask(()=>item.onend?.()),cancel(){},getVoices:()=>[]}});Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(text){this.text=text;}}});Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:undefined});},{initial,workspace:f.teacher.workspaceId,locale});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));const field=page.getByLabel('Review spoken question',{exact:true});
 const first=locale==='hi'?'मुझे भिन्न समझाएँ।':locale==='bn'?'আমাকে ভগ্নাংশ বোঝান।':'Explain fractions.',second=locale==='hi'?'एक उदाहरण दें।':locale==='bn'?'একটি উদাহরণ দিন।':'Give an example.';
 const emit=async(parts,index)=>page.evaluate(({parts,index})=>window.recognitions.at(-1).emit(parts,index),{parts,index});
 const value=async expected=>{await page.waitForFunction(expected=>document.querySelector('textarea[aria-label="Review spoken question"]')?.value===expected,expected,{timeout:5000});};
 try{
 await page.goto((process.env.VISIONARY_BASE||'http://127.0.0.1:4262')+'/dashboard/home');assert.equal(await page.evaluate(()=>window.recognitions.length),0);await page.getByRole('button',{name:/Open Visionary voice panel/}).click();await page.getByRole('button',{name:'Start listening',exact:true}).click();assert.equal(await page.evaluate(()=>window.recognitions.at(-1).lang),locale+'-IN');
 const before=await page.evaluate(workspace=>JSON.stringify(JSON.parse(localStorage.getItem('visionary_workspace_v2')).data[workspace].conversations),f.teacher.workspaceId);
 await emit([[first,false]],0);await value(first);await emit([[first,true]],0);await value(first);
 if(process.env.VISIONARY_PHASE!=='edit'){
 await emit([[first,true],[second,false]],1);await value(first+' '+second);await emit([[first,true],[second,true]],1);await value(first+' '+second);await emit([[first,true],[second,true]],0);assert.equal(await field.inputValue(),first+' '+second);
 }
 const edited=first+' '+second+' Edited review.';await field.fill(edited);assert.equal(await page.evaluate(()=>window.recognitions.at(-1).started),false,'manual edit must stop recognition');await page.evaluate(()=>{const old=window.recognitions.at(-1);old.emit([['Late discarded words.',true]],0);old.onend?.();});assert.equal(await field.inputValue(),edited);
 await field.fill('');assert.equal(await field.count(),1,'cleared review stays editable');assert.equal(await page.getByRole('button',{name:'Send spoken question',exact:true}).isDisabled(),true);await field.fill(edited);await value(edited);await page.screenshot({path:'scripts-tmp/voice-review-'+locale+'-edited.png'});
 await page.evaluate(()=>{window.originalStorageWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='visionary_workspace_v2')throw new DOMException('Fixture quota','QuotaExceededError');return window.originalStorageWrite.call(this,key,value);};});
 await page.getByRole('button',{name:'Send spoken question',exact:true}).click();await page.getByText(/Your changes could not be saved on this device/).waitFor();assert.equal(await field.inputValue(),edited);
 await page.evaluate(()=>Storage.prototype.setItem=window.originalStorageWrite);
 await page.getByRole('button',{name:'Start listening',exact:true}).click();await emit([['Additional phrase.',false]],0);await value(edited+' Additional phrase.');await emit([['Additional phrase.',true]],0);await value(edited+' Additional phrase.');
 await emit([['Additional phrase.',true],['x'.repeat(7000),true]],1);await page.waitForFunction(()=>document.querySelector('textarea[aria-label="Review spoken question"]')?.value.length===6000);assert.ok((await field.inputValue()).startsWith(edited));
 const final=await field.inputValue();assert.equal(await page.evaluate(workspace=>JSON.stringify(JSON.parse(localStorage.getItem('visionary_workspace_v2')).data[workspace].conversations),f.teacher.workspaceId),before,'recognition and editing must not auto-send');
 await page.getByRole('link',{name:'Use text instead',exact:true}).click();await page.waitForURL('**/dashboard/ask');assert.equal(await page.getByLabel(guideCopy(locale)('Message Visionary Guide'),{exact:true}).inputValue(),final);assert.equal(await page.evaluate(()=>window.recognitions.some(item=>item.started)),false);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}assert.deepEqual(errors,[]);
 console.log('PASS '+locale+': multi-phrase final/interim accumulation and replay dedup; manual edit stops capture and rejects late callbacks; explicit restart appends; 6000-character bound retains prefix; no automatic send; full reviewed text fallback; four widths/no errors. Speech runtime simulated; no hardware request.');
 }catch(error){console.error('Observed transcript:',await field.inputValue({timeout:2000}).catch(()=>''));throw error;}finally{await context.close();}
}}finally{await browser.close();}




