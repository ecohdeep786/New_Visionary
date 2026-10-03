import { classTabCopy } from '@/lib/classTabCopy';
import { useClassRecords } from '@/hooks/useClassRecords';
import { useState } from "react";
import { Send, Megaphone, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
export default function StreamTab({
  classId,
  classroom,
  accent,
  locale = "en"
}) {
  const copy = classTabCopy(locale);
  const {
    user
  } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const {
    records,
    loading,
    unavailable,
    reload: load
  } = useClassRecords(classId, ['Announcement']);
  const announcements = [...(records?.[0] || [])].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const post = async event => {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await base44.entities.Announcement.create({
        class_id: classId,
        text: text.trim(),
        author_name: user?.full_name || classroom.teacher_name || copy("Teacher"),
        teacher_email: user?.email,
        teacher_id: user?.id
      });
      setText("");
      await load();
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch {
      setError("Your update wasn’t posted. Your draft is still here; please try again.");
    } finally {
      setBusy(false);
    }
  };
  return <div className="flex max-w-[800px] flex-col gap-6">
    <form onSubmit={post} className="flex flex-col gap-4 rounded-2xl border border-[#dadce0] bg-white p-5 sm:p-6">
      <label htmlFor="class-announcement" className="text-sm font-medium text-[#121317]">{copy("Share an update with your class")}</label>
      <textarea id="class-announcement" disabled={busy} value={text} onChange={e => setText(e.target.value)} placeholder={copy("Announcements, reminders, or a welcome message\u2026")} rows={4} maxLength={10000} className="w-full resize-y rounded-lg border border-[#dadce0] p-3 text-sm leading-relaxed text-[#121317] outline-none focus:border-[#4285F4]" />
      <div className="flex flex-wrap justify-between gap-3"><button type="button" disabled={busy || Boolean(text)} onClick={() => setText(copy('Welcome to {name}! You’ll find assignments in Classwork and class updates here. I’m looking forward to learning together.', {
          name: classroom?.name || copy('our class')
        }))} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#dadce0] px-4 text-sm font-medium text-[#5f6368] hover:bg-[#ffffff] disabled:opacity-40"><FileText className="h-4 w-4" />{copy("Welcome template")}</button><button type="submit" disabled={busy || !text.trim()} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50" style={{
          backgroundColor: accent
        }}><Send className="h-4 w-4" />{busy ? copy("Posting\u2026") : copy("Post update")}</button></div>
    </form>
    {error && <p role="alert" className="text-sm text-[#b3261e]">{copy(error)}</p>}
    {unavailable && <p role="alert" className="text-sm text-[#b3261e]">{copy('Class updates couldn’t be loaded. Please try again.')} <button onClick={load} className="min-h-11 underline">{copy('Retry')}</button></p>}
    {loading ? <p role="status" className="py-10 text-center text-sm text-[#5f6368]">{copy("Loading updates\u2026")}</p> : unavailable ? null : announcements.length === 0 ? <div className="py-12 text-center"><Megaphone className="mx-auto mb-3 h-10 w-10 text-[#5f6368]" /><h3 className="font-medium text-[#121317]">{copy("Keep your class in the loop")}</h3><p className="mt-2 text-sm text-[#5f6368]">{copy("Post a welcome message to get started.")}</p></div> : announcements.map(a => <article key={a.id} className="rounded-2xl border border-[#dadce0] bg-white p-6"><h3 className="text-sm font-medium text-[#121317]">{a.author_name || classroom.teacher_name || copy("Teacher")}</h3><p className="mt-1 text-xs text-[#5f6368]">{a.createdAt && Number.isFinite(new Date(a.createdAt).getTime()) ? new Date(a.createdAt).toLocaleString(locale, {
          dateStyle: "medium",
          timeStyle: "short"
        }) : copy("Class update")}</p><p className="mt-4 break-words whitespace-pre-wrap text-sm leading-relaxed text-[#5f6368]">{a.text}</p></article>)}
  </div>;
}
