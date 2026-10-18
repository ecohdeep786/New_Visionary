import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {seedDemo,configureMock,updatePreferences,snapshot} from '../src/services/workspaceService.ts';
import {configureContentRepository,SAMPLE_LIBRARY_SELECTION,SAMPLE_SELECTION,getContentRepository} from '../src/services/contentRepository.ts';
import {loadBookCatalogue} from '../src/services/bookCatalogueService.js';
import {booksForOutline,bookCompletion,filterCatalogueBooks} from '../src/lib/learningCatalogue.js';
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
beforeEach(()=>{memory.clear();configureMock({latency:0,fault:'none'});seedDemo('adult');configureContentRepository(null);});
test('single-book catalog never implicitly exposes chapters; explicit parent and saved chapter links still work',async()=>{
 const outline=await getContentRepository(ctx).getSyllabus(SAMPLE_SELECTION.board,SAMPLE_SELECTION.classLevel,SAMPLE_SELECTION.subject);
 assert.equal(outline.textbooks.length,1);assert.equal(booksForOutline(outline).selected,null);assert.deepEqual(booksForOutline(outline).chapters,[]);
 assert.equal(booksForOutline(outline,outline.textbooks[0].id).chapters.length,outline.chapters.length);
 assert.equal(booksForOutline(outline,null,outline.chapters[0].id).selected.id,outline.textbooks[0].id);
});
test('completion excludes old versions, classroom attempts and empty chapters',()=>{
 const source={provider:'School',sourceId:'math',version:'2'},book={id:'b',chapterIds:['c','empty']};
 const syllabus={id:'s',provenance:source,chapters:[{id:'c',textbookId:'b',topicIds:['t']},{id:'empty',textbookId:'b',topicIds:[]}]};
 const graphs=[{syllabus,topics:[{id:'t',conceptIds:['x','y']}]}];
 const unit=id=>({conceptId:id,stage:'completed',sourceContext:{provenance:source}});
 assert.deepEqual(bookCompletion(syllabus,book,graphs,[unit('x'),{...unit('y'),sourceContext:{provenance:{...source,version:'1'}}}]),{completed:0,total:2});
 assert.equal(bookCompletion(syllabus,book,graphs,[unit('x'),{...unit('y'),classId:'private-class'}]).completed,0);
 assert.deepEqual(bookCompletion(syllabus,book,graphs,[unit('x'),unit('y')]),{completed:1,total:2});
});
test('catalog uses owned source books, does not create learning units, and can filter without mutating source order',async()=>{
 const view=await loadBookCatalogue(ctx,SAMPLE_LIBRARY_SELECTION);
 assert.equal(view.groups.length,1);assert.equal(view.groups[0].books.length,2);assert.equal(view.failures.length,0);assert.equal(memory.get('visionary_learning_v1'),undefined);
 const before=structuredClone(view.groups);
 assert.equal(filterCatalogueBooks(view.groups,'geometry mathematics')[0].books[0].id,'sample:library:geometry-book');
 assert.deepEqual(filterCatalogueBooks(view.groups,'', 'completed'),[]);
 assert.equal(filterCatalogueBooks(view.groups,'','all','title')[0].books[0].title,'Fractions workbook');assert.deepEqual(view.groups,before);
});
test('catalog keeps readable subjects after one source fails and stops after cancellation',async()=>{
 configureContentRepository({getSubjects:async query=>({...query,subjects:['Readable','Failed']}),getSyllabus:async query=>{if(query.subject==='Failed')throw Error('Offline source');return null;}});
 const view=await loadBookCatalogue(ctx,{board:'Demo',classLevel:'8',subject:''});assert.equal(view.groups.length,1);assert.equal(view.failures[0].subject,'Failed');
 const controller=new AbortController();controller.abort();await assert.rejects(loadBookCatalogue({...ctx,signal:controller.signal},SAMPLE_LIBRARY_SELECTION),{name:'AbortError'});
});
test('theme choice is workspace scoped and invalid values do not replace preferences',()=>{
 updatePreferences(ctx,{appearance:'dark'});assert.equal(snapshot(ctx).preferences.appearance,'dark');
 const teacher={...ctx,role:'teacher',workspaceId:'demo-adult:teacher'};assert.equal(snapshot(teacher).preferences.appearance,undefined);
 assert.throws(()=>updatePreferences(ctx,{appearance:'unsupported'}),/supported theme/);assert.equal(snapshot(ctx).preferences.appearance,'dark');
 updatePreferences(ctx,{appearance:'system'});assert.equal(snapshot(ctx).preferences.appearance,'system');
});
