import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";

const field = "mt-2 w-full rounded-xl border border-[#5f6368] bg-white p-3 text-sm font-normal";
export default function Connections() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const organization = user?.identity === "organization";
  const { data: records = [], isPending, error, refetch } = useQuery({
    queryKey: ["workspace", "connections", user?.email],
    queryFn: async () => {
      const [invites, family, connections] = await Promise.all([
        appClient.entities.OrganizationInvite.list(), appClient.entities.FamilyLink.list(), appClient.entities.Connection.list(),
      ]);
      return [
        ...invites.filter(r => r.organization_email === user.email || r.email === user.email).map(r => ({ ...r, entity: "OrganizationInvite", from: r.organization_email, to: r.email, label: r.organization_name || r.organization_email, description: "Organization membership · " + r.role })),
        ...family.filter(r => r.parent_email === user.email || r.child_email === user.email).map(r => ({ ...r, entity: "FamilyLink", from: r.parent_email, to: r.child_email, label: r.parent_name || r.parent_email, description: "Shares learning areas and study activity with this parent. Private questions and projects stay private." })),
        ...connections.filter(r => r.requester_email === user.email || r.recipient_email === user.email).map(r => ({ ...r, entity: "Connection", from: r.requester_email, to: r.recipient_email, label: r.requester_name || r.requester_email, description: "Learning connection · Does not share private learning data." })),
      ].filter(r => !["removed", "cancelled", "revoked", "declined"].includes(r.status));
    },
  });
  async function request(event) {
    event.preventDefault();
    if (busy) return;
    const target = email.trim().toLowerCase();
    setNotice("");
    if (target === user.email.toLowerCase()) { setNotice("Use another person’s account email."); return; }
    if (records.some(r => ((r.from === user.email && r.to === target) || (r.to === user.email && r.from === target)) && ["pending", "active"].includes(r.status))) { setNotice("You already have a connection or pending request with this account."); return; }
    setBusy("new");
    try {
      if (organization) await appClient.entities.OrganizationInvite.create({ organization_email: user.email, organization_name: user.org_name || user.full_name, email: target, role, status: "pending" });
      else await appClient.entities.Connection.create({ requester_email: user.email, requester_name: user.full_name, requester_role: user.identity, recipient_email: target, status: "pending" });
      setEmail(""); setNotice("Request saved. The recipient can accept in Connections on this browser. No email has been sent."); await refetch();
    } catch (err) { setNotice(err.message || "Could not save this request. Please try again."); }
    finally { setBusy(""); }
  }
  async function change(record, status) {
    if (busy) return;
    setBusy(record.id); setNotice("");
    try {
      if (status === "active" && record.to !== user.email) throw new Error("Only the recipient can accept this request.");
      if (status === "active" && record.entity === "OrganizationInvite" && record.role !== user.identity) throw new Error("This invitation is for a " + record.role + ". Ask the organization to invite your current role.");
      await appClient.entities[record.entity].update(record.id, { status, accepted_at: status === "active" ? new Date().toISOString() : record.accepted_at });
      await refetch(); setNotice(status === "active" ? "Connection accepted." : "Connection updated.");
    } catch (err) { setNotice(err.message || "Could not update this connection."); }
    finally { setBusy(""); }
  }
  const renderRows = (rows) => rows.length ? <div className="divide-y divide-[#dadce0] rounded-2xl border border-[#dadce0]">{rows.map(r => {
    const incoming = r.to === user.email;
    return <article key={r.entity + r.id} className="flex flex-wrap items-start gap-4 p-5">
      <div className="rounded-xl bg-[#e8f0fd] p-3 text-[#4285F4]"><Users className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><h3 className="break-words text-sm font-medium">{incoming ? r.label : r.to}</h3><p className="mt-1 break-all text-xs text-[#5f6368]">{incoming ? r.from : r.organization_name || "Request from you"}</p><p className="mt-2 max-w-xl text-xs leading-5 text-[#5f6368]">{r.description}</p><span className="mt-2 inline-block rounded-full bg-[#dadce0] px-2 py-1 text-xs">{r.status === "active" ? "Connected" : r.status === "draft" ? "Legacy draft · not sent" : incoming ? "Needs your approval" : "Awaiting acceptance"}</span></div>
      <div className="flex flex-wrap gap-2">{r.status === "pending" && incoming && <button disabled={!!busy} onClick={() => change(r,"active")} className="rounded-full bg-[#4285F4] px-4 py-2 text-sm text-white disabled:opacity-40">Accept</button>}
      <button disabled={!!busy} onClick={() => change(r, r.status === "active" ? "revoked" : incoming ? "declined" : "cancelled")} className="rounded-full border border-[#dadce0] px-4 py-2 text-sm text-[#5f6368] disabled:opacity-40">{busy === r.id ? "Saving…" : r.status === "active" ? "Disconnect" : incoming ? "Decline" : "Cancel request"}</button></div>
    </article>;
  })}</div> : <p className="rounded-2xl border border-dashed border-[#5f6368] p-7 text-sm text-[#5f6368]">Nothing here yet. Connections are optional—your own learning continues independently.</p>;
  return <div className="mx-auto max-w-[1100px] space-y-6 p-5 sm:p-8">
    <header><h1 className="text-2xl font-medium">{organization ? "People & connections" : "Connections"}</h1><p className="mt-2 text-sm leading-6 text-[#5f6368]">One personal workspace. People and organizations you choose to grow with.</p></header>
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]"><form onSubmit={request} className="rounded-2xl border border-[#dadce0] p-6"><h2 className="text-base font-medium">{organization ? "Invite someone to your organization" : "Connect with a teacher or collaborator"}</h2><label className="mt-4 block text-sm font-medium">Visionary account email<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="person@example.com" className={field} /></label>{organization && <label className="mt-4 block text-sm font-medium">Workspace role<select value={role} onChange={e => setRole(e.target.value)} className={field}><option value="teacher">Teacher</option><option value="student">Student / individual learner</option><option value="parent">Parent</option></select></label>}<button disabled={!!busy || isPending || !!error} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#4285F4] px-5 py-2.5 text-sm text-white disabled:opacity-40"><Plus className="h-4 w-4" />{busy === "new" ? "Saving…" : "Request connection"}</button></form>
    <aside className="rounded-2xl border border-[#dadce0] bg-[#ffffff] p-6"><ShieldCheck className="mb-3 h-6 w-6 text-[#4285F4]" /><h2 className="text-base font-medium">Connected, with clear boundaries</h2><p className="mt-3 text-sm leading-6 text-[#5f6368]">Requests need acceptance. Organization membership does not give access to private questions or project notes. Classes share classwork with their teacher; family progress requires a separate permission.</p>{user.identity === "parent" && <Link to="/dashboard/child" className="mt-4 inline-flex items-center gap-2 text-sm text-[#4285F4]">Connect your child<ArrowRight className="h-4 w-4" /></Link>}{user.identity === "student" && <Link to="/dashboard/classes?join=1" className="mt-4 inline-flex items-center gap-2 text-sm text-[#4285F4]">Join with a class code<ArrowRight className="h-4 w-4" /></Link>}</aside></div>
    {notice && <p role="status" className="rounded-xl bg-[#e8f0fd] p-4 text-sm leading-6 text-[#3367d6]">{notice}</p>}
    {isPending ? <p role="status" className="text-sm">Loading connections…</p> : error ? <p role="alert" className="text-sm text-[#b3261e]">Could not load connections. <button onClick={() => refetch()} className="underline">Retry</button></p> : <><section><h2 className="mb-4 text-lg font-medium">Requests</h2>{renderRows(records.filter(r => r.status !== "active"))}</section><section><h2 className="mb-4 text-lg font-medium">Connected</h2>{renderRows(records.filter(r => r.status === "active"))}</section></>}
    <p className="text-xs leading-5 text-[#5f6368]">Local preview: connections work between accounts stored in this browser. Cloud invitations, verified access rules, and cross-device sync are not active yet.</p>
  </div>;
}
