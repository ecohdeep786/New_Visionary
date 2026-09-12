import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, Send, CheckCircle2, Clock, GraduationCap, ClipboardList, KeyRound, Link2, Megaphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState("");
  const [joining, setJoining] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [classTab, setClassTab] = useState("classwork");

  useEffect(() => {
    if (searchParams.get("join") === "1") setShowJoin(true);
  }, [searchParams]);

  const load = useCallback(async () => {
      if (!email) {
        setLoading(false);
        return;
      }
      setError("");
      try {
        const [enr, allClasses, allAssignments, mySubs, allAnnouncements] = await Promise.all([
          base44.entities.Enrollment.filter({ student_email: email }),
          base44.entities.Classroom.list(),
          base44.entities.Assignment.list(),
          base44.entities.Submission.filter({ student_email: email }),
          base44.entities.Announcement.list(),
        ]);
        const classIds = new Set((enr || []).map((e) => e.class_id));
        setEnrollments(enr || []);
        setClasses((allClasses || []).filter((c) => classIds.has(c.id)));
        setAssignments((allAssignments || []).filter((a) => classIds.has(a.class_id)));
        setSubmissions(mySubs || []);
        setAnnouncements((allAnnouncements || []).filter((a) => classIds.has(a.class_id)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      } catch { setError("We couldn’t load your classes. Please try again."); }
      setLoading(false);
  }, [email]);
  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    return () => window.removeEventListener("visionary:workspace-change", load);
  }, [load]);

  const mySubFor = (assignmentId) => (submissions || []).find((s) => s.assignment_id === assignmentId);

  const submit = async (a) => {
    const text = (drafts[a.id] || "").trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    try {
      const previous = await base44.entities.Submission.filter({ assignment_id: a.id, student_email: email });
      if (previous.length) { await load(); return; }
      const created = await base44.entities.Submission.create({
        assignment_id: a.id,
        class_id: a.class_id,
        teacher_id: a.teacher_id || a.created_by_id,
        teacher_email: a.teacher_email,
        student_id: user.id,
        student_name: studentName,
        student_email: email,
        text,
        status: "submitted",
        submitted_date: new Date().toISOString().split("T")[0],
      });
      setSubmissions((p) => [created, ...p]);
      setDrafts((p) => ({ ...p, [a.id]: "" }));
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch { setError("Your response wasn’t submitted. Your draft is still here; please try again."); }
    finally { setBusy(false); }
  };

  const closeJoin = () => {
    if (joining) return;
    setShowJoin(false);
    if (searchParams.has("join")) { const next = new URLSearchParams(searchParams); next.delete("join"); setSearchParams(next, { replace: true }); }
  };

  const connectClass = async (classroom) => {
    const existing = await base44.entities.Enrollment.filter({ student_email: email, class_id: classroom.id });
    const active = existing.find((e) => e.status === "active");
    if (!active) {
      const details = { student_name: studentName, student_id: user.id, status: "active" };
      if (existing.length) await base44.entities.Enrollment.update(existing[0].id, details);
      else await base44.entities.Enrollment.create({ class_id: classroom.id, student_email: email, ...details });
      const enrolled = await base44.entities.Enrollment.filter({ class_id: classroom.id });
      await base44.entities.Classroom.update(classroom.id, { student_count: new Set(enrolled.filter((e) => e.status === "active").map((e) => e.student_email)).size });
    }
    await load();
    setOpenClassId(classroom.id);
    window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
  };

  const acceptInvitation = async (classroom) => {
    if (joining) return;
    setJoining(true);
    try { await connectClass(classroom); }
    catch { setError("We couldn’t accept this invitation. Please try again."); }
    finally { setJoining(false); }
  };

  const joinClass = async (event) => {
    event.preventDefault();
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode || joining || !email) return;
    setJoining(true);
    setJoinStatus("");
    try {
      const allClasses = await base44.entities.Classroom.list();
      const classroom = (allClasses || []).find((item) => item.join_code?.toUpperCase() === normalizedCode);
      if (!classroom) {
        setJoinStatus("We couldn’t find a class with that code. Check the code with your teacher and try again.");
        return;
      }
      await connectClass(classroom);
      setShowJoin(false);
      if (searchParams.has("join")) { const next = new URLSearchParams(searchParams); next.delete("join"); setSearchParams(next, { replace: true }); }
      setJoinCode("");
      setOpenClassId(classroom.id);
    } catch {
      setJoinStatus("We couldn’t join this class right now. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const openClass = classes.find((c) => c.id === openClassId);
  const activeClassIds = new Set(enrollments.filter((e) => e.status === "active").map((e) => e.class_id));
  const connectedClasses = classes.filter((c) => activeClassIds.has(c.id));
  const invitations = classes.filter((c) => !activeClassIds.has(c.id) && enrollments.some((e) => e.class_id === c.id && e.status === "invited"));
  const classAssignments = (assignments || []).filter((a) => a.class_id === openClassId).sort((x, y) => (y.created_date || "").localeCompare(x.created_date || ""));

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-medium text-[#202124] tracking-tight">Your classes</h1>
          <p className="text-sm text-[#5f6368] mt-1">Assignments, feedback, and class updates in one place</p>
        </div>
        <button onClick={() => { setJoinStatus(""); setShowJoin(true); }} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border border-[#dadce0] bg-white px-5 text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fafd] sm:self-auto">
          <Link2 className="h-4 w-4" /> Join class
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]">{error} <button onClick={load} className="ml-2 font-medium underline">Retry</button></p>}
      {invitations.length > 0 && <section aria-label="Class invitations" className="rounded-2xl border border-[#d3e3fd] bg-[#f8fafd] p-5"><h2 className="font-medium text-[#202124]">Class invitations</h2><div className="mt-3 space-y-3">{invitations.map((c) => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-[#202124]">{c.name}</p><p className="text-xs text-[#5f6368]">{c.teacher_name || "Your teacher"} invited you to join</p></div><button disabled={joining} onClick={() => acceptInvitation(c)} className="h-10 rounded-full bg-[#1a73e8] px-5 text-sm font-medium text-white disabled:opacity-50">Accept class</button></div>)}</div></section>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
        </div>
      ) : connectedClasses.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
            <GraduationCap className="w-8 h-8" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-[#202124] mb-2">No classes yet</h3>
            <p className="text-sm text-[#5f6368] max-w-sm leading-relaxed">
              Join with a class code from your teacher. When you connect, assignments and feedback will appear here.
            </p>
          </div>
          <button onClick={() => { setJoinStatus(""); setShowJoin(true); }} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white" style={{ backgroundColor: accent }}><KeyRound className="h-4 w-4" /> Join with a code</button>
        </div>
      ) : openClass && activeClassIds.has(openClass.id) ? (
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

          <div className="flex gap-2 border-b border-[#dadce0]" aria-label="Class sections">{[["classwork", "Classwork"], ["stream", "Updates"]].map(([id, label]) => <button key={id} onClick={() => setClassTab(id)} aria-pressed={classTab === id} className={`h-11 border-b-2 px-5 text-sm font-medium ${classTab === id ? "border-[#1a73e8] text-[#1a73e8]" : "border-transparent text-[#5f6368]"}`}>{label}</button>)}</div>
          {classTab === "stream" && <div className="space-y-4">{announcements.filter((a) => a.class_id === openClassId).length === 0 ? <div className="py-12 text-center"><Megaphone className="mx-auto mb-3 h-9 w-9 text-[#9aa0a6]" /><p className="text-sm text-[#5f6368]">Class updates from your teacher will appear here.</p></div> : announcements.filter((a) => a.class_id === openClassId).map((a) => <article key={a.id} className="rounded-2xl border border-[#dadce0] p-6"><p className="text-sm font-medium text-[#202124]">{a.author_name || openClass.teacher_name || "Teacher"}</p><p className="mt-1 text-xs text-[#5f6368]">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Class update"}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#3c4043]">{a.text}</p></article>)}</div>}

          {classTab === "classwork" && <div className="flex flex-col gap-4">
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
                        <p className="text-xs text-[#5f6368]">Returned by your teacher.</p>
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
                          aria-label={`Your response to ${a.title}`}
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
          </div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedClasses.map((c) => {
            const count = (assignments || []).filter((a) => a.class_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setOpenClassId(c.id)}
                className="text-left flex flex-col bg-white rounded-2xl border border-[#dadce0] overflow-hidden hover:shadow-md transition-all"
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
      <Dialog open={showJoin} onOpenChange={(open) => { if (!open) closeJoin(); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-7 sm:rounded-3xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}15` }}><KeyRound className="h-5 w-5" style={{ color: accent }} /></div>
          <DialogTitle className="text-xl font-medium text-[#202124]">Join a class</DialogTitle>
          <DialogDescription>Ask your teacher for their class code, then enter it below.</DialogDescription>
          <form onSubmit={joinClass}>
            <label className="mt-6 block text-sm font-medium text-[#202124]">Class code<input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="e.g. VISION-AB12" autoFocus className="mt-2 h-12 w-full rounded-lg border border-[#747775] px-3 font-mono text-sm tracking-wide outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]" /></label>
            {joinStatus && <p className="mt-3 text-sm text-[#b3261e]" role="alert">{joinStatus}</p>}
            <div className="mt-7 flex justify-end gap-3"><button type="button" disabled={joining} onClick={closeJoin} className="h-10 rounded-full px-4 text-sm font-medium text-[#1a73e8] hover:bg-[#f8fafd]">Cancel</button><button type="submit" disabled={joining || !joinCode.trim()} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: accent }}><Link2 className="h-4 w-4" />{joining ? "Joining…" : "Join class"}</button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
