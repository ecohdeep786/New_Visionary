import { createAuthTransport } from '../api/firebase/authTransport.js';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const requestLearning = createAuthTransport({ basePath: '/api/account/learning' });

export async function listSavedLearning(uid, { after, request = requestLearning } = {}) {
  if (!uid || (after != null && !uuid.test(after))) throw Error('Invalid learning request.');
  const params = new URLSearchParams({ limit: '20' });
  if (after) params.set('after', after);
  const page = await request('/sessions?' + params, { accountId: uid });
  if (page?.version !== 1 || page.uid !== uid || !Array.isArray(page.items) || page.items.length > 20 ||
      !(page.nextCursor === null || (page.nextCursor !== after && uuid.test(page.nextCursor) && page.nextCursor === page.items.at(-1)?.sessionId)) ||
      new Set(page.items.map(item => item?.sessionId)).size !== page.items.length ||
      page.items.some(item => item?.uid !== uid || !uuid.test(item.sessionId) ||
        typeof item.concept?.conceptId !== 'string' || !item.concept.conceptId ||
        !['active', 'cancelled'].includes(item.status) || !Number.isFinite(Date.parse(item.updatedAt)))) {
    throw Error('The server returned an invalid learning history.');
  }
  return { nextCursor: page.nextCursor, items: page.items.map(item => ({
    id: item.sessionId, concept: item.concept.conceptId, updatedAt: item.updatedAt,
    status: item.status, phase: ['check_passed', 'review_suggested'].includes(item.phase) ? item.phase : '',
  })) };
}
