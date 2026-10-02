// Fictional professional → organization portfolio sharing journey.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4191';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context=await browser.newContext({viewport:{width:390,height:844}});
await context.addInitScript(()=>{
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const users=[{id:'share-pro',email:'sam@share.test',full_name:'Sam',identity:'professional',roles:['professional'],age_band:'adult',onboarding_complete:true},{id:'share-org',email:'org@share.test',full_name:'Company admin',identity:'organization',roles:['organization'],age_band:'adult',onboarding_complete:true}];
 const empty=()=>({conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',lowBandwidth:false,notifications:'weekly',memory:true,voice:false},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:'2026-09-29'},legacyImported:false});
 localStorage.setItem('visionary_users',JSON.stringify(users));
 localStorage.setItem('visionary_sessions',JSON.stringify(users.map(user=>({token:user.identity,userId:user.id,email:user.email,expiresAt:Date.now()+86400000,createdAt:Date.now()}))));
 localStorage.setItem('visionary_session_token','professional');
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:users.map(user=>({id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:user.roles})),workspaces:users.map(user=>({id:`${user.id}:${user.identity}`,personId:user.id,role:user.identity,name:user.identity,lastPath:'/dashboard/home'})),active:Object.fromEntries(users.map(user=>[user.id,`${user.id}:${user.identity}`])),relationships:[{id:'company-connection',from:'share-org',to:'share-pro',type:'organization',scope:['shared-resources'],status:'active'}],data:{'share-pro:professional':empty(),'share-org:organization':empty()}}));
});
const page=await context.newPage();page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
await page.goto(base+'/dashboard/settings',{waitUntil:'networkidle'});await page.getByLabel('Teaching language',{exact:true}).selectOption('hi');await page.getByLabel('Interface language',{exact:true}).selectOption('bn');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['share-pro:professional'].preferences.locale),'hi');
await page.goto(base+'/dashboard/personalization',{waitUntil:'networkidle'});assert.equal(await page.getByLabel('Teaching language',{exact:true}).inputValue(),'hi');assert.equal(await page.getByLabel('Interface language',{exact:true}).inputValue(),'bn');
await page.goto(base+'/dashboard/settings',{waitUntil:'networkidle'});await page.getByRole('radio',{name:/green/i}).press('Space');
await page.evaluate(()=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='visionary_users')throw Error('Fictional account failure');return old.call(this,key,value);};window.restoreAccountAppearance=()=>Storage.prototype.setItem=old;});await page.getByRole('button',{name:'Save account accent'}).click();await page.getByText('Account accent could not be saved. Your selection remains here for retry.').waitFor();assert.equal(await page.getByRole('radio',{name:/green/i}).isChecked(),true);
await page.evaluate(()=>window.restoreAccountAppearance());await page.getByRole('button',{name:'Save account accent'}).click();await page.getByText('Account accent saved on this device.').waitFor();await page.reload({waitUntil:'networkidle'});assert.equal(await page.getByRole('radio',{name:/green/i}).isChecked(),true);assert.equal(await page.getByLabel('Teaching language',{exact:true}).inputValue(),'hi');assert.equal(await page.evaluate(()=>Object.hasOwn(JSON.parse(localStorage.getItem('visionary_users')).find(row=>row.id==='share-pro').preferences||{},'learning_language')),false);
await page.setViewportSize({width:640,height:450});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/settings-canonical-640.png'});assert.deepEqual(errors,[]);console.log('PASS Settings and Personalization share saved workspace language; account accent failure/retry/refresh preserves language; 640px reflow, zero page errors');
}finally{await browser.close();}

