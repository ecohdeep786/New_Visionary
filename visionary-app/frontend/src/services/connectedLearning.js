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

export function createLearningClosure(getAccountId, request = requestLearning) {
  async function call(uid, path, options) {
    const check = () => {
      if (!uid || getAccountId() !== uid) throw Object.assign(new Error('Account changed.'), { status: 401 });
    };
    check();
    const value = await request(path, { ...options, accountId: uid, beforeSend: check });
    check();
    return value;
  }

  function pathFor(id) {
    if (typeof id !== 'string' || !uuid.test(id)) throw new Error('Invalid learning session.');
    return '/sessions/' + id;
  }

  return {
    async read(uid, id) {
      const value = await call(uid, pathFor(id));
      const reference = text => typeof text === 'string' && text.length > 0 && text.length <= 256;
      if (value?.version !== 1 || value.uid !== uid || value.sessionId !== id ||
        !['active', 'cancelled'].includes(value.status) || !Number.isSafeInteger(value.revision) || value.revision < 0 ||
        !reference(value.workspaceId) || !reference(value.concept?.sourceVersion) || !reference(value.concept?.criteriaVersion)) {
        throw new Error('The current learning session could not be confirmed.');
      }
      return {
        status: value.status, expectedRevision: value.revision, workspaceId: value.workspaceId,
        sourceVersion: value.concept.sourceVersion, criteriaVersion: value.concept.criteriaVersion,
      };
    },

    async close(uid, id, revision, commandId) {
      const { expectedRevision, workspaceId, sourceVersion, criteriaVersion } = revision;
      const value = await call(uid, pathFor(id) + '/cancel', {
        method: 'POST', body: { version: 1, commandId, expectedRevision, workspaceId, sourceVersion, criteriaVersion },
      });
      if (value?.version !== 1 || value.uid !== uid || value.sessionId !== id || value.status !== 'cancelled' ||
        value.revision !== expectedRevision || value.workspaceId !== workspaceId ||
        value.concept?.sourceVersion !== sourceVersion || value.concept?.criteriaVersion !== criteriaVersion) {
        throw new Error('The server did not confirm this session was closed.');
      }
    },
  };
}
