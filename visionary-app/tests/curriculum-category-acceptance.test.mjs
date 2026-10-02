import test from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset,template} from './fixtures/classCurriculum.mjs';
import {getClassCurriculum,publishClassCurriculum} from '../src/services/classCurriculumService.js';
import {getAssignedCurriculumOutline} from '../src/services/assignedCurriculumOutline.js';

// Synthetic source fixtures exercise ownership/delivery, not subject accuracy,
// official-board approval, model quality or completeness of real textbooks.
const categories=[
 ['primary','minor-cbse','CBSE fixture','3','Mathematics'],
 ['secondary','bengali','West Bengal fixture','10','Science'],
 ['higher-secondary','adult','School fixture','12','Physics'],
 ['competitive','exam','Exam fixture','Competitive','Quantitative reasoning'],
 ['vocational','adult','Training fixture','Vocational','Applied measurement'],
 ['higher-education','college','University fixture','Higher education','Statistics'],
 ['independent-adult','adult','Independent fixture','Adult','Financial numeracy'],
 ['professional','professional','Professional fixture','Professional','Data analysis'],
 ['employer-sponsored','employee','Employer fixture','Professional','Workplace data'],
];
for(const [category,learnerPersona,board,classLevel,subject] of categories) {
 test(`${category}: en/hi/bn reviewed sources retain exact scope, assignment and language`,async()=>{
  for(const language of ['en','hi','bn']) {
   reset();const curriculum=template();curriculum.selection={board,classLevel,subject};curriculum.provenance={provider:'Synthetic category provider',sourceId:category,version:'fixture-1'};
   const title={en:'Reviewed source objective',hi:'समीक्षित स्रोत उद्देश्य',bn:'পর্যালোচিত উৎসের উদ্দেশ্য'}[language];curriculum.chapters[0].objectives[0].title=title;
   const f=await fixture({learnerPersona,title:category+' curriculum',language,curriculumTemplate:curriculum});
   const saved=await publishClassCurriculum(f.teacher,{classId:f.classroom.id,deliveryId:f.delivery.id,expectedRevision:'[]'});
   const classBytes=storage.get('visionary_entity_Classroom'),assignmentBytes=storage.get('visionary_entity_Assignment');
   storage.set('visionary_session_token',f.learner.personId);
   const view=await getClassCurriculum({...f.learner,locale:language},f.classroom.id),outline=await getAssignedCurriculumOutline({...f.learner,locale:language},f.classroom.id);
   const objective=view.publications[0].chapters[0].objectives[0];
   assert.equal(view.publications[0].id,saved.id);assert.equal(objective.objective.locale,language);assert.equal(objective.objective.title,title);assert.deepEqual(objective.objective.selection,{board,classLevel,subject});assert.deepEqual(objective.objective.provenance,{...curriculum.provenance,sourceId:category+' · Pages 1–4'});
   assert.equal(objective.assignments[0].id,f.assignment.id);assert.equal(outline.chapters[0].objectives[0].assignmentId,f.assignment.id);assert.equal(outline.chapters[0].locale,language);
   assert.doesNotMatch(JSON.stringify([view,outline]),/PRIVATE_|answerIndex|"practice":|student_email/);
   assert.equal(storage.get('visionary_entity_Classroom'),classBytes);assert.equal(storage.get('visionary_entity_Assignment'),assignmentBytes);assert.equal(storage.get('visionary_entity_Submission'),undefined);assert.equal(storage.get('visionary_mentor_v1'),undefined);
   const enrollments=JSON.parse(storage.get('visionary_entity_Enrollment'));enrollments[0].status='left';storage.set('visionary_entity_Enrollment',JSON.stringify(enrollments));
   await assert.rejects(getClassCurriculum(f.learner,f.classroom.id),/no longer connected|unavailable/);await assert.rejects(getAssignedCurriculumOutline(f.learner,f.classroom.id),/no longer connected/);
  }
 });
}
