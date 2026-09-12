import { useState, useEffect, useCallback } from "react";
import { Send, Megaphone, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function StreamTab({ classId, classroom, accent }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const list = await base44.entities.Announcement.filter({ class_id: classId });
      setAnnouncements(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch { setError("Class updates couldn’t be loaded. Please try again."); }
    finally { setLoading(false); }
  }, [classId]);
  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    return () => window.removeEventListener("visionary:workspace-change", load);
  }, [load]);
  const post = async (event) => {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await base44.entities.Announcement.create({ class_id: classId, text: text.trim(), author_name: user?.full_name || classroom.teacher_name || "Teacher", teacher_email: user?.email, teacher_id: user?.id });
      setText("");
      await load();
      window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
    } catch { setError("Your update wasn’t posted. Your draft is still here; please try again."); }
    finally { setBusy(false); }
  };
  return <div className="flex max-w-[800px] flex-col gap-6">
    <form onSubmit={post} className="flex flex-col gap-4 rounded-2xl border border-[#dadce0] bg-white p-5 sm:p-6">
      <label htmlFor="class-announcement" className="text-sm font-medium text-[#202124]">Share an update with your class</label>
      <textarea id="class-announcement" value={text} onChange={(e) => setText(e.target.value)} placeholder="Announcements, reminders, or a welcome message…" rows={4} maxLength={10000} className="w-full resize-y rounded-lg border border-[#dadce0] p-3 text-sm leading-relaxed text-[#202124] outline-none focus:border-[#1a73e8]" />
      <div className="flex flex-wrap justify-between gap-3"><button type="button" disabled={Boolean(text)} onClick={() => setText(`Welcome to ${classroom?.name || "our class"}! You’ll find assignments in Classwork and class updates here. I’m looking forward to learning together.`)} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dadce0] px-4 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa] disabled:opacity-40"><FileText className="h-4 w-4" />Welcome template</button><button type="submit" disabled={busy || !text.trim()} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: accent }}><Send className="h-4 w-4" />{busy ? "Posting…" : "Post update"}</button></div>
    </form>
    {error && <p role="alert" className="text-sm text-[#b3261e]">{error} <button onClick={load} className="underline">Retry</button></p>}
    {loading ? <p role="status" className="py-10 text-center text-sm text-[#5f6368]">Loading updates…</p> : announcements.length === 0 ? <div className="py-12 text-center"><Megaphone className="mx-auto mb-3 h-10 w-10 text-[#9aa0a6]" /><h3 className="font-medium text-[#202124]">Keep your class in the loop</h3><p className="mt-2 text-sm text-[#5f6368]">Post a welcome message to get started.</p></div> : announcements.map((a) => <article key={a.id} className="rounded-2xl border border-[#dadce0] bg-white p-6"><h3 className="text-sm font-medium text-[#202124]">{a.author_name || classroom.teacher_name || "Teacher"}</h3><p className="mt-1 text-xs text-[#5f6368]">{a.createdAt ? new Date(a.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Class update"}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#3c4043]">{a.text}</p></article>)}
  </div>;
}
