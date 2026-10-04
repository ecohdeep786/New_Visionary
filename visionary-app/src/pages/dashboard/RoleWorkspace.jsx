import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import OrganizationCurriculum from './OrganizationCurriculum';
import { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, GraduationCap, Send, UserPlus, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import FamilyProgress from "@/components/dashboard/FamilyProgress";
import Connections from "./Connections";
import OrganizationEvidencePanel from "@/components/dashboard/OrganizationEvidencePanel";
import {useWorkspace} from '@/hooks/useWorkspace';
import {organizationAccess} from '@/services/workspaceService';

const inputClass = "mt-2 h-11 w-full rounded-lg border border-[#5f6368] bg-white px-3 text-sm font-normal text-[#121317] outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]";
const primaryClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60";
const pageClass = "mx-auto flex w-full max-w-[1100px] flex-col gap-8 p-5 sm:p-8 lg:p-10";
const announceChange = () => window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
const normalize = (value) => value?.trim().toLowerCase() || "";

function WorkspaceHeader({ eyebrow, title, description, action }) {
 const {data}=useWorkspace();const copy=primaryWorkspaceCopy(data?.preferences.interfaceLocale||'en');
  return <header className="flex flex-col gap-5 border-b border-[#dadce0] pb-7 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-sm font-medium text-[#5f6368]">{copy(eyebrow)}</p><h1 className="mt-2 text-[30px] font-medium tracking-tight text-[#121317]">{copy(title)}</h1><p className="mt-2 text-base leading-relaxed text-[#5f6368]">{copy(description)}</p></div>{action}</header>;
}

function EmptyWorkspace({ icon: Icon, title, description, action }) {
 const {data}=useWorkspace();const copy=primaryWorkspaceCopy(data?.preferences.interfaceLocale||'en');
  return <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#5f6368] bg-[#ffffff] px-6 py-10 text-center"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white"><Icon className="h-6 w-6 text-[#5f6368]" /></div><h2 className="text-lg font-medium text-[#121317]">{copy(title)}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-[#5f6368]">{copy(description)}</p>{action && <div className="mt-6">{action}</div>}</div>;
}

function LoadState({ loading, error, retry }) {
 const {data}=useWorkspace();const copy=primaryWorkspaceCopy(data?.preferences.interfaceLocale||'en');
  if (loading) return <p className="py-6 text-sm text-[#5f6368]" role="status">{copy("Loading your workspace…")}</p>;
  if (error) return <div className="rounded-xl border border-[#5f6368] bg-[#fce8e6] p-4 text-sm text-[#b3261e]" role="alert">{copy(error)}<button type="button" onClick={retry} className="ml-3 font-medium underline">{copy("Try again")}</button></div>;
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
      setNotice("Request saved. Your child can accept in Connections when signed in on this browser. No email has been sent.");
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
        <div className="flex items-center gap-3"><UserPlus className="h-5 w-5" style={{ color: accent }} /><h2 className="text-base font-medium text-[#121317]">Request a connection</h2></div>
        <div className="mt-6 grid gap-4"><label className="text-sm font-medium text-[#121317]">Child’s name<input required maxLength={80} autoComplete="off" value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="First name" className={inputClass} /></label><label className="text-sm font-medium text-[#121317]">Child’s Visionary email<input required type="email" maxLength={254} autoComplete="off" value={childEmail} onChange={(event) => setChildEmail(event.target.value)} placeholder="student@example.com" className={inputClass} /></label></div>
        <button type="submit" disabled={saving || loading || !!error || !childName.trim() || !childEmail.trim()} className={"mt-6 " + primaryClass} style={{ backgroundColor: accent }}><Send className="h-4 w-4" />{saving ? "Saving…" : "Request connection"}</button>
        {notice && <p className="mt-3 text-sm leading-relaxed text-[#5f6368]" role="status">{notice}</p>}
      </form>
      <aside className="rounded-2xl border border-[#dadce0] bg-[#ffffff] p-6"><h2 className="text-base font-medium text-[#121317]">Their learning. Their permission.</h2><ol className="mt-5 space-y-4 text-sm leading-relaxed text-[#5f6368]"><li className="flex gap-3"><span className="font-medium text-[#121317]">1.</span> Request a connection with their Visionary email.</li><li className="flex gap-3"><span className="font-medium text-[#121317]">2.</span> Your child accepts or declines in Connections.</li><li className="flex gap-3"><span className="font-medium text-[#121317]">3.</span> An accepted connection shares subjects and study activity. Private questions and conversations stay private.</li></ol><p className="mt-5 border-t border-[#dadce0] pt-4 text-xs leading-relaxed text-[#5f6368]">Connections currently work between accounts saved in this browser. Cross-device requests will be available when account sync is connected.</p></aside>
    </div>
    <section><h2 className="mb-4 text-lg font-medium text-[#121317]">Connections</h2><LoadState loading={loading} error={error} retry={load} />{!loading && !error && (visibleLinks.length === 0 ? <EmptyWorkspace icon={GraduationCap} title="No child connected yet" description="Start with a connection request. Progress appears only after your child accepts." /> : <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">{visibleLinks.map((link) => <div key={link.id} className="flex flex-wrap items-center gap-3 border-b border-[#dadce0] px-5 py-5 last:border-b-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fd] text-sm font-medium text-[#3367d6]">{link.child_name?.charAt(0)?.toUpperCase() || "C"}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#121317]">{link.child_name}</p><p className="truncate text-xs text-[#5f6368]">{link.child_email}</p></div><span className={"rounded-full px-3 py-1 text-xs font-medium " + (link.status === "active" ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#dadce0] text-[#5f6368]")}>{link.status === "active" ? "Connected" : link.status === "declined" ? "Declined" : "Awaiting acceptance"}</span>{["active", "pending"].includes(link.status) && <button type="button" disabled={changingId === link.id} onClick={() => removeConnection(link)} className="rounded-lg px-2 py-2 text-xs font-medium text-[#5f6368] hover:bg-[#dadce0] disabled:opacity-50" aria-label={(link.status === "active" ? "Disconnect " : "Cancel request for ") + link.child_name}>{changingId === link.id ? "Saving…" : link.status === "active" ? "Disconnect" : "Cancel"}</button>}</div>)}</div>)}</section>
    {!loading && !error && <FamilyProgress links={links} accent={accent} />}
  </div>;
}


function MetricsWorkspace({ user, area, accent }) {
  const {ctx,revision,data:workspaceData}=useWorkspace();const copy=primaryWorkspaceCopy(workspaceData?.preferences.interfaceLocale||'en');const sequenceRef=useRef(0);
  const [data, setData] = useState({ classes: [], people: [], assignments: [], enrollments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const teaching = area === "insights";
  const load = useCallback(async () => {
    const sequence=++sequenceRef.current;setLoading(true);setData({classes:[],people:[],assignments:[],enrollments:[]});setError("");
    try {
      const classes = await base44.entities.Classroom.filter(teaching ? { teacher_email: user.email } : { organization_email: user.email });
      if(sequence!==sequenceRef.current)return;
      const [assignmentsByClass, enrollmentsByClass, people] = await Promise.all([
        Promise.all(classes.map((classroom) => base44.entities.Assignment.filter({ class_id: classroom.id }))),
        Promise.all(classes.map((classroom) => base44.entities.Enrollment.filter({ class_id: classroom.id }))),
        teaching ? Promise.resolve([]) : base44.entities.OrganizationInvite.filter({ organization_email: user.email }),
      ]);
      if(sequence!==sequenceRef.current)return;
      setData({ classes, assignments: assignmentsByClass.flat(), enrollments: enrollmentsByClass.flat().filter((entry) => entry.status === "active"), people: people.filter((person) => person.status === "active") });
    } catch { if(sequence!==sequenceRef.current)return;setError("Your report couldn’t be loaded. Please try again."); }
    finally { if(sequence===sequenceRef.current)setLoading(false); }
  }, [teaching, user.email,ctx?.personId,ctx?.workspaceId,revision]);
  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    return () => {sequenceRef.current++;window.removeEventListener("visionary:workspace-change", load);};
  }, [load]);
  const studentCount = new Set(data.enrollments.map((entry) => entry.student_email).filter(Boolean)).size;
  const metrics = [{ label: teaching ? "Your classes" : "Linked classes", value: data.classes.length, icon: BookOpen }, { label: teaching ? "Connected students" : "Connected people", value: teaching ? studentCount : data.people.length, icon: Users }, { label: "Class assignments", value: data.assignments.length, icon: CheckCircle2 }];
  return <div className={pageClass}>
    <WorkspaceHeader eyebrow={teaching ? "Teaching" : "Organization"} title={teaching ? "Teaching insights" : "Institution analytics"} description={teaching ? "An overview of your classes, connected learners, and teaching workload." : "A focused view of your institution’s roster and explicitly linked classrooms."} />
    <LoadState loading={loading} error={error} retry={load} />
    {!loading && !error && <><div className="grid gap-4 sm:grid-cols-3">{metrics.map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-2xl border border-[#dadce0] bg-white p-6"><Icon className="h-5 w-5" style={{ color: accent }} /><p className="mt-5 text-3xl font-medium text-[#121317]">{metric.value}</p><p className="mt-1 text-sm text-[#5f6368]">{copy(metric.label)}</p></div>; })}</div>{!teaching && <OrganizationEvidencePanel/>}{data.classes.length > 0 ? <section><h2 className="mb-4 text-lg font-medium text-[#121317]">{copy("Class overview")}</h2><div tabIndex={0} role="region" aria-label={copy("Class overview")} className="overflow-x-auto rounded-2xl border border-[#dadce0]"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-[#ffffff] text-[#5f6368]"><tr><th className="px-5 py-4 font-medium">{copy("Class")}</th><th className="px-5 py-4 font-medium">{copy("Students")}</th><th className="px-5 py-4 font-medium">{copy("Assignments")}</th></tr></thead><tbody>{data.classes.map((classroom) => <tr key={classroom.id} className="border-t border-[#dadce0]"><td className="px-5 py-4 font-medium text-[#121317]">{classroom.name || classroom.title || "Untitled class"}</td><td className="px-5 py-4 text-[#5f6368]">{new Set(data.enrollments.filter((entry) => entry.class_id === classroom.id).map(entry=>entry.student_email).filter(Boolean)).size}</td><td className="px-5 py-4 text-[#5f6368]">{data.assignments.filter((item) => item.class_id === classroom.id).length}</td></tr>)}</tbody></table></div></section> : <EmptyWorkspace icon={BarChart3} title={teaching ? "Insights start with a class" : "No linked classrooms yet"} description={teaching ? "Create a class and share its join code. Learner and assignment totals appear here as you teach." : "Roster drafts do not create classroom access. Only classes explicitly linked to your institution will contribute to this report."} action={<Link to={teaching ? "/dashboard/classes" : "/dashboard/people"} className={primaryClass} style={{ backgroundColor: accent }}>{copy(teaching ? "Go to classes" : "Manage people")}<ArrowRight className="h-4 w-4" /></Link>} />}</>}
  </div>;
}

export default function RoleWorkspace({ area }) {
  const { user } = useAuth();
  const {ctx}=useWorkspace();
  const themeColor = useThemeColor();
  const role = user?.identity;
  if (area === "child" && role === "parent") return <ParentChildWorkspace user={user} accent={themeColor.accent} />;
  if (area === "people" && role === "organization") return <Connections />;
  const policy=role==='organization'&&ctx?organizationAccess(ctx):null;
  const organizationUser=policy?{...user,email:policy.organizationEmail}:user;
  if (area === "curriculum" && role === "organization") return <OrganizationCurriculum key={ctx?.personId+':'+ctx?.workspaceId}/>;
  if (area === "analytics" && role === "organization") return policy.permissions.includes('academic')?<MetricsWorkspace key={ctx?.personId+':'+ctx?.workspaceId} user={organizationUser} area={area} accent={themeColor.accent} />:<div className="v-page"><h1 className="v-title">Aggregate insights</h1><OrganizationEvidencePanel/></div>;
  if (area === "insights" && role === "teacher") return <MetricsWorkspace user={user} area={area} accent={themeColor.accent} />;
  return <div className={pageClass}><EmptyWorkspace icon={BookOpen} title="This workspace is not available" description="Choose a section that matches your Visionary role." action={<Link to="/dashboard/home" className="text-sm font-medium text-[#4285F4] hover:underline">Return to dashboard</Link>} /></div>;
}
