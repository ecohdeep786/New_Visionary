import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { getHome } from '../src/services/homeService.ts';
import { getDailyPlan } from '../src/services/dailyPlanService.ts';
import { startLearningUnit, selectLearningSyllabus } from '../src/services/learningPipelineService.ts';
import { SAMPLE_SELECTION } from '../src/services/contentRepository.ts';

const memory = new Map();
globalThis.localStorage = { getItem:key => memory.get(key) ?? null, setItem:(key,value) => memory.set(key,String(value)), removeItem:key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type=type; } };
const ctx = role => ({personId:'demo-adult',workspaceId:'demo-adult:'+role,role,locale:'en'});
beforeEach(() => {memory.clear();workspace.configureMock({latency:0,fault:'none'});workspace.seedDemo('adult');});
function language(role,locale) {
  const db=JSON.parse(memory.get('visionary_workspace_v2'));
  db.data[ctx(role).workspaceId].preferences.interfaceLocale=locale;
  db.data[ctx(role).workspaceId].preferences.locale='en';
  memory.set('visionary_workspace_v2',JSON.stringify(db));
}

test('each role localizes Home using interface language independently of teaching language',async () => {
  const targets={student:'/dashboard/learn',teacher:'/dashboard/prepare',parent:'/dashboard/child',professional:'/dashboard/career',organization:'/dashboard/people'};
  for(const role of Object.keys(targets)) {
    const english=await getHome(ctx(role));
    for(const locale of ['hi','bn']) {
      language(role,locale);
      const before=memory.get('visionary_workspace_v2');
      const localized=await getHome(ctx(role));
      assert.equal(localized.priority.action.path,targets[role]);
      for(const field of ['title','detail','reason','source']) assert.notEqual(localized.priority[field],english.priority[field],role+' '+locale+' '+field);
      assert.notEqual(localized.priority.action.label,english.priority.action.label);
      assert.notEqual(localized.boundary,english.boundary);
      assert.equal(memory.get('visionary_workspace_v2'),before,'display localization must not mutate records');
    }
  }
});

test('localized daily continuation preserves the original authored concept and teaching language',async () => {
  const context=ctx('student');
  await selectLearningSyllabus(context,SAMPLE_SELECTION);
  const unit=await startLearningUnit(context,'sample:fractions:concept');
  for(const locale of ['hi','bn']) {
    language('student',locale);
    const before=memory.get('visionary_learning_pipeline_v1');
    const home=await getHome(context);
    const step=getDailyPlan(context).steps.find(row=>row.kind==='learn');
    assert.equal(home.priority.title,unit.title);
    assert.equal(home.priority.titleLocale,'en');
    assert.equal(step.title,unit.title);
    assert.equal(step.titleLocale,'en');
    assert.equal(home.priority.action.path,'/dashboard/learn?unit='+encodeURIComponent(unit.id));
    assert.doesNotMatch(step.detail,/Continue from explain/);
    assert.equal(memory.get('visionary_learning_pipeline_v1'),before,'localization must preserve the original activity');
  }
});

test('authored project titles that match a UI message are never translated',async () => {
  const context=ctx('student');
  workspace.saveArtifact(context,{title:'Prepare your next lesson',body:'Private original text',milestones:[false,false,false],status:'in-progress'});
  language('student','bn');
  const plan=getDailyPlan(context);
  assert.equal(plan.steps.find(row=>row.kind==='build').title,'Prepare your next lesson');
  assert.equal((await getHome(context)).priority.title,'Prepare your next lesson');
});
