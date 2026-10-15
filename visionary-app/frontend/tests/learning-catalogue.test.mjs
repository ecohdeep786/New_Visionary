import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {seedDemo,configureMock,updateStageProfile} from '../src/services/workspaceService.ts';
import {configureContentRepository,getContentRepository,SAMPLE_SELECTION,SAMPLE_LIBRARY_SELECTION} from '../src/services/contentRepository.ts';
import {learningProfileSelection,catalogueSelection,booksForOutline} from '../src/lib/learningCatalogue.js';
import {selectLearningSyllabus,startLearningUnit,getLearningUnit} from '../src/services/learningPipelineService.ts';
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window={dispatchEvent(){}};
globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
beforeEach(()=>{memory.clear();configureMock({latency:0,fault:'none'});seedDemo('adult');configureContentRepository(null);});

test('current university and exam context replaces old school browsing without mutating saved selection',()=>{
 const old={board:'CBSE',classLevel:'Class 8',subject:'Science'},before=structuredClone(old);
 const university=learningProfileSelection({stage:'higher_ed',institution:'Demo University',classLevel:'B.Sc · Semester 1',subjects:['Physics','Mathematics']},{board:'CBSE',grade_level:'Class 8',subjects:['Science']});
 assert.deepEqual(catalogueSelection(old,university),{board:'Demo University',classLevel:'B.Sc · Semester 1',subject:'Physics'});
 const exam=learningProfileSelection({exam:'Demo entrance',subjects:['Reasoning']});
 assert.equal(catalogueSelection(old,exam).board,'Demo entrance');assert.deepEqual(old,before);
 assert.deepEqual(learningProfileSelection({subjects:[]},{board:'CBSE',grade_level:'8',subjects:['Science']}),{board:'',classLevel:'',subject:''});
});

test('book browsing separates identically titled chapters and rejects a foreign book selection',()=>{
 const outline={textbooks:[{id:'a',title:'Core',chapterIds:['a1']},{id:'b',title:'Practice',chapterIds:['b1']}],chapters:[{id:'a1',textbookId:'a',title:'Chapter 1'},{id:'b1',textbookId:'b',title:'Chapter 1'}]};
 assert.equal(booksForOutline(outline).selected,null);
 assert.deepEqual(booksForOutline(outline,'a').chapters.map(row=>row.id),['a1']);
 assert.equal(booksForOutline(outline,null,'b1').selected.id,'b');
 assert.deepEqual(booksForOutline(outline,'foreign').chapters,[]);
});

test('subject catalog merges current profile and saved context without leaking another board',async()=>{
 updateStageProfile(ctx,{board:'Demo board',classLevel:'8',subjects:['Math','Science']});
 const repo=getContentRepository(ctx);await repo.getSyllabus('Other board','8','History');await repo.getSyllabus('Demo board','8','Arts');
 assert.deepEqual(await repo.getSubjects('Demo board','8'),[{subject:'Math',origin:'profile'},{subject:'Science',origin:'profile'},{subject:'Arts',origin:'saved'}]);
 const before=memory.get('visionary_content_v1');await repo.getSubjects('Demo board','8');assert.equal(memory.get('visionary_content_v1'),before);
});

test('subject adapter rechecks response context and current authorization without persisting catalog rows',async()=>{
 const repo=getContentRepository(ctx);
 configureContentRepository({getSyllabus:async()=>null,getSubjects:async()=>({board:'Wrong board',classLevel:'8',subjects:['Math']})});
 await assert.rejects(repo.getSubjects('Demo board','8'),/does not match/);assert.equal(memory.get('visionary_content_v1'),undefined);
 configureContentRepository({getSyllabus:async()=>null,getSubjects:async query=>({...query,subjects:['Math','Math','Science']})});
 assert.deepEqual(await repo.getSubjects('Demo board','8'),[{subject:'Math',origin:'catalog'},{subject:'Science',origin:'catalog'}]);
 configureContentRepository({getSyllabus:async()=>null,getSubjects:async query=>{const db=JSON.parse(memory.get('visionary_workspace_v2'));db.workspaces=db.workspaces.filter(row=>row.id!==ctx.workspaceId);memory.set('visionary_workspace_v2',JSON.stringify(db));return {...query,subjects:['Private subject']};}});
 await assert.rejects(repo.getSubjects('Demo board','8'),/access/);
});

test('isolated multi-book sample supports real activities without changing older saved sample sources',async()=>{
 const old=await selectLearningSyllabus(ctx,SAMPLE_SELECTION),repo=getContentRepository(ctx),oldTopics=await repo.getTopics(old.chapters[1].id),oldConcepts=await repo.getConcepts(oldTopics[0].id);
 const original=await startLearningUnit(ctx,oldConcepts[0].id),snapshot=structuredClone(getLearningUnit(ctx,original.id));
 const outline=await selectLearningSyllabus(ctx,SAMPLE_LIBRARY_SELECTION);assert.equal(outline.status,'sample');assert.equal(outline.textbooks.length,2);
 const geometry=outline.textbooks.find(book=>book.title==='Geometry workbook'),path=booksForOutline(outline,geometry.id),topics=await repo.getTopics(path.chapters[0].id),concepts=await repo.getConcepts(topics[0].id);
 const next=await startLearningUnit(ctx,concepts[0].id);assert.notEqual(next.id,original.id);assert.equal(next.sourceContext.provenance.sourceId,'sample:library');
 assert.deepEqual(getLearningUnit(ctx,original.id),snapshot);assert.equal((await repo.getConcept(oldConcepts[0].id)).provenance.version,'2');
 assert.equal((await getContentRepository({...ctx,locale:'hi'}).getChapters(outline.id))[0].textbookId,outline.textbooks[0].id);
});
