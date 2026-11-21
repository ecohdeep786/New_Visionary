import test from 'node:test';
import assert from 'node:assert/strict';
import { listSavedLearning } from '../src/services/connectedLearning.js';

const id = '30ec069b-f5c7-41c1-820d-d487a666d838';
const cursor = '311a091b-28c3-4708-a76c-d487a666d830';
const item = { uid: 'learner', sessionId: id, concept: { conceptId: 'motion' }, status: 'active', phase: 'check_passed', updatedAt: '2026-11-14T12:00:00Z' };
const page = { version: 1, uid: 'learner', items: [item], nextCursor: id };

test('saved learning sends the expected account and cursor and returns a display projection', async () => {
  const result = await listSavedLearning('learner', {
    after: cursor,
    request: async (url, headers) => {
      assert.equal(url, '/sessions?limit=20&after=' + cursor);
      assert.deepEqual(headers, { accountId: 'learner' });
      return page;
    },
  });
  assert.deepEqual(result, { nextCursor: id, items: [
    { id, concept: 'motion', status: 'active', phase: 'check_passed', updatedAt: item.updatedAt },
  ] });
});

test('saved learning rejects foreign records and non-advancing cursors', async () => {
  await assert.rejects(listSavedLearning('learner', { request: async () => ({ ...page, items: [{ ...item, uid: 'another-account' }] }) }), /invalid learning history/);
  await assert.rejects(listSavedLearning('learner', { after: id, request: async () => page }), /invalid learning history/);
});
