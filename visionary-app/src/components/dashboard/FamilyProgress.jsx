import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

/* Shared-progress view for parents — mirrors the RoleWorkspace design system.
   Privacy rule: only FamilyLink rows with status "active" (child-accepted)
   produce any content here; everything else renders nothing. */

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function lastNDays(n) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return { key: dayKey(d), initial: WEEKDAY_INITIALS[d.getDay()] };
  });
}

function formatDay(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function summarize(logs, window) {
  const keys = window.map((d) => d.key);
  const inWindow = logs.filter((log) => keys.includes(log.date));
  const minutes = inWindow.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const scored = inWindow.filter((log) => typeof log.confidence === "number");
  const perDay = window.map(({ key, initial }) => ({
    initial,
    minutes: inWindow.filter((log) => log.date === key).reduce((sum, log) => sum + (log.duration_minutes || 0), 0),
  }));
  const seen = new Set();
  const recent = [];
  for (const log of inWindow) {
    if (seen.has(log.topic)) continue;
    seen.add(log.topic);
    recent.push(log);
    if (recent.length === 3) break;
  }
  return {
    sessions: inWindow.length,
    minutes,
    avgConfidence: scored.length ? Math.round(scored.reduce((sum, log) => sum + log.confidence, 0) / scored.length) : null,
    perDay,
    recent,
    lastActive: inWindow[0]?.date || logs[0]?.date || null,
  };
}

function ProgressCard({ link, logs, window, accent }) {
  const attributed = logs.filter((log) => log.student_email && log.student_email.toLowerCase() === String(link.child_email).toLowerCase());
  const stats = summarize(attributed, window);
  const peak = Math.max(10, ...stats.perDay.map((day) => day.minutes));
  const activeToday = stats.lastActive === dayKey(new Date());

  return (
    <article className="rounded-2xl border border-[#dadce0] bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-medium text-[#174ea6]">{link.child_name?.charAt(0)?.toUpperCase() || "C"}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#202124]">{link.child_name}</p>
          <p className="truncate text-xs text-[#5f6368]">{link.child_email}</p>
        </div>
        <span className={"rounded-full px-3 py-1 text-xs font-medium " + (activeToday ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#f1f3f4] text-[#5f6368]")}>
          {activeToday ? "Studied today" : stats.lastActive ? "Last studied " + formatDay(stats.lastActive) : "No activity yet"}
        </span>
      </div>

      {attributed.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-[#bdc1c6] bg-[#f8fafd] px-4 py-5 text-sm leading-relaxed text-[#5f6368]">
          No shared activity yet. When {link.child_name || "your child"} studies with Visionary, their subjects, practice, and confidence appear here.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#f8fafd] px-4 py-3"><p className="text-2xl font-medium text-[#202124]">{stats.sessions}</p><p className="mt-1 text-xs text-[#5f6368]">Sessions · 7 days</p></div>
            <div className="rounded-xl bg-[#f8fafd] px-4 py-3"><p className="text-2xl font-medium text-[#202124]">{stats.minutes}</p><p className="mt-1 text-xs text-[#5f6368]">Minutes · 7 days</p></div>
            <div className="rounded-xl bg-[#f8fafd] px-4 py-3"><p className="text-2xl font-medium text-[#202124]">{stats.avgConfidence === null ? "—" : stats.avgConfidence + "%"}</p><p className="mt-1 text-xs text-[#5f6368]">Avg. confidence</p></div>
          </div>

          <div className="mt-6" aria-hidden="true">
            <div className="flex h-16 items-end gap-1.5">
              {stats.perDay.map((day, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                  <div className="w-full rounded-t-md transition-all" style={{ height: Math.max(6, Math.round((day.minutes / peak) * 100)) + "%", backgroundColor: day.minutes > 0 ? accent : "#f1f3f4" }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1.5">
              {stats.perDay.map((day, i) => <span key={i} className="flex-1 text-center text-[10px] text-[#5f6368]">{day.initial}</span>)}
            </div>
          </div>

          <div className="mt-5 border-t border-[#dadce0] pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5f6368]">Recent topics</p>
            <ul className="mt-3 space-y-2.5">
              {stats.recent.map((log) => (
                <li key={log.topic + log.date} className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 shrink-0" style={{ color: accent }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#202124]">{log.topic}</span>
                  <span className="shrink-0 text-xs text-[#5f6368]">{log.subject ? log.subject + " · " : ""}{formatDay(log.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </article>
  );
}

export default function FamilyProgress({ links = [], accent = "#1a73e8" }) {
  const activeLinks = useMemo(() => links.filter((link) => link.status === "active"), [links]);
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try { setLogs(await base44.entities.StudyLog.list("-date")); }
    catch { setError(true); }
  }, []);

  useEffect(() => {
    if (activeLinks.length === 0) return undefined;
    load();
    window.addEventListener("visionary:workspace-change", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("visionary:workspace-change", load);
      window.removeEventListener("storage", load);
    };
  }, [activeLinks.length, load]);

  if (activeLinks.length === 0) return null;

  const window = lastNDays(7);
  const attributed = new Set(activeLinks.map((link) => String(link.child_email).toLowerCase()));
  const unattributed = (logs || []).filter((log) => !log.student_email || !attributed.has(String(log.student_email).toLowerCase()));
  const singleChild = activeLinks.length === 1;

  return (
    <section aria-label="Shared learning progress">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium text-[#202124]">Shared progress</h2>
        <p className="text-xs text-[#5f6368]">Only what your children share through an accepted connection appears here.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#f2b8b5] bg-[#fce8e6] p-4 text-sm text-[#b3261e]" role="alert">
          Shared progress couldn’t be loaded.
          <button type="button" onClick={load} className="ml-3 font-medium underline">Try again</button>
        </div>
      )}
      {!error && logs === null && <p className="py-6 text-sm text-[#5f6368]" role="status">Loading shared progress…</p>}

      {!error && logs !== null && (
        <>
          {!singleChild && unattributed.length > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#dadce0] bg-[#f8fafd] px-5 py-4">
              <Sparkles className="h-5 w-5 shrink-0" style={{ color: accent }} />
              <p className="text-sm text-[#5f6368]">{unattributed.length} study {unattributed.length === 1 ? "session" : "sessions"} logged this week across your family’s Visionary accounts.</p>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {activeLinks.map((link) => (
              <ProgressCard
                key={link.id}
                link={link}
                accent={accent}
                window={window}
                logs={logs.filter((log) => {
                  const owner = String(log.student_email || "").toLowerCase();
                  if (owner) return owner === String(link.child_email).toLowerCase();
                  return singleChild;
                })}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
