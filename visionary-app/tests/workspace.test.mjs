import test from "node:test";
import assert from "node:assert/strict";
import { deriveLearningData } from "../src/lib/learningMetrics.js";
import { initializeLearningWorkspace } from "../src/lib/learningProfile.js";
import { scoreExercises, cubeExercises } from "../src/lib/practiceExercises.js";
import { safeReturnTo } from "../src/lib/authReturnTo.js";
import { appClient } from "../src/api/appClient.js";
import { bootstrapPerson,snapshot,saveResource } from '../src/services/workspaceService.ts';
import { assignReviewedLesson,teacherLearners } from '../src/services/classroomService.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key,value) => memory.set(key,String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {}, location: { origin: "http://localhost:5173", search: "" } };
globalThis.CustomEvent ??= class CustomEvent { constructor(type) { this.type = type; } };

test('reviewed lesson → assignment → learner submission → returned feedback stays connected and scoped',async()=>{
  memory.clear();
  const create=async(email,identity)=>{await appClient.auth.register({email,password:'Preview-test-123!'});await appClient.auth.verifyOtp({email});return appClient.auth.updateMe({identity,onboarding_complete:true});};
  const teacher=await create('loop-teacher@visionary.test','teacher');const person=bootstrapPerson(teacher);const ctx={personId:teacher.id,workspaceId:person.active,role:'teacher',locale:'en'};
  const classroom=await appClient.entities.Classroom.create({name:'Reasoning together',teacher_email:teacher.email,teacher_id:teacher.id,join_code:'LOOP-CUBE'});
  const lesson=saveResource(ctx,{title:'Explain cube volume',kind:'lesson',body:'Explain why side × side × side counts unit cubes.',status:'reviewed'});
  const assignment=await assignReviewedLesson(ctx,{resourceId:lesson.id,classId:classroom.id,points:10});
  assert.equal((await assignReviewedLesson(ctx,{resourceId:lesson.id,classId:classroom.id,points:10})).id,assignment.id);
  saveResource(ctx,{...lesson,body:'Changed preparation notes'});assert.equal((await appClient.entities.Assignment.get(assignment.id)).description,'Explain why side × side × side counts unit cubes.');
  const learner=await create('loop-learner@visionary.test','student');bootstrapPerson(learner);
  assert.equal((await appClient.entities.Classroom.list()).length,0);assert.equal((await appClient.entities.Assignment.list()).length,0);
  const join=await appClient.entities.Classroom.findByJoinCode('LOOP-CUBE');assert.equal(join.id,classroom.id);
  await appClient.entities.Enrollment.create({class_id:join.id,student_email:learner.email,student_name:'Demo learner',status:'active',join_code:'LOOP-CUBE'});
  const visible=await appClient.entities.Assignment.list();assert.equal(visible.length,1);
  const submission=await appClient.entities.Submission.create({assignment_id:assignment.id,class_id:join.id,student_email:learner.email,text:'Three layers of nine unit cubes make 27.',status:'submitted'});
  await assert.rejects(appClient.entities.Submission.update(submission.id,{grade:10,status:'graded'}));
  await appClient.auth.loginViaEmailPassword(teacher.email,'Preview-test-123!');
  const learners=await teacherLearners(ctx);assert.equal(learners[0].pending,1);assert.equal(learners[0].evidence[0].response,'Three layers of nine unit cubes make 27.');
  await appClient.entities.Submission.update(submission.id,{grade:8,status:'graded',feedback:'Good model. Label the cubic units.',graded_date:new Date().toISOString()});
  await appClient.auth.loginViaEmailPassword(learner.email,'Preview-test-123!');assert.equal((await appClient.entities.Submission.get(submission.id)).feedback,'Good model. Label the cubic units.');
  assert.equal(snapshot({personId:learner.id,workspaceId:`${learner.id}:student`,role:'student',locale:'en'}).sessions.length,0);
  await create('loop-outsider@visionary.test','teacher');assert.equal((await appClient.entities.Submission.list()).length,0);assert.equal((await appClient.entities.Enrollment.list()).length,0);
});

test("visiting the dashboard never creates a streak or changes inputs", () => {
  const input = { studyLogs: [{date:"2026-09-13",topic:"Dashboard check-in",duration_minutes:0}], topics: [{name:"Volume",subject:"Geometry",mastery:0,status:"not-started"}] };
  const original = JSON.stringify(input);
  const result = deriveLearningData(input,new Date(2026,8,13,12));
  assert.equal(result.dailyStats.streak,0);
  assert.equal(result.dailyStats.topicsToday,0);
  assert.equal(JSON.stringify(input),original);
});
test("grades are normalized against assignment points without write-side effects", () => {
  const result = deriveLearningData({subjects:[{name:"Geometry"}],topics:[{name:"Volume",subject:"Geometry",mastery:0}],
    assignments:[{id:"a",subject:"Geometry",topics:["Volume"],points:50}], submissions:[{id:"s",assignment_id:"a",grade:40,status:"graded",graded_date:"2026-09-13"}]});
  assert.equal(result.topics[0].mastery,0); assert.equal(result.topics[0].last_assessment_accuracy,80);
  assert.equal(result.subjects[0].topics_mastered,0); assert.equal(result.studyLogs[0].confidence,undefined);
  assert.equal(result.studyLogs.length,1);
});
test("priority sorting preserves high priority and real activity makes a streak", () => {
  const result=deriveLearningData({topics:[{name:"Medium",status:"in-progress",priority:"medium"},{name:"High",status:"in-progress",priority:"high"}],
    studyLogs:[{date:"2026-09-12",topic:"A",duration_minutes:5},{date:"2026-09-13",topic:"B",duration_minutes:10}]},new Date(2026,8,13,12));
  assert.equal(result.todayPlan[0].name,"High"); assert.equal(result.dailyStats.streak,2); assert.equal(result.dailyStats.minutesToday,10);
});
test("practice scoring cannot exceed its question count", () => {
  assert.equal(scoreExercises(cubeExercises,{0:2,1:2,2:0}),3);
  assert.equal(scoreExercises(cubeExercises,{0:0,1:0,2:1}),0);
  assert.equal(scoreExercises(cubeExercises,{}),0);
});
test("auth returns only to internal dashboard paths", () => {
  for(const path of ["/","https://example.com","//example.com","/pricing"]) {
    window.location.search="?returnTo="+encodeURIComponent(path); assert.equal(safeReturnTo(),"/dashboard/home");
  }
  window.location.search="?returnTo="+encodeURIComponent("/dashboard/build?subject=Geometry");
  assert.equal(safeReturnTo(),"/dashboard/build?subject=Geometry");
});
test("preview account isolation, consent, persistence, and idempotent onboarding", async () => {
  const create = async (email,identity) => { await appClient.auth.register({email,password:"Preview-test-123!"}); await appClient.auth.verifyOtp({email}); return appClient.auth.updateMe({identity}); };
  const student=await create("learner@visionary.test","student");
  await initializeLearningWorkspace(appClient,student,{identity:"student",subjects:["Geometry"],subject_confidence:{Geometry:5}});
  await initializeLearningWorkspace(appClient,student,{identity:"student",subjects:["Geometry"],subject_confidence:{Geometry:5}});
  assert.equal((await appClient.entities.Subject.list()).length,1);
  assert.equal((await appClient.entities.Subject.list())[0].overall_mastery,0);
  const topic=await appClient.entities.Topic.create({name:"Private topic",subject:"Geometry"});
  await appClient.entities.StudyLog.create({date:"2026-09-13",duration_minutes:5,topic:"Volume"});
  await appClient.entities.Question.create({question:"Private question"});
  appClient.auth.logout();
  await create("parent@visionary.test","parent");
  assert.equal((await appClient.entities.Topic.list()).length,0);
  await assert.rejects(appClient.entities.Topic.update(topic.id,{name:"wrong account"}));
  const request=await appClient.entities.FamilyLink.create({parent_email:"parent@visionary.test",child_email:"learner@visionary.test",status:"pending"});
  assert.equal((await appClient.entities.StudyLog.filter({owner_email:student.email})).length,0);
  await appClient.auth.loginViaEmailPassword(student.email,"Preview-test-123!");
  await appClient.entities.FamilyLink.update(request.id,{status:"active"});
  await appClient.auth.loginViaEmailPassword("parent@visionary.test","Preview-test-123!");
  assert.equal((await appClient.entities.StudyLog.filter({owner_email:student.email})).length,1);
  assert.equal((await appClient.entities.Question.filter({owner_email:student.email})).length,0);
  await appClient.entities.FamilyLink.update(request.id,{status:"revoked"});
  assert.equal((await appClient.entities.StudyLog.filter({owner_email:student.email})).length,0);
  await assert.rejects(appClient.integrations.Core.InvokeLLM(),/not available/);
});
