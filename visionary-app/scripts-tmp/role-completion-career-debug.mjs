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
const page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try {
await page.goto(base+'/dashboard/career',{waitUntil:'networkidle'});
const title=page.getByLabel('Capability or role target'),body=page.getByLabel('What would useful progress look like?');
await title.fill('First target');await body.fill('Private unsaved direction');
await page.reload({waitUntil:'networkidle'});
await page.getByText('Unsaved career edits recovered on this device. Save direction to keep them.').waitFor();assert.equal(await title.inputValue(),'First target');
await page.getByRole('button',{name:'Save direction',exact:true}).click();await page.getByText(/Career target saved on this device/).waitFor();
await body.fill('My unfinished edits');
const second=await context.newPage();await second.goto(base+'/dashboard/career',{waitUntil:'networkidle'});
await second.getByLabel('Capability or role target').fill('Other tab target');await second.getByRole('button',{name:'Save direction',exact:true}).click();
await page.getByRole('heading',{name:'A newer direction is saved'}).waitFor();assert.equal(await body.inputValue(),'My unfinished edits');assert.equal(await page.getByRole('button',{name:'Save direction',exact:true}).isDisabled(),true);
const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export current edits'}).click();assert.equal((await download).suggestedFilename(),'career-direction-edits.json');
await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/career-conflict-390.png'});
await page.getByRole('button',{name:'Load saved direction and discard edits'}).click();assert.equal(await title.inputValue(),'Other tab target');
await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='visionary_workspace_v2')throw Error('Fictional storage failure');return original.call(this,key,value);};window.restoreCareerStorage=()=>Storage.prototype.setItem=original;});
await title.fill('Retry target');await page.getByRole('button',{name:'Save direction',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await title.inputValue(),'Retry target');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).data['share-pro:professional'].resources[0].title),'Other tab target');
await page.evaluate(()=>window.restoreCareerStorage());await page.getByRole('button',{name:'Save direction',exact:true}).click();await page.reload({waitUntil:'networkidle'});assert.equal(await title.inputValue(),'Retry target');
await page.evaluate(()=>{const tab=sessionStorage.getItem('visionary_resource_editor_tab');const malformed={version:1,spaces:{'share-pro:professional':{['new:career-direction:tab:'+tab]:{draft:{title:42,body:'Original corrupt bytes',conceptId:''},baseRevision:'null',savedAt:'2026-10-01'}}}};localStorage.setItem('visionary_resource_editor_v1',JSON.stringify(malformed));window.corruptCareerBytes=localStorage.getItem('visionary_resource_editor_v1');});
const corruptBytes=await page.evaluate(()=>localStorage.getItem('visionary_resource_editor_v1'));
await page.reload({waitUntil:'networkidle'});await page.getByRole('alert').waitFor();await title.fill('Retained in form');assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_resource_editor_v1')),corruptBytes);
await page.getByRole('button',{name:'Load saved direction and discard edits'}).click();assert.equal(await title.inputValue(),'Retry target');
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);console.log('PASS career refresh, separate tabs, conflict retention, export, reload, failed save and retry at 390px');
} catch(error) {console.log(await page.locator('main').innerText());await page.screenshot({path:'scripts-tmp/role-completion-career-failure.png'});throw error;} finally {await browser.close();}

