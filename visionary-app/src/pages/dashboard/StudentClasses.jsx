import { useState, useEffect } from "react";
import { ChevronRight, Send, CheckCircle2, Clock, GraduationCap, ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * Student-facing Classes page — the other half of the teacher–student connection.
 * Shows classes the student is enrolled in, lets them submit work to assignments,
 * and reveals grades + feedback as the teacher returns them. Graded work is
 * silently folded into the student's mastery map (see useStudentData).
 */
export default function StudentClasses() {
  const { user } = useAuth();
  const themeColor = useThemeColor();
  const accent = themeColor.accent;
  const email = user?.email;
  const studentName = user?.full_name || (email || "").split("@")[0] || "Learner";

  const [enrollments, setEnrollments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openClassId, setOpenClassId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      try {
        const [enr, allClasses, allAssignments, mySubs] = await Promise.all([
          base44.entities.Enrollment.filter({ student_email: email }),
          base44.entities.Classroom.list(),
          base44.entities.Assignment.list(),
          base44.entities.Submission.list(),
        ]);
        const classIds = new Set((enr || []).map((e) => e.class_id));
        setEnrollments(enr || []);
        setClasses((allClasses || []).filter((c) => classIds.has(c.id)));
        setAssignments((allAssignments || []).filter((a) => classIds.has(a.class_id)));
        setSubmissions(mySubs || []);
      } catch {}
      setLoading(false);
    })();
  }, [email]);

  const mySubFor = (assignmentId) => (submissions || []).find((s) => s.assignment_id === assignmentId);

  const submit = async (a) => {
    const text = (drafts[a.id] || "").trim();
    if (!text) return;
    setBusy(true);
    try {
      const created = await base44.entities.Submission.create({
        assignment_id: a.id,
        class_id: a.class_id,
        teacher_id: a.created_by_id,
        student_id: user.id,
        student_name: studentName,
        student_email: email,
        text,
        status: "submitted",
        submitted_date: new Date().toISOString().split("T")[0],
      });
      setSubmissions((p) => [created, ...p]);
      setDrafts((p) => ({ ...p, [a.id]: "" }));
    } catch {}
    setBusy(false);
  };

  const openClass = classes.find((c) => c.id === openClassId);
  const classAssignments = (assignments || []).filter((a) => a.class_id === openClassId).sort((x, y) => (y.created_date || "").localeCompare(x.created_date || ""));

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <div>
        <h1 className="text-[28px] font-medium text-[#202124] tracking-tight">Your classes</h1>
        <p className="text-sm text-[#5f6368] mt-1">Work your teachers have assigned you, all in one place</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
            <GraduationCap className="w-8 h-8" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-[#202124] mb-2">No classes yet</h3>
            <p className="text-sm text-[#5f6368] max-w-sm leading-relaxed">
              When a teacher invites you to a class, it'll show up here. Ask your teacher for an invite using {email}.
            </p>
          </div>
        </div>
      ) : openClass ? (
        <div className="flex flex-col gap-6">
          <button onClick={() => setOpenClassId(null)} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#202124] self-start">
            <ChevronRight className="w-4 h-4 rotate-180" /> All classes
          </button>

          <div className="rounded-3xl overflow-hidden">
            <div className="p-8" style={{ backgroundColor: openClass.color || accent }}>
              <h2 className="text-[24px] font-medium text-white tracking-tight">{openClass.name}</h2>
              {openClass.section && <p className="text-white/85 text-sm mt-1">{openClass.section}</p>}
              {openClass.subject && <p className="text-white/70 text-sm mt-0.5">{openClass.subject}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {classAssignments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <ClipboardList className="w-10 h-10 text-[#dadce0]" />
                <p className="text-sm text-[#5f6368] max-w-sm">No assignments in this class yet. Check back soon.</p>
              </div>
            ) : (
              classAssignments.map((a) => {
                const sub = mySubFor(a.id);
                const graded = sub && sub.status === "graded";
                const submitted = sub && sub.status === "submitted";
                return (
                  <div key={a.id} className="p-6 bg-white rounded-3xl border border-[#dadce0]/60 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                        <ClipboardList className="w-5 h-5" style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#202124]">{a.title}</p>
                        <p className="text-xs text-[#5f6368] mt-0.5">
                          {a.points || 100} points{a.due_date ? ` · Due ${a.due_date}` : ""}
                        </p>
                        {a.description && <p className="text-sm text-[#3c4043] mt-3 leading-relaxed">{a.description}</p>}
                        {a.topics && a.topics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {a.topics.map((t) => (
                              <span key={t} className="inline-flex items-center h-7 px-3 rounded-full text-xs font-medium bg-[#f1f3f4] text-[#3c4043]">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {graded && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {sub.grade}/{a.points || 100}
                        </span>
                      )}
                      {submitted && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#fef7e0] text-[#b06000] shrink-0">
                          <Clock className="w-3.5 h-3.5" /> Submitted
                        </span>
                      )}
                    </div>

                    {graded ? (
                      <div className="pl-14 flex flex-col gap-2">
                        {sub.feedback && (
                          <div className="p-4 rounded-2xl bg-[#f8f9fa]">
                            <p className="text-xs font-medium text-[#5f6368] mb-1">Teacher feedback</p>
                            <p className="text-sm text-[#3c4043] leading-relaxed">{sub.feedback}</p>
                          </div>
                        )}
                        <p className="text-xs text-[#5f6368]">This work has been added to your mastery map.</p>
                      </div>
                    ) : submitted ? (
                      <div className="pl-14">
                        <div className="p-4 rounded-2xl bg-[#f8f9fa] text-sm text-[#3c4043] whitespace-pre-wrap leading-relaxed">{sub.text}</div>
                        <p className="text-xs text-[#5f6368] mt-2">Submitted — waiting for your teacher to review.</p>
                      </div>
                    ) : (
                      <div className="pl-14 flex flex-col gap-2">
                        <textarea
                          value={drafts[a.id] || ""}
                          onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: e.target.value }))}
                          placeholder="Write your response…"
                          rows={3}
                          className="w-full p-4 rounded-2xl border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8] resize-none leading-relaxed"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => submit(a)}
                            disabled={busy || !(drafts[a.id] || "").trim()}
                            className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium text-white disabled:opacity-50"
                            style={{ backgroundColor: accent }}
                          >
                            <Send className="w-4 h-4" /> Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => {
            const count = (assignments || []).filter((a) => a.class_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setOpenClassId(c.id)}
                className="text-left flex flex-col bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6" style={{ backgroundColor: c.color || accent }}>
                  <h3 className="text-[18px] font-medium text-white tracking-tight">{c.name}</h3>
                  {c.section && <p className="text-white/85 text-sm mt-0.5">{c.section}</p>}
                  {c.subject && <p className="text-white/70 text-sm mt-0.5">{c.subject}</p>}
                </div>
                <div className="flex items-center justify-between px-6 py-5">
                  <span className="text-sm text-[#5f6368]">{count} assignment{count !== 1 ? "s" : ""}</span>
                  <ChevronRight className="w-5 h-5 text-[#5f6368]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}