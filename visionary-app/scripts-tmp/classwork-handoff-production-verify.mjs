import {chromium} from 'playwright-core';import assert from 'node:assert/strict';
import {classworkTranslator} from '../src/lib/classworkCopy.js';import {workspaceText} from '../src/lib/workspaceStrings.js';
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4246';const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn']){const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),t=classworkTranslator(locale);
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
await context.addInitScript(()=>{if(localStorage.getItem('handoff-alt-fixture'))return;const db=JSON.parse(localStorage.getItem('visionary_workspace_v2'));db.people[0].roles.push('professional');db.workspaces.push({id:'failure-learner:professional',personId:'failure-learner',role:'professional',name:'Professional',lastPath:'/dashboard/home'});db.data['failure-learner:professional']=structuredClone(db.data['failure-learner:student']);localStorage.setItem('visionary_workspace_v2',JSON.stringify(db));localStorage.setItem('handoff-alt-fixture','1');});
const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',error=>errors.push(String(error)));let releaseHome;
await page.route('**/assets/DashboardHome-*.js',async route=>{await new Promise(resolve=>{releaseHome=resolve;});await route.continue().catch(()=>{});});
try{
 await page.goto(base+'/dashboard/learn?assignment=failure-assignment',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:t('Continue to response'),exact:true}).click();
 const response='Private student draft '+locale;await page.getByLabel('1. Explain equal parts',{exact:true}).fill(response);await page.getByRole('button',{name:t('Review my response'),exact:true}).click();
 const before=await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner'));
 await page.getByRole('combobox',{name:workspaceText(locale,'activeWorkspace'),exact:true}).selectOption('failure-learner:professional');await page.waitForURL('**/dashboard/home');
 await page.getByRole('status').filter({hasText:workspaceText(locale,'openingWorkspace')}).waitFor();assert.equal((await page.locator('body').innerText()).includes(response),false);
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner')),before);assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
 assert.ok(releaseHome,'Production Home asset must be pending');releaseHome();await page.getByRole('status').filter({hasText:workspaceText(locale,'openingWorkspace')}).waitFor({state:'hidden'});
 assert.equal((await page.locator('body').innerText()).includes(response),false);
 await page.getByRole('combobox',{name:workspaceText(locale,'activeWorkspace'),exact:true}).selectOption('failure-learner:student');await page.goto(base+'/dashboard/learn?assignment=failure-assignment',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:t('Review the copy your teacher will receive'),exact:true}).waitFor();await page.getByText(response,{exact:true}).waitFor();
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).click();await page.getByRole('heading',{name:t('Submitted for review'),exact:true}).waitFor();const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_entity_Submission')));assert.equal(rows.length,1);assert.ok(rows[0].text.includes(response));assert.deepEqual(errors,[]);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 console.log('PASS '+locale+': production pending Home chunk shows localized current-workspace loading and excludes prior draft; original response retained; return and explicit submission succeed; 320–1440px reflow.');
}catch(error){console.log(await page.locator('body').innerText().catch(()=>''));throw error;}finally{releaseHome?.();await context.close();}
}}finally{await browser.close();}
