const prefix = 'visionary_review_drafts_v1:';
const validCriteria=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(item=>item&&Object.keys(item).every(key=>['rating','note'].includes(key))&&typeof item==='object'&&!Array.isArray(item)&&['','met','needs-work','not-assessed'].includes(item.rating)&&typeof item.note==='string'&&item.note.length<=2000);

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
  if(draft.criterionFeedback!==undefined&&!validCriteria(draft.criterionFeedback))throw Error('Saved criterion feedback is incomplete. Submitted work is unchanged.');
  if(draft.reviewRevision!==undefined&&typeof draft.reviewRevision!=='string')throw Error('Saved review revision is incomplete. Submitted work is unchanged.');
  return { grade: draft.grade, feedback: draft.feedback,...(draft.reviewRevision!==undefined?{reviewRevision:draft.reviewRevision}:{}),...(draft.criterionFeedback!==undefined?{criterionFeedback:draft.criterionFeedback}:{}) };
}
export function saveReviewDraft(ctx, assignmentId, submissionId, attempt, grade, feedback,criterionFeedback,reviewRevision) {
  if (!submissionId || !Number.isInteger(attempt) || attempt < 1 || typeof grade !== 'string' || typeof feedback !== 'string' || feedback.length > 5000) throw new Error('Review draft is incomplete.');
  if(reviewRevision!==undefined&&typeof reviewRevision!=='string')throw Error('Review revision is incomplete.');
  const drafts = read(ctx, assignmentId);
  if(criterionFeedback!==undefined&&!validCriteria(criterionFeedback))throw Error('Criterion review draft is incomplete.');
  drafts[submissionId] = { attempt, grade, feedback,...(reviewRevision!==undefined?{reviewRevision}:{}),...(criterionFeedback!==undefined?{criterionFeedback:structuredClone(criterionFeedback)}:{}) };
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
