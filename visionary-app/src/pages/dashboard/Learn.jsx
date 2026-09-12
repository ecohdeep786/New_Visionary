import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Bookmark, LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SubjectPills from "@/components/dashboard/learn/SubjectPills";
import TopicCard from "@/components/dashboard/learn/TopicCard";

const filters = [{ value: "all", label: "All topics" }, { value: "not-started", label: "Not started" }, { value: "in-progress", label: "In progress" }, { value: "mastered", label: "Mastered" }, { value: "saved", label: "Saved" }];

export default function Learn() {
  const data = useStudentData();
  const theme = useThemeColor();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [bookmarks, setBookmarks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const subject = data.subjects.find((s) => s.name === params.get("subject"))?.name || data.subjects[0]?.name || "";

  useEffect(() => {
    let current = true;
    base44.entities.Bookmark.list().then((items) => { if (current) setBookmarks(items); }).catch(() => { if (current) setError("Saved topics could not be loaded. Please refresh to try again."); });
    return () => { current = false; };
  }, []);

  const topics = useMemo(() => data.topics.filter((topic) => {
    if (topic.subject !== subject || !topic.name.toLowerCase().includes(query.toLowerCase().trim())) return false;
    if (filter === "saved") return bookmarks.some((b) => b.topic_id === topic.id);
    if (filter === "in-progress") return ["in-progress", "needs-review"].includes(topic.status);
    return filter === "all" || (topic.status || "not-started") === filter;
  }).sort((a, b) => (a.chapter || a.name).localeCompare(b.chapter || b.name, undefined, { numeric: true })), [data.topics, subject, query, filter, bookmarks]);

  async function addTopic(event) {
    event.preventDefault();
    if (!title.trim() || !subject || saving) return;
    setSaving(true); setError("");
    try {
      if (data.topics.some((topic) => topic.subject === subject && topic.name.toLowerCase() === title.trim().toLowerCase())) throw new Error("This topic is already in your lessons.");
      await base44.entities.Topic.create({ name: title.trim(), subject, status: "not-started", practice_count: 0, mastery: 0 });
      await data.refresh?.();
      setTitle(""); setDialogOpen(false);
    } catch (err) { setError(err.message || "The topic could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-5 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-medium tracking-tight text-[#202124]">Learn</h1><p className="mt-2 text-sm text-[#5f6368]">Your subjects, lessons, and saved topics in one place.</p></div>
        <button onClick={() => { setError(""); setDialogOpen(true); }} disabled={!subject || data.loading} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: theme.accent }}><Plus className="h-4 w-4" /> Add topic</button>
      </header>
      {data.loading ? <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-[#5f6368]"><Loader2 className="h-5 w-5 animate-spin" /> Loading your lessons</div> : data.error ? <div role="alert" className="rounded-xl border p-6 text-sm">Your lessons could not be loaded. <button className="text-blue-700 underline" onClick={() => data.refresh?.()}>Try again</button></div> : <>
        <SubjectPills subjects={data.subjects} activeSubject={subject} onSelect={(name) => { setParams({ subject: name }); setFilter("all"); setQuery(""); }} />
        <section className="rounded-xl border border-[#dadce0] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dadce0] p-4">
            <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs"><Search className="h-4 w-4 shrink-0 text-[#5f6368]" /><span className="sr-only">Search topics</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search topics" className="w-full min-w-0 bg-transparent py-1 text-sm outline-none" /></label>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="lesson-status">Topic status</label><select id="lesson-status" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-sm">{filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
              <div className="flex rounded-lg border border-[#dadce0] p-1">{[{ id: "grid", icon: LayoutGrid }, { id: "list", icon: List }].map(({ id, icon: Icon }) => <button key={id} onClick={() => setView(id)} aria-label={`${id} view`} aria-pressed={view === id} className={`rounded-md p-2 ${view === id ? "bg-blue-50 text-blue-700" : "text-[#5f6368] hover:bg-gray-50"}`}><Icon className="h-4 w-4" /></button>)}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-medium text-[#202124]">{subject || "Your lessons"}</h2><span className="text-xs text-[#5f6368]">{topics.length} {topics.length === 1 ? "topic" : "topics"}</span></div>
            {topics.length ? <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>{topics.map((topic) => <TopicCard key={topic.id} topic={topic} variant={view} />)}</div> : <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
              <div className="rounded-2xl bg-[#f1f3f4] p-4">{filter === "saved" ? <Bookmark className="h-7 w-7 text-[#5f6368]" /> : <BookOpen className="h-7 w-7 text-[#5f6368]" />}</div>
              <h3 className="text-base font-medium text-[#202124]">{query || filter !== "all" ? "No matching topics" : "Make room for your next discovery"}</h3>
              <p className="max-w-md text-sm leading-6 text-[#5f6368]">{query || filter !== "all" ? "Try a different search or filter. Save a topic from its lesson to find it here." : subject ? "Add a topic you want to study. Lessons from your connected classes will also appear as they become available." : "Choose your subjects in your learning profile to get started."}</p>
              {query || filter !== "all" ? <button className="text-sm font-medium text-blue-700" onClick={() => { setQuery(""); setFilter("all"); }}>Clear filters</button> : <Link to={subject ? "/dashboard/classes" : "/dashboard/profile"} className="text-sm font-medium text-blue-700">{subject ? "Go to classes" : "Open profile"}</Link>}
            </div>}
          </div>
        </section>
      </>}
      {error && !dialogOpen && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md"><DialogTitle>Add a topic</DialogTitle><DialogDescription>Keep track of a concept you want to learn in {subject}.</DialogDescription><form onSubmit={addTopic} className="space-y-4"><label className="block text-sm font-medium">Topic name<input required maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example, quadratic equations" className="mt-2 w-full rounded-lg border border-[#dadce0] p-3 font-normal" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-full px-4 py-2 text-sm">Cancel</button><button disabled={saving || !title.trim()} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40">{saving ? "Saving…" : "Add topic"}</button></div></form></DialogContent></Dialog>
    </div>
  );
}
