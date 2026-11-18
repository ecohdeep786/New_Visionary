import {getResourceEditorDraft,saveResourceEditorDraft,clearResourceEditorDraft} from '@/services/resourceEditorDraft';
import { useWorkspace } from '@/hooks/useWorkspace';
import { legacyLearningCopy } from '@/lib/legacyLearningCopy';
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Bookmark, LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import SubjectPills from "@/components/dashboard/learn/SubjectPills";
import TopicCard from "@/components/dashboard/learn/TopicCard";
import JourneyCatalogue from '@/components/dashboard/JourneyCatalogue';
import LearningWorkspace from './LearningWorkspace';
const filters = [{
  value: "all",
  label: "All topics"
}, {
  value: "not-started",
  label: "Not started"
}, {
  value: "in-progress",
  label: "In progress"
}, {
  value: "mastered",
  label: "Mastered"
}, {
  value: "saved",
  label: "Saved"
}];
export default function Learn() {
  const [params] = useSearchParams();const {ctx}=useWorkspace();
  return params.get('legacy') === '1' || params.has('subject') && !params.has('unit') ? <LegacyLearn key={ctx?.personId+':'+ctx?.workspaceId}/> : <LearningWorkspace />;
}
function LegacyLearn() {
  const {
    data: workspaceData,
    ctx: workspaceCtx
  } = useWorkspace();
  const locale = workspaceData?.preferences.interfaceLocale || 'en';
  const copy = legacyLearningCopy(locale);
  const data = useStudentData();
  const theme = useThemeColor();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [bookmarks, setBookmarks] = useState([]);const [bookmarkFailure,setBookmarkFailure]=useState(false),[bookmarkLoading,setBookmarkLoading]=useState(true),[bookmarkRetry,setBookmarkRetry]=useState(0);const mutationScope=useRef('');mutationScope.current=workspaceCtx?.personId+':'+workspaceCtx?.workspaceId;useEffect(()=>()=>{mutationScope.current='';},[]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const subject = data.subjects.find(s => s.name === params.get("subject"))?.name || data.subjects[0]?.name || "";
  useEffect(() => {
    let current = true;setBookmarks([]);setBookmarkFailure(false);setBookmarkLoading(true);
    base44.entities.Bookmark.list().then(items => {
      if (current) {setBookmarks(items);setBookmarkLoading(false);}
    }).catch(() => {
      if (current) {setBookmarkFailure(true);setBookmarkLoading(false);}
    });
    return () => {
      current = false;
    };
  }, [workspaceCtx?.personId,workspaceCtx?.workspaceId,bookmarkRetry]);
  const bookmarksReady=!bookmarkFailure&&!bookmarkLoading;const draftKey='new:legacy-topic:'+subject;
  useEffect(()=>{if(!dialogOpen||!title||!workspaceCtx)return;try{saveResourceEditorDraft(workspaceCtx,draftKey,{title,body:subject});}catch(error){setError(error.message);}},[dialogOpen,title,subject,workspaceCtx?.personId,workspaceCtx?.workspaceId]);
  const topics = useMemo(() => data.topics.filter(topic => {
    if (topic.subject !== subject || !topic.name.toLowerCase().includes(query.toLowerCase().trim())) return false;
    if (filter === "saved") return bookmarks.some(b => b.topic_id === topic.id);
    if (filter === "in-progress") return ["in-progress", "needs-review"].includes(topic.status);
    return filter === "all" || (topic.status || "not-started") === filter;
  }).sort((a, b) => (a.chapter || a.name).localeCompare(b.chapter || b.name, undefined, {
    numeric: true
  })), [data.topics, subject, query, filter, bookmarks]);
  async function addTopic(event) {
    event.preventDefault();
    if (!title.trim() || !subject || saving) return;
    const requestScope=mutationScope.current;setSaving(true);
    setError("");
    try {
      if (data.topics.some(topic => topic.subject === subject && topic.name.toLowerCase() === title.trim().toLowerCase())) throw new Error("This topic is already in your lessons.");
      await base44.entities.Topic.create({
        name: title.trim(),
        subject,
        status: "not-started",
        practice_count: 0,
        mastery: 0
      });
      if(mutationScope.current!==requestScope)return;await data.refresh?.();if(mutationScope.current!==requestScope)return;try{clearResourceEditorDraft(workspaceCtx,draftKey);}catch(error){setError(error.message);}
      setTitle("");
      setDialogOpen(false);
    } catch (err) {
      if(mutationScope.current===requestScope)setError(err.message || "The topic could not be saved. Please try again.");
    } finally {
      if(mutationScope.current===requestScope)setSaving(false);
    }
  }
  return <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-5 sm:p-8" lang={locale}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-medium tracking-tight text-[#1d1d1f]">{copy("Learn")}</h1><p className="mt-2 text-sm text-[#6e6e73]">{copy("Follow your curiosity. Understand an idea, then put it to work.")}</p></div>
        <button onClick={() => {
        setError("");try{const backup=getResourceEditorDraft(workspaceCtx,draftKey);if(backup&&backup.draft.body===subject)setTitle(backup.draft.title);}catch(error){setError(error.message);}
        setDialogOpen(true);
      }} disabled={!subject || data.loading} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-40" style={{
        backgroundColor: theme.accent
      }}><Plus className="h-4 w-4" /> {copy("Add topic")}</button>
      </header>
      <JourneyCatalogue />
      {bookmarkFailure&&<p role="alert" className="v-notice v-error">{copy("Saved topics are unavailable. Your topics and bookmarks have not been changed.")} <button type="button" className="v-button" onClick={()=>setBookmarkRetry(value=>value+1)}>{copy("Retry saved topics")}</button></p>}
      {data.loading ? <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-[#6e6e73]"><Loader2 className="h-5 w-5 animate-spin" /> {copy("Loading your lessons")}</div> : data.error ? <div role="alert" className="rounded-xl border p-6 text-sm">{copy("Your lessons could not be loaded.")} <button className="text-[#0071e3] underline" onClick={() => data.refresh?.()}>{copy("Try again")}</button></div> : <>
        <div className="flex flex-wrap items-center gap-3"><SubjectPills subjects={data.subjects} activeSubject={subject} onSelect={name => {
          setParams({
            subject: name
          });
          setFilter("all");
          setQuery("");
        }} /><Link to="/dashboard/profile" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[#6e6e73] px-4 py-2 text-sm text-[#0071e3]"><Plus className="h-4 w-4" />{copy("Learning area")}</Link></div>
        <Link to="/dashboard/explore" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d2d2d7] bg-[#ffffff] p-5"><div><p className="text-xs font-medium text-[#0071e3]">{copy("Explore in 3D \xB7 Interactive example")}</p><h2 className="mt-2 text-lg font-medium">{copy("See how a small change grows.")}</h2><p className="mt-1 text-sm text-[#6e6e73]">{copy("Rotate a cube, change its size, and discover volume.")}</p></div><span className="rounded-full bg-white px-4 py-2 text-sm text-[#0071e3]">{copy("Open lab \u2192")}</span></Link>
        <section className="rounded-xl border border-[#d2d2d7] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d2d2d7] p-4">
            <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs"><Search className="h-4 w-4 shrink-0 text-[#6e6e73]" /><span className="sr-only">{copy("Search topics")}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={copy("Search topics")} className="w-full min-w-0 bg-transparent py-1 text-sm outline-none" /></label>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="lesson-status">{copy("Topic status")}</label><select id="lesson-status" value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-[#d2d2d7] bg-white px-3 py-2 text-sm">{filters.map(f => <option key={f.value} value={f.value}>{copy(f.label)}</option>)}</select>
              <div className="flex rounded-xl border border-[#d2d2d7] p-1">{[{
                id: "grid",
                icon: LayoutGrid
              }, {
                id: "list",
                icon: List
              }].map(({
                id,
                icon: Icon
              }) => <button key={id} onClick={() => setView(id)} aria-label={copy(`${id} view`)} aria-pressed={view === id} className={`rounded-xl p-2 ${view === id ? "bg-[#eef5ff] text-[#0071e3]" : "text-[#6e6e73] hover:bg-[#1d1d1f]/5"}`}><Icon className="h-4 w-4" /></button>)}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-medium text-[#1d1d1f]">{subject || copy("Your lessons")}</h2><span className="text-xs text-[#6e6e73]">{filter==='saved'&&!bookmarksReady?copy('Saved topic count unavailable'):copy('{count} topics', {
                count: topics.length
              })}</span></div>
            {filter==="saved"&&!bookmarksReady?<p className="v-notice" role="status">{copy(bookmarkLoading?"Loading saved topics…":"Saved topic count unavailable")}</p>:topics.length ? <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>{topics.map(topic => <TopicCard key={topic.id} topic={topic} variant={view} />)}</div> : <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
              <div className="rounded-2xl bg-[#d2d2d7] p-4">{filter === "saved" ? <Bookmark className="h-7 w-7 text-[#6e6e73]" /> : <BookOpen className="h-7 w-7 text-[#6e6e73]" />}</div>
              <h3 className="text-base font-medium text-[#1d1d1f]">{query || filter !== "all" ? copy("No matching topics") : copy("Make room for your next discovery")}</h3>
              <p className="max-w-md text-sm leading-6 text-[#6e6e73]">{query || filter !== "all" ? copy("Try a different search or filter. Save a topic from its lesson to find it here.") : subject ? copy("Add a topic you want to explore. Your class assignments remain in Classes, alongside your personal learning.") : copy("Add a learning area in Profile to get started.")}</p>
              {query || filter !== "all" ? <button className="text-sm font-medium text-[#0071e3]" onClick={() => {
              setQuery("");
              setFilter("all");
            }}>Clear filters</button> : <Link to={subject ? "/dashboard/classes" : "/dashboard/profile"} className="text-sm font-medium text-[#0071e3]">{subject ? copy("Go to classes") : copy("Open profile")}</Link>}
            </div>}
          </div>
        </section>
      </>}
      {error && !dialogOpen && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent lang={locale} className="max-w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md"><DialogTitle>{copy("Add a topic")}</DialogTitle><DialogDescription>{copy('Keep track of a concept you want to learn in {subject}.', {
            subject
          })}</DialogDescription><form onSubmit={addTopic} className="space-y-4"><label className="block text-sm font-medium">{copy("Topic name")}<input disabled={saving} required maxLength={140} value={title} onChange={e => setTitle(e.target.value)} placeholder={copy("For example, quadratic equations")} className="mt-2 w-full rounded-xl border border-[#d2d2d7] p-3 font-normal" /></label>{error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-full px-4 py-2 text-sm">Cancel</button><button disabled={saving || !title.trim()} className="rounded-full bg-[#0071e3] px-5 py-2 text-sm font-medium text-white disabled:opacity-40">{saving ? copy("Saving\u2026") : copy("Add topic")}</button></div></form></DialogContent></Dialog>
    </div>;
}
