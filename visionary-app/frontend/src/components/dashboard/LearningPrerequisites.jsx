import { useEffect, useState } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { learningCopy } from '@/lib/learningCopy';
import { getPrerequisitePath, getStudentState } from '@/services/mentorStateService';

/** Curriculum prerequisites guide the learner without blocking exploration. */
export default function LearningPrerequisites({ ctx, conceptId, onOpen, compact = false }) {
 const { data, revision } = useWorkspace();
 const locale = data?.preferences.interfaceLocale || 'en';
 const copy = learningCopy(locale);
 const [result, setResult] = useState(null);
 const [unavailable, setUnavailable] = useState(false);
 const [retry, setRetry] = useState(0);
 useEffect(() => {
  let live = true;
  setResult(null); setUnavailable(false);
  (async () => {
   const items = await getPrerequisitePath(ctx, conceptId);
   const states = getStudentState(ctx).concepts;
   if (!Array.isArray(items) || !Array.isArray(states)) throw Error('Unreadable prerequisite records');
   const stages = new Map(states.map(item => [item.conceptId, item.stage]));
   if (live) setResult({ path: items.slice(0, -1), stages });
  })().catch(() => { if (live) setUnavailable(true); });
  return () => { live = false; };
 }, [ctx?.personId, ctx?.workspaceId, ctx?.locale, conceptId, revision, retry]);
 if (unavailable) return <div className="v-notice mt-3" lang={locale} role="status"><p>{copy('Prerequisite details are unavailable. You can explore this concept, but readiness cannot be confirmed from this outline.')}</p><button type="button" className="v-button mt-2" onClick={() => setRetry(value => value + 1)}>{copy('Retry')}</button></div>;
 if (!result?.path.length) return null;
 const { path, stages } = result;
 const remaining = path.filter(item => !['Secure', 'Mastered'].includes(stages.get(item.id)));
 return <div lang={locale} className={compact ? 'mt-2' : 'v-notice mt-4'} aria-label={copy('Prerequisite path')}><p className={compact ? 'v-muted text-sm' : 'font-medium'}>{copy(remaining.length ? 'Suggested first: review earlier concepts' : 'Earlier concepts have recorded secure evidence')}</p><div className="mt-2 flex flex-wrap gap-2">{path.map(item => <button className="v-button" type="button" key={item.id} onClick={() => onOpen(item.id)}>{copy(['Secure', 'Mastered'].includes(stages.get(item.id)) ? 'Revisit' : 'Review')} <span lang={item.locale || ctx.locale}>{item.title}</span></button>)}</div>{!compact && <p className="v-muted mt-2 text-sm">{copy('You can still explore this concept now. A prerequisite is a guide, not a mastery claim.')}</p>}</div>;
}
