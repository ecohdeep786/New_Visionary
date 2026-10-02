import { useEffect, useState } from 'react';
import { getPrerequisitePath, getStudentState } from '@/services/mentorStateService';

/** Curriculum prerequisites guide the learner without blocking exploration. */
export default function LearningPrerequisites({ ctx, conceptId, onOpen, compact = false }) {
 const [path, setPath] = useState(null);
 const [unavailable, setUnavailable] = useState(false);

 useEffect(() => {
  let live = true;
  setPath(null);
  setUnavailable(false);
  getPrerequisitePath(ctx, conceptId).then(items => {
   if (live) setPath(items.slice(0, -1));
  }).catch(() => {
   if (live) setUnavailable(true);
  });
  return () => { live = false; };
 }, [ctx?.workspaceId, ctx?.locale, conceptId]);

 if (unavailable) return <p className="v-notice mt-3" role="status">Prerequisite details are unavailable. You can explore this concept, but readiness cannot be confirmed from this outline.</p>;
 if (!path?.length) return null;
 const stages = new Map(getStudentState(ctx).concepts.map(item => [item.conceptId, item.stage]));
 const remaining = path.filter(item => !['Secure', 'Mastered'].includes(stages.get(item.id)));
 return <div className={compact ? 'mt-2' : 'v-notice mt-4'} aria-label="Prerequisite path">
  <p className={compact ? 'v-muted text-sm' : 'font-medium'}>{remaining.length ? 'Suggested first: review earlier concepts' : 'Earlier concepts have recorded secure evidence'}</p>
  <div className="mt-2 flex flex-wrap gap-2">{path.map(item => <button className="v-button" type="button" key={item.id} onClick={() => onOpen(item.id)}>
   {['Secure', 'Mastered'].includes(stages.get(item.id)) ? 'Revisit' : 'Review'} {item.title}
  </button>)}</div>
  {!compact && <p className="v-muted mt-2 text-sm">You can still explore this concept now. A prerequisite is a guide, not a mastery claim.</p>}
 </div>;
}
