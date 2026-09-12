import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, GraduationCap, LibraryBig, Mail, Plus, Send, UserPlus, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

function WorkspaceHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-col gap-5 border-b border-[#dadce0] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-[#5f6368]">{eyebrow}</p>
        <h1 className="mt-2 text-[30px] font-medium tracking-tight text-[#202124]">{title}</h1>
        <p className="mt-2 text-base leading-relaxed text-[#5f6368]">{description}</p>
      </div>
      {action}
    </header>
  );
}

function EmptyWorkspace({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#bdc1c6] bg-[#f8fafd] px-6 py-10 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className="h-6 w-6 text-[#5f6368]" />
      </div>
      <h2 className="text-lg font-medium text-[#202124]">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#5f6368]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function ParentChildWorkspace({ user, accent }) {
  const [links, setLinks] = useState([]);
  const [childName, setChildName] = useState(user?.child_name || "");
  const [childEmail, setChildEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => {
    if (!user?.email) return;
    try {
      setLinks(await base44.entities.FamilyLink.filter({ parent_email: user.email }));
    } catch {
      setLinks([]);
    }
  };

  useEffect(() => {
    load();
  }, [user?.email]);

  const requestConnection = async (event) => {
    event.preventDefault();
    if (!childName.trim() || !childEmail.trim() || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const created = await base44.entities.FamilyLink.create({
        parent_email: user.email,
        child_name: childName.trim(),
        child_email: childEmail.trim().toLowerCase(),
        status: "pending",
      });
      setLinks((current) => [created, ...current]);
      setChildEmail("");
      setNotice("Connection request saved. It will be available once your child accepts it.");
    } catch {
      setNotice("We couldn’t save this request. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 p-6 sm:p-8 lg:p-10">
      <WorkspaceHeader eyebrow="Family" title="Your child" description="Connect a child’s Visionary account to view learning progress and receive clear, respectful updates." />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={requestConnection} className="rounded-2xl border border-[#dadce0] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}15` }}><UserPlus className="h-5 w-5" style={{ color: accent }} /></div>
            <div><h2 className="text-base font-medium text-[#202124]">Request a connection</h2><p className="mt-0.5 text-sm text-[#5f6368]">Your child controls whether to accept.</p></div>
          </div>
          <div className="mt-6 grid gap-4">
            <label className="text-sm font-medium text-[#202124]">Child’s name<input value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="First name" className="mt-2 h-11 w-full rounded-lg border border-[#747775] px-3 text-sm font-normal outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]" /></label>
            <label className="text-sm font-medium text-[#202124]">Child’s Visionary email<input type="email" value={childEmail} onChange={(event) => setChildEmail(event.target.value)} placeholder="student@example.com" className="mt-2 h-11 w-full rounded-lg border border-[#747775] px-3 text-sm font-normal outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]" /></label>
          </div>
          <button type="submit" disabled={saving || !childName.trim() || !childEmail.trim()} className="mt-6 inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60" style={{ backgroundColor: accent }}><Send className="h-4 w-4" />{saving ? "Saving" : "Request connection"}</button>
          {notice && <p className="mt-3 text-sm text-[#5f6368]" role="status">{notice}</p>}
        </form>
        <div className="rounded-2xl border border-[#dadce0] bg-[#f8fafd] p-6">
          <h2 className="text-base font-medium text-[#202124]">How it works</h2>
          <ol className="mt-5 space-y-4 text-sm leading-relaxed text-[#5f6368]">
            <li className="flex gap-3"><span className="font-medium text-[#202124]">1.</span> Send a request to the child’s signed-in Visionary account.</li>
            <li className="flex gap-3"><span className="font-medium text-[#202124]">2.</span> The child accepts the connection in their own account.</li>
            <li className="flex gap-3"><span className="font-medium text-[#202124]">3.</span> You see agreed learning progress, not private conversations.</li>
          </ol>
        </div>
      </div>
      <section>
        <h2 className="mb-4 text-lg font-medium text-[#202124]">Connections</h2>
        {links.length === 0 ? <EmptyWorkspace icon={GraduationCap} title="No child connected yet" description="Use the connection request above to begin a consent-based family view." /> : <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">{links.map((link) => <div key={link.id} className="flex items-center gap-4 border-b border-[#dadce0] px-6 py-5 last:border-b-0"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-medium text-[#174ea6]">{link.child_name?.charAt(0)?.toUpperCase() || "C"}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#202124]">{link.child_name}</p><p className="truncate text-xs text-[#5f6368]">{link.child_email}</p></div><span className="rounded-full bg-[#fef7e0] px-3 py-1 text-xs font-medium text-[#b06000]">{link.status || "pending"}</span></div>)}</div>}
      </section>
    </div>
  );
}

function OrganizationPeopleWorkspace({ user, accent }) {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.OrganizationInvite.filter({ organization_email: user.email }).then(setInvites).catch(() => setInvites([]));
  }, [user?.email]);

  const invite = async (event) => {
    event.preventDefault();
    if (!email.trim() || saving) return;
    setSaving(true);
    try {
      const created = await base44.entities.OrganizationInvite.create({ organization_email: user.email, email: email.trim().toLowerCase(), role, status: "pending" });
      setInvites((current) => [created, ...current]);
      setEmail("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 p-6 sm:p-8 lg:p-10">
      <WorkspaceHeader eyebrow="Organization" title="People" description="Invite teachers and coordinators, then use cohorts when your roster is connected." action={<span className="rounded-full bg-[#e8f0fe] px-3 py-1.5 text-sm font-medium text-[#174ea6]">{invites.length} pending</span>} />
      <form onSubmit={invite} className="flex flex-col gap-4 rounded-2xl border border-[#dadce0] bg-white p-6 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-[#202124]">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="educator@example.com" className="mt-2 h-11 w-full rounded-lg border border-[#747775] px-3 text-sm font-normal outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]" /></label>
        <label className="text-sm font-medium text-[#202124]">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#747775] bg-white px-3 text-sm font-normal outline-none focus:border-[#1a73e8] sm:w-40"><option value="teacher">Teacher</option><option value="coordinator">Coordinator</option><option value="admin">Administrator</option></select></label>
        <button type="submit" disabled={saving || !email.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: accent }}><Mail className="h-4 w-4" />{saving ? "Adding" : "Add person"}</button>
      </form>
      {invites.length === 0 ? <EmptyWorkspace icon={Users} title="Start with your team" description="Add the educators who will create classes and support learners. Email delivery will be connected with your identity provider." /> : <div className="overflow-hidden rounded-2xl border border-[#dadce0] bg-white">{invites.map((invitee) => <div key={invitee.id} className="flex items-center gap-4 border-b border-[#dadce0] px-6 py-5 last:border-b-0"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f4] text-sm font-medium text-[#3c4043]">{invitee.email?.charAt(0)?.toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#202124]">{invitee.email}</p><p className="text-xs capitalize text-[#5f6368]">{invitee.role}</p></div><span className="rounded-full bg-[#fef7e0] px-3 py-1 text-xs font-medium text-[#b06000]">Pending</span></div>)}</div>}
    </div>
  );
}

function CurriculumWorkspace({ user, updateUser, accent }) {
  const [name, setName] = useState(user?.curriculum_name || "");
  const [board, setBoard] = useState(user?.org_board || user?.board || "");
  const [status, setStatus] = useState("idle");
  const save = async () => {
    setStatus("saving");
    try { await updateUser({ curriculum_name: name.trim(), org_board: board.trim() }); setStatus("saved"); } catch { setStatus("error"); }
  };
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 p-6 sm:p-8 lg:p-10">
      <WorkspaceHeader eyebrow="Organization" title="Curriculum" description="Set the institution-wide context first. Classes will then use the same board and curriculum language." />
      <section className="rounded-2xl border border-[#dadce0] bg-white p-6">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}15` }}><LibraryBig className="h-5 w-5" style={{ color: accent }} /></div><div><h2 className="text-base font-medium text-[#202124]">Curriculum context</h2><p className="mt-0.5 text-sm text-[#5f6368]">This is the shared starting point—not a student-level plan.</p></div></div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-[#202124]">Curriculum name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. 2026 Secondary Curriculum" className="mt-2 h-11 w-full rounded-lg border border-[#747775] px-3 text-sm font-normal outline-none focus:border-[#1a73e8]" /></label><label className="text-sm font-medium text-[#202124]">Board or framework<input value={board} onChange={(event) => setBoard(event.target.value)} placeholder="e.g. CBSE" className="mt-2 h-11 w-full rounded-lg border border-[#747775] px-3 text-sm font-normal outline-none focus:border-[#1a73e8]" /></label></div>
        <div className="mt-6 flex items-center gap-4"><button type="button" onClick={save} disabled={status === "saving"} className="h-10 rounded-full px-5 text-sm font-medium text-white disabled:opacity-60" style={{ backgroundColor: accent }}>{status === "saving" ? "Saving" : "Save curriculum"}</button>{status === "saved" && <span className="text-sm text-[#137333]" role="status">Saved.</span>}{status === "error" && <span className="text-sm text-[#b3261e]" role="alert">Couldn’t save. Try again.</span>}</div>
      </section>
      <EmptyWorkspace icon={BookOpen} title="No published curriculum items yet" description="When your curriculum service is connected, subjects, learning objectives, and class mappings will appear here." />
    </div>
  );
}

function MetricsWorkspace({ user, area, accent }) {
  const [metrics, setMetrics] = useState({ classes: 0, people: 0, assignments: 0 });
  useEffect(() => {
    (async () => {
      try {
        if (area === "insights") {
          const [classes, assignments] = await Promise.all([base44.entities.Classroom.filter({ teacher_email: user?.email }), base44.entities.Assignment.list()]);
          setMetrics({ classes: classes.length, people: classes.reduce((total, item) => total + (item.student_count || 0), 0), assignments: assignments.filter((item) => classes.some((classroom) => classroom.id === item.class_id)).length });
        } else {
          const [people, classes] = await Promise.all([base44.entities.OrganizationInvite.filter({ organization_email: user?.email }), base44.entities.Classroom.list()]);
          setMetrics({ classes: classes.length, people: people.length, assignments: 0 });
        }
      } catch {}
    })();
  }, [area, user?.email]);
  const title = area === "insights" ? "Teaching insights" : "Institution analytics";
  const subtitle = area === "insights" ? "A concise view of your classes and feedback workload." : "A clear starting point for organization-wide learning data.";
  return <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 p-6 sm:p-8 lg:p-10"><WorkspaceHeader eyebrow={area === "insights" ? "Teaching" : "Organization"} title={title} description={subtitle} /><div className="grid gap-4 sm:grid-cols-3">{[{ label: area === "insights" ? "Classes" : "Classes in workspace", value: metrics.classes, icon: BookOpen }, { label: area === "insights" ? "Students" : "People pending", value: metrics.people, icon: Users }, { label: "Assignments", value: metrics.assignments, icon: CheckCircle2 }].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-2xl border border-[#dadce0] bg-white p-6"><Icon className="h-5 w-5" style={{ color: accent }} /><p className="mt-5 text-3xl font-medium text-[#202124]">{metric.value}</p><p className="mt-1 text-sm text-[#5f6368]">{metric.label}</p></div>; })}</div><EmptyWorkspace icon={BarChart3} title="Insights will grow with activity" description={area === "insights" ? "Create a class, add students, and grade classwork to see concept-level understanding patterns." : "Invite people and connect your roster to begin building trustworthy institution-wide reporting."} action={area === "insights" ? <Link to="/dashboard/home" className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white" style={{ backgroundColor: accent }}>Go to classes <ArrowRight className="h-4 w-4" /></Link> : <Link to="/dashboard/people" className="inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-medium text-white" style={{ backgroundColor: accent }}>Manage people <ArrowRight className="h-4 w-4" /></Link>} /></div>;
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
  return <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-10"><EmptyWorkspace icon={BookOpen} title="This workspace is not available" description="Choose a section that matches your Visionary role." action={<Link to="/dashboard/home" className="text-sm font-medium text-[#1a73e8] hover:underline">Return to dashboard</Link>} /></div>;
}
