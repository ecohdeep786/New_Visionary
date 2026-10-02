import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {appClient} from '../src/api/appClient.js';
const store=new Map();globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};
const options={expectedUserId:'profile-one',expectedProfileName:'Original name'};
beforeEach(()=>{store.clear();store.set('visionary_users',JSON.stringify([{id:'profile-one',email:'one@profile.test',full_name:'Original name'},{id:'profile-two',email:'two@profile.test',full_name:'Second account'}]));store.set('visionary_sessions',JSON.stringify([{token:'one',userId:'profile-one',email:'one@profile.test',expiresAt:Date.now()+86400000},{token:'two',userId:'profile-two',email:'two@profile.test',expiresAt:Date.now()+86400000}]));store.set('visionary_session_token','one');});
test('profile save compares the loaded name and rejects stale tabs without replacing newer account fields',async()=>{
 await appClient.auth.updateMe({full_name:'Current name',preferences:{theme_color:'green'}},options);const before=store.get('visionary_users');await assert.rejects(appClient.auth.updateMe({full_name:'Stale edit'},options),/display name changed/);assert.equal(store.get('visionary_users'),before);await appClient.auth.updateMe({full_name:'  Reviewed retry  '},{...options,expectedProfileName:'Current name'});const user=JSON.parse(store.get('visionary_users'))[0];assert.equal(user.full_name,'Reviewed retry');assert.equal(user.preferences.theme_color,'green');
});
test('profile save remains bound to the original signed-in account after a session switch',async()=>{
 store.set('visionary_session_token','two');const before=store.get('visionary_users');await assert.rejects(appClient.auth.updateMe({full_name:'Wrong account edit'},options),/account changed/);assert.equal(store.get('visionary_users'),before);
});
test('invalid and failed profile saves retain original account data for retry',async()=>{
 const before=store.get('visionary_users');for(const full_name of ['', ' '.repeat(5),'x'.repeat(81)])await assert.rejects(appClient.auth.updateMe({full_name},options),/1 to 80/);assert.equal(store.get('visionary_users'),before);const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('Rejected storage');};try{await assert.rejects(appClient.auth.updateMe({full_name:'Retry edit'},options),/could not be saved/);}finally{localStorage.setItem=set;}assert.equal(store.get('visionary_users'),before);await appClient.auth.updateMe({full_name:'Retry edit'},options);assert.equal(JSON.parse(store.get('visionary_users'))[0].full_name,'Retry edit');
});
