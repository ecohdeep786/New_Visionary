import { classColors } from '@/lib/classColors';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import AssignedCurriculumOutline from '@/components/dashboard/AssignedCurriculumOutline';
import ClassCurriculum from '@/components/dashboard/ClassCurriculum';
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, Send, CheckCircle2, Clock, GraduationCap, ClipboardList, KeyRound, Link2, Megaphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { submitClassworkResponses, classworkResponseText } from "@/services/classroomService";
import { classworkActivityRevision } from '@/lib/classworkSource';
import CommunityTab from "@/components/dashboard/CommunityTab";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { downloadText } from '@/lib/downloadText';
import ClassworkProjectSubmission from '@/components/dashboard/ClassworkProjectSubmission';
import { readClassworkDrafts, saveClassworkDraft, classworkDraftRevision } from '@/services/classworkDraftService';
import CriterionFeedback from '@/components/dashboard/CriterionFeedback';

/**
 * Student-facing Classes page — the other half of the teacher–student connection.
 * Shows classes the student is enrolled in, lets them submit work to assignments,
 * and reveals grades + feedback as the teacher returns them. Graded work is
 * retained as classwork records; a grade does not establish concept mastery here.
 */

function assertClassView(classes,assignments,submissions,announcements){
 const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const textFields=(row,keys)=>keys.every(key=>row[key]==null||typeof row[key]==='string');
 const valid=classes.every(c=>typeof c.id==='string'&&typeof c.name==='string'&&textFields(c,['section','subject','room','teacher_name']))
 && assignments.every(a=>typeof a.id==='string'&&typeof a.title==='string'&&textFields(a,['description','due_date'])&&(a.topics==null||Array.isArray(a.topics)&&a.topics.every(t=>typeof t==='string'))&&(a.checks==null||Array.isArray(a.checks)&&a.checks.every(c=>record(c)&&typeof c.id==='string'&&typeof c.prompt==='string'))&&(a.objective_snapshot?.criteria==null||Array.isArray(a.objective_snapshot.criteria)&&a.objective_snapshot.criteria.every(c=>record(c)&&typeof c.id==='string'&&typeof c.label==='string')))
 && submissions.every(s=>textFields(s,['text','feedback'])&&(s.revision_history==null||Array.isArray(s.revision_history)&&s.revision_history.every(h=>record(h)&&textFields(h,['text','feedback'])&&(h.attempt==null||Number.isInteger(h.attempt)&&h.attempt>0))))
 && announcements.every(a=>typeof a.text==='string'&&textFields(a,['author_name']));
 if(!valid)throw Error('Saved class records are incomplete. Original responses and drafts have not been changed.');
}

export default function StudentClasses() {
  const {
    data: copyWorkspace
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  const {
    user
  } = useAuth();
  const {
    ctx,
    data
  } = useWorkspace();
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
  const [draftError, setDraftError] = useState("");
  const [draftStorageReadable, setDraftStorageReadable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState("");
  const [joining, setJoining] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [classTab, setClassTab] = useState(() => searchParams.has('curriculum') ? 'outline' : 'classwork');
  const draftKey = user?.id ? `visionary_classwork_drafts_v1:${user.id}` : null;
  const draftBases = useRef({});
  useEffect(() => {
    setDraftStorageReadable(false);
    if (!draftKey || !ctx) {
      setDrafts({});
      setDraftError('');
      return;
    }
    try {
      const saved = readClassworkDrafts(ctx);
      draftBases.current = Object.fromEntries(Object.entries(saved).map(([id, row]) => [id, classworkDraftRevision(row)]));
      setDrafts(saved);
      setDraftStorageReadable(true);
      setDraftError('');
    } catch {
      setDrafts({});
      setDraftError('Saved classwork drafts could not be read. Keep this page open and export your current response. Older saved records will not be replaced.');
    }
  }, [draftKey, ctx?.workspaceId]);
  const updateDraft = (assignmentId, value) => {
    const next = {
      ...drafts,
      [assignmentId]: value
    };
    if (value === null) delete next[assignmentId];
    setDrafts(next);
    if (!draftStorageReadable) {
      setDraftError('Older classwork drafts remain unreadable and were not replaced. Your current edits stay on this page; export them before leaving.');
      return;
    }
    if (draftKey) try {
      saveClassworkDraft(ctx, assignmentId, value, draftBases.current[assignmentId] || 'null');
      draftBases.current[assignmentId] = classworkDraftRevision(value);
      setDraftError('');
    } catch (failure) {
      setDraftError(failure.message);
    }
  };
  useEffect(() => {
    if (searchParams.get("join") === "1") setShowJoin(true);
    if (searchParams.get("class")) setOpenClassId(searchParams.get("class"));
  }, [searchParams]);
  const load = useCallback(async (foreground = true) => {
    const sequence = ++loadSequence.current;
    if (foreground !== false) setLoading(true);
    setLoadError('');
    if (!email) {
      setLoading(false);
      return;
    }
    if (foreground !== false) setError("");
    try {
      const [enr, allClasses, allAssignments, mySubs, allAnnouncements] = await Promise.all([base44.entities.Enrollment.filter({
        student_email: email
      }), base44.entities.Classroom.list(), base44.entities.Assignment.list(), base44.entities.Submission.filter({
        student_email: email
      }), base44.entities.Announcement.list()]);
      if (sequence !== loadSequence.current) return;
      const classIds = new Set((enr || []).map(e => e.class_id));
      assertClassView(allClasses.filter(c=>classIds.has(c.id)),allAssignments.filter(a=>classIds.has(a.class_id)),mySubs,allAnnouncements.filter(a=>classIds.has(a.class_id)));
      setEnrollments(enr || []);
      setClasses((allClasses || []).filter(c => classIds.has(c.id)));
      setAssignments((allAssignments || []).filter(a => classIds.has(a.class_id)));
      setSubmissions(mySubs || []);
      setAnnouncements((allAnnouncements || []).filter(a => classIds.has(a.class_id)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch {
      if (sequence !== loadSequence.current) return;
      setEnrollments([]);
      setClasses([]);
      setAssignments([]);
      setSubmissions([]);
      setAnnouncements([]);
      setLoadError("We couldn’t load your classes. Saved responses and drafts have not been replaced. Please retry.");
    }
    setLoading(false);
  }, [email, ctx?.workspaceId]);
  useEffect(() => {
    load();
    const refresh = () => load(false);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 30000);
    const events = ['visionary:workspace-change', 'visionary:v2-change', 'storage'];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => {
      loadSequence.current++;
      window.clearInterval(timer);
      events.forEach(event => window.removeEventListener(event, refresh));
    };
  }, [load]);
  const mySubFor = assignmentId => (submissions || []).find(s => s.assignment_id === assignmentId);
  const draftFor = assignmentId => {
    const submission = mySubFor(assignmentId);
    const saved = drafts[assignmentId];
    if (submission?.status !== 'revision_requested') return saved || {};
    if (saved?.revisionAttempt === (submission.attempt || 1)) return saved;
    return {
      text: classworkResponseText(assignments.find(item => item.id === assignmentId) || {}, submission),
      selfReview: submission.self_review || {},
      answers: Object.fromEntries((submission.responses || []).map(answer => [answer.questionId, answer.text])),
      revisionAttempt: submission.attempt || 1
    };
  };
  const submit = async a => {
    const checks = Array.isArray(a.checks) ? a.checks : [];
    const draft = draftFor(a.id);
    const responses = checks.map(check => ({
      questionId: check.id,
      text: (draft.answers?.[check.id] || '').trim()
    }));
    const text = checks.length ? responses.map(response => response.text).join('\n') : (draft.text || '').trim();
    if (!text || responses.some(response => !response.text) || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await submitClassworkResponses(ctx, {
        assignmentId: a.id,
        expectedRevision: classworkActivityRevision(a),
        text,
        responses
      });
      setSubmissions(p => [created, ...p.filter(item => item.id !== created.id)]);
      updateDraft(a.id, null);
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch (failure) {
      setError(failure.message || "Your response wasn’t submitted. Your draft is still here; please try again.");
    } finally {
      setBusy(false);
    }
  };
  const closeJoin = () => {
    if (joining) return;
    setShowJoin(false);
    if (searchParams.has("join")) {
      const next = new URLSearchParams(searchParams);
      next.delete("join");
      setSearchParams(next, {
        replace: true
      });
    }
  };
  const connectClass = async classroom => {
    const existing = await base44.entities.Enrollment.filter({
      student_email: email,
      class_id: classroom.id
    });
    const active = existing.find(e => e.status === "active");
    if (!active) {
      const details = {
        student_name: studentName,
        student_id: user.id,
        status: "active",
        join_code: classroom.join_code
      };
      if (existing.length) await base44.entities.Enrollment.update(existing[0].id, details);else await base44.entities.Enrollment.create({
        class_id: classroom.id,
        student_email: email,
        ...details
      });
    }
    await load();
    setOpenClassId(classroom.id);
    window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
  };
  const acceptInvitation = async classroom => {
    if (joining) return;
    setJoining(true);
    try {
      await connectClass(classroom);
    } catch {
      setError("We couldn’t accept this invitation. Please try again.");
    } finally {
      setJoining(false);
    }
  };
  const joinClass = async event => {
    event.preventDefault();
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode || joining || !email) return;
    setJoining(true);
    setJoinStatus("");
    try {
      const classroom = await base44.entities.Classroom.findByJoinCode(normalizedCode);
      if (!classroom) {
        setJoinStatus("We couldn’t find a class with that code. Check the code with your teacher and try again.");
        return;
      }
      await connectClass(classroom);
      setShowJoin(false);
      if (searchParams.has("join")) {
        const next = new URLSearchParams(searchParams);
        next.delete("join");
        setSearchParams(next, {
          replace: true
        });
      }
      setJoinCode("");
      setOpenClassId(classroom.id);
    } catch {
      setJoinStatus("We couldn’t join this class right now. Please try again.");
    } finally {
      setJoining(false);
    }
  };
  const openClass = classes.find(c => c.id === openClassId);
  const activeClassIds = new Set(enrollments.filter(e => e.status === "active").map(e => e.class_id));
  const connectedClasses = classes.filter(c => activeClassIds.has(c.id));
  const invitations = classes.filter(c => !activeClassIds.has(c.id) && enrollments.some(e => e.class_id === c.id && e.status === "invited"));
  const classAssignments = (assignments || []).filter(a => a.class_id === openClassId).sort((x, y) => (y.created_date || "").localeCompare(x.created_date || ""));
  return <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-medium text-[#121317] tracking-tight"> {copy("Your classes")} </h1>
          <p className="text-sm text-[#5f6368] mt-1"> {copy("Assignments, feedback, and class updates in one place")} </p>
        </div>
        <button onClick={() => {
        setJoinStatus("");
        setShowJoin(true);
      }} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-full border border-[#dadce0] bg-white px-5 text-sm font-medium text-[#0b57d2] transition-colors hover:bg-[#ffffff] sm:self-auto">
          <Link2 className="h-4 w-4" /> {copy("Join class")} </button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]"> {copy(error)}  <button onClick={load} className="ml-2 font-medium underline"> {copy("Retry")} </button></p>}
      {loadError && <p role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]"> {copy(loadError)}  <button onClick={load} className="ml-2 font-medium underline"> {copy("Retry class loading")} </button></p>}
      {draftError && <div role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]"><p> {copy(draftError)} </p>{!draftStorageReadable && draftKey && <button className="v-button mt-3" onClick={() => {
        try {
          downloadText('visionary-saved-classwork-drafts.txt', localStorage.getItem(draftKey) || '');
        } catch {
          setDraftError('Saved draft backup could not be read. Your current editor remains available.');
        }
      }}> {copy("Export saved drafts backup")} </button>}<button className="v-button mt-3" onClick={() => {
        try {
          const saved = readClassworkDrafts(ctx);
          setDrafts(saved);
          draftBases.current = Object.fromEntries(Object.entries(saved).map(([id, row]) => [id, classworkDraftRevision(row)]));
          setDraftStorageReadable(true);
          setDraftError('');
        } catch (failure) {
          setDraftError(failure.message);
        }
      }}> {copy("Discard current edits and load saved drafts")} </button></div>}
      {invitations.length > 0 && <section aria-label={copy("Class invitations")} className="rounded-2xl border border-[#dadce0] bg-[#ffffff] p-5"><h2 className="font-medium text-[#121317]"> {copy("Class invitations")} </h2><div className="mt-3 space-y-3">{invitations.map(c => <div key={c.id} className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-[#121317]">{c.name}</p><p className="text-xs text-[#5f6368]">{c.teacher_name || "Your teacher"} {copy("invited you to join")} </p></div><button disabled={joining} onClick={() => acceptInvitation(c)} className="h-10 rounded-full bg-[#0b57d2] px-5 text-sm font-medium text-white disabled:opacity-50"> {copy("Accept class")} </button></div>)}</div></section>}

      {loading ? <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#dadce0] rounded-full animate-spin" style={{
        borderTopColor: accent
      }} />
        </div> : loadError ? null : connectedClasses.length === 0 ? <div className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
        backgroundColor: `${accent}15`
      }}>
            <GraduationCap className="w-8 h-8" style={{
          color: accent
        }} />
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-[#121317] mb-2"> {copy("No classes yet")} </h3>
            <p className="text-sm text-[#5f6368] max-w-sm leading-relaxed"> {copy("Join with a class code from your teacher. When you connect, assignments and feedback will appear here.")} </p>
          </div>
          <button onClick={() => {
        setJoinStatus("");
        setShowJoin(true);
      }} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white" style={{
        backgroundColor: accent
      }}><KeyRound className="h-4 w-4" /> {copy("Join with a code")} </button>
        </div> : openClass && activeClassIds.has(openClass.id) ? <div className="flex flex-col gap-6">
          <button onClick={() => setOpenClassId(null)} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#121317] self-start">
            <ChevronRight className="w-4 h-4 rotate-180" /> {copy("All classes")} </button>

          <div className="rounded-3xl overflow-hidden">
            <div className="p-8" style={{
          ...classColors(openClass.color || accent)
        }}>
              <h2 className="text-[24px] font-medium tracking-tight">{openClass.name}</h2>
              {openClass.section && <p className="text-sm mt-1">{openClass.section}</p>}
              {openClass.subject && <p className="text-sm mt-0.5">{openClass.subject}</p>}
              {openClass.subject && <Link className="v-button mt-4" to={`/dashboard/learn?fromClass=${encodeURIComponent(openClass.id)}`}> {copy("Explore")} {openClass.subject} {copy("in Learn")} </Link>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[#dadce0]" aria-label={copy("Class sections")}>{[["classwork", "Classwork"], ["outline", "Learning outline"], ["stream", "Updates"], ["community", "Community"]].map(([id, label]) => <button key={id} onClick={() => setClassTab(id)} aria-pressed={classTab === id} className={`h-11 border-b-2 px-5 text-sm font-medium ${classTab === id ? "border-[#4285F4] text-[#0b57d2]" : "border-transparent text-[#5f6368]"}`}> {copy(label)} </button>)}</div>
          {classTab === "stream" && <div className="space-y-4">{announcements.filter(a => a.class_id === openClassId).length === 0 ? <div className="py-12 text-center"><Megaphone className="mx-auto mb-3 h-9 w-9 text-[#5f6368]" /><p className="text-sm text-[#5f6368]"> {copy("Class updates from your teacher will appear here.")} </p></div> : announcements.filter(a => a.class_id === openClassId).map(a => <article key={a.id} className="rounded-2xl border border-[#dadce0] p-6"><p className="text-sm font-medium text-[#121317]">{a.author_name || openClass.teacher_name || "Teacher"}</p><p className="mt-1 text-xs text-[#5f6368]">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : copy("Class update")}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#5f6368]">{a.text}</p></article>)}</div>}

          {classTab === "outline" && <><ClassCurriculum key={'published:' + ctx?.workspaceId + ':' + openClassId} classId={openClassId} /><AssignedCurriculumOutline key={ctx?.workspaceId + ':' + openClassId} classId={openClassId} /></>}
          {classTab === "community" && <CommunityTab classId={openClassId} accent="#4285F4" />}
          {classTab === "classwork" && <div className="flex flex-col gap-4">
            {classAssignments.length === 0 ? <div className="flex flex-col items-center gap-3 py-12 text-center">
                <ClipboardList className="w-10 h-10 text-[#dadce0]" />
                <p className="text-sm text-[#5f6368] max-w-sm"> {copy("No assignments in this class yet. Check back soon.")} </p>
              </div> : classAssignments.map(a => {
          const sub = mySubFor(a.id);
          const graded = sub && sub.status === "graded";
          const submitted = sub && sub.status === "submitted";
          const revision = sub?.status === 'revision_requested';
          const draft = draftFor(a.id);
          return <div key={a.id} className="p-6 bg-white rounded-3xl border border-[#dadce0]/60 flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
                backgroundColor: `${accent}15`
              }}>
                        <ClipboardList className="w-5 h-5" style={{
                  color: accent
                }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#121317]">{a.title}</p>
                        <Link className="mt-2 inline-block text-sm font-medium text-blue-700 underline" to={`/dashboard/learn?assignment=${encodeURIComponent(a.id)}`}> {copy("Open class activity in Learn")} </Link>
                        <p className="text-xs text-[#5f6368] mt-0.5">
                          {a.points ?? 100} {copy("points")} {a.due_date ? ` · ${copy('Due {date}',{date:a.due_date})}` : ""}
                        </p>
                        {a.description && <p className="text-sm text-[#5f6368] mt-3 leading-relaxed">{a.description}</p>}
                        {a.topics && a.topics.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                            {a.topics.map(t => <span key={t} className="inline-flex items-center h-7 px-3 rounded-full text-xs font-medium bg-[#dadce0] text-[#5f6368]">
                                {t}
                              </span>)}
                          </div>}
                      </div>
                      {graded && <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {typeof sub.grade === 'number' && Number.isFinite(sub.grade) && sub.grade >= 0 && sub.grade <= (a.points ?? 100) ? `${sub.grade}/${a.points ?? 100}` : copy("Grade unavailable")}
                        </span>}
                      {submitted && <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#ffffff] text-[#5f6368] shrink-0">
                          <Clock className="w-3.5 h-3.5" /> {copy("Submitted")} </span>}
                    </div>

                    {revision && <div role="status" className="rounded-2xl bg-[#fef7e0] p-4 text-sm"><p className="font-medium"> {copy("Revision requested \xB7 Attempt")} {sub.attempt || 1}</p><p className="mt-2 whitespace-pre-wrap">{sub.feedback}</p><CriterionFeedback criteria={a.objective_snapshot?.criteria} feedback={sub.criterion_feedback} /><p className="mt-2"> {copy("Update your answers below and resubmit. Your previous response and feedback stay in the attempt history.")} </p></div>}
                    {!!sub?.revision_history?.length && <details className="text-sm text-[#5f6368]"><summary className="cursor-pointer"> {copy("Previous attempts and feedback ({count})",{count:sub.revision_history.length})} </summary>{sub.revision_history.map((entry, index) => <div key={index} className="mt-3 border-l-2 border-[#dadce0] pl-3"><p className="font-medium"> {copy("Attempt")} {entry.attempt}</p><p className="whitespace-pre-wrap">{entry.text}</p><p className="mt-2 whitespace-pre-wrap"> {copy("Feedback:")} {entry.feedback}</p><CriterionFeedback criteria={a.objective_snapshot?.criteria} feedback={entry.criterion_feedback} /></div>)}</details>}
                    {graded ? <div className="sm:pl-14 flex flex-col gap-2">
                        {sub.feedback && <div className="p-4 rounded-2xl bg-[#ffffff]">
                            <p className="text-xs font-medium text-[#5f6368] mb-1"> {copy("Teacher feedback")} </p>
                            <p className="text-sm text-[#5f6368] leading-relaxed">{sub.feedback}</p>
                          </div>}
                        <CriterionFeedback criteria={a.objective_snapshot?.criteria} feedback={sub.criterion_feedback} /><p className="text-xs text-[#5f6368]"> {copy("Returned by your teacher.")} </p>
                        <details className="text-sm"><summary className="cursor-pointer font-medium"> {copy("Your submitted copy")} </summary><p className="mt-3 whitespace-pre-wrap break-words">{sub.text}</p></details>
                      </div> : submitted ? <div className="sm:pl-14">
                        <div className="p-4 rounded-2xl bg-[#ffffff] text-sm text-[#5f6368] whitespace-pre-wrap leading-relaxed">{sub.text}</div>
                        <CriterionFeedback criteria={a.objective_snapshot?.criteria} feedback={sub?.criterion_feedback} /><p className="text-xs text-[#5f6368] mt-2"> {copy("Submitted \u2014 waiting for your teacher to review.")} </p>
                      </div> : ['closed', 'archived'].includes(a.status) ? <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm"> {copy("Submissions are closed. Your saved draft remains on this device. Your teacher can reopen the assignment.")} </p> : <div className="sm:pl-14 flex flex-col gap-2">
                        {Array.isArray(a.checks) && a.checks.length ? <div className="space-y-4">{a.checks.map((check, index) => <label key={check.id} className="block text-sm font-medium text-[#121317]">{index + 1}. {check.prompt}<textarea aria-label={`${index + 1}. ${check.prompt}`} value={draft.answers?.[check.id] || ''} onChange={event => updateDraft(a.id, {
                    ...draft,
                    answers: {
                      ...draft.answers,
                      [check.id]: event.target.value
                    }
                  })} placeholder={copy("Explain in your own words\u2026")} rows={3} className="mt-2 w-full rounded-2xl border border-[#dadce0] p-4 text-sm font-normal leading-relaxed outline-none focus:border-[#4285F4]" /></label>)}</div> : <textarea value={draft.text || ""} onChange={e => updateDraft(a.id, {
                ...draft,
                text: e.target.value
              })} placeholder={copy("Write your response\u2026")} aria-label={copy('Your response to {title}', {
                title: a.title
              })} rows={3} className="w-full p-4 rounded-2xl border border-[#dadce0] text-sm text-[#121317] outline-none focus:border-[#4285F4] resize-none leading-relaxed" />}
                        <p className="text-xs text-[#5f6368]"> {copy("Drafts are kept on this device when storage is available. Your teacher reviews the response; it is not automatically scored.")} </p>
                        {!a.checks?.length && <ClassworkProjectSubmission key={`${a.id}:${sub?.attempt || 0}`} ctx={ctx} artifacts={data?.artifacts} assignment={{
                ...a,
                revisionRequested: revision
              }} onSubmitted={saved => {
                setSubmissions(previous => [saved, ...previous.filter(item => item.id !== saved.id)]);
                window.dispatchEvent(new CustomEvent('visionary:workspace-change'));
              }} />}
                        {(draftError || error) && <button className="v-button self-start" onClick={() => downloadText(`visionary-classwork-${a.id}.txt`, Array.isArray(a.checks) && a.checks.length ? a.checks.map((check, index) => `${index + 1}. ${check.prompt}\n${draft.answers?.[check.id] || ""}`).join("\n\n") : draft.text || "")}> {copy("Export current response")} </button>}<div className="flex justify-end">
                          {a.objective_snapshot?.criteria?.length ? <Link className="v-button primary" to={`/dashboard/learn?assignment=${encodeURIComponent(a.id)}`}> {copy("Review criteria and submit in Learn")} </Link> : <button onClick={() => submit(a)} disabled={busy || (Array.isArray(a.checks) && a.checks.length ? a.checks.some(check => !(draft.answers?.[check.id] || '').trim()) : !(draft.text || '').trim())} className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium text-white disabled:opacity-50" style={{
                  backgroundColor: accent
                }}>
                            <Send className="w-4 h-4" /> {revision ? copy("Resubmit") : copy("Submit")}
                          </button>}
                        </div>
                      </div>}
                  </div>;
        })}
          </div>}
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedClasses.map(c => {
        const count = (assignments || []).filter(a => a.class_id === c.id).length;
        return <button key={c.id} onClick={() => setOpenClassId(c.id)} className="text-left flex flex-col bg-white rounded-2xl border border-[#dadce0] overflow-hidden hover:shadow-md transition-all">
                <div className="p-6" style={{
            ...classColors(c.color || accent)
          }}>
                  <h3 className="text-[18px] font-medium text-white tracking-tight">{c.name}</h3>
                  {c.section && <p className="text-sm mt-0.5">{c.section}</p>}
                  {c.subject && <p className="text-sm mt-0.5">{c.subject}</p>}
                </div>
                <div className="flex items-center justify-between px-6 py-5">
                  <span className="text-sm text-[#5f6368]"> {copy(count===1?'{count} assignment':'{count} assignments', {
                count
              })} </span>
                  <ChevronRight className="w-5 h-5 text-[#5f6368]" />
                </div>
              </button>;
      })}
        </div>}
      <Dialog open={showJoin} onOpenChange={open => {
      if (!open) closeJoin();
    }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-7 sm:rounded-3xl" lang={locale}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{
          backgroundColor: `${accent}15`
        }}><KeyRound className="h-5 w-5" style={{
            color: accent
          }} /></div>
          <DialogTitle className="text-xl font-medium text-[#121317]"> {copy("Join a class")} </DialogTitle>
          <DialogDescription> {copy("Ask your teacher for their class code, then enter it below.")} </DialogDescription>
          <form onSubmit={joinClass}>
            <label className="mt-6 block text-sm font-medium text-[#121317]"> {copy("Class code")} <input disabled={joining} value={joinCode} onChange={event => setJoinCode(event.target.value.toUpperCase())} placeholder="e.g. VISION-AB12" autoFocus className="mt-2 h-12 w-full rounded-lg border border-[#5f6368] px-3 font-mono text-sm tracking-wide outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]" /></label>
            {joinStatus && <p className="mt-3 text-sm text-[#b3261e]" role="alert"> {copy(joinStatus)} </p>}
            <div className="mt-7 flex justify-end gap-3"><button type="button" disabled={joining} onClick={closeJoin} className="h-10 rounded-full px-4 text-sm font-medium text-[#0b57d2] hover:bg-[#ffffff]"> {copy("Cancel")} </button><button type="submit" disabled={joining || !joinCode.trim()} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-60" style={{
              backgroundColor: accent
            }}><Link2 className="h-4 w-4" />{joining ? copy("Joining\u2026") : copy("Join class")}</button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
}
