import { classTabCopy } from '@/lib/classTabCopy';
import { useClassRecords } from '@/hooks/useClassRecords';
import { useState } from "react";
import { UserPlus, GraduationCap, Mail, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
export default function PeopleTab({
  classId,
  classroom,
  accent,
  locale = "en"
}) {
  const copy = classTabCopy(locale);
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
  return <div className="flex flex-col gap-6 max-w-[680px]">
      {/* Invite box */}
      <div className="p-6 bg-white rounded-3xl border border-[#dadce0]/60">
        <p className="text-sm font-medium text-[#121317] mb-1">{copy("Invite students")}</p>
        <p className="text-sm text-[#5f6368] mb-4">{copy('Add an in-app invitation by email, or share class code {code}. Email delivery is not connected yet.', {
          code: classroom?.join_code || copy('from the class header')
        })}</p>
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-xl border border-[#dadce0] focus-within:border-[#4285F4]">
            <Mail className="w-4 h-4 text-[#5f6368] shrink-0" />
            <input type="email" required aria-label={copy("Student email address")} disabled={busy} value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com" className="min-w-0 flex-1 bg-transparent text-sm text-[#121317] placeholder:text-[#5f6368] outline-none" />
          </div>
          <button type="submit" disabled={busy || !email.trim()} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{
          backgroundColor: accent
        }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}{copy("Invite")}</button>
        </form>
        {error && <p role="alert" className="text-sm text-[#b3261e] mt-3">{copy(error)}</p>}
        {notice && <p role="status" className="text-sm text-[#137333] mt-3">{copy(notice)}</p>}
      </div>

      {/* Teachers */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#dadce0]/60">
          <h3 className="text-sm font-medium text-[#121317]">{copy("Teachers")}</h3>
        </div>
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0" style={{
          backgroundColor: accent
        }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#121317] truncate">{teacherName}</p>
            <p className="text-xs text-[#5f6368] truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#dadce0]/60 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#121317]">{copy("Students")}</h3>
          {enrollments.length > 0 && <span className="text-xs text-[#5f6368]">{copy('{connected} connected · {invited} invited', {
            connected: enrollments.filter(e => e.status === 'active').length,
            invited: enrollments.filter(e => e.status === 'invited').length
          })}</span>}
        </div>
        {loading ? <div role="status" aria-label={copy("Loading class records…")} className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-[#dadce0] rounded-full animate-spin" style={{
          borderTopColor: accent
        }} />
          </div> : unavailable ? <p role="alert" className="p-6 text-sm text-[#b3261e]">{copy('We couldn’t load your class members. Please try again.')} <button onClick={load} className="min-h-11 underline">{copy('Retry')}</button></p> : enrollments.length === 0 ? <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
            <GraduationCap className="w-10 h-10 text-[#dadce0]" />
            <p className="text-sm text-[#5f6368] max-w-sm">{copy("No students yet. Invite your first student above to see them here.")}</p>
          </div> : <div className="divide-y divide-[#dadce0]/40">
            {enrollments.map(e => <div key={e.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-[#dadce0] text-[#5f6368] shrink-0">
                  {(e.student_name || e.student_email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#121317] truncate">{e.student_name || e.student_email}</p>
                  <p className="text-xs text-[#5f6368] truncate">{e.student_email}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${e.status === "active" ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#ffffff] text-[#5f6368]"}`}>{copy({
              active: 'Connected',
              invited: 'Invited',
              removed: 'Removed',left:'Left',inactive:'Inactive',
              declined: 'Declined',
              expired: 'Expired'
            }[e.status] || copy("Unavailable"))}</span>
              </div>)}
          </div>}
      </div>
    </div>;
}
