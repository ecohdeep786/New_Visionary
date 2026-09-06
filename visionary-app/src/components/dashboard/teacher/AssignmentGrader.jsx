import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * AssignmentGrader — the teacher's review surface.
 * Lists every student submission for an assignment, lets the teacher enter a
 * grade + private feedback, and "Return" it. Returning flips status → graded,
 * which the student's app then silently folds into their mastery map.
 */
export default function AssignmentGrader({ assignment, accent, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const list = await base44.entities.Submission.filter({ assignment_id: assignment.id });
      setSubmissions(list || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [assignment.id]);

  const updateField = (id, field, value) =>
    setSubmissions((p) => p.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const returnSub = async (s) => {
    setBusyId(s.id);
    try {
      await base44.entities.Submission.update(s.id, {
        status: "graded",
        grade: Number(s.grade) || 0,
        feedback: s.feedback || "",
      });
      setSubmissions((p) => p.map((x) => (x.id === s.id ? { ...x, status: "graded" } : x)));
    } catch {}
    setBusyId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-[640px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-[#dadce0]/60">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#202124] truncate">{assignment.title}</p>
            <p className="text-xs text-[#5f6368] mt-0.5">Review & return submissions</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-[#5f6368]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-[#5f6368] max-w-sm">No submissions yet. They'll appear here as students turn in their work.</p>
            </div>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl border border-[#dadce0]/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-[#f1f3f4] text-[#3c4043] shrink-0">
                    {(s.student_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#202124] truncate">{s.student_name || s.student_email}</p>
                    <p className="text-xs text-[#5f6368] truncate">{s.student_email}</p>
                  </div>
                  {s.status === "graded" && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333]">Returned</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-[#f8f9fa] text-sm text-[#3c4043] whitespace-pre-wrap leading-relaxed">
                  {s.text || "No submission text"}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={assignment.points || 100}
                      value={s.grade ?? ""}
                      onChange={(e) => updateField(s.id, "grade", e.target.value)}
                      placeholder="Grade"
                      className="w-20 h-10 px-3 rounded-xl border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8]"
                    />
                    <span className="text-xs text-[#5f6368]">/ {assignment.points || 100}</span>
                  </div>
                  <input
                    value={s.feedback || ""}
                    onChange={(e) => updateField(s.id, "feedback", e.target.value)}
                    placeholder="Private feedback (optional)"
                    className="flex-1 h-10 px-3 rounded-xl border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8]"
                  />
                  <button
                    onClick={() => returnSub(s)}
                    disabled={busyId === s.id}
                    className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium text-white disabled:opacity-50 shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    <Check className="w-4 h-4" /> Return
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}