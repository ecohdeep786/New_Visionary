import { legacyLearningCopy } from '@/lib/legacyLearningCopy';
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Blocks, BookOpen, Loader2, MessageCircle, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import CourseViewer from "@/components/dashboard/learn/CourseViewer";
import { useWorkspace } from '@/hooks/useWorkspace';
export default function TopicDetail() {
  const {
    ctx,
    data: workspaceData
  } = useWorkspace();
  const locale = workspaceData?.preferences.interfaceLocale || 'en';
  const copy = legacyLearningCopy(locale);
  const {
    topicId
  } = useParams();
  const data = useStudentData();
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState(false);
  const [bookmarkFailure, setBookmarkFailure] = useState(false);
  const [bookmarkRetry, setBookmarkRetry] = useState(0);
  const scope = useRef('');
  scope.current = `${ctx?.personId}:${ctx?.workspaceId}:${topicId}`;
  useEffect(() => () => {
    scope.current = '';
  }, []);
  const topic = data.topics.find(item => item.id === topicId);
  const topics = data.topics.filter(item => item.subject === topic?.subject).sort((a, b) => (a.chapter || a.name).localeCompare(b.chapter || b.name, undefined, {
    numeric: true
  }));
  const nextTopic = topics[topics.findIndex(item => item.id === topicId) + 1];
  useEffect(() => {
    setFocus(false);
    setError("");
    setBookmarkBusy(false);
  }, [topicId, ctx?.personId, ctx?.workspaceId]);
  useEffect(() => {
    let active = true;
    setBookmarks([]);
    setBookmarkFailure(false);
    setBookmarkBusy(true);
    base44.entities.Bookmark.list().then(rows => {
      if (active) {
        setBookmarks(rows);
        setBookmarkBusy(false);
      }
    }).catch(() => {
      if (active) {
        setBookmarkFailure(true);
        setBookmarkBusy(false);
      }
    });
    return () => {
      active = false;
    };
  }, [ctx?.personId, ctx?.workspaceId, bookmarkRetry]);
  useEffect(() => {
    if (!focus) return;
    const escape = event => {
      if (event.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [focus]);
  async function toggleBookmark() {
    if (bookmarkBusy || bookmarkFailure) return;
    const requestScope = scope.current;
    setBookmarkBusy(true);
    setError("");
    try {
      const existing = bookmarks.find(item => item.topic_id === topic.id);
      if (existing) {
        await base44.entities.Bookmark.delete(existing.id);
        if (scope.current === requestScope) setBookmarks(rows => rows.filter(item => item.id !== existing.id));
      } else {
        const created = await base44.entities.Bookmark.create({
          topic_id: topic.id,
          topic_name: topic.name,
          subject: topic.subject,
          chapter: topic.chapter || ""
        });
        if (scope.current === requestScope) setBookmarks(rows => [...rows, created]);
      }
    } catch (err) {
      if (scope.current === requestScope) setError(err.message || "The bookmark could not be updated. Please try again.");
    } finally {
      if (scope.current === requestScope) setBookmarkBusy(false);
    }
  }
  if (data.loading) return <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-[#5f6368]" lang={locale}><Loader2 className="h-5 w-5 animate-spin" /> {copy("Loading lesson")}</div>;
  if (data.error) return <div role="alert" className="p-8 text-sm" lang={locale}>{copy("Your lesson could not be loaded.")} <button className="text-[#0b57d2] underline" onClick={() => data.refresh?.()}>{copy("Try again")}</button></div>;
  if (!topic) return <div className="flex flex-col items-center gap-4 p-8 py-20 text-center" lang={locale}><BookOpen className="h-10 w-10 text-[#5f6368]" /><h1 className="text-xl font-medium">{copy("This topic is unavailable")}</h1><p className="text-sm text-[#5f6368]">{copy("It may have been removed or belong to a different learning workspace.")}</p><Link className="text-sm font-medium text-[#0b57d2]" to="/dashboard/learn">{copy("Back to Learn")}</Link></div>;
  const context = new URLSearchParams({
    subject: topic.subject,
    topic: topic.name
  });
  return <div className={focus ? "mx-auto flex w-full max-w-[1000px] flex-col gap-6 p-5 sm:p-8" : "mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-5 sm:p-8"} lang={locale}>
      <div className={focus ? "mx-auto max-w-[1000px]" : ""}>
        {!focus && <><Link to={`/dashboard/learn?subject=${encodeURIComponent(topic.subject)}`} className="mb-5 inline-flex items-center gap-2 text-sm text-[#5f6368] hover:text-[#0b57d2]"><ArrowLeft className="h-4 w-4" />{topic.subject}</Link><header className="mb-6"><p className="mb-2 text-xs font-medium text-[#5f6368]">{topic.chapter || copy("Your learning workspace")}</p><h1 className="text-2xl font-medium tracking-tight text-[#121317] sm:text-3xl">{topic.name}</h1></header></>}
        {bookmarkFailure && <p className="v-notice v-error" role="alert">{copy("Saved topics are unavailable. Your topics and bookmarks have not been changed.")} <button type="button" className="v-button" onClick={() => setBookmarkRetry(value => value + 1)}>{copy("Retry saved topics")}</button></p>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-[#fce8e6] p-3 text-sm text-[#b3261e]">{error}</p>}
        <div className={focus ? "" : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]"}>
          {topic.lab === "cube-volume" ? <section className="rounded-2xl border border-[#dadce0] bg-[#ffffff] p-8"><h2 className="text-xl font-medium">{copy("Explore cube volume in 3D")}</h2><p className="mt-3 text-sm leading-6 text-[#5f6368]">{copy("Change the side length and see how volume changes in three dimensions.")}</p><Link to="/dashboard/explore" className="mt-5 inline-block rounded-full bg-[#0b57d2] px-5 py-2.5 text-sm text-white">{copy("Open interactive lab")}</Link></section> : <CourseViewer key={topic.id} topic={topic} nextTopic={nextTopic} isBookmarked={bookmarks.some(item => item.topic_id === topic.id)} bookmarkBusy={bookmarkBusy || bookmarkFailure} onToggleBookmark={toggleBookmark} isFullscreen={focus} onToggleFullscreen={() => setFocus(value => !value)} />}
          {!focus && <aside className="flex flex-col gap-4">
            <section className="rounded-xl border border-[#dadce0] p-5"><h2 className="mb-4 text-sm font-medium">{copy("Keep learning")}</h2><div className="space-y-1">{[{
                path: "ask",
                label: "Ask a question",
                icon: MessageCircle
              }, {
                path: "practice",
                label: "Practice this topic",
                icon: Target
              }, {
                path: "build",
                label: "Start a project",
                icon: Blocks
              }].map(({
                path,
                label,
                icon: Icon
              }) => <Link key={path} to={`/dashboard/${path}?${context}`} className="flex items-center gap-3 rounded-lg px-2 py-3 text-sm text-[#5f6368] hover:bg-[#ffffff]"><Icon className="h-4 w-4 text-[#0b57d2]" />{copy(label)}</Link>)}</div></section>
            {topics.length > 1 && <nav aria-label={copy("Subject lessons")} className="rounded-xl border border-[#dadce0] p-5"><h2 className="mb-3 text-sm font-medium">{copy("In this subject")}</h2><div className="max-h-80 space-y-1 overflow-y-auto">{topics.map(item => <Link key={item.id} to={`/dashboard/learn/${item.id}`} aria-current={item.id === topic.id ? "page" : undefined} className={`block rounded-lg px-3 py-2 text-sm ${item.id === topic.id ? "bg-[#e8f0fd] font-medium text-[#0b57d2]" : "text-[#5f6368] hover:bg-[#121317]/5"}`}>{item.name}</Link>)}</div></nav>}
          </aside>}
        </div>
      </div>
    </div>;
}
