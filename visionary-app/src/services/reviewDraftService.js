const prefix = 'visionary_review_drafts_v1:';

function key(ctx, assignmentId) {
  if (ctx?.role !== 'teacher' || !ctx.workspaceId || !assignmentId) throw new Error('Open your teacher workspace to review classwork.');
  return `${prefix}${ctx.workspaceId}:${assignmentId}`;
}
function read(ctx, assignmentId) {
  const raw = localStorage.getItem(key(ctx, assignmentId));
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    return value;
  } catch { throw new Error('Saved review drafts could not be read on this device. Submitted work is unchanged.'); }
}
export function getReviewDraft(ctx, assignmentId, submissionId, attempt) {
  const draft = read(ctx, assignmentId)[submissionId];
  if (!draft || draft.attempt !== attempt) return null;
  if (typeof draft.grade !== 'string' || typeof draft.feedback !== 'string') throw new Error('This saved review draft is incomplete. Submitted work is unchanged.');
  return { grade: draft.grade, feedback: draft.feedback };
}
export function saveReviewDraft(ctx, assignmentId, submissionId, attempt, grade, feedback) {
  if (!submissionId || !Number.isInteger(attempt) || attempt < 1 || typeof grade !== 'string' || typeof feedback !== 'string' || feedback.length > 5000) throw new Error('Review draft is incomplete.');
  const drafts = read(ctx, assignmentId);
  drafts[submissionId] = { attempt, grade, feedback };
  try { localStorage.setItem(key(ctx, assignmentId), JSON.stringify(drafts)); }
  catch { throw new Error('Review edits could not be backed up on this device. Keep this dialog open and try again.'); }
}
export function clearReviewDraft(ctx, assignmentId, submissionId) {
  const drafts = read(ctx, assignmentId);
  if (!drafts[submissionId]) return;
  delete drafts[submissionId];
  try { localStorage.setItem(key(ctx, assignmentId), JSON.stringify(drafts)); }
  catch { throw new Error('Returned feedback was saved, but its local draft could not be cleared.'); }
}
