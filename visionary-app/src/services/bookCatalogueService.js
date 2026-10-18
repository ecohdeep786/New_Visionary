import {getContentRepository,getSavedCurriculumGraphs} from './contentRepository.ts';
import {getLearningWorkspace} from './learningPipelineService.ts';
import {workspaceIdentity} from './workspaceService.ts';
import {bookCompletion} from '../lib/learningCatalogue.js';

/** Four concurrent subject reads; partial failures do not erase readable books. */
export async function loadBookCatalogue(ctx, selection) {
 const repo = getContentRepository(ctx);
 const subjects = selection.subject ? [{subject:selection.subject}] : await repo.getSubjects(selection.board,selection.classLevel);
 const groups = [], failures = [];
 for (let index=0; index<subjects.length; index+=4) {
  if(ctx.signal?.aborted)throw new DOMException('Catalogue opening cancelled.','AbortError');
  const batch=await Promise.allSettled(subjects.slice(index,index+4).map(row=>repo.getSyllabus(selection.board,selection.classLevel,row.subject)));
  batch.forEach((result,offset)=>{
   if(result.status==='fulfilled')groups.push(result.value);
   else failures.push({subject:subjects[index+offset].subject,message:result.reason.message});
  });
 }
 workspaceIdentity(ctx); // Recheck access after transport completion.
 if(ctx.signal?.aborted)throw new DOMException('Catalogue opening cancelled.','AbortError');
 const graphs=getSavedCurriculumGraphs(ctx);
 let units=[],progressError='';
 try{units=getLearningWorkspace(ctx).units;}catch(error){progressError=error.message;}
 return {groups:groups.map(syllabus=>({...syllabus,books:syllabus.textbooks.map(book=>{
  const graph=graphs.find(item=>item.syllabus.id===syllabus.id && item.syllabus.contentLocale===syllabus.contentLocale);
  const chapterIds=new Set(book.chapterIds);
  const topicIds=new Set(syllabus.chapters.filter(chapter=>chapterIds.has(chapter.id)).flatMap(chapter=>chapter.topicIds));
  const conceptIds=new Set(graph?.topics.filter(topic=>topicIds.has(topic.id)).flatMap(topic=>topic.conceptIds) || []);
  return {...book,progress:bookCompletion(syllabus,book,graphs,units),started:units.some(unit=>!unit.classId&&conceptIds.has(unit.conceptId)&&(!syllabus.provenance||['provider','sourceId','version'].every(key=>unit.sourceContext?.provenance[key]===syllabus.provenance[key])))};
 })})),failures,progressError};
}
