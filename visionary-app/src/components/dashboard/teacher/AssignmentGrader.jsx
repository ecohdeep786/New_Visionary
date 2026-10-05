import { classTabCopy } from '@/lib/classTabCopy';
import { useState, useEffect } from "react";
import { classworkReviewRevision } from "@/lib/classworkRubric";
import { downloadText } from "@/lib/downloadText";
import CriterionFeedback from "@/components/dashboard/CriterionFeedback";
import { Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { reviewClasswork } from "@/services/classroomService";
import { getReviewDraft, saveReviewDraft, clearReviewDraft } from "@/services/reviewDraftService";
import { workspaceIdentity } from "@/services/workspaceService";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * AssignmentGrader — the teacher's review surface.
 * Lists every student submission for an assignment, lets the teacher enter a
 * grade and feedback, return it, or request a revised response.
 */
export default function AssignmentGrader({
  assignment,
  accent,
  onClose
}) {
  const {
    ctx,
    data
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = classTabCopy(locale);
  const [submissions, setSubmissions] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setSubmissions([]);
    setError('');
    setExportError('');
    setLoadFailed(false);
    (async () => {
      try {
        const list = await base44.entities.Submission.filter({
          assignment_id: assignment.id
        });
        const withDrafts = (list || []).map(item => {
          const reviewRevision = classworkReviewRevision(item);
          if (item.status !== 'submitted') return {
            ...item,
            _reviewRevision: reviewRevision
          };
          const draft = getReviewDraft(ctx, assignment.id, item.id, item.attempt || 1);
          return draft ? {
            ...item,
            _reviewRevision: draft.reviewRevision || reviewRevision,
            grade: draft.grade,
            feedback: draft.feedback,
            criterion_feedback: draft.criterionFeedback || item.criterion_feedback || {}
          } : {
            ...item,
            _reviewRevision: reviewRevision
          };
        });
        if (active) setSubmissions(withDrafts);
      } catch (failure) {
        if (active) {
          setLoadFailed(true);
          setError(failure.message || "Submissions could not be loaded. Close this dialog and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [assignment.id, ctx.workspaceId, reload]);
  const updateField = (submission, field, value) => {
    const next = {
      ...submission,
      [field]: value
    };
    setSubmissions(p => p.map(s => s.id === submission.id ? next : s));
    try {
      saveReviewDraft(ctx, assignment.id, submission.id, submission.attempt || 1, String(next.grade ?? ''), next.feedback || '', next.criterion_feedback || {}, next._reviewRevision);
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  };
  const returnSub = async (s, status = 'graded') => {
    const grade = Number(s.grade);
    if (status === 'graded' && (s.grade === "" || s.grade == null || !Number.isFinite(grade) || grade < 0 || grade > (assignment.points || 100))) {
      setError("Enter a grade between 0 and " + (assignment.points || 100) + ".");
      return;
    }
    if (busyId) return;
    setError("");
    setBusyId(s.id);
    try {
      const saved = await reviewClasswork(ctx, {
        submissionId: s.id,
        attempt: s.attempt || 1,
        status,
        grade,
        feedback: s.feedback || '',
        criterionFeedback: s.criterion_feedback || {},
        expectedReviewRevision: s._reviewRevision
      });
      setSubmissions(p => p.map(x => x.id === s.id ? {
        ...saved,
        _reviewRevision: classworkReviewRevision(saved)
      } : x));
      try {
        clearReviewDraft(ctx, assignment.id, s.id);
      } catch (failure) {
        setError(failure.message);
      }
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch (failure) {
      setError(failure.message || "Feedback was not returned. Your edits are still here; please retry.");
    }
    setBusyId(null);
  };
  const exportCurrentReview = () => {
    try {
      workspaceIdentity(ctx);
      downloadText('visionary-current-review-edits.json', JSON.stringify(submissions.map(s => ({
        id: s.id,
        attempt: s.attempt,
        grade: s.grade,
        feedback: s.feedback,
        criterionFeedback: s.criterion_feedback
      })), null, 2));
      setExportError('');
    } catch (failure) {
      setExportError(failure.message);
    }
  };
  return <Dialog open onOpenChange={open => {
    if (!open && !busyId) onClose();
  }}>
      <DialogContent lang={locale} className="max-h-[85dvh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl bg-white p-0 sm:max-w-[640px]">
        <div className="flex items-center justify-between p-6 border-b border-[#dadce0]/60">
          <div className="min-w-0">
            <DialogTitle className="pr-8 text-sm font-medium text-[#121317]">{assignment.title}</DialogTitle>
            <DialogDescription className="text-xs text-[#5f6368] mt-0.5">{copy("Review and return submissions. Grades must be within the assignment\u2019s point range. Edits are kept on this device until returned.")}</DialogDescription>
            {assignment.source_version && <p className="mt-2 break-all text-xs text-[#5f6368]">{copy("Saved lesson version:")}{assignment.source_version}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && <div role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]"><p lang="en">{error}</p>{exportError && <p lang="en" className="mt-2">{exportError}</p>}<button disabled={!!busyId} className="v-button mt-3" onClick={exportCurrentReview}>{copy("Export current review edits")}</button><button disabled={!!busyId} className="v-button mt-3" onClick={async () => {
            try {
              for (const s of submissions) clearReviewDraft(ctx, assignment.id, s.id);
              setReload(value => value + 1);
            } catch (failure) {
              setError(failure.message);
            }
          }}>{copy("Discard edits and load latest reviews")}</button></div>}
          {loading ? <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-[#dadce0] rounded-full animate-spin" style={{
            borderTopColor: accent
          }} />
            </div> : loadFailed ? <p role="alert" className="text-sm text-[#b3261e]">{copy('Submissions unavailable. Saved work has not been replaced.')} <button className="min-h-11 underline" onClick={() => setReload(value => value + 1)}>{copy('Retry')}</button></p> : submissions.length === 0 ? <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-[#5f6368] max-w-sm">{copy("No submissions yet. They'll appear here as students turn in their work.")}</p>
            </div> : submissions.map(s => <div key={s.id} className="p-5 rounded-2xl border border-[#dadce0]/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-[#dadce0] text-[#5f6368] shrink-0">
                    {(s.student_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#121317] truncate">{s.student_name || s.student_email}</p>
                    <p className="text-xs text-[#5f6368] truncate">{s.student_email}</p>
                  </div>
                  {s.status === "graded" && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333]">{copy("Returned")}</span>}
                </div>
                <p className="text-xs text-[#5f6368]">{copy('Attempt {number}', {
              number: s.attempt || 1
            })}{s.status === 'revision_requested' ? copy(" \xB7 Revision requested") : ''}</p>
                <div className="p-3 rounded-xl bg-[#ffffff] text-sm text-[#5f6368] break-words whitespace-pre-wrap leading-relaxed">
                  {s.text || copy("No submission text")}
                </div>
                {!!s.revision_history?.length && <details className="text-sm text-[#5f6368]"><summary className="cursor-pointer">{copy('Previous attempts and feedback ({count})', {
                count: s.revision_history.length
              })}</summary>{s.revision_history.map((entry, index) => <div key={index} className="mt-3 border-l-2 border-[#dadce0] pl-3"><p className="font-medium">{copy('Attempt {number}', {
                  number: entry.attempt
                })}</p><p className="whitespace-pre-wrap">{entry.text}</p><p className="mt-2 whitespace-pre-wrap">{copy("Feedback:")}{entry.feedback}</p><CriterionFeedback criteria={assignment.objective_snapshot?.criteria} feedback={entry.criterion_feedback} /></div>)}</details>}
                <div className="flex flex-wrap items-center gap-3">
                  {!!assignment.objective_snapshot?.criteria?.length && <section className="w-full"><h3 className="text-sm font-medium">{copy("Review the assigned criteria")}</h3><p className="mt-2 text-xs text-[#5f6368]">{copy("Returning a grade requires a rating and note for each criterion. Revision requests may address selected criteria.")}</p>{assignment.objective_snapshot.criteria.map(item => <div className="mt-4" key={item.id}><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-[#5f6368]">{item.prompt}</p><select className="v-field mt-2" aria-label={copy("Criterion rating: {criterion} for {name}", {
                  criterion: item.label,
                  name: s.student_name || s.student_email
                })} value={s.criterion_feedback?.[item.id]?.rating || ''} disabled={!!busyId} onChange={event => updateField(s, 'criterion_feedback', {
                  ...s.criterion_feedback,
                  [item.id]: {
                    rating: event.target.value,
                    note: s.criterion_feedback?.[item.id]?.note || ''
                  }
                })}><option value="">{copy("Choose a rating")}</option><option value="met">{copy("Met")}</option><option value="needs-work">{copy("Needs work")}</option><option value="not-assessed">{copy("Not assessed")}</option></select><textarea className="v-field mt-2" aria-label={copy("Criterion note: {criterion} for {name}", {
                  criterion: item.label,
                  name: s.student_name || s.student_email
                })} maxLength={2000} value={s.criterion_feedback?.[item.id]?.note || ''} disabled={!!busyId} onChange={event => updateField(s, 'criterion_feedback', {
                  ...s.criterion_feedback,
                  [item.id]: {
                    rating: s.criterion_feedback?.[item.id]?.rating || '',
                    note: event.target.value
                  }
                })} /></div>)}</section>}
                  <div className="flex items-center gap-2">
                    <input type="number" disabled={!!busyId} aria-label={copy("Grade for {name}", {
                name: s.student_name || s.student_email
              })} min="0" max={assignment.points || 100} value={s.grade ?? ""} onChange={e => updateField(s, "grade", e.target.value)} placeholder={copy("Grade")} className="w-20 h-11 px-3 rounded-xl border border-[#dadce0] text-sm outline-none focus:border-[#4285F4]" />
                    <span className="text-xs text-[#5f6368]">/ {assignment.points || 100}</span>
                  </div>
                  <input aria-label={copy("Feedback for {name}", {
              name: s.student_name || s.student_email
            })} maxLength={5000} disabled={!!busyId} value={s.feedback || ""} onChange={e => updateField(s, "feedback", e.target.value)} placeholder={copy("Feedback (required for revision)")} className="min-w-0 flex-1 h-11 px-3 rounded-xl border border-[#dadce0] text-sm outline-none focus:border-[#4285F4]" />
                  <button onClick={() => returnSub(s)} disabled={!!busyId} className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-full text-sm font-medium text-white disabled:opacity-50 shrink-0" style={{
              backgroundColor: accent
            }}>
                    <Check className="w-4 h-4" />{copy("Return")}</button>
                  <button onClick={() => returnSub(s, 'revision_requested')} disabled={!!busyId} className="h-11 rounded-full border border-[#dadce0] px-4 text-sm font-medium disabled:opacity-50">{copy("Request revision")}</button>
                </div>
              </div>)}
        </div>
      </DialogContent>
    </Dialog>;
}
