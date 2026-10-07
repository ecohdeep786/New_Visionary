import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import {configureContentRepository, getContentRepository} from '../src/services/contentRepository.ts';
import { configureTeachingInterface } from '../src/services/teachingInterface.ts';
import {seedConnectedFixtures} from '../src/api/demoFixtures.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person = 'adult', role = 'student') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
beforeEach(() => {
 memory.clear(); configureContentRepository(null); configureTeachingInterface(null);
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') });
 mentor.configureMentorClock(() => new Date('2026-09-23T12:00:00Z'));
 workspace.seedDemo('adult');
});


async function sourcedActivity(request=ctx(),selection={board:'Reviewed fixture',classLevel:'7',subject:'Source recovery'}){
 let version='1';const graph=()=>({syllabus:{...selection,id:'source:syllabus',status:'official',contentLocale:'en',availableLocales:['en'],provenance:{provider:'Synthetic source',sourceId:'source:book',version},textbooks:[{id:'source:book',title:'Fixture book',chapterIds:['source:chapter']}],chapters:[{id:'source:chapter',title:'Fixture chapter',textbookId:'source:book',topicIds:['source:topic'],status:'official'}]},topics:[{id:'source:topic',title:'Fixture topic',chapterId:'source:chapter',conceptIds:['source:concept'],status:'official'}],concepts:[{id:'source:concept',title:'Fixture concept',topicId:'source:topic',status:'official',locale:'en',availableLocales:['en'],prerequisiteIds:[],representations:[],explanation:'Version '+version+' explanation',check:{id:'check',prompt:'Choose the authored option',options:['A','B'],answerIndex:0,source:'database'},practice:[{id:'practice',prompt:'Choose again',options:['A','B'],answerIndex:0,source:'database'}],project:{title:'Version '+version+' project',brief:'Retain the source version',criteria:[{id:'evidence',label:'Evidence',prompt:'Describe your work'}]}}]});
 configureContentRepository({async getSyllabus(){return graph();}});
 await pipeline.selectLearningSyllabus(request,selection);const unit=await pipeline.startLearningUnit(request,'source:concept');
 return {request,unit,graph,async replace(){version='2';await pipeline.selectLearningSyllabus(request,selection);}};
}

test('incomplete retained source context blocks learning without replacing original records',async()=>{
 for(const sourceContext of [null,[],{}, {selection:null,provenance:null},{selection:{board:'A',classLevel:'7',subject:'B'},provenance:{provider:'P',sourceId:'S',version:''}}]){
  const f=await sourcedActivity();const db=JSON.parse(memory.get('visionary_learning_pipeline_v1'));
  db.spaces[f.request.workspaceId].units[0].sourceContext=sourceContext;memory.set('visionary_learning_pipeline_v1',JSON.stringify(db));
  const original=memory.get('visionary_learning_pipeline_v1'),work=memory.get('visionary_workspace_v2');
  await assert.rejects(pipeline.requestUnitTeaching(f.request,f.unit.id,'explanation'),/incomplete or ambiguous/);
  assert.equal(memory.get('visionary_learning_pipeline_v1'),original);assert.equal(memory.get('visionary_workspace_v2'),work);
  memory.delete('visionary_learning_pipeline_v1');
 }
});
test('legacy activities without source context remain readable',async()=>{
 const f=await sourcedActivity();const db=JSON.parse(memory.get('visionary_learning_pipeline_v1'));delete db.spaces[f.request.workspaceId].units[0].sourceContext;
 memory.set('visionary_learning_pipeline_v1',JSON.stringify(db));assert.equal((await pipeline.requestUnitTeaching(f.request,f.unit.id,'explanation')).explanation,'Version 1 explanation');
});
for(const conflict of ['selection','provenance'])test(`conflicting cached concept ${conflict} cannot start an unpinned activity`,async()=>{
 const f=await sourcedActivity(),db=JSON.parse(memory.get('visionary_content_v1')),other=f.graph();other.syllabus.id='other:syllabus';
 if(conflict==='selection')other.syllabus.subject='Another course';else other.syllabus.provenance.sourceId='other:book';
 db.spaces[f.request.workspaceId].graphs.push(other);memory.set('visionary_content_v1',JSON.stringify(db));
 const original=memory.get('visionary_learning_pipeline_v1'),content=memory.get('visionary_content_v1');
 await assert.rejects(getContentRepository(f.request).getConcept('source:concept'),/ambiguous curriculum source/);
 await assert.rejects(pipeline.startLearningUnit(f.request,'source:concept'),/ambiguous curriculum source/);
 assert.equal(memory.get('visionary_learning_pipeline_v1'),original);assert.equal(memory.get('visionary_content_v1'),content);
});
test('same-source language variants keep their authored language and source pin',async()=>{
 const f=await sourcedActivity(),db=JSON.parse(memory.get('visionary_content_v1')),variant=f.graph();
 variant.syllabus.contentLocale='hi';variant.syllabus.availableLocales=['en','hi'];variant.concepts[0].locale='hi';variant.concepts[0].availableLocales=['en','hi'];variant.concepts[0].explanation='Authored Hindi fixture';
 db.spaces[f.request.workspaceId].graphs.push(variant);memory.set('visionary_content_v1',JSON.stringify(db));
 const unit=await pipeline.updateLearningLanguage(f.request,f.unit.id,'hi');assert.equal(unit.sourceContext.provenance.sourceId,'source:book');
 assert.equal((await pipeline.requestUnitTeaching({...f.request,locale:'hi'},unit.id,'explanation')).explanation,'Authored Hindi fixture');
});
test('a changed source cannot create a project under an older learning unit',async()=>{
 const f=await sourcedActivity();await pipeline.requestUnitTeaching(f.request,f.unit.id,'explanation');let check=await pipeline.beginComprehension(f.request,f.unit.id);await pipeline.answerLearningQuestion(f.request,f.unit.id,check.question.answerIndex);check=await pipeline.nextLearningQuestion(f.request,f.unit.id);await pipeline.answerLearningQuestion(f.request,f.unit.id,check.question.answerIndex);
 await f.replace();const learning=memory.get('visionary_learning_pipeline_v1'),work=memory.get('visionary_workspace_v2');
 await assert.rejects(pipeline.createLearningProject(f.request,f.unit.id),/source version/);assert.equal(memory.get('visionary_learning_pipeline_v1'),learning);assert.equal(memory.get('visionary_workspace_v2'),work);
});
test('a changed source cannot erase the saved check or selection before retry fails',async()=>{
 const f=await sourcedActivity();await pipeline.requestUnitTeaching(f.request,f.unit.id,'explanation');const check=await pipeline.beginComprehension(f.request,f.unit.id);pipeline.saveLearningAnswerDraft(f.request,f.unit.id,1,JSON.stringify(check.question),check.practiceRound);
 await f.replace();const learning=memory.get('visionary_learning_pipeline_v1');
 await assert.rejects(pipeline.nextLearningQuestion(f.request,f.unit.id,false),/source version/);assert.equal(memory.get('visionary_learning_pipeline_v1'),learning);
});
test('source replacement during teaching cannot attach old teaching to an obsolete activity',async()=>{
 const f=await sourcedActivity();let release,started;const waiting=new Promise(resolve=>{started=resolve;});configureTeachingInterface({async request(_mode,packet){started();return new Promise(resolve=>{release=()=>resolve({status:'ready',source:'adapter',text:'Old source response',locale:packet.language,promptVersion:'old-source'});});}});
 const pending=pipeline.requestUnitTeaching(f.request,f.unit.id,'explanation');await waiting;await f.replace();const learning=memory.get('visionary_learning_pipeline_v1');release();await assert.rejects(pending,/source version/);assert.equal(memory.get('visionary_learning_pipeline_v1'),learning);
});

test('a changed source cannot grade a previously displayed unanswered question',async()=>{
 const f=await sourcedActivity();await pipeline.requestUnitTeaching(f.request,f.unit.id,'explanation');const check=await pipeline.beginComprehension(f.request,f.unit.id);
 await f.replace();const learning=memory.get('visionary_learning_pipeline_v1'),evidence=mentor.getStudentState(f.request);
 await assert.rejects(pipeline.answerLearningQuestion(f.request,f.unit.id,check.question.answerIndex),/source version/);assert.equal(memory.get('visionary_learning_pipeline_v1'),learning);assert.deepEqual(mentor.getStudentState(f.request),evidence);
});

for(const [category,persona,level] of [['primary','minor-cbse','3'],['secondary','bengali','10'],['higher-secondary','adult','12'],['competitive','exam','Competitive'],['vocational','adult','Vocational'],['higher-education','college','Higher education'],['independent-adult','adult','Adult'],['professional','professional','Professional'],['employer-sponsored','employee','Professional']]){
 test(`${category}: sourced explanation, remediation, practice, criterion build and source replacement across en/hi/bn`,async()=>{
  for(const locale of ['en','hi','bn']){
   memory.clear();configureTeachingInterface(null);workspace.seedDemo(persona);
   const role=['professional','employee'].includes(persona)?'professional':'student';let request={...ctx(persona,role),locale};
   if(persona==='employee'){seedConnectedFixtures();const work=workspace.bootstrapPerson({id:request.personId,email:'employee@visionary.test',identity:role}).workspaces.find(row=>row.organizationId==='company-admin@visionary.test');request={...request,workspaceId:work.id};}
   const f=await sourcedActivity(request,{board:'Synthetic '+category,classLevel:level,subject:'Source recovery'});
   // This authored source is English. A missing variant must not be relabelled.
   if(locale!=='en'){const missing=await pipeline.requestUnitTeaching(request,f.unit.id,'explanation');assert.equal(missing.explanation,undefined);await assert.rejects(pipeline.beginComprehension(request,f.unit.id),/explanation/);await pipeline.updateLearningLanguage(request,f.unit.id,'en');}
   await pipeline.requestUnitTeaching(request,f.unit.id,'explanation');let check=await pipeline.beginComprehension(request,f.unit.id);await pipeline.answerLearningQuestion(request,f.unit.id,1);assert.equal(pipeline.getLearningUnit(request,f.unit.id).answer.correct,false);
   check=await pipeline.nextLearningQuestion(request,f.unit.id,false);await pipeline.answerLearningQuestion(request,f.unit.id,0);check=await pipeline.nextLearningQuestion(request,f.unit.id);await pipeline.answerLearningQuestion(request,f.unit.id,0);
   const artifact=await pipeline.createLearningProject(request,f.unit.id);const candidate={...artifact,body:'Authored fixture application',milestones:artifact.milestones.map(()=>true),status:'completed',rubric:{...artifact.rubric,responses:{evidence:'My criterion evidence'}}};pipeline.validateProjectCompletion(candidate);const saved=workspace.saveArtifact(request,candidate);pipeline.recordProjectSave(request,saved);
   assert.equal(pipeline.getLearningUnit(request,f.unit.id).stage,'completed');assert.equal(mentor.getStudentState(request).concepts[0].applicationCount,1);assert.equal(pipeline.getLearningUnit(request,f.unit.id).attempts.length,3);
   await f.replace();const original=JSON.stringify(pipeline.getLearningUnit(request,f.unit.id));const fresh=await pipeline.startLearningUnit(request,'source:concept');assert.notEqual(fresh.id,f.unit.id);assert.equal(fresh.sourceContext.provenance.version,'2');assert.equal(JSON.stringify(pipeline.getLearningUnit(request,f.unit.id)),original);assert.equal(fresh.checkPassed,false);
   const validLearning=memory.get('visionary_learning_pipeline_v1'),broken=JSON.parse(validLearning);broken.spaces[request.workspaceId].units.find(unit=>unit.id===fresh.id).sourceContext=null;
   memory.set('visionary_learning_pipeline_v1',JSON.stringify(broken));const brokenBytes=memory.get('visionary_learning_pipeline_v1');
   await assert.rejects(pipeline.requestUnitTeaching(request,fresh.id,'explanation'),/incomplete or ambiguous/);assert.equal(memory.get('visionary_learning_pipeline_v1'),brokenBytes);
   memory.set('visionary_learning_pipeline_v1',validLearning);
   const validContent=memory.get('visionary_content_v1'),ambiguous=JSON.parse(validContent),other=structuredClone(ambiguous.spaces[request.workspaceId].graphs[0]);other.syllabus.id='other:syllabus';other.syllabus.subject='Another category source';ambiguous.spaces[request.workspaceId].graphs.push(other);
   memory.set('visionary_content_v1',JSON.stringify(ambiguous));const ambiguousBytes=memory.get('visionary_content_v1');
   await assert.rejects(pipeline.startLearningUnit(request,'source:concept'),/ambiguous curriculum source/);assert.equal(memory.get('visionary_learning_pipeline_v1'),validLearning);assert.equal(memory.get('visionary_content_v1'),ambiguousBytes);
   memory.set('visionary_content_v1',validContent);assert.equal((await pipeline.startLearningUnit(request,'source:concept')).id,fresh.id);
   const foreign={...request,workspaceId:request.workspaceId+'-foreign'};assert.throws(()=>pipeline.getLearningUnit(foreign,f.unit.id),/access/);
  }
 });
}
