import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { proposeClassPromotion } from '@/services/stageTransitionService';

// Part W's canonical case: the teacher records the class promotion (for example 7 to 8)
// for every actively enrolled learner. Each learner keeps notice, Postpone and Undo on
// their own Home — the teacher never silently rewrites private learning.
export default function ClassPromotion({ classId, accent }) {
  const { user, activeWorkspace } = useAuth();
  const [level, setLevel] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (!user || !activeWorkspace) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const summary = proposeClassPromotion(
        { personId: user.id, workspaceId: activeWorkspace.id, role: activeWorkspace.role },
        classId, level, reason,
      );
      setResult(summary);
      setLevel(''); setReason('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="rounded-2xl border border-[#dadce0] bg-white p-5">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#121317]">
        <GraduationCap className="h-4 w-4" style={{ color: accent }} /> Record class promotion
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Moving to class
            <input value={level} onChange={e => setLevel(e.target.value)} maxLength={2} placeholder="8" aria-label="Next class level" className="mt-1 block w-24 rounded-xl border border-[#dadce0] p-2.5 text-sm" />
          </label>
          <label className="min-w-0 flex-1 text-sm">Reason (shared with learners)
            <input value={reason} onChange={e => setReason(e.target.value)} maxLength={120} placeholder="End of year promotion" aria-label="Promotion reason" className="mt-1 block w-full rounded-xl border border-[#dadce0] p-2.5 text-sm" />
          </label>
          <button type="submit" disabled={busy || !level.trim()} className="h-10 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: accent }}>
            {busy ? 'Recording…' : 'Record promotion'}
          </button>
        </div>
        {result && (
          <div role="status" className="rounded-xl bg-[#e8f0fd] p-4 text-sm">
            <p className="font-medium text-[#121317]">{result.promoted.length} learner{result.promoted.length === 1 ? '' : 's'} moved to class {result.nextClassLevel}.</p>
            {result.skipped.length > 0 && <p className="mt-1 text-[#5f6368]">{result.skipped.length} already in class {result.nextClassLevel}.</p>}
            <p className="mt-1 text-xs text-[#5f6368]">Each learner can postpone or undo this on their own Home.</p>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}
      </form>
    </details>
  );
}
