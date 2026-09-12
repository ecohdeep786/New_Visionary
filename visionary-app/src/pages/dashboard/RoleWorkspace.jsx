import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, GraduationCap, LibraryBig, Plus, Search, Send, UserPlus, Users, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import FamilyProgress from "@/components/dashboard/FamilyProgress";

const inputClass = "mt-2 h-11 w-full rounded-lg border border-[#747775] bg-white px-3 text-sm font-normal text-[#202124] outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]";
const primaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60";
const pageClass = "mx-auto flex w-full max-w-[1100px] flex-col gap-8 p-5 sm:p-8 lg:p-10";
const announceChange = () => window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
const normalize = (value) => value?.trim().toLowerCase() || "";

function WorkspaceHeader({ eyebrow, title, description, action }) {
  return <header className="flex flex-col gap-5 border-b border-[#dadce0] pb-7 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-sm font-medium text-[#5f6368]">{eyebrow}</p><h1 className="mt-2 text-[30px] font-medium tracking-tight text-[#202124]">{title}</h1><p className="mt-2 text-base leading-relaxed text-[#5f6368]">{description}</p></div>{action}</header>;
}

function EmptyWorkspace({ icon: Icon, title, description, action }) {
  return <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#bdc1c6] bg-[#f8fafd] px-6 py-10 text-center"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white"><Icon className="h-6 w-6 text-[#5f6368]" /></div><h2 className="text-lg font-medium text-[#202124]">{title}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-[#5f6368]">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}

function LoadState({ loading, error, retry }) {
  if (loading) return <p className="py-6 text-sm text-[#5f6368]" role="status">Loading your workspace…</p>;
  if (error) return <div className="rounded-xl border border-[#f2b8b5] bg-[#fce8e6] p-4 text-sm text-[#b3261e]" role="alert">{error}<button type="button" onClick={retry} className="ml-3 font-medium underline">Try again</button></div>;
  return null;
}

function ParentChildWorkspace({ user, accent }) {
  const [links, setLinks] = useState([]);
  const [childName, setChildName] = useState(user?.child_name || "");
  const [childEmail, setChildEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [changingId, setChangingId] = useState(null);
  const load = useCallback(async () => {
    if (!user?.email) return;
    setError("");
    try { setLinks(await base44.entities.FamilyLink.filter({ parent_email: user.email })); }
    catch { setError("Your connections couldn’t be loaded."); }
    finally { setLoading(false); }
  }, [user?.email]);

  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("visionary:workspace-change", load); window.removeEventListener("storage", load); };
  }, [load]);

  const requestConnection = async (event) => {
    event.preventDefault();
    if (saving || !childName.trim() || !childEmail.trim()) return;
    const email = normalize(childEmail);
    setNotice("");
    if (email === normalize(user.email)) { setNotice("Use your child’s account email, which must be different from your own."); return; }
    setSaving(true);
    try {
      const existing = await base44.entities.FamilyLink.filter({ parent_email: user.email, child_email: email });
      if (existing.some((link) => ["pending", "active"].includes(link.status))) { setNotice("You already have an active connection or pending request for this email."); return; }
      await base44.entities.FamilyLink.create({ parent_email: user.email, parent_name: user.full_name || "Parent", child_name: childName.trim(), child_email: email, status: "pending" });
      setChildEmail("");
      setNotice("Request saved. Your child can accept from Profile → Family connections when signed in on this browser. No email has been sent.");
      announceChange();
    } catch { setNotice("We couldn’t save this request. Please try again."); }
    finally { setSaving(false); }
  };

  const removeConnection = async (link) => {
    setChangingId(link.id);
    setNotice("");
    try {
      await base44.entities.FamilyLink.update(link.id, { status: link.status === "active" ? "revoked" : "cancelled" });
      setNotice(link.status === "active" ? "Connection removed. Shared progress is no longer available." : "Request cancelled.");
      announceChange();
    } catch { setNotice("We couldn’t update this connection. Please try again."); }
    finally { setChangingId(null); }
  };

  const visibleLinks = links.filter((link) => !["cancelled", "revoked"].includes(link.status));
  return <div className={pageClass}>
    <WorkspaceHeader eyebrow="Family" title="Your children" description="Connect a child’s account and follow the learning progress they choose to share." />
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={requestConnection} className="rounded-2xl border border-[#dadce0] bg-white p-6">
        <div className="flex items-center gap-3"><UserPlus className="h-5 w-5" style={{ color: accent }} /><h2 className="text-base font-medium text-[#202124]">Request a connection</h2></div>
        <div className="mt-6 grid gap-4"><label className="text-sm font-medium text-[#202124]">Child’s name<input required maxLength={80} autoComplete="off" value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="First name" className={inputClass} /></label><label className="text-sm font-medium text-[#202124]">Child’s Visionary email<input required type="email" maxLength={254} autoComplete="off" value={childEmail} onChange={(event) => setChildEmail(event.target.value)} placeholder="student@example.com" className={inputClass} /></label></div>
        <button type="submit" disabled={saving || loading || !!error || !childName.trim() || !childEmail.trim()} className={"mt-6 " + primaryClass} style={{ backgroundColor: accent }}><Send className="h-4 w-4" />{saving ? "Saving…" : "Request connection"}</button>
        {notice && <p className="mt-3 text-sm leading-relaxed text-[#5f6368]" role="status">{notice}</p>}
      </form>
      <aside className="rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-6"><h2 className="text-base font-medium text-[#202124]">Their learning. Their permission.</h2><ol className="mt-5 space-y-4 text-sm leading-relaxed text-[#5f6368]"><li className="flex gap-3"><span className="font-medium text-[#202124]">1.</span> Request a connection with their Visionary email.</li><li className="flex gap-3"><span className="font-medium text-[#202124]">2.</span> Your child accepts or declines in their own Profile.</li><li className="flex gap-3"><span className="font-medium text-[#202124]">3.</span> An accepted connection shares subjects and study activity. Private questions and conversations stay private.</li></ol><p className="mt-5 border-t border-[#dadce0] pt-4 text-xs leading-relaxed text-[#5f6368]">Connections currently work between accounts saved in this browser. Cross-device requests will be available when account sync is connected.</p></aside>
    </div>
    <section><h2 className="mb-4 text-lg font-medium text-[#202124]">Connections</h2><LoadState loading={loading} error={error} retry={load} />{!loading && !error && (visibleLinks.length === 0 ? <EmptyWorkspace icon={GraduationCap} title="No child connected yet" description="Start with a connection request. Progress appears only after your child accepts." /> : <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">{visibleLinks.map((link) => <div key={link.id} className="flex flex-wrap items-center gap-3 border-b border-[#dadce0] px-5 py-5 last:border-b-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-medium text-[#174ea6]">{link.child_name?.charAt(0)?.toUpperCase() || "C"}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#202124]">{link.child_name}</p><p className="truncate text-xs text-[#5f6368]">{link.child_email}</p></div><span className={"rounded-full px-3 py-1 text-xs font-medium " + (link.status === "active" ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#f1f3f4] text-[#5f6368]")}>{link.status === "active" ? "Connected" : link.status === "declined" ? "Declined" : "Awaiting acceptance"}</span>{["active", "pending"].includes(link.status) && <button type="button" disabled={changingId === link.id} onClick={() => removeConnection(link)} className="rounded-lg px-2 py-2 text-xs font-medium text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-50" aria-label={(link.status === "active" ? "Disconnect " : "Cancel request for ") + link.child_name}>{changingId === link.id ? "Saving…" : link.status === "active" ? "Disconnect" : "Cancel"}</button>}</div>)}</div>)}</section>
    {!loading && !error && <FamilyProgress links={links} accent={accent} />}
  </div>;
}

function OrganizationPeopleWorkspace({ user, accent }) {
  const [people, setPeople] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (!user?.email) return;
    setError("");
    try { setPeople((await base44.entities.OrganizationInvite.filter({ organization_email: user.email })).filter((person) => person.status !== "removed")); }
    catch { setError("Your people list couldn’t be loaded."); }
    finally { setLoading(false); }
  }, [user?.email]);
  useEffect(() => { load(); }, [load]);

  const addPerson = async (event) => {
    event.preventDefault();
    if (!email.trim() || saving) return;
    const normalized = normalize(email);
    setNotice("");
    if (normalized === normalize(user.email)) { setNotice("You already manage this workspace. Add another person’s email."); return; }
    if (people.some((person) => normalize(person.email) === normalized)) { setNotice("This email is already in your people list."); return; }
    setSaving(true);
    try {
      await base44.entities.OrganizationInvite.create({ organization_email: user.email, email: normalized, role, status: "draft" });
      setEmail("");
      setNotice("Person saved as a roster draft. No invitation has been sent and no account access has changed.");
      await load();
      announceChange();
    } catch { setNotice("This person couldn’t be saved. Please try again."); }
    finally { setSaving(false); }
  };
  const removePerson = async (person) => {
    setSaving(true);
    try { await base44.entities.OrganizationInvite.update(person.id, { status: "removed" }); await load(); announceChange(); setNotice("Roster draft removed."); }
    catch { setNotice("We couldn’t remove this roster draft. Please try again."); }
    finally { setSaving(false); }
  };
  const visiblePeople = people.filter((person) => (person.email + " " + person.role).toLowerCase().includes(query.toLowerCase().trim()));
  return <div className={pageClass}>
    <WorkspaceHeader eyebrow="Organization" title="People" description="Prepare your institution’s roster with clear roles for every educator and learner." action={<span className="shrink-0 rounded-full bg-[#e8f0fe] px-3 py-1.5 text-sm font-medium text-[#174ea6]">{people.length} roster drafts</span>} />
    <section className="rounded-2xl border border-[#dadce0] bg-white p-6"><h2 className="text-base font-medium text-[#202124]">Add to your roster</h2><form onSubmit={addPerson} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium text-[#202124]">Email address<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@example.com" className={inputClass} /></label><label className="text-sm font-medium text-[#202124]">Role<select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass + " sm:w-40"}><option value="teacher">Teacher</option><option value="student">Student</option><option value="coordinator">Coordinator</option><option value="admin">Administrator</option></select></label><button type="submit" disabled={saving || loading || !!error || !email.trim()} className={primaryClass} style={{ backgroundColor: accent }}><Plus className="h-4 w-4" />{saving ? "Saving…" : "Add person"}</button></form><p className="mt-4 text-xs leading-relaxed text-[#5f6368]">Roster drafts are saved in this browser. Email invitations and account permissions are not active yet.</p>{notice && <p className="mt-3 text-sm text-[#5f6368]" role="status">{notice}</p>}</section>
    <LoadState loading={loading} error={error} retry={load} />
    {!loading && !error && (people.length === 0 ? <EmptyWorkspace icon={Users} title="Start with your team" description="Add your first teacher, student, or coordinator above. You can review the roster before invitations become available." /> : <section><label className="mb-4 flex max-w-sm items-center gap-2 rounded-full border border-[#dadce0] px-4"><Search className="h-4 w-4 text-[#5f6368]" /><input aria-label="Search people" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email or role" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">{visiblePeople.length === 0 ? <p className="p-6 text-sm text-[#5f6368]">No people match your search.</p> : visiblePeople.map((person) => <div key={person.id} className="flex items-center gap-3 border-b border-[#dadce0] px-5 py-4 last:border-b-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-sm font-medium text-[#3c4043]">{person.email?.charAt(0)?.toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#202124]">{person.email}</p><p className="text-xs capitalize text-[#5f6368]">{person.role === "admin" ? "Administrator" : person.role}</p></div><span className="rounded-full bg-[#f1f3f4] px-3 py-1 text-xs font-medium text-[#5f6368]">Draft</span><button type="button" disabled={saving} onClick={() => removePerson(person)} aria-label={"Remove " + person.email + " from roster drafts"} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-50"><X className="h-4 w-4" /></button></div>)}</div></section>)}
  </div>;
}

function CurriculumWorkspace({ user, updateUser, accent }) {
  const [name, setName] = useState(user?.curriculum_name || "");
  const [board, setBoard] = useState(user?.org_board || user?.board || "");
  const [status, setStatus] = useState("idle");
  const [items, setItems] = useState([]);
  const [subject, setSubject] = useState("");
  const [group, setGroup] = useState("");
  const [objectives, setObjectives] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { setItems((await base44.entities.OrganizationCurriculum.filter({ organization_email: user.email })).filter((item) => item.status !== "archived")); }
    catch { setError("Curriculum items couldn’t be loaded."); }
    finally { setLoading(false); }
  }, [user.email]);
  useEffect(() => { load(); }, [load]);
  const saveContext = async (event) => {
    event.preventDefault();
    setStatus("saving");
    try { await updateUser({ curriculum_name: name.trim(), org_board: board.trim() }); setStatus("saved"); announceChange(); }
    catch { setStatus("error"); }
  };
  const addItem = async (event) => {
    event.preventDefault();
    if (saving || !subject.trim() || !group.trim()) return;
    setNotice("");
    if (items.some((item) => normalize(item.subject) === normalize(subject) && normalize(item.group) === normalize(group))) { setNotice("This subject and year group already have a curriculum draft."); return; }
    setSaving(true);
    try { await base44.entities.OrganizationCurriculum.create({ organization_email: user.email, subject: subject.trim(), group: group.trim(), objectives: objectives.trim(), status: "draft" }); setSubject(""); setGroup(""); setObjectives(""); setNotice("Curriculum draft added."); await load(); announceChange(); }
    catch { setNotice("This curriculum draft couldn’t be saved. Please try again."); }
    finally { setSaving(false); }
  };
  const archiveItem = async (item) => {
    setSaving(true);
    try { await base44.entities.OrganizationCurriculum.update(item.id, { status: "archived" }); await load(); announceChange(); setNotice("Curriculum draft removed from this list."); }
    catch { setNotice("We couldn’t remove this draft. Please try again."); }
    finally { setSaving(false); }
  };
  return <div className={pageClass}>
    <WorkspaceHeader eyebrow="Organization" title="Curriculum" description="Organize your teaching framework, subjects, and learning objectives in one place." />
    <form onSubmit={saveContext} className="rounded-2xl border border-[#dadce0] bg-white p-6"><div className="flex items-center gap-3"><LibraryBig className="h-5 w-5" style={{ color: accent }} /><h2 className="text-base font-medium text-[#202124]">Curriculum framework</h2></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-[#202124]">Curriculum name<input required maxLength={120} value={name} onChange={(event) => { setName(event.target.value); setStatus("idle"); }} placeholder="e.g. Secondary curriculum 2026" className={inputClass} /></label><label className="text-sm font-medium text-[#202124]">Board or framework<input required maxLength={120} value={board} onChange={(event) => { setBoard(event.target.value); setStatus("idle"); }} placeholder="e.g. CBSE" className={inputClass} /></label></div><div className="mt-6 flex flex-wrap items-center gap-4"><button type="submit" disabled={status === "saving" || !name.trim() || !board.trim()} className={primaryClass} style={{ backgroundColor: accent }}>{status === "saving" ? "Saving…" : "Save framework"}</button>{status === "saved" && <span className="text-sm text-[#137333]" role="status">Framework saved.</span>}{status === "error" && <span className="text-sm text-[#b3261e]" role="alert">Couldn’t save. Try again.</span>}</div></form>
    <section className="rounded-2xl border border-[#dadce0] bg-white p-6"><h2 className="text-base font-medium text-[#202124]">Add a subject draft</h2><p className="mt-1 text-sm text-[#5f6368]">Plan the scope here. Drafts do not publish assignments or change classrooms.</p><form onSubmit={addItem} className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-[#202124]">Subject<input required maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Mathematics" className={inputClass} /></label><label className="text-sm font-medium text-[#202124]">Year or learner group<input required maxLength={100} value={group} onChange={(event) => setGroup(event.target.value)} placeholder="e.g. Grade 10" className={inputClass} /></label><label className="text-sm font-medium text-[#202124] sm:col-span-2">Learning objectives <span className="font-normal text-[#5f6368]">(optional)</span><textarea maxLength={2000} rows={3} value={objectives} onChange={(event) => setObjectives(event.target.value)} placeholder="What should learners understand or be able to do?" className={inputClass + " h-auto py-3"} /></label><div className="sm:col-span-2"><button type="submit" disabled={saving || loading || !!error || !subject.trim() || !group.trim()} className={primaryClass} style={{ backgroundColor: accent }}><Plus className="h-4 w-4" />{saving ? "Saving…" : "Add subject"}</button>{notice && <p className="mt-3 text-sm text-[#5f6368]" role="status">{notice}</p>}</div></form></section>
    <section><h2 className="mb-4 text-lg font-medium text-[#202124]">Subject drafts</h2><LoadState loading={loading} error={error} retry={load} />{!loading && !error && (items.length === 0 ? <EmptyWorkspace icon={BookOpen} title="Your curriculum starts here" description="Add a subject and learner group above, then capture the objectives your team will teach." /> : <div className="grid gap-4 sm:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-[#dadce0] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-[#5f6368]">{item.group} · Draft</p><h3 className="mt-2 text-base font-medium text-[#202124]">{item.subject}</h3></div><button type="button" disabled={saving} onClick={() => archiveItem(item)} aria-label={"Remove " + item.subject + ", " + item.group + " draft"} className="rounded-full p-2 text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-50"><X className="h-4 w-4" /></button></div><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#5f6368]">{item.objectives || "No learning objectives added."}</p></article>)}</div>)}</section>
  </div>;
}

function MetricsWorkspace({ user, area, accent }) {
  const [data, setData] = useState({ classes: [], people: [], assignments: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const teaching = area === "insights";
  const load = useCallback(async () => {
    setError("");
    try {
      const classes = await base44.entities.Classroom.filter(teaching ? { teacher_email: user.email } : { organization_email: user.email });
      const [assignmentsByClass, enrollmentsByClass, people] = await Promise.all([
        Promise.all(classes.map((classroom) => base44.entities.Assignment.filter({ class_id: classroom.id }))),
        Promise.all(classes.map((classroom) => base44.entities.Enrollment.filter({ class_id: classroom.id }))),
        teaching ? Promise.resolve([]) : base44.entities.OrganizationInvite.filter({ organization_email: user.email }),
      ]);
      setData({ classes, assignments: assignmentsByClass.flat(), enrollments: enrollmentsByClass.flat().filter((entry) => !["removed", "declined", "pending"].includes(entry.status)), people: people.filter((person) => person.status !== "removed") });
    } catch { setError("Your report couldn’t be loaded. Please try again."); }
    finally { setLoading(false); }
  }, [teaching, user.email]);
  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    return () => window.removeEventListener("visionary:workspace-change", load);
  }, [load]);
  const studentCount = new Set(data.enrollments.map((entry) => entry.student_email).filter(Boolean)).size;
  const metrics = [{ label: teaching ? "Your classes" : "Linked classes", value: data.classes.length, icon: BookOpen }, { label: teaching ? "Connected students" : "Roster drafts", value: teaching ? studentCount : data.people.length, icon: Users }, { label: "Class assignments", value: data.assignments.length, icon: CheckCircle2 }];
  return <div className={pageClass}>
    <WorkspaceHeader eyebrow={teaching ? "Teaching" : "Organization"} title={teaching ? "Teaching insights" : "Institution analytics"} description={teaching ? "An overview of your classes, connected learners, and teaching workload." : "A focused view of your institution’s roster and explicitly linked classrooms."} />
    <LoadState loading={loading} error={error} retry={load} />
    {!loading && !error && <><div className="grid gap-4 sm:grid-cols-3">{metrics.map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-2xl border border-[#dadce0] bg-white p-6"><Icon className="h-5 w-5" style={{ color: accent }} /><p className="mt-5 text-3xl font-medium text-[#202124]">{metric.value}</p><p className="mt-1 text-sm text-[#5f6368]">{metric.label}</p></div>; })}</div>{data.classes.length > 0 ? <section><h2 className="mb-4 text-lg font-medium text-[#202124]">Class overview</h2><div className="overflow-x-auto rounded-2xl border border-[#dadce0]"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-[#f8fafd] text-[#5f6368]"><tr><th className="px-5 py-4 font-medium">Class</th><th className="px-5 py-4 font-medium">Students</th><th className="px-5 py-4 font-medium">Assignments</th></tr></thead><tbody>{data.classes.map((classroom) => <tr key={classroom.id} className="border-t border-[#dadce0]"><td className="px-5 py-4 font-medium text-[#202124]">{classroom.name || classroom.title || "Untitled class"}</td><td className="px-5 py-4 text-[#5f6368]">{data.enrollments.filter((entry) => entry.class_id === classroom.id).length}</td><td className="px-5 py-4 text-[#5f6368]">{data.assignments.filter((item) => item.class_id === classroom.id).length}</td></tr>)}</tbody></table></div></section> : <EmptyWorkspace icon={BarChart3} title={teaching ? "Insights start with a class" : "No linked classrooms yet"} description={teaching ? "Create a class and share its join code. Learner and assignment totals appear here as you teach." : "Roster drafts do not create classroom access. Only classes explicitly linked to your institution will contribute to this report."} action={<Link to={teaching ? "/dashboard/home" : "/dashboard/people"} className={primaryClass} style={{ backgroundColor: accent }}>{teaching ? "Go to classes" : "Manage people"}<ArrowRight className="h-4 w-4" /></Link>} />}</>}
  </div>;
}

export default function RoleWorkspace({ area }) {
  const { user, updateUser } = useAuth();
  const themeColor = useThemeColor();
  const role = user?.identity;
  if (area === "child" && role === "parent") return <ParentChildWorkspace user={user} accent={themeColor.accent} />;
  if (area === "people" && role === "organization") return <OrganizationPeopleWorkspace user={user} accent={themeColor.accent} />;
  if (area === "curriculum" && role === "organization") return <CurriculumWorkspace user={user} updateUser={updateUser} accent={themeColor.accent} />;
  if (area === "analytics" && role === "organization") return <MetricsWorkspace user={user} area={area} accent={themeColor.accent} />;
  if (area === "insights" && role === "teacher") return <MetricsWorkspace user={user} area={area} accent={themeColor.accent} />;
  return <div className={pageClass}><EmptyWorkspace icon={BookOpen} title="This workspace is not available" description="Choose a section that matches your Visionary role." action={<Link to="/dashboard/home" className="text-sm font-medium text-[#1a73e8] hover:underline">Return to dashboard</Link>} /></div>;
}
