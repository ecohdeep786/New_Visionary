import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrivacyPolicyClient } from '../src/services/privacyPolicyClient.js';
import { createAuthTransport } from '../src/api/firebase/authTransport.js';
const classes = ['auth_device','learning_text','source_files','billing_audit','model_artifacts','admission_proof','voice_transcript','offline_pack','pilot_feedback'];
const value = () => ({version:1,uid:'owner-a',approvalState:'approved',policyVersion:'synthetic-v1',policyDigest:'a'.repeat(64),approvedBy:{name:'Synthetic Reviewer',role:'Test owner'},preservation:{automaticPurge:false,defaultTraining:false,under18Activation:'blocked'},capabilities:{policyReference:true,cloudErasure:false,guardianVerification:false,automaticTraining:false},dataClasses:classes.map(dataClass=>({dataClass,purpose:'Synthetic purpose',retention:'owner_controlled',permittedFields:['uid']}))});
test('privacy client uses authenticated registered GET with account hint and no-store transport', async()=>{
 let observed;
 const request=createAuthTransport({basePath:'/api/account/privacy',fetchImpl:async(url,options)=>{observed={url,options};return new Response(JSON.stringify(value()),{status:200,headers:{'Content-Type':'application/json'}});}});
 const client=createPrivacyPolicyClient({getAccountId:()=> 'owner-a',request});
 assert.equal((await client.read()).uid,'owner-a'); assert.equal(observed.url,'/api/account/privacy/policy');
 assert.equal(observed.options.method,'GET');assert.equal(observed.options.headers['X-Visionary-Account'],'owner-a');assert.equal(observed.options.cache,'no-store');assert.equal(observed.options.credentials,'same-origin');
});
test('privacy client refuses missing identity before issuing request',async()=>{
 let called=false;const client=createPrivacyPolicyClient({getAccountId:()=>null,request:async()=>{called=true;return value();}});
 await assert.rejects(()=>client.read(),e=>e.status===409);assert.equal(called,false);
});
test('privacy client refuses account change before send and after response',async()=>{
 for(const phase of ['before','after']){
  let uid='owner-a';const client=createPrivacyPolicyClient({getAccountId:()=>uid,request:async(_path,options)=>{uid='owner-b';if(phase==='before')options.beforeSend();return value();}});
  await assert.rejects(()=>client.read(),e=>e.status===409);
 }
});
for(const [label,change] of [
 ['foreign UID',v=>v.uid='owner-b'],['unsupported version',v=>v.version=2],['unapproved policy',v=>v.approvalState='draft'],['bad digest',v=>v.policyDigest='wrong'],['purge activation',v=>v.preservation.automaticPurge=true],['child activation',v=>v.preservation.under18Activation='enabled'],['unaccepted lifecycle',v=>v.capabilities.cloudErasure=true],['missing class',v=>v.dataClasses.pop()],['duplicate class',v=>v.dataClasses[1]=v.dataClasses[0]],['unbounded fields',v=>v.dataClasses[0].permittedFields=['x'.repeat(65)]]
])test('privacy client rejects '+label,async()=>{
 const dto=value();change(dto);const client=createPrivacyPolicyClient({getAccountId:()=> 'owner-a',request:async()=>dto});await assert.rejects(()=>client.read(),e=>e.status===503);
});
test('privacy client preserves unavailable response instead of fabricating approved fallback',async()=>{
 const client=createPrivacyPolicyClient({getAccountId:()=> 'owner-a',request:async()=>{throw Object.assign(new Error('synthetic unavailable'),{status:503});}});await assert.rejects(()=>client.read(),/synthetic unavailable/);
});
