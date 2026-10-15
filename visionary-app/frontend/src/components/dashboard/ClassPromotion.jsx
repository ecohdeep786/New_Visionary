import { classTabCopy } from '@/lib/classTabCopy';
import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { proposeClassPromotion } from '@/services/stageTransitionService';

// Part W's canonical case: the teacher records the class promotion (for example 7 to 8)
// for every actively enrolled learner. Each learner keeps notice, Postpone and Undo on
// their own Home — the teacher never silently rewrites private learning.
export default function ClassPromotion({
  classId,
  accent,
  locale = "en"
}) {
  const copy = classTabCopy(locale);
  const {
    user,
    activeWorkspace
  } = useAuth();
  const [level, setLevel] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const alreadyCount = result?.skipped.filter(item => item.reason.startsWith('already in')).length || 0;
  const reviewCount = (result?.skipped.length || 0) - alreadyCount;
  function submit(event) {
    event.preventDefault();
    if (!user || !activeWorkspace) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const summary = proposeClassPromotion({
        personId: user.id,
        workspaceId: activeWorkspace.id,
        role: activeWorkspace.role
      }, classId, level, reason);
      setResult(summary);
      setLevel('');
      setReason('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <details className="border-t border-[#dadce0] pt-5">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#121317]">
        <GraduationCap className="h-4 w-4" style={{
        color: accent
      }} />{copy("Record class promotion")}</summary>
      <p className="mt-3 text-sm text-[#5f6368]">{copy("Adjacent class changes apply to actively enrolled learners. Anyone already in that class or needing a larger change keeps their current stage.")}</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">{copy("Moving to class")}<input value={level} onChange={e => setLevel(e.target.value)} maxLength={2} placeholder="8" aria-label={copy("Next class level")} className="mt-1 block w-24 rounded-xl border border-[#dadce0] p-2.5 text-sm" />
          </label>
          <label className="min-w-0 flex-1 text-sm">{copy("Reason (shared with learners)")}<input value={reason} onChange={e => setReason(e.target.value)} maxLength={120} placeholder={copy("End of year promotion")} aria-label={copy("Promotion reason")} className="mt-1 block w-full rounded-xl border border-[#dadce0] p-2.5 text-sm" />
          </label>
          <button type="submit" disabled={busy || !level.trim()} className="h-11 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50" style={{
          backgroundColor: accent
        }}>
            {busy ? copy("Recording\u2026") : copy("Record promotion")}
          </button>
        </div>
        {result && <div role="status" className="rounded-xl bg-[#e8f0fd] p-4 text-sm">
            <p className="font-medium text-[#121317]">{copy('{count} learners moved to class {level}.', {
            count: result.promoted.length,
            level: result.nextClassLevel
          })}</p>
            {alreadyCount > 0 && <p className="mt-1 text-[#5f6368]">{copy('{count} already in class {level}.', {
            count: alreadyCount,
            level: result.nextClassLevel
          })}</p>}
            {reviewCount > 0 && <p className="mt-1 text-[#5f6368]">{copy('{count} need individual review or learner confirmation; their stage was not changed.', {
            count: reviewCount
          })}</p>}
            {result.promoted.length > 0 && <p className="mt-1 text-xs text-[#5f6368]">{copy("Promoted learners can postpone or undo this on their own Home.")}</p>}
          </div>}
        {error && <p role="alert" lang="en" className="text-sm text-[#b3261e]">{error}</p>}
      </form>
    </details>;
}
