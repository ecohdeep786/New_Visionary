import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {getReviewDraft,saveReviewDraft,clearReviewDraft} from '../src/services/reviewDraftService.js';
beforeEach(reset);
const key=f=>`visionary_review_drafts_v1:${f.teacher.workspaceId}:${f.assignment.id}`;
const save=(f,ctx=f.teacher)=>saveReviewDraft(ctx,f.assignment.id,'submission',1,'8','Retained teacher feedback');
const read=(f,ctx=f.teacher)=>getReviewDraft(ctx,f.assignment.id,'submission',1);
const clear=(f,ctx=f.teacher)=>clearReviewDraft(ctx,f.assignment.id,'submission');
test('a foreign person cannot read, overwrite or clear another teacher workspace draft',async()=>{
 const f=await fixture();save(f);const original=storage.get(key(f)),foreign={...f.teacher,personId:f.learner.personId};
 for(const command of [read,save,clear]){assert.throws(()=>command(f,foreign),/access|workspace/);assert.equal(storage.get(key(f)),original);}
 assert.equal(read(f).feedback,'Retained teacher feedback');
});
for(const status of ['pending','revoked','expired'])test(`${status} Work membership denies review draft operations and preserves restored recovery`,async()=>{
 const f=await fixture();save(f);const original=storage.get(key(f)),memberships=storage.get('visionary_entity_OrganizationInvite'),rows=JSON.parse(memberships),teacher=rows.find(row=>row.email==='teacher@visionary.test');
 if(status==='expired')teacher.expiresAt=1;else teacher.status=status;storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));
 for(const command of [read,save,clear]){assert.throws(()=>command(f),/connection|active/);assert.equal(storage.get(key(f)),original);}
 storage.set('visionary_entity_OrganizationInvite',memberships);assert.equal(read(f).feedback,'Retained teacher feedback');
});
for(const malformed of [null,{attempt:1,grade:8,feedback:'Unreadable'}, {attempt:0,grade:'8',feedback:'Unreadable'}])test(`malformed retained review row ${JSON.stringify(malformed)} cannot be silently replaced or cleared`,async()=>{
 const f=await fixture();storage.set(key(f),JSON.stringify({submission:malformed}));const original=storage.get(key(f));
 for(const command of [read,save,clear]){assert.throws(()=>command(f),/incomplete|could not be read/);assert.equal(storage.get(key(f)),original);}
});
test('an unreadable sibling review draft cannot be silently carried through a new write',async()=>{
 const f=await fixture();save(f);const rows=JSON.parse(storage.get(key(f)));rows.other={attempt:1,grade:'8'};storage.set(key(f),JSON.stringify(rows));const original=storage.get(key(f));
 assert.throws(()=>save(f),/incomplete|could not be read/);assert.equal(storage.get(key(f)),original);
});
test('cancelled review draft commands cannot read, write or clear retained feedback',async()=>{
 const f=await fixture();save(f);const original=storage.get(key(f)),controller=new AbortController();controller.abort();
 for(const command of [read,save,clear]){assert.throws(()=>command(f,{...f.teacher,signal:controller.signal}),{name:'AbortError'});assert.equal(storage.get(key(f)),original);}
});
