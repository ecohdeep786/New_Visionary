import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Blocks, BookOpen, Loader2, MessageCircle, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import CourseViewer from "@/components/dashboard/learn/CourseViewer";

export default function TopicDetail() {
  const { topicId } = useParams();
  const data = useStudentData();
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState(false);
  const topic = data.topics.find((item) => item.id === topicId);
  const topics = data.topics.filter((item) => item.subject === topic?.subject).sort((a, b) => (a.chapter || a.name).localeCompare(b.chapter || b.name, undefined, { numeric: true }));
  const nextTopic = topics[topics.findIndex((item) => item.id === topicId) + 1];

  useEffect(() => { setFocus(false); setError(""); }, [topicId]);
  useEffect(() => {
    let active = true;
    base44.entities.Bookmark.list().then((rows) => { if (active) setBookmarks(rows); }).catch(() => { if (active) setError("Bookmarks could not be loaded. Refresh the page to try again."); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!focus) return;
    const escape = (event) => { if (event.key === "Escape") setFocus(false); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [focus]);
  async function toggleBookmark() {
    if (bookmarkBusy) return;
    setBookmarkBusy(true); setError("");
    try {
      const existing = bookmarks.find((item) => item.topic_id === topic.id);
      if (existing) { await base44.entities.Bookmark.delete(existing.id); setBookmarks((rows) => rows.filter((item) => item.id !== existing.id)); }
      else {
        const created = await base44.entities.Bookmark.create({ topic_id: topic.id, topic_name: topic.name, subject: topic.subject, chapter: topic.chapter || "" });
        setBookmarks((rows) => [...rows, created]);
      }
    } catch (err) { setError(err.message || "The bookmark could not be updated. Please try again."); }
    finally { setBookmarkBusy(false); }
  }

  if (data.loading) return <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-[#5f6368]"><Loader2 className="h-5 w-5 animate-spin" /> Loading lesson</div>;
  if (data.error) return <div role="alert" className="p-8 text-sm">Your lesson could not be loaded. <button className="text-blue-700 underline" onClick={() => data.refresh?.()}>Try again</button></div>;
  if (!topic) return <div className="flex flex-col items-center gap-4 p-8 py-20 text-center"><BookOpen className="h-10 w-10 text-[#5f6368]" /><h1 className="text-xl font-medium">This topic is unavailable</h1><p className="text-sm text-[#5f6368]">It may have been removed or belong to a different learning workspace.</p><Link className="text-sm font-medium text-blue-700" to="/dashboard/learn">Back to Learn</Link></div>;
  const context = new URLSearchParams({ subject: topic.subject, topic: topic.name });

  return (
    <div className={focus ? "fixed inset-0 z-50 overflow-y-auto bg-white p-5 sm:p-8" : "mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-5 sm:p-8"}>
      <div className={focus ? "mx-auto max-w-[1000px]" : ""}>
        {!focus && <><Link to={`/dashboard/learn?subject=${encodeURIComponent(topic.subject)}`} className="mb-5 inline-flex items-center gap-2 text-sm text-[#5f6368] hover:text-blue-700"><ArrowLeft className="h-4 w-4" />{topic.subject}</Link><header className="mb-6"><p className="mb-2 text-xs font-medium text-[#5f6368]">{topic.chapter || "Your learning workspace"}</p><h1 className="text-2xl font-medium tracking-tight text-[#202124] sm:text-3xl">{topic.name}</h1></header></>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className={focus ? "" : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]"}>
          <CourseViewer key={topic.id} topic={topic} nextTopic={nextTopic} isBookmarked={bookmarks.some((item) => item.topic_id === topic.id)} bookmarkBusy={bookmarkBusy} onToggleBookmark={toggleBookmark} isFullscreen={focus} onToggleFullscreen={() => setFocus((value) => !value)} />
          {!focus && <aside className="flex flex-col gap-4">
            <section className="rounded-xl border border-[#dadce0] p-5"><h2 className="mb-4 text-sm font-medium">Keep learning</h2><div className="space-y-1">{[{ path: "ask", label: "Ask a question", icon: MessageCircle }, { path: "practice", label: "Practice this topic", icon: Target }, { path: "build", label: "Start a project", icon: Blocks }].map(({ path, label, icon: Icon }) => <Link key={path} to={`/dashboard/${path}?${context}`} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-[#3c4043] hover:bg-[#f8fafd]"><Icon className="h-4 w-4 text-blue-700" />{label}</Link>)}</div></section>
            {topics.length > 1 && <nav aria-label="Subject lessons" className="rounded-xl border border-[#dadce0] p-5"><h2 className="mb-3 text-sm font-medium">In this subject</h2><div className="max-h-80 space-y-1 overflow-y-auto">{topics.map((item) => <Link key={item.id} to={`/dashboard/learn/${item.id}`} aria-current={item.id === topic.id ? "page" : undefined} className={`block rounded-lg px-3 py-2 text-sm ${item.id === topic.id ? "bg-blue-50 font-medium text-blue-700" : "text-[#5f6368] hover:bg-gray-50"}`}>{item.name}</Link>)}</div></nav>}
          </aside>}
        </div>
      </div>
    </div>
  );
}
