import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {classworkTranslator} from '../src/lib/classworkCopy.js';
const base=process.env.VISIONARY_BASE||'http://127.0.0.1:4243';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try{for(const locale of ['en','hi','bn']){
const t=classworkTranslator(locale),context=await browser.newContext({viewport:{width:390,height:844}});
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
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));page.setDefaultTimeout(20000);
try{
 await page.goto(base+'/dashboard/learn?assignment=failure-assignment',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:t('Continue to response'),exact:true}).click();
 const response='Retained learner answer '+locale;await page.getByLabel('1. Explain equal parts',{exact:true}).fill(response);
 await page.getByRole('button',{name:t('Review my response'),exact:true}).click();
 const originalAssignment=await page.evaluate(()=>localStorage.getItem('visionary_entity_Assignment'));
 const draftBytes=await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner'));
 await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('visionary_entity_Assignment'));rows[0].description='Changed instructions';localStorage.setItem('visionary_entity_Assignment',JSON.stringify(rows));});
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).click();
 await page.getByRole('alert').filter({hasText:'The assigned content changed'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner')),draftBytes);
 await page.evaluate(value=>localStorage.setItem('visionary_entity_Assignment',value),originalAssignment);
 const enrollmentBytes=await page.evaluate(()=>localStorage.getItem('visionary_entity_Enrollment'));
 await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('visionary_entity_Enrollment'));rows[0].status='left';localStorage.setItem('visionary_entity_Enrollment',JSON.stringify(rows));window.dispatchEvent(new Event('storage'));});
 await page.getByRole('button',{name:t('Retry activity'),exact:true}).waitFor();
 const pendingDownload=page.waitForEvent('download');await page.getByRole('button',{name:t('Export current response'),exact:true}).click();
 const download=await pendingDownload;const exportPath='scripts-tmp/classwork-submit-export-'+locale+'.txt';await download.saveAs(exportPath);const exported=await readFile(exportPath,'utf8');assert.ok(exported.includes(response));assert.ok(exported.includes('Retained criterion note '+locale));
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner')),draftBytes);
 await page.evaluate(value=>{localStorage.setItem('visionary_entity_Enrollment',value);window.dispatchEvent(new Event('storage'));},enrollmentBytes);
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).waitFor();
 await page.evaluate(()=>{window.__submissionWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='visionary_entity_Submission')throw new Error('Fixture quota');return window.__submissionWrite.call(this,key,value);};});
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).click();
 await page.getByRole('alert').filter({hasText:'could not be saved'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_entity_Submission')),null);
 assert.equal(await page.evaluate(()=>localStorage.getItem('visionary_classwork_drafts_v1:failure-learner')),draftBytes);
 await page.evaluate(()=>{Storage.prototype.setItem=window.__submissionWrite;delete window.__submissionWrite;});
 await page.getByRole('button',{name:t('Submit to teacher'),exact:true}).click();
 await page.getByRole('heading',{name:t('Submitted for review'),exact:true}).waitFor();
 const submitted=await page.evaluate(()=>JSON.parse(localStorage.getItem('visionary_entity_Submission')));assert.equal(submitted.length,1);assert.ok(submitted[0].text.includes(response));assert.equal(submitted[0].grade,undefined);assert.equal(submitted[0].text.includes('Retained criterion note'),false);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 assert.deepEqual(errors,[]);console.log('PASS '+locale+': changed source rejected; withdrawn access retains export; failed write preserves draft; explicit retry creates one response; 320–1440px reflow.');
}catch(error){console.log(await page.locator('body').innerText());throw error;}finally{await context.close();}
}}finally{await browser.close();}
