import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {classworkTranslator} from '../src/lib/classworkCopy.js';
import {workspaceText} from '../src/lib/workspaceStrings.js';
// Actual source adapter is deferred; separate production regression verifies built UI.
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4244';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn']){
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),t=classworkTranslator(locale);
await context.addInitScript(({locale})=>{
 if(localStorage.getItem('visionary_workspace_v2'))return;
 const user={id:'failure-learner',email:'learner@failure.test',full_name:'Learner fixture',identity:'student',roles:['student'],age_band:'adult',onboarding_complete:true};
 const data={conversations:[],sessions:[],artifacts:[],resources:[],notifications:[],audit:[],preferences:{locale:'en',interfaceLocale:locale,voice:false,memory:true},subscription:{plan:'Free',state:'active',invoices:[],usage:0,usageDay:new Date().toISOString().slice(0,10)},legacyImported:false};
 localStorage.setItem('visionary_users',JSON.stringify([user]));localStorage.setItem('visionary_sessions',JSON.stringify([{token:'failure-session',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));localStorage.setItem('visionary_session_token','failure-session');
 localStorage.setItem('visionary_workspace_v2',JSON.stringify({version:2,people:[{id:user.id,email:user.email,name:user.full_name,ageBand:'adult',roles:['student']}],workspaces:[{id:user.id+':student',personId:user.id,role:'student',name:'My learning',lastPath:'/dashboard/classes'}],active:{[user.id]:user.id+':student'},relationships:[],data:{[user.id+':student']:data}}));
 localStorage.setItem('visionary_entity_Classroom',JSON.stringify([{id:'failure-class',name:'Independent class fixture',subject:'Mathematics',teacher_email:'teacher@failure.test',teacher_id:'failure-teacher',join_code:'FAILURE'}]));
 localStorage.setItem('visionary_entity_Enrollment',JSON.stringify([{id:'failure-enrollment',class_id:'failure-class',student_email:user.email,student_id:user.id,status:'active'}]));
 localStorage.setItem('visionary_entity_Assignment',JSON.stringify([{id:'failure-assignment',class_id:'failure-class',teacher_email:'teacher@failure.test',teacher_id:'failure-teacher',title:'Draft recovery fixture',description:'Explain equal parts.',checks:[{id:'failure-q',prompt:'Explain equal parts'}],status:'published',points:10}]));
 localStorage.setItem('visionary_classwork_drafts_v1:failure-learner',JSON.stringify({'failure-assignment':{selfReview:{retained:'Retained criterion note '+locale}}}));
},{locale});
const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',error=>errors.push(String(error)));
let releaseHome;await page.route('**/src/pages/dashboard/DashboardHome.jsx*',async route=>{await new Promise(resolve=>{releaseHome=resolve;});await route.continue().catch(()=>{});});
try{
 await page.goto(base+'/dashboard/learn?assignment=failure-assignment',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:t('Continue to response'),exact:true}).click();
 const response='Original student response '+locale;await page.getByLabel('1. Explain equal parts',{exact:true}).fill(response);
 await page.getByRole('button',{name:t('Review my response'),exact:true}).click();
 await page.evaluate(async locale=>{
  const w=await import('/src/services/workspaceService.ts');const alternative=w.addRole('failure-learner','professional');const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.data[alternative.id].preferences.interfaceLocale=locale;localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));window.dispatchEvent(new CustomEvent('visionary:v2-change'));
  const {appClient}=await import('/src/api/appClient.js');const original=appClient.entities;let pending=true;
  appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];if(name!=='Submission')return entity;return {...entity,async create(...args){if(!pending)return entity.create(...args);pending=false;window.pendingSubmission=true;await new Promise(resolve=>{window.releaseSubmission=resolve;});try{return await entity.create(...args);}catch(error){window.submissionFailure=error.message;throw error;}finally{appClient.entities=original;window.submissionFinished=true;}}};}});
 },locale);
 const draftBytes=await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner'));
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).click();await page.waitForFunction(()=>window.pendingSubmission);
 await page.getByRole('combobox',{name:workspaceText(locale,'activeWorkspace'),exact:true}).selectOption('failure-learner:professional');await page.waitForURL('**/dashboard/home');await page.getByRole('status').filter({hasText:workspaceText(locale,'openingWorkspace')}).waitFor();assert.equal((await page.locator('body').innerText()).includes(response),false);
 await page.evaluate(()=>window.releaseSubmission());await page.waitForFunction(()=>window.submissionFinished);
 assert.match(await page.evaluate(()=>window.submissionFailure),/workspace changed/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner')),draftBytes);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_workspace_v2')).active['failure-learner']),'failure-learner:professional');
 assert.equal((await page.locator('body').innerText()).includes(response),false);
 assert.ok(releaseHome,'Home request must be pending');releaseHome();await page.getByRole('status').filter({hasText:workspaceText(locale,'openingWorkspace')}).waitFor({state:'hidden'});
 await page.getByRole('combobox',{name:workspaceText(locale,'activeWorkspace'),exact:true}).selectOption('failure-learner:student');
 await page.goto(base+'/dashboard/learn?assignment=failure-assignment',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:t('Review the copy your teacher will receive'),exact:true}).waitFor();await page.getByText(response,{exact:true}).waitFor();
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).click();await page.getByRole('heading',{name:t('Submitted for review'),exact:true}).waitFor();
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_entity_Submission')));assert.equal(rows.length,1);assert.ok(rows[0].text.includes(response));assert.equal(rows[0].student_id,'failure-learner');assert.deepEqual(errors,[]);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));console.log('PASS '+locale+': real workspace selector during pending submission rejects late commit; prior draft retained; professional Home excludes old response; return and explicit retry create one student response.');
}catch(error){console.log(await page.locator('body').innerText().catch(()=>''));throw error;}finally{releaseHome?.();await context.close();}
}}finally{await browser.close();}
