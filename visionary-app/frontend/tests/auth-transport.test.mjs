import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthTransport } from '../src/api/firebase/authTransport.js';
const response = (status, body = {}) => ({ ok: status < 400, status, json: async () => body });

test('one transient safe-read failure recovers without retrying credential errors', async () => {
  let reads = 0;
  const request = createAuthTransport({ pause: async () => {}, fetchImpl: async () => ++reads === 1 ? response(503) : response(200, {id:'account'}) });
  assert.deepEqual(await request('/me'), {id:'account'}); assert.equal(reads, 2);
  let denied = 0;
  await assert.rejects(createAuthTransport({fetchImpl:async()=>{denied++;return response(401);}})('/me'), error => error.status === 401);
  assert.equal(denied,1);
});
test('failed writes are not automatically repeated and keep UID/CSRF binding', async () => {
  const calls = [], request = createAuthTransport({getLocks:()=>null,fetchImpl:async(url, options)=>{calls.push({url,options});return url.endsWith('/csrf')?response(200,{token:'csrf'}):response(503);}});
  await assert.rejects(request('/onboarding',{method:'POST',accountId:'account-a',body:{full_name:'Adult'}}), error=>error.status===503);
  assert.equal(calls.length,2); assert.equal(calls[1].options.headers['X-Visionary-Account'],'account-a'); assert.equal(calls[1].options.headers['X-CSRF-Token'],'csrf'); assert.equal(calls[1].options.cache,'no-store');
});
test('CSRF recovery rechecks obsolete-account guards before the repeated write', async () => {
  let obsolete=false, writes=0, csrfReads=0;
  const request=createAuthTransport({getLocks:()=>null,fetchImpl:async url=>{
    if(url.endsWith('/csrf')){if(++csrfReads===2)obsolete=true;return response(200,{token:'csrf'});}
    writes++; return response(403,{message:'Reload this page before continuing.'});
  }});
  await assert.rejects(request('/session',{method:'POST',body:{idToken:'fixture'},beforeSend:()=>{if(obsolete)throw Error('Obsolete account');}}),/Obsolete account/);
  assert.equal(writes,1);
});
test('one deadline covers CSRF and the write rather than resetting at each fetch', async () => {
  const signals=[];
  const request=createAuthTransport({getLocks:()=>null,timeoutMs:25,fetchImpl:async(url,options)=>{
    signals.push(options.signal);
    if(url.endsWith('/csrf'))return response(200,{token:'csrf'});
    return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
  }});
  await assert.rejects(request('/onboarding',{method:'POST',body:{}}),error=>error.name==='TimeoutError'); assert.equal(signals[0],signals[1]);
});
test('queued writes that expire never issue a request after the prior mutation finishes', async () => {
  let finish, posts=0;
  const request=createAuthTransport({getLocks:()=>null,timeoutMs:30,fetchImpl:async url=>url.endsWith('/csrf')?response(200,{token:'csrf'}):(++posts===1?new Promise(resolve=>{finish=()=>resolve(response(200,{ok:true}));}):response(200))});
  const first=request('/onboarding',{method:'POST',body:{}});
  const firstChecked=assert.rejects(first,error=>error.name==='TimeoutError');
  const second=request('/profile',{method:'PATCH',body:{}}); const checked=assert.rejects(second,error=>error.name==='TimeoutError');
  await new Promise(resolve=>setTimeout(resolve,45)); finish(); await firstChecked; await checked; assert.equal(posts,1);
});
