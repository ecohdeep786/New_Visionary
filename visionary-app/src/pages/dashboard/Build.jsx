import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Blocks, CheckCircle2, FolderOpen, Loader2, Plus, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const blankProject = { title: "", subject: "", topic_id: "", notes: "", status: "in-progress" };
const fieldClass = "mt-2 w-full rounded-lg border border-[#dadce0] bg-white p-3 text-sm font-normal";

export default function Build() {
  const data = useStudentData();
  const theme = useThemeColor();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true); setError("");
    try { setProjects(await base44.entities.Project.list("-updatedAt")); }
    catch { setError("Your projects could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadProjects(); }, []);

  function newProject() {
    const subject = data.subjects.find((s) => s.name === params.get("subject"))?.name || data.subjects[0]?.name || "";
    const topic = data.topics.find((t) => t.name === params.get("topic") && t.subject === subject);
    setDraft({ ...blankProject, subject, topic_id: topic?.id || "" }); setError("");
  }
  async function saveProject(event) {
    event.preventDefault();
    if (!draft.title.trim() || saving) return;
    setSaving(true); setError("");
    try {
      const record = { title: draft.title.trim(), subject: draft.subject, topic_id: draft.topic_id, notes: draft.notes.trim(), status: draft.status, updatedAt: Date.now() };
      const saved = draft.id ? await base44.entities.Project.update(draft.id, record) : await base44.entities.Project.create(record);
      setProjects((previous) => [saved, ...previous.filter((p) => p.id !== saved.id)]); setDraft(null);
    } catch (err) { setError(err.message || "Your project could not be saved. Please try again."); }
    finally { setSaving(false); }
  }
  const visible = projects.filter((p) => (filter === "all" || p.status === filter) && [p.title, p.subject].some((s) => s?.toLowerCase().includes(query.toLowerCase().trim())));
  const completed = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 p-5 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-medium tracking-tight text-[#202124]">Build</h1><p className="mt-2 text-sm text-[#5f6368]">Turn what you learn into something of your own.</p></div>
        <button onClick={newProject} disabled={data.loading || loading} className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: theme.accent }}><Plus className="h-4 w-4" /> New project</button>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {[{ label: "Your projects", count: projects.length, icon: FolderOpen }, { label: "In progress", count: projects.length - completed, icon: Blocks }, { label: "Completed", count: completed, icon: CheckCircle2 }].map(({ label, count, icon: Icon }) => <div key={label} className="flex items-center gap-4 rounded-xl border border-[#dadce0] bg-white p-5"><Icon className="h-5 w-5 text-[#5f6368]" /><div><p className="text-xl font-medium">{loading ? "—" : count}</p><p className="mt-1 text-xs text-[#5f6368]">{label}</p></div></div>)}
      </div>
      <section className="rounded-xl border border-[#dadce0] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dadce0] p-4">
          <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs"><Search className="h-4 w-4 shrink-0 text-[#5f6368]" /><span className="sr-only">Search projects</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="w-full min-w-0 bg-transparent py-1 text-sm outline-none" /></label>
          <label className="text-sm"><span className="sr-only">Project status</span><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-[#dadce0] bg-white px-3 py-2"><option value="all">All projects</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
        </div>
        {loading ? <div role="status" className="flex items-center justify-center gap-3 py-24 text-sm text-[#5f6368]"><Loader2 className="h-5 w-5 animate-spin" /> Loading projects</div> : error && !draft ? <div role="alert" className="p-6 text-sm text-red-700">{error} <button onClick={loadProjects} className="underline">Try again</button></div> : visible.length ? <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((project) => {
          const topic = data.topics.find((t) => t.id === project.topic_id);
          return <article key={project.id} className="flex flex-col rounded-xl border border-[#dadce0] p-5">
            <div className="mb-5 flex items-center justify-between gap-3"><div className="rounded-xl p-3" style={{ backgroundColor: theme.light, color: theme.accent }}><Blocks className="h-5 w-5" /></div><span className={`rounded-md px-2 py-1 text-xs ${project.status === "completed" ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800"}`}>{project.status === "completed" ? "Completed" : "In progress"}</span></div>
            <p className="text-xs text-[#5f6368]">{project.subject || "Independent project"}</p><h2 className="mt-1 text-base font-medium">{project.title}</h2><p className="mt-3 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-6 text-[#5f6368]">{project.notes || "Add your idea, steps, and what you discover as you build."}</p>
            {topic && <Link className="mt-4 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" to={`/dashboard/learn/${topic.id}`}>Lesson: {topic.name}</Link>}
            <button onClick={() => { setDraft({ ...blankProject, ...project }); setError(""); }} className="mt-5 inline-flex items-center gap-2 self-start text-sm font-medium" style={{ color: theme.accent }}>Open project <ArrowRight className="h-4 w-4" /></button>
          </article>;
        })}</div> : <div className="flex flex-col items-center gap-3 px-5 py-16 text-center"><div className="rounded-2xl bg-[#f1f3f4] p-4"><Blocks className="h-8 w-8 text-[#5f6368]" /></div><h2 className="text-lg font-medium">{query || filter !== "all" ? "No projects match your filters" : "Big ideas start with a small project"}</h2><p className="max-w-md text-sm leading-6 text-[#5f6368]">{query || filter !== "all" ? "Try another search or view all your projects." : "Create a project notebook, connect it to a lesson, and keep your plan and discoveries together."}</p>{query || filter !== "all" ? <button onClick={() => { setQuery(""); setFilter("all"); }} className="text-sm font-medium text-blue-700">Clear filters</button> : <button onClick={newProject} className="mt-2 rounded-full border border-[#dadce0] px-5 py-2 text-sm font-medium text-blue-700">Create your first project</button>}</div>}
      </section>
      <Dialog open={!!draft} onOpenChange={(open) => { if (!open) setDraft(null); }}><DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl sm:max-w-xl"><DialogTitle>{draft?.id ? "Project notebook" : "New project"}</DialogTitle><DialogDescription>Capture your idea, plan your steps, and record what you learn.</DialogDescription>{draft && <form onSubmit={saveProject} className="space-y-4">
        <label className="block text-sm font-medium">Project title<input required maxLength={140} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What would you like to build?" className={fieldClass} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Subject<select className={fieldClass} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value, topic_id: "" })}><option value="">Independent project</option>{data.subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></label><label className="block text-sm font-medium">Related topic<select className={fieldClass} value={draft.topic_id} onChange={(e) => setDraft({ ...draft, topic_id: e.target.value })}><option value="">No linked topic</option>{data.topics.filter((t) => t.subject === draft.subject).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
        <label className="block text-sm font-medium">Notes and progress<textarea rows={7} maxLength={20000} className={fieldClass} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="My idea…&#10;Steps to try…&#10;What I learned…" /></label>
        <label className="block text-sm font-medium">Status<select className={fieldClass} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={() => setDraft(null)} className="rounded-full px-4 py-2 text-sm">Cancel</button><button disabled={saving || !draft.title.trim()} className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40">{saving ? "Saving…" : "Save project"}</button></div>
      </form>}</DialogContent></Dialog>
    </div>
  );
}
