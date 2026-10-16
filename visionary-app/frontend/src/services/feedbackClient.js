import { createAuthTransport } from '../api/firebase/authTransport.js';

export function feedbackSurface(path) {
  const area = path.split('/')[2];
  if (['learn', 'practice', 'progress'].includes(area)) return 'learn';
  if (['ask', 'guide', 'build'].includes(area)) return area;
  if (['classes', 'classwork', 'learners', 'prepare'].includes(area)) return 'classroom';
  if (['subscription', 'plans'].includes(area)) return 'billing';
  if (['settings', 'privacy', 'connections'].includes(area)) return 'account';
  return 'general';
}

export function createFeedbackClient({ getAccountId, request = createAuthTransport({ basePath: '/api/account/feedback' }) }) {
  return {
    async submit(command) {
      const uid = getAccountId();
      const check = () => { if (!uid || getAccountId() !== uid) throw Object.assign(new Error('The signed-in account changed.'), { status: 409 }); };
      check();
      const value = await request('', { method: 'POST', body: command, accountId: uid, beforeSend: check });
      check();
      if (value?.version !== 1 || value.uid !== uid || value.id !== command.commandId || value.status !== 'submitted' || !Number.isFinite(Date.parse(value.createdAt))) {
        throw Object.assign(new Error('Feedback receipt could not be confirmed. Retry the same note.'), { status: 503 });
      }
      return value;
    },
  };
}
