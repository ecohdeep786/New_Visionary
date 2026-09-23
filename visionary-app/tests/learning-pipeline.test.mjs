import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as pipeline from '../src/services/learningPipelineService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import { getContentRepository, SAMPLE_SELECTION, configureContentRepository } from '../src/services/contentRepository.ts';
import { configureTeachingInterface } from '../src/services/teachingInterface.ts';
import { getHome } from '../src/services/homeService.ts';
import { seedConnectedFixtures } from '../src/api/demoFixtures.js';

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

async function startSample() {
 const request = ctx(); const syllabus = await pipeline.selectLearningSyllabus(request, SAMPLE_SELECTION);
 const repo = getContentRepository(request); const topics = await repo.getTopics(syllabus.chapters[0].id);
 const concepts = await repo.getConcepts(topics[0].id);
 return { request, unit: await pipeline.startLearningUnit(request, concepts[0].id), concept: concepts[0] };
}

test('student Home → Learn → Ask → Practice → Build persists one connected activity and evidence', async () => {
 const { request, unit, concept } = await startSample();
 assert.equal((await getHome(request)).priority.action.path, `/dashboard/learn?unit=${unit.id}`);
 const taught = await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
 assert.equal(taught.response.status, 'not_connected');
 assert.equal(taught.explanation, concept.explanation);
 let checked = await pipeline.beginComprehension(request, unit.id);
 assert.equal(checked.question.source, 'authored-sample');
 assert.equal(mentor.getStudentState(request).concepts.length, 0);
 checked = await pipeline.answerLearningQuestion(request, unit.id, checked.question.answerIndex);
 assert.equal(checked.checkPassed, true);
 assert.equal(mentor.getStudentState(request).concepts[0].total, 1);
 const conversationId = pipeline.prepareLearningConversation(request, unit.id);
 workspace.updateConversation(request, conversationId, { draft: 'How does this work?' });
 assert.equal(pipeline.prepareLearningConversation(request, unit.id), conversationId);
 assert.equal(workspace.snapshot(request).conversations.find(c => c.id === conversationId).draft, 'How does this work?');
 const reply = await pipeline.sendTeachingTurn(request, conversationId, 'How does this work?');
 assert.equal(reply.status, 'not_connected');
 assert.equal(pipeline.getLearningForConversation(request, conversationId).id, unit.id);
 assert.equal(workspace.snapshot(request).conversations.find(c => c.id === conversationId).messages.at(-1).status, 'not_connected');
 await assert.rejects(pipeline.createLearningProject(request, unit.id), /practice step/);
 let practiced = await pipeline.nextLearningQuestion(request, unit.id);
 practiced = await pipeline.answerLearningQuestion(request, unit.id, practiced.question.answerIndex);
 assert.equal(practiced.practicePassed, true);
 assert.equal(mentor.getStudentState(request).concepts[0].total, 2);
 const artifact = await pipeline.createLearningProject(request, unit.id);
 assert.equal(artifact.conceptId, concept.id);
 const completed = workspace.saveArtifact(request, { ...artifact, body: 'I planned and made a useful prototype, then reviewed the result.', milestones: [true, true, true], status: 'completed' });
 pipeline.recordProjectSave(request, completed);
 pipeline.recordProjectSave(request, completed);
 assert.equal(pipeline.getLearningUnit(request, unit.id).stage, 'completed');
 assert.equal(mentor.getStudentState(request).concepts[0].applicationCount, 1);
 assert.equal(mentor.getStudentState(request).concepts[0].stage, 'Secure');
 assert.equal(mentor.getWeeklyObservations(request).some(item => item.kind === 'application'), true);
 const apps = mentor.getInteractionEvents(request).map(event => event.app);
 for (const app of ['LEARN', 'ASK', 'PRACTICE', 'BUILD']) assert.ok(apps.includes(app));
 assert.equal(JSON.stringify(mentor.getInteractionEvents(request)).includes('How does this work?'), false);
});

test('wrong practice answer lowers difficulty and requests remediation without a generated local answer', async () => {
 const { request, unit } = await startSample();
 await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
 const check = await pipeline.beginComprehension(request, unit.id);
 await pipeline.answerLearningQuestion(request, unit.id, check.question.answerIndex);
 const practice = await pipeline.nextLearningQuestion(request, unit.id);
 const wrongIndex = (practice.question.answerIndex + 1) % practice.question.options.length;
 const result = await pipeline.answerLearningQuestion(request, unit.id, wrongIndex);
 assert.equal(result.answer.correct, false);
 assert.equal(result.practicePassed, false);
 assert.equal(result.response.status, 'not_connected');
 assert.equal(mentor.getStudentState(request).concepts[0].correct, 1);
 await assert.rejects(pipeline.createLearningProject(request, unit.id), /practice step/);
});

test('class-started learning reaches only the assigned teacher aggregate', async () => {
 seedConnectedFixtures(localStorage, new Date('2026-09-23T12:00:00Z'));
 const learner=ctx('minor-cbse');
 const selection={board:'CBSE',classLevel:'6',subject:'Geometry'};
 configureContentRepository({async getSyllabus(query){
  if(query.subject!=='Geometry')return null;
  const conceptId='db:geometry:cube';const chapterId='db:geometry:chapter';const topicId='db:geometry:topic';
  const question={id:'db:geometry:check',prompt:'Which shape is a cube?',options:['Six equal square faces','One round face'],answerIndex:0,source:'database'};
  return {syllabus:{...query,id:'db:geometry',status:'official',textbooks:[{id:'db:geometry:book',title:'Geometry',chapterIds:[chapterId]}],chapters:[{id:chapterId,title:'Shapes',textbookId:'db:geometry:book',topicIds:[topicId],status:'official'}]},topics:[{id:topicId,title:'Cubes',chapterId,conceptIds:[conceptId],status:'official'}],concepts:[{id:conceptId,title:'Cube shapes',topicId,prerequisiteIds:[],status:'official',explanation:'A cube has six equal square faces.',check:question,representations:[]}]};
 }});
 await pipeline.selectLearningSyllabus(learner,SAMPLE_SELECTION);
 await assert.rejects(pipeline.startLearningUnit(learner,'sample:cube:concept','demo-class-cube'),/class subject/);
 await pipeline.selectLearningSyllabus(learner,selection);
 await assert.rejects(pipeline.startLearningUnit(learner,'db:geometry:cube','demo-class-fractions'),/not connected/);
 const unit=await pipeline.startLearningUnit(learner,'db:geometry:cube','demo-class-cube');
 assert.equal(unit.classId,'demo-class-cube');
 await pipeline.requestUnitTeaching(learner,unit.id,'explanation');
 const check=await pipeline.beginComprehension(learner,unit.id);
 await pipeline.answerLearningQuestion(learner,unit.id,check.question.answerIndex);
 assert.equal(mentor.getClassAggregate(ctx('teacher','teacher'),'demo-class-cube').concepts[0].correct,1);
 assert.equal(mentor.getClassAggregate(ctx('school-teacher','teacher'),'demo-class-fractions').concepts.some(item=>item.conceptId==='db:geometry:cube'),false);
});

test('changing teaching language keeps the same session and localized authored check', async () => {
 const { request, unit } = await startSample();
 await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
 const translated = await pipeline.updateLearningLanguage(request, unit.id, 'hi');
 assert.equal(translated.id, unit.id);
 assert.equal(translated.locale, 'hi');
 assert.match(translated.explanation, /[\u0900-\u097F]/);
 const check = await pipeline.beginComprehension(request, unit.id);
 assert.equal(check.locale, 'hi');
 assert.equal(check.question.id, `sample:fractions:concept:q:0`);
 assert.equal(mentor.getStudentState(request).concepts.length, 0);
});

test('a missing syllabus retains provisional position, flags the gap, and offers an honest Ask fallback', async () => {
 const request = ctx(); const selection = { board: 'Unconnected board', classLevel: '7', subject: 'Local language subject' };
 const outline = await pipeline.selectLearningSyllabus(request, selection);
 assert.equal(outline.status, 'provisional');
 const repo = getContentRepository(request); const topic = (await repo.getTopics(outline.chapters[0].id))[0];
 const concept = (await repo.getConcepts(topic.id))[0];
 const unit = await pipeline.startLearningUnit(request, concept.id);
 const response = await pipeline.requestUnitTeaching(request, unit.id, 'explanation');
 assert.equal(response.explanation, undefined);
 assert.equal(response.response.status, 'not_connected');
 assert.equal((await repo.getDataGaps()).length, 1);
 await assert.rejects(pipeline.beginComprehension(request, unit.id), /not available/);
 const conversationId = pipeline.prepareLearningConversation(request, unit.id);
 assert.equal((await pipeline.sendTeachingTurn(request, conversationId, 'Explain this topic')).status, 'not_connected');
 assert.equal(pipeline.getLearningUnit(request, unit.id).stage, 'explain');
 assert.equal(mentor.getStudentState(request).concepts.length, 0);
});

test('official concept mapping resumes the provisional learning unit without splitting its progress', async () => {
 const request=ctx(); const selection={board:'Local board',classLevel:'7',subject:'Reasoning'};
 const provisional=await pipeline.selectLearningSyllabus(request,selection);
 const repo=getContentRepository(request);const topic=(await repo.getTopics(provisional.chapters[0].id))[0];
 const previous=(await repo.getConcepts(topic.id))[0];const unit=await pipeline.startLearningUnit(request,previous.id);
 const graph={syllabus:{...selection,id:'official:syllabus',status:'official',textbooks:[{id:'official:book',title:'Official book',chapterIds:['official:chapter']}],chapters:[{id:'official:chapter',title:'Verified chapter',textbookId:'official:book',topicIds:['official:topic'],status:'official'}]},topics:[{id:'official:topic',title:'Verified topic',chapterId:'official:chapter',conceptIds:['official:concept'],status:'official'}],concepts:[{id:'official:concept',title:'Verified concept',topicId:'official:topic',prerequisiteIds:[],status:'official',representations:[]}]};
 configureContentRepository({async getSyllabus(){return graph;}});
 await pipeline.selectLearningSyllabus(request,selection);
 await getContentRepository(request).mapProvisional(previous.id,'official:concept');
 const resumed=await pipeline.startLearningUnit(request,'official:concept');
 assert.equal(resumed.id,unit.id);assert.equal(resumed.conceptId,previous.id);assert.equal(resumed.title,'Verified concept');
 assert.equal(pipeline.getLearningWorkspace(request).units.length,1);
});

test('minor profiles cannot enter a professional journey through the service', async () => {
 workspace.seedDemo('minor-cbse');
 const professional = ctx('minor-cbse', 'professional');
 assert.throws(() => pipeline.getLearningWorkspace(professional), /Professional journeys|access/);
});
