import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context=await browser.newContext({viewport:{width:390,height:844}});
await context.addInitScript(()=>{
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const roles=['student','teacher','parent','professional','organization'];
 const user={id:'help-person',email:'person@help.test',full_name:'Fictional helper',identity:'student',roles,age_band:'adult',onboarding_complete:true};
 const empty=()=>({conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date().toISOString().slice(0,10)},legacyImported:false});
 localStorage.setItem('visionary_users',JSON.stringify([user]));localStorage.setItem('visionary_sessions',JSON.stringify([{token:'help',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));localStorage.setItem('visionary_session_token','help');
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles}],workspaces:roles.map(role=>({id:'help-person:'+role,personId:user.id,role,name:'Personal'})),active:{'help-person':'help-person:student'},relationships:[],data:Object.fromEntries(roles.map(role=>['help-person:'+role,empty()]))}));
});
const page=await context.newPage();page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(120000);const errors=[];page.on('pageerror',error=>errors.push(String(error)));
try{
 await page.goto('http://127.0.0.1:4191/dashboard/support',{waitUntil:'networkidle'});
 const jobs={student:'How do I start a learning activity?',professional:'How do I connect learning to my work?',teacher:'How do I prepare and assign work?',parent:'How do I support my child?',organization:'How do we review curriculum and content?'};
 for(const [role,title] of Object.entries(jobs)){
  await page.evaluate(role=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.active['help-person']='help-person:'+role;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},role);
  await page.goto('http://127.0.0.1:4191/dashboard/support',{waitUntil:'networkidle'});await page.getByRole('heading',{name:title,exact:true}).waitFor();await page.getByText(/Navigation and Progress have English, Hindi and Bengali labels/).waitFor();
  await page.goto('http://127.0.0.1:4191/dashboard/profile',{waitUntil:'networkidle'});await page.getByLabel('Display name',{exact:true}).waitFor();assert.equal(await page.getByLabel('New learning area',{exact:true}).count(),['student','professional'].includes(role)?1:0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 assert.deepEqual(errors,[]);console.log('PASS all five role-specific Help starts, truthful language/storage/model boundaries, eligible Profile learning-area controls and 390px reflow; no errors.');
}catch(error){console.log(await page.locator('body').innerText());console.log(errors);throw error;}finally{await browser.close();}
