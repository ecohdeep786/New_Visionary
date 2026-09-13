import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Settings, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useStudentData } from "@/hooks/useStudentData";
import { appClient } from "@/api/appClient";
import { learningLanguage } from "@/lib/productAccess";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const data = useStudentData();
  const [name, setName] = useState(user?.full_name || "");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function saveName(event) {
    event.preventDefault(); setBusy(true); setStatus("");
    try { await updateUser({ full_name: name.trim() }); setStatus("Profile saved."); }
    catch (err) { setStatus(err.message || "Could not save your profile."); }
    finally { setBusy(false); }
  }
  async function addSubject(event) {
    event.preventDefault();
    if (!subject.trim() || busy) return;
    setBusy(true); setStatus("");
    try {
      const title = subject.trim();
      if (data.subjects.some(s => s.name.toLowerCase() === title.toLowerCase())) throw new Error("This learning area is already in your workspace.");
      await appClient.entities.Subject.create({ name: title, overall_mastery: 0, topics_mastered: 0, topics_total: 0 });
      setSubject(""); await data.refresh(); setStatus("Learning area added. Open it in Learn to add your first topic.");
    } catch (err) { setStatus(err.message || "Could not add this learning area."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-[900px] space-y-6 p-5 sm:p-8">
    <header><h1 className="text-2xl font-medium">Your profile</h1><p className="mt-2 text-sm text-[#5f6368]">One identity, wherever your learning takes you.</p></header>
    <section className="rounded-2xl border border-[#dadce0] p-6"><div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1967d2] text-2xl text-white">{(user?.full_name || user?.email || "V").charAt(0).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate text-lg font-medium">{user?.full_name || "Your account"}</h2><p className="mt-1 break-all text-sm text-[#5f6368]">{user?.email}</p><p className="mt-2 text-xs capitalize text-[#1967d2]">{user?.identity === "student" && user?.education_stage === "professional" ? "Professional learner" : user?.identity} · {learningLanguage(user)}</p></div></div>
      <form onSubmit={saveName} className="mt-6 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm font-medium">Display name<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} className="mt-2 block w-full rounded-xl border border-[#747775] p-3 font-normal" /></label><button disabled={busy || !name.trim() || name.trim() === user?.full_name} className="h-11 rounded-full bg-[#1967d2] px-5 text-sm font-medium text-white disabled:opacity-40">Save profile</button></form>
    </section>
    <section className="rounded-2xl border border-[#dadce0] p-6"><h2 className="flex items-center gap-2 text-base font-medium"><BookOpen className="h-5 w-5 text-[#1967d2]" />Learning areas</h2><p className="mt-2 text-sm leading-6 text-[#5f6368]">Subjects, skills, or interests—not courses to purchase. Add anything you want to understand or build with.</p><div className="mt-4 flex flex-wrap gap-2">{data.subjects.map(s => <Link key={s.id} to={"/dashboard/learn?subject=" + encodeURIComponent(s.name)} className="rounded-full bg-[#e8f0fe] px-4 py-2 text-sm text-[#1967d2]">{s.name}</Link>)}</div><form onSubmit={addSubject} className="mt-5 flex flex-wrap gap-3"><label className="sr-only" htmlFor="new-learning-area">New learning area</label><input id="new-learning-area" required maxLength={100} value={subject} onChange={e => setSubject(e.target.value)} placeholder="For example, robotics or storytelling" className="min-w-0 flex-1 rounded-xl border border-[#747775] p-3 text-sm" /><button disabled={busy || data.loading || !!data.error || !subject.trim()} className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2 text-sm text-[#1967d2] disabled:opacity-40"><Plus className="h-4 w-4" />Add area</button></form></section>
    {status && <p role="status" className="rounded-xl bg-[#f8fafd] p-4 text-sm">{status}</p>}
    <div className="grid gap-4 sm:grid-cols-2"><Link to="/dashboard/connections" className="rounded-2xl border border-[#dadce0] p-6"><Users className="mb-3 h-5 w-5 text-[#1967d2]" /><h2 className="text-base font-medium">Family & other connections</h2><p className="mt-2 text-sm leading-6 text-[#5f6368]">Review requests and choose who can see shared progress.</p></Link><Link to="/dashboard/settings" className="rounded-2xl border border-[#dadce0] p-6"><Settings className="mb-3 h-5 w-5 text-[#1967d2]" /><h2 className="text-base font-medium">Language & appearance</h2><p className="mt-2 text-sm leading-6 text-[#5f6368]">Set your learning language and workspace accent.</p></Link></div>
  </div>;
}

