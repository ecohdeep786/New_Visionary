import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4191';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context=await browser.newContext({viewport:{width:390,height:844}});
await context.addInitScript(()=>{
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const user={id:'scope-teacher',email:'teacher@scope.test',full_name:'Dev',identity:'teacher',roles:['teacher'],age_band:'adult',onboarding_complete:true};
 const empty=()=>({conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date().toISOString().slice(0,10)},legacyImported:false});
 const personal={id:'scope-teacher:teacher',personId:user.id,role:'teacher',name:'Teacher',lastPath:'/dashboard/home'};
 const work={...personal,id:'scope-teacher:teacher:org:school@scope.test',name:'Sample school · Teacher',organizationId:'school@scope.test'};
 localStorage.setItem('visionary_users',JSON.stringify([user]));
 localStorage.setItem('visionary_sessions',JSON.stringify([{token:'scope',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));localStorage.setItem('visionary_session_token','scope');
 localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([{id:'scope-invite',organization_email:'school@scope.test',organization_name:'Sample school',email:user.email,role:'teacher',status:'active'}]));
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['teacher']}],workspaces:[personal,work],active:{[user.id]:personal.id},relationships:[],data:{[personal.id]:empty(),[work.id]:empty()}}));
});
const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(String(error)));
async function create(name,label){
 await page.getByRole('button',{name:'Create class',exact:true}).first().click();
 const dialog=page.getByRole('dialog');await dialog.getByText(label,{exact:false}).waitFor();await dialog.getByLabel('Class name',{exact:true}).fill(name);
 await dialog.getByRole('button',{name:'Create class',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.getByText(name,{exact:true}).first().waitFor();
}
try{
 await page.goto(`${base}/dashboard/classes`,{waitUntil:'networkidle'});
 await create('Independent reasoning','Independent teaching');
 await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.active['scope-teacher']='scope-teacher:teacher:org:school@scope.test';localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.getByText('Independent reasoning',{exact:true}).count(),0);
 await create('School reasoning','Organization class');
 await page.reload({waitUntil:'networkidle'});await page.getByText('School reasoning',{exact:true}).first().waitFor();
 const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_entity_Classroom')));
 assert.equal(records.find(row=>row.name==='Independent reasoning').organization_email,undefined);
 assert.equal(records.find(row=>row.name==='School reasoning').organization_email,'school@scope.test');
 await page.getByText('School reasoning',{exact:true}).first().scrollIntoViewIfNeeded();
 await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/teacher-linked-class-390.png',fullPage:true});
 await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite'));rows[0].status='revoked';localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify(rows));});
 await page.reload({waitUntil:'networkidle'});await page.getByText('Independent reasoning',{exact:true}).first().waitFor();assert.equal(await page.getByText('School reasoning',{exact:true}).count(),0);
 await page.getByText('Independent reasoning',{exact:true}).first().scrollIntoViewIfNeeded();
 await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/teacher-independent-recovery-390.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('390px teacher independent → linked creation → refresh → revoked personal recovery passed.');
}finally{await browser.close();}
