import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as service from '../src/services/workspaceService.ts';
import {getJourney,listJourneys} from '../src/services/journeys.ts';
import {previewPolicy} from '../src/api/previewPermissions.js';

const memory=new Map();
let instant=new Date('2026-09-14T12:00:00Z');
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window={dispatchEvent(){}};
globalThis.CustomEvent??=class {constructor(type){this.type=type;}};
const ctx=(id='adult',role='student')=>({personId:`demo-${id}`,workspaceId:`demo-${id}:${role}`,role,locale:'en'});
beforeEach(()=>{memory.clear();instant=new Date('2026-09-14T12:00:00Z');service.configureMock({now:()=>instant,latency:0,fault:'none'});service.seedDemo('adult');});

test('one person has five isolated workspaces; forged role and person contexts fail',()=>{
 const c=service.newConversation(ctx(),'Private learner idea');service.updateConversation(ctx(),c.id,{draft:'private draft'});
 for(const role of ['teacher','parent','professional','organization'])assert.equal(service.snapshot(ctx('adult',role)).conversations.length,0);
 assert.throws(()=>service.snapshot({...ctx(),role:'teacher'}),/access/);
 assert.throws(()=>service.snapshot({...ctx(),personId:'demo-parent'}),/access/);
 service.selectWorkspace('demo-adult','demo-adult:teacher');assert.equal(service.snapshot(ctx()).conversations[0].draft,'private draft');
});
test('curated journeys contain complete localized questions and explanations',()=>{
 for(const locale of ['en','hi','bn'])for(const j of listJourneys(locale)){
   assert.equal(j.questions.length,3);assert.ok(j.explanation.length>50);assert.ok(j.projectBrief);assert.ok(j.objective);
   for(const q of j.questions)assert.ok(q.options[q.answer]);
 }
 assert.throws(()=>getJourney('unavailable'));
});
test('conversation cancellation and service failures retain the saved draft',async()=>{
 const c=service.newConversation(ctx());service.updateConversation(ctx(),c.id,{draft:'fractions'});
 const controller=new AbortController();controller.abort();await assert.rejects(service.sendMessage({...ctx(),signal:controller.signal},c.id,'fractions'),{name:'AbortError'});
 service.configureMock({fault:'offline'});await assert.rejects(service.sendMessage(ctx(),c.id,'fractions'),/Offline/);
 const saved=service.snapshot(ctx()).conversations[0];assert.equal(saved.draft,'fractions');assert.equal(saved.messages.length,0);
});
test('unsupported questions stay saved with an honest fallback, not fabricated understanding',async()=>{
 const c=service.newConversation(ctx());await service.sendMessage(ctx(),c.id,'Explain an unsupported specialized topic');
 const saved=service.snapshot(ctx()).conversations[0];assert.match(saved.messages[1].blocks[0].text,/not a live/);assert.equal(saved.messages[1].blocks.filter(b=>b.type==='activity').length,3);
});
test('interruption, language, answers and model controls survive resume',async()=>{
 const c=service.newConversation(ctx());const s=service.startJourney(ctx(),c.id,'cube');
 service.updateSession(ctx(),s.id,{stage:'checking',position:0,locale:'hi',canvas:{size:6,rotation:77},notes:'private thought',confidence:25});
 const answer=String(getJourney('cube').questions[0].answer);service.answerQuestion(ctx(),s.id,answer);await service.sendMessage(ctx(),c.id,'cube question');
 assert.equal(service.snapshot(ctx()).sessions[0].interrupted,true);
 const resumed=service.startJourney(ctx(),c.id,'cube');assert.equal(resumed.id,s.id);assert.equal(resumed.stage,'checking');assert.equal(resumed.locale,'hi');assert.deepEqual(resumed.canvas,{size:6,rotation:77});assert.equal(resumed.notes,'private thought');assert.equal(resumed.confidence,25);assert.equal(resumed.interrupted,false);
});
test('practice counts are idempotent; a new delayed review produces separate retrieval evidence',()=>{
 const c=service.newConversation(ctx());const s=service.startJourney(ctx(),c.id,'cube');service.updateSession(ctx(),s.id,{stage:'checking'});
 const answer=String(getJourney('cube').questions[0].answer);service.answerQuestion(ctx(),s.id,answer);service.answerQuestion(ctx(),s.id,answer);
 assert.equal(service.snapshot(ctx()).sessions[0].evidence.length,1);assert.notEqual(service.mastery(service.snapshot(ctx()).sessions[0].evidence), 'Mastered');
 instant=new Date('2026-09-16T12:00:00Z');service.beginReview(ctx(),s.id);service.answerQuestion(ctx(),s.id,answer);
 const evidence=service.snapshot(ctx()).sessions[0].evidence;assert.equal(evidence.length,2);assert.equal(evidence[1].kind,'retrieval');assert.equal(evidence[1].delayed,true);
 assert.notEqual(service.mastery(evidence),'Mastered');
});
test('a single grade never establishes mastery or self-reported confidence',()=>{
 const e={id:'one',objectiveId:'cube',kind:'check',correct:1,total:1,at:instant.toISOString(),delayed:false};
 assert.equal(service.mastery([e],true,instant),'Practicing');
 const varied=[e,{...e,id:'application',kind:'application'},{...e,id:'recall',kind:'retrieval',delayed:true}];assert.equal(service.mastery(varied,true,instant),'Mastered');
});
test('parent summaries require active scoped consent and exclude private content',()=>{
 const child=ctx('minor-cbse');const c=service.newConversation(child);const s=service.startJourney(child,c.id,'cube');service.updateSession(child,s.id,{notes:'NEVER SHARE',stage:'completed'});
 const reports=service.familyReports(ctx('parent','parent'));assert.equal(reports.length,2);assert.equal(reports[0].completed,1);assert.ok(!JSON.stringify(reports).includes('NEVER SHARE'));
 service.changeRelationship(ctx('parent','parent'),'demo-parent:demo-minor-cbse','revoked');assert.equal(service.familyReports(ctx('parent','parent')).length,1);
 assert.throws(()=>service.changeRelationship(child,'demo-parent:demo-minor-cbse','active'),/no longer pending/);
});
test('report period filters out old activity and expired invitations cannot be accepted',()=>{
 const child=ctx('minor-cbse');const c=service.newConversation(child);service.startJourney(child,c.id,'cube');
 service.requestRelationship(ctx('adult','parent'),'professional@visionary.test','guardian');
 instant=new Date('2026-10-01T12:00:00Z');assert.equal(service.familyReports(ctx('parent','parent'))[0].objectives.length,0);
 const request=service.visibleRelationships(ctx('professional','professional'))[0];assert.throws(()=>service.changeRelationship(ctx('professional','professional'),request.id,'active'),/expired/);
});
test('account quotas span roles, never block saved activities, and reset daily',async()=>{
 service.setDemoUsage(ctx(),10);const c=service.newConversation(ctx('adult','teacher'));
 await assert.rejects(service.sendMessage(ctx('adult','teacher'),c.id,'Prepare a lesson'),/10 guided turns/);
 assert.ok(service.startJourney(ctx('adult','teacher'),c.id,'cube'));
 instant=new Date('2026-09-15T12:00:00Z');await service.sendMessage(ctx('adult','teacher'),c.id,'Prepare a lesson');assert.equal(service.snapshot(ctx()).subscription.usage,1);
});
test('mock checkout propagates across roles; resume creates no charge; expiry preserves content',()=>{
 service.changeSubscription(ctx(),'Premium','active');assert.equal(service.snapshot(ctx('adult','teacher')).subscription.plan,'Premium');
 service.changeSubscription(ctx(),'Family','failed');assert.equal(service.snapshot(ctx()).subscription.plan,'Premium');
 service.changeSubscription(ctx(),'Premium','cancelled');service.changeSubscription(ctx(),'Premium','active');assert.equal(service.snapshot(ctx()).subscription.invoices.length,1);
 const a=service.saveArtifact(ctx(),{title:'Keep me',body:'My work'});service.changeSubscription(ctx(),'Premium','cancelled');instant=new Date('2026-11-01T00:00:00Z');assert.equal(service.snapshot(ctx()).subscription.plan,'Free');assert.equal(service.snapshot(ctx()).artifacts[0].id,a.id);
});
test('storage write failure does not acknowledge or destroy a saved document',()=>{
 service.saveArtifact(ctx(),{title:'Saved',body:'Original'});const old=localStorage.setItem;localStorage.setItem=()=>{throw Error('Quota exceeded');};
 try{assert.throws(()=>service.saveArtifact(ctx(),{title:'Unsaved',body:'Do not lose'}),/could not be saved/);}finally{localStorage.setItem=old;}
 assert.equal(service.snapshot(ctx()).artifacts.length,1);assert.equal(service.snapshot(ctx()).artifacts[0].body,'Original');
});
test('family billing grants entitlement only after acceptance and never creates guardian access',()=>{
 service.changeSubscription(ctx(),'Family','active');service.inviteFamily(ctx(),'professional@visionary.test');
 const member=ctx('professional','professional');assert.equal(service.snapshot(member).subscription.plan,'Free');
 const invitation=service.familyInvitations(member)[0];assert.throws(()=>service.changeFamilyInvitation(ctx(),invitation.id,'active'),/Only the invited/);
 service.changeFamilyInvitation(member,invitation.id,'active');assert.equal(service.snapshot(member).subscription.plan,'Family');assert.equal(service.visibleRelationships(member).length,0);
 service.changeFamilyInvitation(ctx(),invitation.id,'revoked');assert.equal(service.snapshot(member).subscription.plan,'Free');
});
test('organization workspaces isolate drafts and lose access on removal without deleting personal work',()=>{
 const membership={id:'org',email:'adult@visionary.test',role:'professional',organization_email:'company-admin@visionary.test',organization_name:'Demo Company',status:'active'};
 localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([membership]));
 const user={id:'demo-adult',email:'adult@visionary.test',identity:'student'};const profile=service.bootstrapPerson(user);
 const workspace=profile.workspaces.find(w=>w.organizationId);assert.ok(workspace);
 const personal=ctx('adult','professional');const work={...personal,workspaceId:workspace.id};
 service.saveArtifact(personal,{title:'Portable personal report',body:'Personal'});service.newConversation(work,'Work-only draft');
 assert.equal(service.snapshot(personal).conversations.length,0);assert.equal(service.snapshot(work).artifacts.length,0);
 service.selectWorkspace('demo-adult',workspace.id);localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([{...membership,status:'revoked'}]));
 assert.throws(()=>service.snapshot(work),/no longer active/);assert.throws(()=>service.selectWorkspace('demo-adult',workspace.id),/no longer active/);
 assert.ok(!service.bootstrapPerson(user).workspaces.some(w=>w.id===workspace.id));assert.equal(service.snapshot(personal).artifacts[0].title,'Portable personal report');
});
test('legacy accepted guardians use the same report permission boundary and revocation path',()=>{
 localStorage.setItem('visionary_entity_FamilyLink',JSON.stringify([{id:'legacy-guardian',parent_email:'adult@visionary.test',child_email:'minor-cbse@visionary.test',status:'active'}]));
 const parent=ctx('adult','parent');assert.equal(service.familyReports(parent).length,1);
 const relationship=service.visibleRelationships(parent).find(r=>r.id.startsWith('legacy:'));assert.ok(relationship);
 service.changeRelationship(parent,relationship.id,'revoked');assert.equal(service.familyReports(parent).length,0);
 assert.equal(JSON.parse(localStorage.getItem('visionary_entity_FamilyLink'))[0].status,'revoked');
});
test('sharing exposes only the confirmed artifact; revocation removes the received view',()=>{
 const recipient=ctx('professional','professional');service.requestRelationship(ctx(),'professional@visionary.test','teacher');
 service.changeRelationship(recipient,service.visibleRelationships(recipient)[0].id,'active');
 const a=service.saveArtifact(ctx(),{title:'Shared report',body:'Public to this connection'});service.saveArtifact(ctx(),{title:'Private report',body:'PRIVATE'});
 assert.equal(service.sharedArtifacts(recipient).length,0);service.shareArtifact(ctx(),a.id,recipient.personId);
 const received=service.sharedArtifacts(recipient);assert.equal(received.length,1);assert.ok(!JSON.stringify(received).includes('PRIVATE'));assert.ok(!('versions' in received[0]));
 service.stopSharingArtifact(ctx(),a.id);assert.equal(service.sharedArtifacts(recipient).length,0);assert.equal(service.snapshot(ctx()).artifacts.length,2);
});
test('class policies prevent roster browsing, self-grading and ownership transfers',()=>{
 const rows={Classroom:[{id:'c',teacher_email:'teacher@test',join_code:'CODE'}],Enrollment:[{class_id:'c',student_email:'learner@test',status:'active'}],Assignment:[{id:'a',class_id:'c',points:10}]};
 const read=name=>rows[name]||[];const learner=previewPolicy({email:'learner@test',identity:'student'},read);const teacher=previewPolicy({email:'teacher@test',identity:'teacher'},read);
 assert.equal(learner.canRead('Submission',{class_id:'c',student_email:'other@test'}),false);
 assert.throws(()=>learner.assertWrite('Submission',{class_id:'c',student_email:'learner@test'},'update',{grade:10}));
 assert.throws(()=>teacher.assertWrite('Submission',{class_id:'c',assignment_id:'a'},'update',{grade:11}));
 assert.doesNotThrow(()=>teacher.assertWrite('Submission',{class_id:'c',assignment_id:'a'},'update',{grade:8,feedback:'Explain the units',status:'graded'}));
 assert.throws(()=>teacher.assertWrite('Classroom',rows.Classroom[0],'update',{teacher_email:'other@test'}));
});
