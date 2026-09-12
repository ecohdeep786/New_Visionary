import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, ChevronRight, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import StreamTab from "@/components/dashboard/teacher/tabs/StreamTab";
import ClassworkTab from "@/components/dashboard/teacher/tabs/ClassworkTab";
import PeopleTab from "@/components/dashboard/teacher/tabs/PeopleTab";
import InsightsTab from "@/components/dashboard/teacher/tabs/InsightsTab";

const TABS = [
  { id: "stream", label: "Stream" },
  { id: "classwork", label: "Classwork" },
  { id: "people", label: "People" },
  { id: "insights", label: "Insights" },
];

export default function ClassDetail() {
  const { classId } = useParams();
  const themeColor = useThemeColor();
  const accent = themeColor.accent;
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("stream");
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const c = await base44.entities.Classroom.get(classId);
        const ownsClass = c && (c.teacher_email === user?.email || c.teacher_id === user?.id || c.created_by_id === user?.id || c.created_by === user?.email);
        setClassroom(ownsClass ? c : null);
      } catch { setError("We couldn’t load this class. Return to your classes and try again."); }
      setLoading(false);
    })();
  }, [classId, user?.email, user?.id]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(classroom.join_code); setCopied(true); }
    catch { setError("Copy is unavailable. Select the class code and copy it manually."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-[#5f6368]">{error || "This class isn’t available in your teaching workspace."}</p>
        <Link to="/dashboard/home" className="text-sm font-medium hover:underline" style={{ color: accent }}>
          Back to classes
        </Link>
      </div>
    );
  }

  const color = classroom.color || accent;

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <nav className="flex items-center gap-1.5 text-sm text-[#5f6368]">
        <Link to="/dashboard/home" aria-label="Back to your classes" className="flex items-center hover:text-[#202124] transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#9aa0a6]" />
        <span className="font-medium text-[#202124]">{classroom.name}</span>
      </nav>

      <div className="rounded-3xl overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 p-6 sm:p-8 lg:p-10" style={{ backgroundColor: color }}>
          <div>
            <h1 className="text-[28px] lg:text-[32px] font-medium text-white tracking-tight leading-tight">
              {classroom.name}
            </h1>
            {classroom.section && <p className="text-white/85 text-base mt-1">{classroom.section}</p>}
            {classroom.room && <p className="text-white/70 text-sm mt-1">Room {classroom.room}</p>}
          </div>
          {classroom.join_code && <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-wide text-white/90">Share this class code</p><div className="mt-1 flex items-center gap-3"><p className="select-all font-mono text-sm font-medium tracking-wide text-white">{classroom.join_code}</p><button onClick={copyCode} aria-label={copied ? "Class code copied" : "Copy class code"} className="rounded-full p-2 text-white hover:bg-white/20">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>{copied && <p role="status" className="text-xs text-white">Copied</p>}</div>}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}

      <div className="flex items-center gap-1 border-b border-[#dadce0]/60 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              className="relative h-11 px-5 text-sm font-medium transition-colors whitespace-nowrap"
              style={{ color: active ? accent : "#5f6368" }}
            >
              {t.label}
              {active && <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-full" style={{ backgroundColor: accent }} />}
            </button>
          );
        })}
      </div>

      {tab === "stream" && <StreamTab classId={classId} classroom={classroom} accent={accent} />}
      {tab === "classwork" && <ClassworkTab classId={classId} classroom={classroom} accent={accent} />}
      {tab === "people" && <PeopleTab classId={classId} classroom={classroom} accent={accent} />}
      {tab === "insights" && <InsightsTab classId={classId} classroom={classroom} accent={accent} />}
    </div>
  );
}
