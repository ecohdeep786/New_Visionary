import test, {beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as service from '../src/services/workspaceService.ts';
import {getHome} from '../src/services/homeService.ts';
import {openGuideEntry,openGuideLocation,selectGuideConversation,saveAskContext,suggestedJourneys} from '../src/services/guideEntryService.ts';

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
test('a saved onboarding subject becomes the first action without inventing curriculum or weakness',async()=>{
 const user={id:'subject-learner',email:'subject-learner@visionary.test',full_name:'Learner',identity:'student',age_band:'minor',board:'CBSE',grade_level:'Class 7',subjects:['Mathematics']};
 service.bootstrapPerson(user);
 const home=await getHome({personId:user.id,workspaceId:`${user.id}:student`,role:'student',locale:'en'});
 assert.match(home.priority.title,/Mathematics/);
 assert.match(home.priority.detail,/provisional/);
 assert.equal(home.priority.action.path,'/dashboard/learn');
 assert.equal(service.snapshot({personId:user.id,workspaceId:`${user.id}:student`,role:'student',locale:'en'}).sessions.length,0);
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

test('unsupported and matched Guide responses use the same role and age eligibility as entry',async()=>{
 const unknown=service.bootstrapPerson({id:'unknown-age',email:'unknown@visionary.test',identity:'student'});
 const contexts=[ctx('student','minor-cbse'),{personId:unknown.person.id,workspaceId:unknown.active,role:'student',locale:'en'},ctx('teacher'),ctx('parent'),ctx('organization'),ctx('professional'),ctx()];
 for(const request of contexts){
  const c=service.newConversation(request);
  await service.sendMessage({...request,locale:'bn'},c.id,'How do stars form?');
  const blocks=service.snapshot(request).conversations.find(item=>item.id===c.id).messages.at(-1).blocks;
  assert.deepEqual(blocks.filter(b=>b.type==='activity').map(b=>b.journeyId),suggestedJourneys(request).map(j=>j.id));
  assert.equal(blocks[0].locale,'en');
  assert.ok(blocks.filter(b=>b.type==='activity').every(b=>b.locale==='bn'));
 }
 const minor=ctx('student','minor-cbse');const c=service.newConversation(minor);
 await service.sendMessage(minor,c.id,'Help me interpret data');
 assert.ok(service.snapshot(minor).conversations.find(item=>item.id===c.id).messages.at(-1).blocks.every(b=>b.type!=='activity'||b.journeyId!=='data'));
});

test('known response blocks retain their own language across mixed-language history; legacy and free text stay unknown',async()=>{
 const request=ctx();const c=service.newConversation(request);
 service.startJourney({...request,locale:'hi'},c.id,'cube');
 const db=JSON.parse(memory.get('visionary_workspace_v2'));
 db.data[request.workspaceId].conversations[0].messages.unshift({id:'legacy-unknown-language',role:'guide',blocks:[{type:'text',text:'Earlier saved response'}],at:'2026-09-19T12:00:00Z'});
 memory.set('visionary_workspace_v2',JSON.stringify(db));
 await service.sendMessage({...request,locale:'bn'},c.id,'Could you explain that another way?');
 await service.sendMessage(request,c.id,'cube');
 const messages=service.snapshot(request).conversations[0].messages;
 assert.equal(messages[0].blocks[0].locale,undefined);
 assert.equal(messages[1].blocks[0].locale,'hi');
 assert.deepEqual(messages[3].blocks.map(b=>b.locale),['en','bn','bn']);
 assert.deepEqual(messages[5].blocks.map(b=>b.locale),['en','en']);
 assert.ok(messages.filter(m=>m.role==='user').every(m=>m.blocks.every(b=>b.locale===undefined)));
});

test('one route-entry snapshot hydrates the exact session draft instead of another active conversation',()=>{
 const request=ctx();const target=service.newConversation(request);
 const session=service.startJourney(request,target.id,'fractions');
 service.updateConversation(request,target.id,{draft:'My fractions question'});
 service.updateSession(request,session.id,{stage:'checking',locale:'hi',notes:'Keep this place'});
 const other=service.newConversation(request);
 service.updateConversation(request,other.id,{draft:'অন্য কথোপকথনের প্রশ্ন',canvasPath:'/dashboard/build'});
 assert.equal(openGuideLocation(request,{}).input,'অন্য কথোপকথনের প্রশ্ন');
 const view=openGuideLocation(request,{sessionId:session.id,topic:'unrelated topic',initialQuestion:'Unrelated route question'});
 assert.deepEqual(view,{selected:target.id,input:'My fractions question',canvasPath:'',pane:'activity'});
 // The blur/autosave consumer now has the matching conversation and its own draft.
 service.updateConversation(request,view.selected,{draft:view.input});
 const after=service.snapshot(request);
 assert.equal(after.conversations.find(c=>c.id===target.id).draft,'My fractions question');
 assert.equal(after.conversations.find(c=>c.id===other.id).draft,'অন্য কথোপকথনের প্রশ্ন');
 assert.equal(after.sessions.find(s=>s.id===session.id).notes,'Keep this place');
 assert.equal(after.activeConversationId,target.id);
 assert.deepEqual(openGuideLocation(request,{}),{...view,pane:'conversation'});
});

test('failed History and New selection keep the complete prior view and stored selection, then retry succeeds',()=>{
 const request=ctx();const target=service.newConversation(request);
 service.startJourney(request,target.id,'fractions');service.updateConversation(request,target.id,{draft:'Saved fractions question'});
 const current=service.newConversation(request);service.updateConversation(request,current.id,{draft:'Saved project question',canvasPath:'/dashboard/build'});
 let view={...selectGuideConversation(request,current.id),input:'Unsaved local question'};
 const before=structuredClone(view);const stored=service.snapshot(request);const set=localStorage.setItem;
 localStorage.setItem=()=>{throw Error('full');};
 try{
  for(const next of [target.id,null]){
   assert.throws(()=>{view=selectGuideConversation(request,next);},/could not be saved/);
   assert.deepEqual(view,before);
   assert.deepEqual(service.snapshot(request),stored);
  }
 }finally{localStorage.setItem=set;}
 view=selectGuideConversation(request,target.id);
 assert.deepEqual(view,{selected:target.id,input:'Saved fractions question',canvasPath:'',pane:'activity'});
 assert.deepEqual(selectGuideConversation(request,null),{selected:null,input:'',canvasPath:'',pane:'conversation'});
 assert.equal(service.snapshot(request).conversations.length,2);
 assert.equal(service.snapshot(request).activeConversationId,undefined);
 assert.throws(()=>selectGuideConversation(ctx('teacher'),target.id),/not found/);
});

test('material persistence failure retains the acknowledged value and can retry the local edit',()=>{
 const request=ctx();const c=service.newConversation(request);
 const acknowledged={intent:'check',source:'material',material:'First explanation'};
 const localEdit={...acknowledged,material:'Revised explanation to retry'};
 saveAskContext(request,c.id,acknowledged);
 const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('full');};
 try{assert.throws(()=>saveAskContext(request,c.id,localEdit),/could not be saved/);}finally{localStorage.setItem=set;}
 assert.deepEqual(service.snapshot(request).conversations[0].ask,acknowledged);
 saveAskContext(request,c.id,localEdit);
 assert.deepEqual(service.snapshot(request).conversations[0].ask,localEdit);
});
