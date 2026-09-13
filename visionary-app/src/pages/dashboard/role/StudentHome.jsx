import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUp, ArrowRight, BookOpen, Blocks, Globe2, Plus, Users, GraduationCap, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/AuthContext";
import { learningLanguage } from "@/lib/productAccess";

export default function StudentHome() {
  const data = useStudentData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState("personal");
  const name = user?.full_name?.split(" ")[0] || "there";
  const { data: connections = { classes: [], organizations: [], requests: 0 } } = useQuery({
    queryKey: ["workspace", "home-connections", user?.email],
    queryFn: async () => {
      const [enrollments, classes, organizations, family] = await Promise.all([
        appClient.entities.Enrollment.filter({ student_email: user.email }), appClient.entities.Classroom.list(),
        appClient.entities.OrganizationInvite.filter({ email: user.email }), appClient.entities.FamilyLink.filter({ child_email: user.email }),
      ]);
      return { classes: classes.filter(c => enrollments.some(e => e.class_id === c.id && e.status === "active")),
        organizations: organizations.filter(o => o.status === "active"),
        requests: organizations.filter(o => o.status === "pending").length + family.filter(f => f.status === "pending").length };
    },
  });
  const next = data.resumeTopic || data.upNext;
  return <div className="mx-auto w-full max-w-[1240px] space-y-8 p-5 sm:p-8 lg:p-10">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm text-[#5f6368]">Your personal learning space</p><h1 className="mt-1 text-2xl font-medium tracking-tight">Hello, {name}</h1></div>
      <Link to="/dashboard/settings" className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-3 py-2 text-xs text-[#5f6368]"><Globe2 className="h-4 w-4" />{learningLanguage(user)}</Link>
    </header>
    <section className="relative overflow-hidden rounded-3xl border border-[#dce6f5] bg-[#f6f9ff] p-6 sm:p-8">
      <div className="relative z-10 max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#1967d2]"><Sparkles className="h-4 w-4" />Visionary PA</div>
        <h2 className="text-[28px] font-normal leading-tight tracking-tight sm:text-[34px]">A little curiosity.<br />A whole new possibility.</h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#5f6368]">Understand an idea, explore it your way, and turn what you learn into something you can build.</p>
        <form onSubmit={e => { e.preventDefault(); if (question.trim()) navigate("/dashboard/ask", { state: { initialQuestion: question.trim() } }); }} className="mt-6 flex items-center gap-3 rounded-2xl border border-[#dadce0] bg-white p-2 pl-4 shadow-sm">
          <label className="sr-only" htmlFor="home-question">What would you like to understand or build?</label><input id="home-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={6000} placeholder="What would you like to understand or build?" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          <button aria-label="Open question in Ask" disabled={!question.trim()} className="rounded-xl bg-[#1967d2] p-2.5 text-white disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
        </form><p className="mt-3 text-xs text-[#5f6368]">AI responses are not connected in this preview. You can save questions now.</p>
      </div>
      <div aria-hidden="true" className="absolute -right-8 top-8 hidden h-56 w-56 rounded-full border-[30px] border-[#dce8fc] lg:block"><div className="m-5 h-28 w-28 rotate-12 rounded-[30px] border-[18px] border-[#b9cff5]" /></div>
    </section>
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e1e3e1] pb-3" role="tablist" aria-label="Learning context">
      {[["personal", "My learning"], ["connected", "Connected spaces"]].map(([id,label]) => <button key={id} role="tab" id={id + "-tab"} aria-selected={scope === id} aria-controls="home-context" onClick={() => setScope(id)} className={`rounded-full px-4 py-2 text-sm ${scope === id ? "bg-[#e8f0fe] font-medium text-[#1967d2]" : "text-[#5f6368] hover:bg-gray-50"}`}>{label}</button>)}
      <Link to="/dashboard/connections" className="ml-auto inline-flex items-center gap-2 px-2 py-2 text-sm text-[#1967d2]"><Users className="h-4 w-4" />{connections.requests ? connections.requests + " requests" : "Manage connections"}</Link>
    </div>
    <div id="home-context" role="tabpanel" aria-labelledby={scope + "-tab"}>
      {scope === "personal" ? <div className="space-y-6">
        {data.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm">Learning data could not be loaded. <button onClick={() => data.refresh()} className="text-blue-700 underline">Try again</button></p> : data.loading ? <p role="status" className="py-8 text-sm text-[#5f6368]">Loading your learning space…</p> : <>
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-[#dadce0] p-6"><p className="mb-4 text-xs font-medium uppercase tracking-wider text-[#5f6368]">{next ? "Pick up where you left off" : "Your next step"}</p><BookOpen className="mb-4 h-6 w-6 text-[#1967d2]" /><h2 className="text-xl font-medium">{next?.name || "Make space for your curiosity"}</h2><p className="mt-2 text-sm leading-6 text-[#5f6368]">{next ? next.subject + " · Learn, ask, practice, and build around the same idea." : "Choose an area you care about and add a topic. Your learning space grows with you, inside and beyond a classroom."}</p><Link to={next ? "/dashboard/learn/" + next.id : "/dashboard/learn"} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1967d2] px-5 py-2.5 text-sm font-medium text-white">{next ? "Continue learning" : "Explore Learn"}<ArrowRight className="h-4 w-4" /></Link></section>
            <section className="rounded-2xl border border-[#dadce0] p-6"><h2 className="text-base font-medium">Small steps, real progress</h2><dl className="mt-5 grid grid-cols-3 gap-3">{[[data.dailyStats.minutesToday,"Minutes today"],[data.dailyStats.streak,"Day streak"],[data.topics.filter(t => t.status === "mastered").length,"Topics mastered"]].map(([v,l]) => <div key={l}><dd className="text-2xl font-medium">{v}</dd><dt className="mt-2 text-xs leading-5 text-[#5f6368]">{l}</dt></div>)}</dl><p className="mt-5 border-t border-[#eef0f2] pt-4 text-xs leading-5 text-[#5f6368]">Based on recorded learning and graded work. Your starting confidence is not an assessment.</p></section>
          </div>
          <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium">Your learning areas</h2><Link to="/dashboard/learn" className="text-sm text-[#1967d2]">View all</Link></div><div className="flex flex-wrap gap-3">{data.subjects.slice(0,8).map(s => <Link key={s.id} to={"/dashboard/learn?subject=" + encodeURIComponent(s.name)} className="rounded-xl border border-[#dadce0] px-4 py-3 text-sm hover:bg-[#f8fafd]">{s.name}<span className="ml-3 text-xs text-[#5f6368]">{s.topics_total} topics</span></Link>)}<Link to="/dashboard/profile" className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#bdc1c6] px-4 py-3 text-sm text-[#1967d2]"><Plus className="h-4 w-4" />Add learning area</Link></div></section>
        </>}
        <div className="grid gap-4 sm:grid-cols-2">{[{to:"/dashboard/build",icon:Blocks,title:"Turn an idea into a project",desc:"Keep your plan, experiments, and discoveries together."},{to:"/dashboard/explore",icon:Sparkles,title:"See an idea in another dimension",desc:"Explore a hands-on 3D geometry lab."}].map(({to,icon:Icon,title,desc}) => <Link key={to} to={to} className="flex items-start gap-4 rounded-2xl border border-[#dadce0] p-5 hover:bg-[#f8fafd]"><Icon className="mt-1 h-5 w-5 shrink-0 text-[#1967d2]" /><div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-xs leading-5 text-[#5f6368]">{desc}</p></div><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[#5f6368]" /></Link>)}</div>
      </div> : <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-medium">Learn independently. Grow together.</h2><p className="mt-2 text-sm text-[#5f6368]">Your personal learning stays yours when you join a class or organization.</p></div><Link to="/dashboard/classes?join=1" className="rounded-full bg-[#1967d2] px-5 py-2.5 text-sm text-white">Join a class</Link></div>
        {connections.classes.length + connections.organizations.length === 0 ? <div className="rounded-2xl border border-dashed border-[#bdc1c6] p-10 text-center"><Users className="mx-auto mb-4 h-8 w-8 text-[#5f6368]" /><h3 className="font-medium">No connected spaces yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5f6368]">Use a teacher’s class code or accept an organization request. You can keep learning on your own meanwhile.</p><Link to="/dashboard/connections" className="mt-4 inline-block text-sm text-[#1967d2]">View connection requests</Link></div> : <div className="grid gap-4 sm:grid-cols-2">{connections.classes.map(c => <Link key={c.id} to={"/dashboard/class/" + c.id} className="rounded-2xl border border-[#dadce0] p-5"><GraduationCap className="mb-3 h-6 w-6 text-[#1967d2]" /><h3 className="font-medium">{c.name}</h3><p className="mt-2 text-sm text-[#5f6368]">{c.organization_name || "Independent class"} · {c.teacher_name}</p></Link>)}{connections.organizations.map(o => <Link key={o.id} to="/dashboard/connections" className="rounded-2xl border border-[#dadce0] p-5"><Users className="mb-3 h-6 w-6 text-[#1967d2]" /><h3 className="font-medium">{o.organization_name || o.organization_email}</h3><p className="mt-2 text-sm text-[#5f6368]">Organization · Connected</p></Link>)}</div>}
      </section>}
    </div>
  </div>;
}

