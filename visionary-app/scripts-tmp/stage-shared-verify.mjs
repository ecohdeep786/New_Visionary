import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {supportCopy} from '../src/lib/supportCopy.js';
import {notificationCopy} from '../src/lib/notificationCopy.js';
import {settingsCopy} from '../src/lib/settingsCopy.js';
const origin=process.env.VISIONARY_PREVIEW_ORIGIN||'http://127.0.0.1:4193';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await context.addInitScript(()=>{
 if(localStorage.getItem('visionary_workspace_v2'))return;const roles=['student','teacher','parent','professional','organization'];const user={id:'route-person',email:'person@route.test',full_name:'Fictional route learner',identity:'student',roles,age_band:'adult',onboarding_complete:true};
 const empty=()=>({conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:'en',voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date().toISOString().slice(0,10)},legacyImported:false});
 localStorage.setItem('visionary_users',JSON.stringify([user]));localStorage.setItem('visionary_sessions',JSON.stringify([{token:'route',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));localStorage.setItem('visionary_session_token','route');localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles}],workspaces:roles.map(role=>({id:'route-person:'+role,personId:user.id,role,name:'Personal'})),active:{'route-person':'route-person:student'},relationships:[],data:Object.fromEntries(roles.map(role=>['route-person:'+role,empty()]))}));
});
const page=await context.newPage();page.setDefaultTimeout(30000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const reflow=async()=>{for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}};
try{
 await page.goto(origin+'/dashboard/home',{waitUntil:'networkidle'});
 for(const locale of ['en','hi','bn']){
  await page.evaluate(locale=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));for(const data of Object.values(db.data))data.preferences.interfaceLocale=locale;db.people[0].learningContext={classLevel:'Class 3',stage:'school',subjects:['Science']};db.people[0].ageBand='minor';db.active['route-person']='route-person:student';db.data['route-person:student'].notifications=[{id:'stage-update',text:'Fictional saved update',path:'/dashboard/learn',read:false}];localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},locale);
  const t=notificationCopy(locale),s=settingsCopy(locale),help=supportCopy(locale);
  await page.goto(origin+'/dashboard/home',{waitUntil:'networkidle'});const stage=page.locator('main details').first();await stage.locator('summary').click();assert.match(await stage.innerText(),/5–8/);assert.match(await page.locator('main').innerText(),/Science/);await reflow();
  await page.goto(origin+'/dashboard/settings',{waitUntil:'networkidle'});await page.getByRole('combobox',{name:s('Interface language'),exact:true}).waitFor();assert.equal(await page.getByRole('combobox',{name:s('Interface language'),exact:true}).evaluate(el=>el.closest('[lang]').lang),locale);assert.equal(await page.getByRole('combobox',{name:s('Interface language'),exact:true}).inputValue(),locale);
  await page.getByRole('combobox',{name:s('Guide appearance'),exact:true}).selectOption('girl');await page.reload({waitUntil:'networkidle'});assert.equal(await page.getByRole('combobox',{name:s('Guide appearance'),exact:true}).inputValue(),'girl');await reflow();
  await page.getByRole('radio',{name:s('green'),exact:true}).locator('..').click();
  await page.evaluate(()=>{const users=JSON.parse(localStorage.getItem('visionary_users'));users[0].preferences={...users[0].preferences,theme_color:'red',learning_language:'Bengali'};localStorage.setItem('visionary_users',JSON.stringify(users));});
  await page.getByRole('button',{name:s('Save account accent'),exact:true}).click();await page.getByRole('alert').filter({hasText:s('The account accent changed in another tab. Your choice is still here.')}).waitFor();
  await page.getByRole('button',{name:s('Use saved account accent'),exact:true}).click();await page.getByRole('radio',{name:s('red'),exact:true}).waitFor();assert.equal(await page.getByRole('radio',{name:s('red'),exact:true}).isChecked(),true);
  await page.getByRole('radio',{name:s('purple'),exact:true}).focus();assert.equal(await page.getByRole('radio',{name:s('purple'),exact:true}).evaluate(el=>{const r=el.closest('label').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}),true);await page.keyboard.press('Space');await page.getByRole('button',{name:s('Save account accent'),exact:true}).click();await page.getByText(s('Account accent saved on this device.'),{exact:true}).waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_users'))[0].preferences.learning_language),'Bengali');
  await page.goto(origin+'/dashboard/notifications',{waitUntil:'networkidle'});await page.getByRole('heading',{name:t('Notifications'),exact:true}).waitFor();await page.getByRole('link',{name:t('Open update'),exact:true}).click();await page.goto(origin+'/dashboard/notifications',{waitUntil:'networkidle'});await page.getByRole('button',{name:t('Mark read'),exact:true}).waitFor();
  await page.getByRole('button',{name:t('Mark read'),exact:true}).click();await page.getByRole('combobox',{name:t('Show updates'),exact:true}).selectOption('unread');await page.getByText(t('No unread updates'),{exact:true}).waitFor();await page.getByRole('button',{name:t('Show all updates'),exact:true}).click();await page.getByRole('combobox',{name:t('Summary frequency'),exact:true}).selectOption('off');await page.reload({waitUntil:'networkidle'});assert.equal(await page.getByRole('combobox',{name:t('Summary frequency'),exact:true}).inputValue(),'off');await reflow();
  for(const role of ['student','teacher','parent','professional','organization']){
   await page.evaluate(role=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.active['route-person']='route-person:'+role;db.people[0].ageBand='adult';localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));},role);
   await page.goto(origin+'/dashboard/support',{waitUntil:'networkidle'});await page.getByRole('heading',{name:help.title,exact:true}).waitFor();await page.getByRole('heading',{name:help.roles[role][0],exact:true}).waitFor();await reflow();
  }
  await page.evaluate(()=>{const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.active['route-person']='route-person:professional';localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));});await page.goto(origin+'/dashboard/home',{waitUntil:'networkidle'});await page.locator('main details').first().locator('summary').click();assert.match(await page.locator('main details').first().innerText(),/12–18/);
  await page.setViewportSize({width:390,height:844});await page.goto(origin+'/dashboard/support',{waitUntil:'networkidle'});await page.screenshot({path:'docs/visionary/baseline/design-2026-09-27/shared-help-'+locale+'-390.png',fullPage:true});console.log('PASS '+locale+' stage policy, saved settings, explicit notification read, five-role Help and 320/390/768/1440 reflow');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
