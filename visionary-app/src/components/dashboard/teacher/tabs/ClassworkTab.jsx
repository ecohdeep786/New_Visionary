import { useState, useEffect, useCallback } from "react";
import { Plus, ClipboardList, X, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AssignmentGrader from "@/components/dashboard/teacher/AssignmentGrader";
import { useAuth } from "@/lib/AuthContext";

export default function ClassworkTab({ classId, classroom, accent }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", points: 100 });
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState("");
  const [grading, setGrading] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [list, subs] = await Promise.all([
        base44.entities.Assignment.filter({ class_id: classId }),
        base44.entities.Submission.filter({ class_id: classId }),
      ]);
      setAssignments((list || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setSubmissions(subs || []);
    } catch { setError("We couldn’t load classwork. Please try again."); }
    setLoading(false);
  }, [classId]);
  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    return () => window.removeEventListener("visionary:workspace-change", load);
  }, [load]);

  const subsFor = (assignmentId) => (submissions || []).filter((s) => s.assignment_id === assignmentId);
  const ungradedFor = (assignmentId) => subsFor(assignmentId).filter((s) => s.status !== "graded").length;

  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) setTopics([...topics, t]);
    setTopicInput("");
  };
  const removeTopic = (t) => setTopics((p) => p.filter((x) => x !== t));

  const create = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || busy) return;
    const points = Number(form.points);
    if (!Number.isFinite(points) || points <= 0 || points > 10000) { setError("Choose a point total between 1 and 10,000."); return; }
    setBusy(true);
    setError("");
    try {
      const created = await base44.entities.Assignment.create({
        class_id: classId,
        teacher_id: user?.id,
        teacher_email: user?.email,
        title: form.title.trim(),
        description: form.description,
        due_date: form.due_date || undefined,
        points,
        subject: classroom?.subject || "",
        topics: topicInput.trim() && !topics.includes(topicInput.trim()) ? [...topics, topicInput.trim()] : topics,
      });
      setAssignments((p) => [created, ...p]);
      setForm({ title: "", description: "", due_date: "", points: 100 });
      setTopics([]);
      setTopicInput("");
      setShowForm(false);
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch { setError("Your assignment wasn’t saved. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5f6368]">Create assignments and return feedback to your students.</p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-4 h-4" /> Create assignment
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}

      {showForm && (
        <form onSubmit={create} className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dadce0]">
          <h3 className="text-base font-medium text-[#202124]">New assignment</h3>
          <label htmlFor="assignment-title" className="text-sm font-medium text-[#202124]">Title</label>
          <input
            id="assignment-title"
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Assignment title"
            className="w-full h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8]"
          />
          <textarea
            aria-label="Assignment instructions"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Instructions (optional)"
            rows={3}
            className="w-full p-4 rounded-xl border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8] resize-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignment-due" className="block text-xs text-[#5f6368] mb-1.5">Due date (optional)</label>
              <input
                id="assignment-due"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8]"
              />
            </div>
            <div>
              <label htmlFor="assignment-points" className="block text-xs text-[#5f6368] mb-1.5">Points</label>
              <input
                id="assignment-points"
                type="number"
                min="1"
                max="10000"
                required
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assignment-concept" className="block text-xs text-[#5f6368] mb-1.5">Concepts (optional)</label>
            <div className="flex gap-2">
              <input
                id="assignment-concept"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTopic();
                  }
                }}
                placeholder="e.g. Quadratic equations"
                className="flex-1 h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8]"
              />
              <button type="button" onClick={addTopic} disabled={!topicInput.trim()} className="h-11 px-4 rounded-xl border border-[#dadce0] text-sm font-medium text-[#3c4043] hover:bg-gray-50 disabled:opacity-40">
                Add
              </button>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${accent}15`, color: accent }}
                  >
                    {t}
                    <button type="button" aria-label={`Remove ${t}`} onClick={() => removeTopic(t)} className="w-5 h-5 rounded-full hover:bg-white/60 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" disabled={busy} onClick={() => setShowForm(false)} className="h-10 px-5 rounded-full text-sm font-medium text-[#5f6368] hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.title.trim()}
              className="h-10 px-5 rounded-full text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {busy ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="w-10 h-10 text-[#dadce0]" />
          <p className="text-sm text-[#5f6368] max-w-sm">No assignments yet. Create your first one and tag the concepts it covers.</p>
        </div>
      ) : (
        assignments.map((a) => {
          const subs = subsFor(a.id);
          const ungraded = ungradedFor(a.id);
          return (
            <div key={a.id} className="p-5 bg-white rounded-3xl border border-[#dadce0]/60">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                  <ClipboardList className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#202124]">{a.title}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">
                    {a.points || 100} points{a.due_date ? ` · Due ${a.due_date}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setGrading(a)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-medium border border-[#dadce0] text-[#3c4043] hover:bg-gray-50 shrink-0"
                >
                  <Inbox className="w-4 h-4" style={{ color: ungraded ? "#ea4335" : "#5f6368" }} />
                  {subs.length > 0 ? `Review (${subs.length}${ungraded ? ` · ${ungraded} new` : ""})` : "Review"}
                </button>
              </div>
              {a.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#5f6368]">{a.description}</p>}
              {a.topics && a.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pl-14">
                  {a.topics.map((t) => (
                    <span key={t} className="inline-flex items-center h-7 px-3 rounded-full text-xs font-medium bg-[#f1f3f4] text-[#3c4043]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {grading && <AssignmentGrader assignment={grading} accent={accent} onClose={() => setGrading(null)} />}
    </div>
  );
}
