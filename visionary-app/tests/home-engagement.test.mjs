import test from 'node:test';
import assert from 'node:assert/strict';
import { currentPlanDeferralLabel, homePlanPresentation } from '../src/lib/homeEngagement.js';

const row = (id, path, pending = true) => ({ id, title: 'Original authored title', detail: 'Saved detail', action: {label:'Open', path}, ...(pending ? {deferId:id} : {}) });
const module = rows => ({id:'daily-plan', title:'Today’s plan', rows});

test('a current-only plan moves to priority controls without mutating service data', () => {
  const current = row('unit:saved-unit', '/dashboard/learn?unit=saved-unit');
  const modules = [module([current])];
  const original = structuredClone(modules);
  const presentation = homePlanPresentation(modules, current);
  assert.equal(presentation.currentStep, current);
  assert.deepEqual(presentation.modules, []);
  assert.equal(presentation.currentStep.deferId, 'unit:saved-unit');
  assert.deepEqual(modules, original);
});

test('known unit-id alias deduplicates while retaining distinct and completed steps', () => {
  const current = row('unit:saved-unit', '/dashboard/learn?unit=saved-unit');
  const next = row('review:another-concept', '/dashboard/practice');
  const done = row('done:earlier-unit', '/dashboard/learn?unit=earlier-unit', false);
  const other = {id:'other', title:'Other section', rows:[current]};
  const result = homePlanPresentation([module([current,next,done]),other], {...current,id:'saved-unit'});
  assert.equal(result.currentStep, current);
  assert.deepEqual(result.modules[0].rows, [next,done]);
  assert.equal(result.modules[1], other);
  assert.equal(result.modules[0].rows[1].deferId, undefined);
  assert.equal(result.modules[0].rows[0].title, 'Original authored title');
});

test('distinct tasks sharing one route or title remain visible', () => {
  const current = row('classwork:first', '/dashboard/classes?class=class-one');
  const distinct = row('classwork:second', current.action.path);
  const result = homePlanPresentation([module([current,distinct])], current);
  assert.deepEqual(result.modules[0].rows, [distinct]);
  assert.deepEqual(homePlanPresentation([module([distinct])], current).modules[0].rows, [distinct]);
});

test('completed records remain visible and an unrelated conversation leaves the plan intact', () => {
  const done = row('done:saved-unit', '/dashboard/learn?unit=saved-unit', false);
  const plan = module([done]);
  assert.equal(homePlanPresentation([plan], done).modules[0], plan);
  const unrelated = row('conversation-session', '/dashboard/ask?session=conversation-session');
  const result = homePlanPresentation([plan], unrelated);
  assert.equal(result.currentStep, undefined);
  assert.equal(result.modules[0], plan);
  assert.deepEqual(homePlanPresentation([], unrelated).modules, []);
});

test('priority deferral names the plan rather than hiding or deleting saved learning', () => {
  assert.equal(currentPlanDeferralLabel('en'), 'Remove from today’s plan');
  assert.equal(currentPlanDeferralLabel('unknown'), currentPlanDeferralLabel('en'));
  assert.match(currentPlanDeferralLabel('hi'), /[\u0900-\u097f]/);
  assert.match(currentPlanDeferralLabel('bn'), /[\u0980-\u09ff]/);
});
