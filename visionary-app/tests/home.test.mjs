import test, {beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as service from '../src/services/workspaceService.ts';
import {getHome} from '../src/services/homeService.ts';
import {openGuideEntry,saveAskContext,suggestedJourneys} from '../src/services/guideEntryService.ts';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window={dispatchEvent(){}};
globalThis.CustomEvent??=class {constructor(type){this.type=type;}};
const ctx=(role='student',person='adult')=>({personId:`demo-${person}`,workspaceId:`demo-${person}:${role}`,role,locale:'en'});
beforeEach(()=>{memory.clear();service.configureMock({latency:0,fault:'none',now:()=>new Date('2026-09-20T12:00:00Z')});service.seedDemo('adult');});

test('five role Homes offer direct role-safe next actions without creating conversations',async()=>{
 const destinations={student:'learn',teacher:'prepare',parent:'child',professional:'career',organization:'people'};
 for(const [role,destination] of Object.entries(destinations)){
  const home=await getHome(ctx(role));
  assert.equal(home.priority.action.path,`/dashboard/${destination}`);
  assert.ok(home.priority.reason);assert.ok(home.modules.length+2<=5);
  assert.equal(service.snapshot(ctx(role)).conversations.length,0);
 }
});
test('Home and deep link resume the exact session without resetting its snapshot',async()=>{
 const first=service.newConversation(ctx());service.startJourney(ctx(),first.id,'cube');
 const second=service.newConversation(ctx());const target=service.startJourney(ctx(),second.id,'fractions');
 service.updateSession(ctx(),target.id,{stage:'checking',position:2,locale:'bn',canvas:{size:7,rotation:60},notes:'keep notes'});
 const before=service.snapshot(ctx()).sessions.find(s=>s.id===target.id);
 const result=openGuideEntry(ctx(),{sessionId:target.id,practice:true});
 assert.equal(result.conversation.id,second.id);
 assert.deepEqual(result.session,before);
 const home=await getHome(ctx());assert.match(home.priority.action.path,/ask\?session=/);
 assert.ok(!JSON.stringify(home).includes('keep notes'));
});
test('invalid and cross-workspace activity links create no blank conversation',()=>{
 assert.throws(()=>openGuideEntry(ctx(),{journeyId:'missing'}),/not available/);
 const c=service.newConversation(ctx());const s=service.startJourney(ctx(),c.id,'cube');
 assert.throws(()=>openGuideEntry(ctx('professional'),{sessionId:s.id}),/unavailable/);
 assert.equal(service.snapshot(ctx('professional')).conversations.length,0);
 assert.equal(service.snapshot(ctx()).conversations.length,1);
});
test('localized Home activity title declares the saved teaching language, not the current preference',async()=>{
 const c=service.newConversation(ctx());const s=service.startJourney(ctx(),c.id,'cube');
 service.updateSession(ctx(),s.id,{locale:'bn'});
 const home=await getHome(ctx());
 assert.equal(home.priority.titleLocale,'bn');
 assert.match(home.priority.title,/[\u0980-\u09ff]/);
});
test('saved Ask intent/material/draft remain workspace scoped and storage failures keep prior values',()=>{
 const c=service.newConversation(ctx());const ask={intent:'check',source:'material',material:'My worked example'};
 saveAskContext(ctx(),c.id,ask);service.updateConversation(ctx(),c.id,{draft:'Where did I go wrong?'});
 assert.deepEqual(service.snapshot(ctx()).conversations[0].ask,ask);
 assert.equal(service.snapshot(ctx('teacher')).conversations.length,0);
 assert.throws(()=>saveAskContext(ctx('teacher'),c.id,ask),/not found/);
 const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('full');};
 try{assert.throws(()=>saveAskContext(ctx(),c.id,{...ask,intent:'plan'}),/could not be saved/);}finally{localStorage.setItem=set;}
 assert.equal(service.snapshot(ctx()).conversations[0].ask.intent,'check');
});
test('parent Home excludes private evidence and drops revoked child summaries',async()=>{
 const child=ctx('student','minor-cbse');const c=service.newConversation(child);const s=service.startJourney(child,c.id,'cube');
 service.updateSession(child,s.id,{notes:'PRIVATE DOUBT',stage:'completed'});
 const parent=ctx('parent','parent');const before=await getHome(parent);
 assert.match(before.priority.title,/Aarav/);assert.ok(!JSON.stringify(before).includes('PRIVATE DOUBT'));
 service.changeRelationship(parent,'demo-parent:demo-minor-cbse','revoked');
 const after=await getHome(parent);assert.ok(!JSON.stringify(after).includes('Aarav'));
});
test('minor suggestions omit the professional scenario; unavailable services fail honestly',async()=>{
 assert.deepEqual(suggestedJourneys(ctx('student','minor-cbse')).map(j=>j.id),['cube','fractions']);
 assert.deepEqual(suggestedJourneys(ctx('professional')).map(j=>j.id),['data']);
 service.configureMock({fault:'offline'});await assert.rejects(getHome(ctx()),/Offline demo/);
 service.configureMock({fault:'none'});const controller=new AbortController();controller.abort();await assert.rejects(getHome({...ctx(),signal:controller.signal}),{name:'AbortError'});
 await assert.rejects(getHome({...ctx(),personId:'demo-parent'}),/access/);
});
