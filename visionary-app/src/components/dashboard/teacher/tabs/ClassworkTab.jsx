import { classTabCopy } from '@/lib/classTabCopy';
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, ClipboardList, X, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AssignmentGrader from "@/components/dashboard/teacher/AssignmentGrader";
import { useAuth } from "@/lib/AuthContext";
import { useWorkspace } from '@/hooks/useWorkspace';
import { changeAssignmentState } from '@/services/classroomService';
import { assignmentAcceptsResponses } from '@/lib/assignmentAvailability';
export default function ClassworkTab({
  classId,
  classroom,
  accent,
  locale = "en"
}) {
  const copy = classTabCopy(locale);
  const {
    user
  } = useAuth();
  const {
    ctx
  } = useWorkspace();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    points: 100
  });
  const [publishAt, setPublishAt] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState("");
  const [grading, setGrading] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState('');
  const loadSequence = useRef(0);
  const load = useCallback(async (foreground = true) => {
    const sequence = ++loadSequence.current;
    if (foreground !== false) setLoading(true);
    setLoadError('');
    try {
      const [list, subs] = await Promise.all([base44.entities.Assignment.filter({
        class_id: classId
      }), base44.entities.Submission.filter({
        class_id: classId
      })]);
      if (sequence !== loadSequence.current) return;
      setAssignments((list || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setSubmissions(subs || []);
    } catch {
      if (sequence !== loadSequence.current) return;
      setAssignments([]);
      setSubmissions([]);
      setGrading(null);
      setLoadError("We couldn’t load classwork. Saved assignments and feedback have not been replaced.");
    }
    setLoading(false);
  }, [classId]);
  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(false);
    }, 30000);
    window.addEventListener("visionary:workspace-change", load);
    window.addEventListener("storage", load);
    return () => {
      loadSequence.current++;
      window.clearInterval(timer);
      window.removeEventListener("visionary:workspace-change", load);
      window.removeEventListener("storage", load);
    };
  }, [load]);
  const subsFor = assignmentId => (submissions || []).filter(s => s.assignment_id === assignmentId);
  const ungradedFor = assignmentId => subsFor(assignmentId).filter(s => s.status === "submitted").length;
  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) setTopics([...topics, t]);
    setTopicInput("");
  };
  const removeTopic = t => setTopics(p => p.filter(x => x !== t));
  const create = async (event, status = 'published') => {
    event.preventDefault();
    if (!form.title.trim() || busy) return;
    const points = Number(form.points);
    const scheduledTime = new Date(publishAt).getTime();
    if (status === 'scheduled' && (!Number.isFinite(scheduledTime) || scheduledTime <= Date.now())) {
      setError('Choose a future publication date and time.');
      return;
    }
    if (status === 'scheduled' && form.due_date && form.due_date < publishAt.slice(0, 10)) {
      setError('The due date must be on or after publication.');
      return;
    }
    if (!Number.isFinite(points) || points <= 0 || points > 10000) {
      setError("Choose a point total between 1 and 10,000.");
      return;
    }
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
        status,
        state_history: [{
          from: 'new',
          to: status,
          actor: user.email,
          at: new Date().toISOString()
        }],
        ...(status === 'scheduled' ? {
          publish_at: new Date(scheduledTime).toISOString()
        } : {}),
        subject: classroom?.subject || "",
        topics: topicInput.trim() && !topics.includes(topicInput.trim()) ? [...topics, topicInput.trim()] : topics
      });
      setAssignments(p => [created, ...p]);
      setForm({
        title: "",
        description: "",
        due_date: "",
        points: 100
      });
      setTopics([]);
      setPublishAt('');
      setTopicInput("");
      setShowForm(false);
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch {
      setError("Your assignment wasn’t saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const changeState = async (assignment, nextStatus) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await changeAssignmentState(ctx, {
        assignmentId: assignment.id,
        expectedStatus: assignment.status || 'published',
        nextStatus
      });
      await load();
      window.dispatchEvent(new CustomEvent('visionary:workspace-change'));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  };
  return <div className="flex flex-col gap-6 max-w-[800px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5f6368]">{copy("Create assignments and return feedback to your students.")}</p>
        <button disabled={busy} onClick={() => setShowForm(s => !s)} className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium text-white" style={{
        backgroundColor: accent
      }}>
          <Plus className="w-4 h-4" />{copy("Create assignment")}</button>
      </div>
      {error && <p role="alert" className="text-sm text-[#b3261e]">{copy(error)}</p>}
      {loadError && <p role="alert" className="text-sm text-[#b3261e]">{copy(loadError)} <button onClick={load} className="ml-2 font-medium underline">{copy("Retry classwork loading")}</button></p>}

      {showForm && <form onSubmit={create} className="flex flex-col gap-4 p-6 bg-white rounded-2xl border border-[#dadce0]">
          <h3 className="text-base font-medium text-[#121317]">{copy("New assignment")}</h3>
          <label htmlFor="assignment-title" className="text-sm font-medium text-[#121317]">{copy("Title")}</label>
          <input disabled={busy} id="assignment-title" required maxLength={160} value={form.title} onChange={e => setForm({
        ...form,
        title: e.target.value
      })} placeholder={copy("Assignment title")} className="w-full h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#121317] outline-none focus:border-[#4285F4]" />
          <textarea disabled={busy} aria-label={copy("Assignment instructions")} value={form.description} onChange={e => setForm({
        ...form,
        description: e.target.value
      })} placeholder={copy("Instructions (optional)")} rows={3} className="w-full p-4 rounded-xl border border-[#dadce0] text-sm text-[#121317] outline-none focus:border-[#4285F4] resize-none" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="assignment-due" className="block text-xs text-[#5f6368] mb-1.5">{copy("Due date (optional)")}</label>
              <input disabled={busy} id="assignment-due" type="date" value={form.due_date} onChange={e => setForm({
            ...form,
            due_date: e.target.value
          })} className="w-full h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#121317] outline-none focus:border-[#4285F4]" />
            </div>
            <div>
              <label htmlFor="assignment-points" className="block text-xs text-[#5f6368] mb-1.5">{copy("Points")}</label>
              <input disabled={busy} id="assignment-points" type="number" min="1" max="10000" required value={form.points} onChange={e => setForm({
            ...form,
            points: e.target.value
          })} className="w-full h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#121317] outline-none focus:border-[#4285F4]" />
            </div>
          </div>

          <div>
            <label htmlFor="assignment-concept" className="block text-xs text-[#5f6368] mb-1.5">{copy("Concepts (optional)")}</label>
            <div className="flex gap-2">
              <input disabled={busy} id="assignment-concept" value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTopic();
            }
          }} placeholder={copy("e.g. Quadratic equations")} className="min-w-0 flex-1 h-11 px-4 rounded-xl border border-[#dadce0] text-sm text-[#121317] outline-none focus:border-[#4285F4]" />
              <button type="button" onClick={addTopic} disabled={busy || !topicInput.trim()} className="h-11 px-4 rounded-xl border border-[#dadce0] text-sm font-medium text-[#5f6368] hover:bg-[#121317]/5 disabled:opacity-40">{copy("Add")}</button>
            </div>
            {topics.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                {topics.map(t => <span key={t} className="inline-flex items-center gap-1.5 min-h-11 pl-3 pr-2 rounded-full text-xs font-medium" style={{
            backgroundColor: `${accent}15`,
            color: accent
          }}>
                    {t}
                    <button type="button" disabled={busy} aria-label={copy("Remove {topic}", {
              topic: t
            })} onClick={() => removeTopic(t)} className="min-w-11 min-h-11 rounded-full hover:bg-white/60 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </span>)}
              </div>}
          </div>

          <label className="text-sm font-medium">{copy("Publication time (optional)")}<input disabled={busy} aria-label={copy("Publication time")} type="datetime-local" className="v-field mt-2" value={publishAt} onChange={event => setPublishAt(event.target.value)} /><span className="mt-2 block text-xs font-normal text-[#5f6368]">{copy("Shown in your device timezone. Scheduled preview access uses the browser clock; no external notification is sent.")}</span></label>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" disabled={busy || !form.title.trim() || !publishAt} onClick={event => create(event, 'scheduled')} className="v-button">{copy("Schedule assignment")}</button>
            <button type="button" disabled={busy || !form.title.trim()} onClick={event => create(event, 'draft')} className="h-11 rounded-full border border-[#dadce0] px-4 text-sm font-medium disabled:opacity-50">{copy("Save draft")}</button>
            <button type="button" disabled={busy} onClick={() => setShowForm(false)} className="h-11 px-5 rounded-full text-sm font-medium text-[#5f6368] hover:bg-[#121317]/5">
              Cancel
            </button>
            <button type="submit" disabled={busy || !form.title.trim()} className="h-11 px-5 rounded-full text-sm font-medium text-white disabled:opacity-50" style={{
          backgroundColor: accent
        }}>
              {busy ? copy("Assigning\u2026") : copy("Assign")}
            </button>
          </div>
        </form>}

      {loading ? <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-[#dadce0] rounded-full animate-spin" style={{
        borderTopColor: accent
      }} />
        </div> : loadError ? null : assignments.length === 0 ? <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="w-10 h-10 text-[#dadce0]" />
          <p className="text-sm text-[#5f6368] max-w-sm">{copy("No assignments yet. Create your first one and tag the concepts it covers.")}</p>
        </div> : assignments.map(a => {
      const subs = subsFor(a.id);
      const ungraded = ungradedFor(a.id);
      return <div key={a.id} className="p-5 bg-white rounded-3xl border border-[#dadce0]/60">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
            backgroundColor: `${accent}15`
          }}>
                  <ClipboardList className="w-5 h-5" style={{
              color: accent
            }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#121317]">{a.title}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">
                    {copy('{points} points{due}', {
                points: a.points ?? copy('Unavailable'),
                due: a.due_date ? copy(' · Due {date}', {
                  date: a.due_date
                }) : ''
              })}
                  </p>
                </div>
                <button onClick={() => setGrading(a)} className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full text-sm font-medium border border-[#dadce0] text-[#5f6368] hover:bg-[#121317]/5 shrink-0">
                  <Inbox className="w-4 h-4" style={{
              color: ungraded ? "#ea4335" : "#5f6368"
            }} />
                  {subs.length > 0 ? copy('Review ({count}{newCount})', {
              count: subs.length,
              newCount: ungraded ? copy(' · {count} new', {
                count: ungraded
              }) : ''
            }) : copy('Review')}
                </button>
              </div>
              {a.description && <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-relaxed text-[#5f6368]">{a.description}</p>}
              <p className="mt-3 text-xs font-medium">{copy({
            draft: 'Draft · visible only to your teacher workspace',
            scheduled: 'Scheduled publication · browser-local preview',
            published: 'Published · accepting responses',
            closed: 'Closed · saved work and reviews retained',
            archived: 'Archived · prior submitters retain their work'
          }[a.status || 'published'] || 'State unavailable')}</p>
              {a.status === 'scheduled' && <p className="mt-2 text-xs">{assignmentAcceptsResponses(a) ? copy("Scheduled publication reached \xB7 accepting responses") : copy('Scheduled · {date} · hidden until publication', {
            date: Number.isFinite(new Date(a.publish_at).getTime()) ? new Date(a.publish_at).toLocaleString(locale) : copy('Unavailable')
          })}</p>}
              <div className="mt-3 flex flex-wrap gap-2" aria-label={copy("Actions for {title}", {
          title: a.title
        })}>
               {(a.status === 'draft' || a.status === 'closed') && <button disabled={busy} className="v-button" onClick={() => changeState(a, 'published')}>{a.status === 'draft' ? copy("Publish assignment") : copy("Reopen submissions")}</button>}
               {a.status === 'scheduled' && <><button disabled={busy} className="v-button" onClick={() => changeState(a, 'published')}>{copy("Publish now")}</button><button disabled={busy} className="v-button" onClick={() => changeState(a, 'draft')}>{copy("Cancel schedule to draft")}</button>{assignmentAcceptsResponses(a) && <button disabled={busy} className="v-button" onClick={() => changeState(a, 'closed')}>{copy("Close submissions")}</button>}</>}
               {(!a.status || a.status === 'published') && <button disabled={busy} className="v-button" onClick={() => changeState(a, 'closed')}>{copy("Close submissions")}</button>}
               {a.status !== 'archived' ? <button disabled={busy} className="v-button" onClick={() => changeState(a, 'archived')}>{copy("Archive assignment")}</button> : <button disabled={busy} className="v-button" onClick={() => changeState(a, 'closed')}>{copy("Restore as closed")}</button>}
              </div>
              {!!a.state_history?.length && <details className="mt-3 text-xs"><summary className="cursor-pointer">{copy("Assignment state history")}</summary>{a.state_history.map((entry, index) => <p className="mt-2 break-words" key={index}>{entry.from} → {entry.to} · {entry.actor} · {entry.at}</p>)}</details>}
              {Array.isArray(a.topics) && a.topics.length > 0 && <div className="flex flex-wrap gap-2 mt-4 pl-14">
                  {a.topics.filter(topic => typeof topic === 'string').map(t => <span key={t} className="inline-flex items-center h-7 px-3 rounded-full text-xs font-medium bg-[#dadce0] text-[#5f6368]">
                      {t}
                    </span>)}
                </div>}
            </div>;
    })}

      {grading && <AssignmentGrader assignment={grading} accent={accent} onClose={() => {
      setGrading(null);
      load();
    }} />}
    </div>;
}
