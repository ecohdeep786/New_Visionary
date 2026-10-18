import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {organizationAuthorCopy} from '../src/lib/organizationAuthorCopy.js';
import {organizationCopy} from '../src/lib/organizationCopy.js';

const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4250';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const locale of ['en','hi','bn']) {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await context.addInitScript(locale=>{
   if(localStorage.getItem('visionary_workspace_v2'))return;
   const users=['owner','member'].map(name=>({id:`governance-${name}`,email:`${name}@governance.test`,full_name:name,identity:'organization',roles:['organization'],age_band:'adult',onboarding_complete:true}));
   const spaceId='governance-member:organization:org:owner@governance.test';
   const empty=()=>({conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale,interfaceLocale:locale,voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date().toISOString().slice(0,10)},legacyImported:false});
   localStorage.setItem('visionary_users',JSON.stringify(users));
   localStorage.setItem('visionary_sessions',JSON.stringify([{token:'member',userId:users[1].id,email:users[1].email,expiresAt:Date.now()+86400000}]));
   localStorage.setItem('visionary_session_token','member');
   const spaces=[...users.map(user=>({id:`${user.id}:organization`,personId:user.id,role:'organization',name:'My organization',lastPath:'/dashboard/home'})),{id:spaceId,personId:users[1].id,role:'organization',organizationId:users[0].email,name:'Connected organization',lastPath:'/dashboard/library'}];
   localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:users.map(user=>({id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['organization']})),workspaces:spaces,active:{'governance-owner':'governance-owner:organization','governance-member':spaceId},relationships:[],data:Object.fromEntries(spaces.map(space=>[space.id,empty()]))}));
   localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([{id:'academic',organization_email:users[0].email,email:users[1].email,role:'organization',status:'active',capability:'academic-admin'}]));
  },locale);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const t=organizationAuthorCopy(locale);
  await page.goto(`${base}/dashboard/library`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:t('New content draft'),exact:true}).click();
  await page.getByLabel(t('Content title'),{exact:true}).fill('Retained fictional objective');
  await page.getByLabel(t('Content and learning objective'),{exact:true}).fill('Private unfinished editorial notes');
  await page.waitForFunction(()=>localStorage.getItem('visionary_resource_editor_v1')?.includes('Private unfinished editorial notes'));
  const original=await page.evaluate(()=>localStorage.getItem('visionary_resource_editor_v1'));
  await page.screenshot({path:`scripts-tmp/governance-${locale}-before.png`,fullPage:true});
  const permission=async capability=>page.evaluate(capability=>{
   const rows=JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite'));rows[0].capability=capability;
   localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify(rows));window.dispatchEvent(new Event('visionary:workspace-change'));
  },capability);
  for(const profile of ['analyst','billing-admin','__proto__','constructor']){
   await permission(profile);
   await page.getByRole('heading',{name:organizationCopy(locale,'Permission required'),exact:true}).waitFor();
   assert.equal(await page.getByRole('dialog').count(),0);
   assert.equal(await page.getByText('Private unfinished editorial notes',{exact:true}).count(),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_resource_editor_v1')),original);
  }
  await page.screenshot({path:`scripts-tmp/governance-${locale}-denied.png`,fullPage:true});
  await permission('academic-admin');
  await page.getByRole('button',{name:t('New content draft'),exact:true}).click();
  assert.equal(await page.getByLabel(t('Content and learning objective'),{exact:true}).inputValue(),'Private unfinished editorial notes');
  assert.equal(await page.getByLabel(t('Content title'),{exact:true}).inputValue(),'Retained fictional objective');
  await page.getByRole('button',{name:t('Save content draft'),exact:true}).click();
  await page.getByRole('button',{name:t('Submit saved revision'),exact:true}).waitFor();
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.screenshot({path:`scripts-tmp/governance-${locale}-recovered.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(`${locale}: academic draft → analyst/billing/malformed permission denial → exact recovery/save; four widths; no page errors`);
  await context.close();
 }
} finally {await browser.close();}
