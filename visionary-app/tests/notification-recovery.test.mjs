import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { seedDemo, configureMock, markNotification } from '../src/services/workspaceService.ts';
const memory = new Map();
globalThis.localStorage = {getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window = {dispatchEvent(){}};
globalThis.CustomEvent ??= class {constructor(type){this.type=type;}};
const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
beforeEach(()=>{memory.clear();configureMock({latency:0,fault:'none'});seedDemo('adult');const db=JSON.parse(memory.get('visionary_workspace_v2'));db.data[ctx.workspaceId].notifications=[{id:'owned',text:'Your saved update',read:false,path:'/dashboard/home'}];db.data['demo-adult:teacher'].notifications=[{id:'teacher-only',text:'Teacher private update',read:false,path:'/dashboard/prepare'}];memory.set('visionary_workspace_v2',JSON.stringify(db));});
test('missing and cross-workspace update IDs cannot be marked read or claim success',()=>{
 const before=memory.get('visionary_workspace_v2');assert.throws(()=>markNotification(ctx,'teacher-only'),/no longer available/);assert.throws(()=>markNotification(ctx,'missing'),/no longer available/);assert.throws(()=>markNotification({...ctx,personId:'demo-teacher'},'owned'),/access/);assert.equal(memory.get('visionary_workspace_v2'),before);
});
test('failed mark-read retains unread state and a successful retry is idempotent',()=>{
 const before=memory.get('visionary_workspace_v2'),save=localStorage.setItem;
 try {localStorage.setItem=()=>{throw Error('Full');};assert.throws(()=>markNotification(ctx,'owned'),/could not be saved/);assert.equal(memory.get('visionary_workspace_v2'),before);}finally{localStorage.setItem=save;}
 markNotification(ctx,'owned');const saved=memory.get('visionary_workspace_v2');assert.equal(JSON.parse(saved).data[ctx.workspaceId].notifications[0].read,true);
 try {localStorage.setItem=()=>{throw Error('Full');};markNotification(ctx,'owned');assert.equal(memory.get('visionary_workspace_v2'),saved);}finally{localStorage.setItem=save;}
});
