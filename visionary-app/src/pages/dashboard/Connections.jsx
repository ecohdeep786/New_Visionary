import { learningDate } from '@/lib/learningCopy';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { Users, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { changeOrganizationInvite, changeOrganizationCapability, organizationAccess, changeRelationship, organizationInvites, requestOrganizationInvite, requestRelationship, visibleRelationships } from "@/services/workspaceService";
import OrganizationPermissionSelect from '@/components/dashboard/OrganizationPermissionSelect';
import { connectionStatus } from '@/lib/connectionAvailability';
const field = "mt-2 w-full rounded-xl border border-[#5f6368] bg-white p-3 text-sm font-normal";
const statusOf = record => connectionStatus(record);
export default function Connections() {
  const {
    data: copyWorkspace
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  const {
    user
  } = useAuth();
  const location = useLocation();
  const {
    ctx,
    revision,
    error: workspaceError
  } = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [capability, setCapability] = useState('analyst');
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const scopeRef = useRef('');
  const scope = ctx?.personId + ':' + ctx?.workspaceId;
  scopeRef.current = scope;
  useEffect(() => {
    setEmail('');
    setBusy('');
    setNotice('');
  }, [scope]);
  const organization = ctx?.role === "organization";
  let policy;
  try {
    if (organization) policy = organizationAccess(ctx);
  } catch {/* Workspace errors are shown below. */}
  let selectedInvite = "";
  try {
    if (location.hash.startsWith('#organization-invite-')) selectedInvite = decodeURIComponent(location.hash.slice('#organization-invite-'.length));
  } catch {/* An invalid fragment never selects a record. */}
  const {
    data: records = [],
    isPending,
    error,
    refetch
  } = useQuery({
    queryKey: ["workspace", "connections", user?.email, ctx?.workspaceId, revision,locale],
    enabled: !!user && !!ctx,
    queryFn: async () => {
      const [family, connections] = await Promise.all([appClient.entities.FamilyLink.list(), appClient.entities.Connection.list()]);
      const invites = organizationInvites(ctx);
      return [...invites.map(r => ({
        ...r,
        entity: "OrganizationInvite",
        from: r.organization_email,
        to: r.email,
        peer: r.email === user.email ? r.organization_name || r.organization_email : r.email,
        incoming: r.email === user.email,
        scopeLabel: `${copy('Organization membership')} · ${copy(r.role)}${r.capability ? ' · ' + copy(r.capability) : ''}`,
        approver: "Invited member"
      })), ...family.filter(r => r.parent_email === user.email || r.child_email === user.email).map(r => ({
        ...r,
        entity: "FamilyLink",
        from: r.parent_email,
        to: r.child_email,
        peer: r.parent_email === user.email ? r.child_name || r.child_email : r.parent_name || r.parent_email,
        incoming: r.child_email === user.email,
        scopeLabel: "Progress summaries",
        approver: "Learner"
      })), ...connections.filter(r => r.requester_email === user.email || r.recipient_email === user.email).map(r => ({
        ...r,
        entity: "Connection",
        from: r.requester_email,
        to: r.recipient_email,
        peer: r.requester_email === user.email ? r.recipient_email : r.requester_name || r.requester_email,
        incoming: r.recipient_email === user.email,
        scopeLabel: "Shared resources",
        approver: "Recipient"
      })), ...visibleRelationships(ctx).filter(r => !r.id.startsWith("legacy:")).map(r => ({
        ...r,
        entity: "WorkspaceRelationship",
        peer: r.name,
        incoming: r.to === ctx.personId,
        scopeLabel: r.scope.map(scope=>copy(scope)).join(", "),
        approver: r.type === "guardian" ? "Learner" : "Recipient"
      }))];
    }
  });
  useEffect(() => {
    if (!selectedInvite || isPending) return;
    const target = document.getElementById(`organization-invite-${selectedInvite}`);
    if (target) {
      target.focus({
        preventScroll: true
      });
      target.scrollIntoView({
        block: 'start'
      });
    }
  }, [selectedInvite, isPending, records]);
  async function request(event) {
    event.preventDefault();
    if (busy) return;
    const target = email.trim().toLowerCase();
    setNotice("");
    setNoticeError(false);
    if (target === user.email.toLowerCase()) {
      setNotice("Use another person’s account email.");
      setNoticeError(true);
      return;
    }
    if (organization && records.some(r => r.entity === "OrganizationInvite" && r.to === target && ["draft", "pending", "active"].includes(statusOf(r)))) {
      setNotice("This account is already in your organization list.");
      setNoticeError(true);
      return;
    }
    const currentScope = scope;
    setBusy("new");
    try {
      if (organization) requestOrganizationInvite(ctx, target, role, user.org_name || user.full_name, capability);else requestRelationship(ctx, target, "teacher");
      setEmail("");
      setNotice("Request saved locally for seven days. The recipient can accept in Connections on this browser. No email has been sent.");
      await refetch();
    } catch (err) {
      if (scopeRef.current !== currentScope) return;
      setNotice(err.message || "Could not save this request. Please try again.");
      setNoticeError(true);
    } finally {
      if (scopeRef.current === currentScope) setBusy("");
    }
  }
  async function change(record, status) {
    if (busy) return;
    const currentScope = scope;
    setBusy(record.id);
    setNotice("");
    setNoticeError(false);
    try {
      if (status === "active" && !record.incoming) throw new Error("Only the recipient can accept this request.");
      if (status === "active" && record.entity === "OrganizationInvite" && record.role !== ctx.role) throw new Error("This invitation is for a " + record.role + ". Open that workspace role first.");
      if (record.entity === "OrganizationInvite") changeOrganizationInvite(ctx, record.id, status);else if (record.entity === "WorkspaceRelationship") changeRelationship(ctx, record.id, status === "cancelled" ? "revoked" : status);else await appClient.entities[record.entity].update(record.id, {
        status,
        accepted_at: status === "active" ? new Date().toISOString() : record.accepted_at
      });
      await refetch();
      if (scopeRef.current !== currentScope) return;
      setNotice(status === "active" ? "Connection accepted." : "Connection updated.");
    } catch (err) {
      if(scopeRef.current!==currentScope)return;setNotice(err.message || "Could not update this connection.");
      setNoticeError(true);
    } finally {
      if(scopeRef.current===currentScope)setBusy("");
    }
  }
  const renderRows = rows => rows.length ? <div className="divide-y divide-[#dadce0] rounded-2xl border border-[#dadce0]">{rows.map(r => {
      const status = statusOf(r);
      const stateLabel = status === "active" ? "Connected" : status === "pending" ? r.incoming ? "Needs your approval" : "Awaiting acceptance" : status === "draft" ? "Draft · not sent" : status === "expired" ? "Expired" : status === "unavailable" ? "Unavailable · unreadable expiry" : copy('Closed · ') + copy(status);
      return <article key={r.entity + r.id} id={r.entity === 'OrganizationInvite' ? `organization-invite-${r.id}` : undefined} tabIndex={r.entity === 'OrganizationInvite' ? -1 : undefined} className={`flex scroll-mt-24 flex-wrap items-start gap-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b57d2] ${r.entity === 'OrganizationInvite' && selectedInvite === r.id ? 'bg-[#e8f0fd]' : ''}`}>
      <div className="rounded-xl bg-[#e8f0fd] p-3 text-[#0b57d2]"><Users className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><h3 className="break-all text-sm font-medium">{r.peer}</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#5f6368]"> {copy("Scope:")}  {copy(r.scopeLabel)}  {copy("\xB7 Approval:")}  {copy(r.approver)} </p>{status === "unavailable" && <p className="mt-2 text-xs leading-5 text-[#b3261e]"> {copy("The saved expiry cannot be verified. Acceptance is unavailable. Close this record and request a new connection; the original date is retained.")} </p>}{typeof r.expiresAt === 'string' && r.expiresAt.trim() && Number.isFinite(Date.parse(r.expiresAt)) && <p className="mt-1 text-xs text-[#5f6368]">{status === "expired" ? copy("Expired") : copy("Request expires")}: <time dateTime={r.expiresAt}>{learningDate(r.expiresAt, locale)}</time></p>}<span className="mt-2 inline-block rounded-full bg-[#dadce0] px-2 py-1 text-xs"> {copy(stateLabel)} </span>{r.entity === "OrganizationInvite" && <details className="mt-3 text-xs text-[#5f6368]"><summary className="cursor-pointer font-medium"> {copy("Local action history")} </summary>{Array.isArray(r.history) && r.history.length > 0 && <ol className="mt-2 space-y-1">{r.history.filter(entry=>entry&&typeof entry==='object').map((entry, index) => <li key={entry.at + index} className="break-words">{entry.actorEmail || "Previous member"} ·  {copy(entry.action)}  · <time dateTime={entry.at}>{learningDate(entry.at, locale)}</time></li>)}</ol>}{!r.historyComplete && <p className="mt-2"> {copy("Earlier actions for this imported invitation were not recorded.")} </p>}</details>}</div>
      {r.entity === 'OrganizationInvite' && r.role === 'organization' && policy?.permissions.includes('permissions') && r.organization_email === policy.organizationEmail && ['pending', 'active'].includes(status) && <div className="w-full"><OrganizationPermissionSelect label={copy('Permission for {email}', {
            email: r.email
          })} value={r.capability} disabled={!!busy} onChange={value => {
            try {
              changeOrganizationCapability(ctx, r.id, value);
              setNotice('Administrative permission saved locally.');
              setNoticeError(false);
            } catch (error) {
              setNotice(error.message);
              setNoticeError(true);
            }
          }} /></div>}
      {(status === "pending" || status === "active" || status === "unavailable") && (r.incoming || r.entity !== 'OrganizationInvite' || policy?.permissions.includes(r.role === 'organization' ? 'permissions' : 'invite')) && <div className="flex w-full flex-wrap gap-2 pl-14 sm:w-auto sm:pl-0">{status === "pending" && r.incoming && <button disabled={!!busy} onClick={() => change(r, "active")} className="rounded-full bg-[#0b57d2] px-4 py-2 text-sm text-white disabled:opacity-40"> {copy("Accept")} </button>}
      <button disabled={!!busy} onClick={() => change(r, status === "active" || status === "unavailable" && r.status === "active" ? "revoked" : r.incoming ? "declined" : "cancelled")} className="rounded-full border border-[#dadce0] px-4 py-2 text-sm text-[#5f6368] disabled:opacity-40">{busy === r.id ? copy("Saving\u2026") : status === "active" || status === "unavailable" && r.status === "active" ? copy("Disconnect") : r.incoming ? copy("Decline") : copy("Cancel request")}</button></div>}
    </article>;
    })}</div> : <p className="rounded-2xl border border-dashed border-[#5f6368] p-7 text-sm text-[#5f6368]">{organization ? copy("No organization connections in this section yet.") : copy("Nothing here yet. Connections are optional\u2014your own learning continues independently.")}</p>;
  return <div className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-8">
    <header><h1 className="text-2xl font-medium">{organization ? copy("People & connections") : copy("Connections")}</h1><p className="mt-2 text-sm leading-6 text-[#5f6368]">{organization ? copy("Manage local invitations and review who accepted, declined or lost access.") : copy("Your personal and work relationships, each with its own permission.")}</p></header>
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">{!organization || policy?.permissions.includes('invite') ? <form onSubmit={request} className="rounded-2xl border border-[#dadce0] p-6"><h2 className="text-base font-medium">{organization ? copy("Invite someone to your organization") : copy("Connect with a teacher or collaborator")}</h2><label className="mt-4 block text-sm font-medium"> {copy("Visionary account email")} <input type="email" required maxLength={254} disabled={!!busy} value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com" className={field} /></label>{organization && <label className="mt-4 block text-sm font-medium"> {copy("Workspace role")} <select aria-label={copy("Workspace role")} disabled={!!busy} value={role} onChange={e => setRole(e.target.value)} className={field}><option value="teacher"> {copy("Teacher")} </option><option value="student"> {copy("Student / individual learner")} </option><option value="professional"> {copy("Professional / team member")} </option><option value="parent"> {copy("Parent")} </option>{policy?.permissions.includes('permissions') && <option value="organization"> {copy("Organization administration")} </option>}</select></label>}{organization && role === 'organization' && <OrganizationPermissionSelect value={capability} onChange={setCapability} />}<button disabled={!!busy || isPending || !!error || !ctx} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0b57d2] px-5 py-2.5 text-sm text-white disabled:opacity-40"><Plus className="h-4 w-4" />{busy === "new" ? copy("Saving\u2026") : copy("Request connection")}</button></form> : <section className="v-card"><h2 className="text-lg font-medium"> {copy("Your administrative connection")} </h2><p className="v-muted mt-3">{copy(policy?.label||'')} {copy(". Your owner manages organization invitations and permissions.")} </p></section>}
    <aside className="rounded-2xl border border-[#dadce0] bg-[#ffffff] p-6"><ShieldCheck className="mb-3 h-6 w-6 text-[#0b57d2]" /><h2 className="text-base font-medium"> {copy("Connected, with clear boundaries")} </h2><p className="mt-3 text-sm leading-6 text-[#5f6368]"> {copy("Requests need acceptance. Organization membership does not give access to private questions or project notes. Classes share classwork with their teacher; family progress requires a separate permission.")} </p>{ctx?.role === "parent" && <Link to="/dashboard/child" className="mt-4 inline-flex items-center gap-2 text-sm text-[#0b57d2]"> {copy("Connect your child")} <ArrowRight className="h-4 w-4" /></Link>}{ctx?.role === "student" && <Link to="/dashboard/classes?join=1" className="mt-4 inline-flex items-center gap-2 text-sm text-[#0b57d2]"> {copy("Join with a class code")} <ArrowRight className="h-4 w-4" /></Link>}</aside></div>
    {notice && <p role={noticeError ? "alert" : "status"} className={noticeError ? "rounded-xl bg-[#fce8e6] p-4 text-sm leading-6 text-[#b3261e]" : "rounded-xl bg-[#e8f0fd] p-4 text-sm leading-6 text-[#3367d6]"}> {copy(notice)} </p>}
    {selectedInvite && !isPending && !error && !workspaceError && !records.some(record => record.entity === 'OrganizationInvite' && record.id === selectedInvite) && <p role="status" className="v-notice"> {copy("The selected organization connection is unavailable in this workspace. You can review your available connections below.")} </p>}
    {workspaceError ? <p role="alert" className="text-sm text-[#b3261e]">{workspaceError}</p> : isPending ? <p role="status" className="text-sm"> {copy("Loading connections\u2026")} </p> : error ? <p role="alert" className="text-sm text-[#b3261e]"> {copy("Could not load connections.")} <button onClick={() => refetch()} className="underline"> {copy("Retry")} </button></p> : <><section><h2 className="mb-4 text-lg font-medium"> {copy("Requests")} </h2>{renderRows(records.filter(r => ["pending", "draft"].includes(statusOf(r))))}</section><section><h2 className="mb-4 text-lg font-medium"> {copy("Connected")} </h2>{renderRows(records.filter(r => statusOf(r) === "active"))}</section><section><h2 className="mb-4 text-lg font-medium"> {copy("Closed history")} </h2>{renderRows(records.filter(r => !["pending", "draft", "active"].includes(statusOf(r))))}</section></>}
    <p className="text-xs leading-5 text-[#5f6368]"> {copy("Local preview: connections work between accounts stored in this browser. Cloud invitations, verified access rules, and cross-device sync are not active yet.")} </p>
  </div>;
}
