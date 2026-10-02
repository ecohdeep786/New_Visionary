import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {appClient} from '../src/api/appClient.js';
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};globalThis.window={dispatchEvent(){},location:{origin:'http://localhost',search:''}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
beforeEach(()=>{memory.clear();const user={id:'entity-owner',email:'owner@entity.test',identity:'student',roles:['student']};localStorage.setItem('visionary_users',JSON.stringify([user]));localStorage.setItem('visionary_sessions',JSON.stringify([{token:'entity-session',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));localStorage.setItem('visionary_session_token','entity-session');});
test('unreadable or malformed entity stores reject reads and all mutations without replacing originals',async()=>{
 for(const raw of ['{broken','{}','[null]','["not a record"]']){
  memory.set('visionary_entity_Subject',raw);const before=new Map(memory);
  await assert.rejects(appClient.entities.Subject.list(),/Saved records have not been replaced/);
  await assert.rejects(appClient.entities.Subject.create({name:'New subject'}),/could not be read/);
  await assert.rejects(appClient.entities.Subject.bulkCreate([{name:'Another subject'}]),/could not be read/);
  await assert.rejects(appClient.entities.Subject.update('unknown',{name:'Changed'}),/could not be read/);
  await assert.rejects(appClient.entities.Subject.delete('unknown'),/could not be read/);assert.deepEqual(memory,before);
 }
});
test('readable entity repair retains existing owned and foreign records and resumes normal writes',async()=>{
 const rows=[{id:'own',name:'Owned',owner_email:'owner@entity.test'},{id:'foreign',name:'Foreign',owner_email:'another@entity.test'}];memory.set('visionary_entity_Subject',JSON.stringify(rows));
 assert.deepEqual((await appClient.entities.Subject.list()).map(row=>row.id),['own']);await appClient.entities.Subject.create({name:'New owned subject'});
 const saved=JSON.parse(memory.get('visionary_entity_Subject'));assert.equal(saved.length,3);assert.deepEqual(saved.find(row=>row.id==='foreign'),rows[1]);assert.equal((await appClient.entities.Subject.list()).length,2);
});
