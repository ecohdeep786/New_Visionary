import { classTabCopy } from '@/lib/classTabCopy';
import { useClassRecords } from '@/hooks/useClassRecords';
import { useId, useState } from "react";
import { UserPlus, Mail, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SpotIllustration from '@/components/landing/SpotIllustration';
import { useAuth } from "@/lib/AuthContext";
export default function PeopleTab({
  classId,
  classroom,
  accent,
  locale = "en"
}) {
  const copy = classTabCopy(locale);
  const [showInvite, setShowInvite] = useState(false);
  const inviteId = useId();
  const {
    user
  } = useAuth();
  const teacherName = user?.full_name || user?.email?.split("@")[0] || copy("Teacher");
  const initial = teacherName.charAt(0).toUpperCase();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const {
    records,
    loading,
    unavailable,
    reload: load
  } = useClassRecords(classId, ['Enrollment']);
  const enrollments = records?.[0] || [];
  const invite = async event => {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (value === user?.email?.toLowerCase()) {
        setError("Use a student’s email address, rather than your teaching account.");
        return;
      }
      const existing = await base44.entities.Enrollment.filter({
        class_id: classId,
        student_email: value
      });
      if (existing.length) {
        setError(existing.some(row=>row.status==='active'||row.status==='invited') ? 'This student is already connected or has a pending invitation.' : 'An enrollment record already exists for this student. Share the class code to reconnect.');
        return;
      }
      await base44.entities.Enrollment.create({
        class_id: classId,
        student_email: value,
        student_name: value.split("@")[0],
        status: "invited",
        teacher_email: user?.email
      });
      setEmail("");
      setNotice("Invitation added. It will appear in this student’s Classes page when they sign in on this device. You can also share the class code.");
      await load();
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch {
      setError("Couldn't invite that student. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="v-class-section">
    <section className="v-people-section" aria-labelledby="class-teachers-title">
      <div className="v-people-heading"><h2 id="class-teachers-title">{copy("Teachers")}</h2></div>
      <div className="v-person-row">
        <div className="v-person-avatar">{initial}</div>
        <div className="min-w-0"><p className="text-sm font-medium break-words">{teacherName}</p><p className="text-xs text-[#5f6368] break-all">{user?.email}</p></div>
      </div>
    </section>
    <section className="v-people-section" aria-labelledby="class-students-title">
      <div className="v-people-heading">
        <div><h2 id="class-students-title">{copy("Students")}</h2>{!loading && !unavailable && enrollments.length > 0 && <p className="v-muted mt-1">{copy('{connected} connected · {invited} invited', {connected:enrollments.filter(e=>e.status==='active').length,invited:enrollments.filter(e=>e.status==='invited').length})}</p>}</div>
        <button type="button" className="v-button" aria-expanded={showInvite} aria-controls={inviteId} onClick={()=>setShowInvite(value=>!value)}><UserPlus size={18} aria-hidden="true"/>{copy("Invite students")}</button>
      </div>
      <div id={inviteId} hidden={!showInvite}>
        <form onSubmit={invite} className="v-class-form mt-5 space-y-4">
          <p className="v-muted">{copy('Add an in-app invitation by email, or share class code {code}. Email delivery is not connected yet.', {code:classroom?.join_code || copy('from the class header')})}</p>
          <label className="block text-sm font-medium" htmlFor={inviteId+'-email'}>{copy("Student email address")}</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 flex items-center gap-2 min-h-11 px-4 rounded-lg border border-[#5f6368] focus-within:border-[#4285F4]"><Mail className="w-4 h-4 text-[#5f6368] shrink-0" aria-hidden="true"/><input id={inviteId+'-email'} type="email" required disabled={busy} value={email} onChange={e=>setEmail(e.target.value)} placeholder="student@example.com" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"/></div>
            <button type="submit" className="v-button primary" disabled={busy || !email.trim()}>{busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true"/>}{copy("Invite")}</button>
          </div>
          {error && <p role="alert" className="v-notice v-error">{copy(error)}</p>}
          {notice && <p role="status" className="text-sm text-[#137333]">{copy(notice)}</p>}
        </form>
      </div>
      {loading ? <p role="status" className="v-muted py-10">{copy("Loading class records…")}</p> : unavailable ? <p role="alert" className="v-notice v-error mt-5">{copy('We couldn’t load your class members. Please try again.')} <button onClick={load} className="min-h-11 underline">{copy('Retry')}</button></p> : enrollments.length===0 ? <div className="v-empty-state"><SpotIllustration subject="teamwork" className="v-empty-illustration"/><p className="v-muted">{copy("No students yet. Invite your first student above to see them here.")}</p></div> : <div>{enrollments.map(e=><div key={e.id} className="v-person-row"><div className="v-person-avatar">{(e.student_name || e.student_email || "?").charAt(0).toUpperCase()}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium break-words">{e.student_name || e.student_email}</p><p className="text-xs text-[#5f6368] break-all">{e.student_email}</p></div><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.status==='active'?'bg-[#e6f4ea] text-[#137333]':'bg-[#f1f3f4] text-[#5f6368]'}`}>{copy({active:'Connected',invited:'Invited',removed:'Removed',left:'Left',inactive:'Inactive',declined:'Declined',expired:'Expired'}[e.status] || 'Unavailable')}</span></div>)}</div>}
    </section>
  </div>;
}
