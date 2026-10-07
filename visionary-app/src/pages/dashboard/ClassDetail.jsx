import { teacherCopy } from '@/lib/teacherCopy';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { Home, ChevronRight, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import StreamTab from "@/components/dashboard/teacher/tabs/StreamTab";
import ClassworkTab from "@/components/dashboard/teacher/tabs/ClassworkTab";
import PeopleTab from "@/components/dashboard/teacher/tabs/PeopleTab";
import InsightsTab from "@/components/dashboard/teacher/tabs/InsightsTab";
import ClassPromotion from "@/components/dashboard/ClassPromotion";
import CommunityTab from "@/components/dashboard/CommunityTab";
import ClassCurriculum from '@/components/dashboard/ClassCurriculum';
const TABS = [{
  id: "stream",
  label: "Stream"
}, {
  id: "classwork",
  label: "Classwork"
}, {
  id: "curriculum",
  label: "Curriculum"
}, {
  id: "people",
  label: "People"
}, {
  id: "insights",
  label: "Insights"
}, {
  id: "community",
  label: "Community"
}];
export default function ClassDetail() {
  const scope = useWorkspace();
  const {
    classId
  } = useParams();
  return <ClassDetailContent key={scope.ctx?.personId + ':' + scope.ctx?.workspaceId + ':' + classId} scope={scope} />;
}
function ClassDetailContent({
  scope
}) {
  const {
    classId
  } = useParams();
  const {
    data: workspaceData,
    ctx,
    revision
  } = scope;
  const locale = workspaceData?.preferences.interfaceLocale || 'en';
  const copy = teacherCopy(locale);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const firstRead = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [searchParams] = useSearchParams();
  const themeColor = useThemeColor();
  const accent = themeColor.accent;
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(() => searchParams.has('curriculum') ? 'curriculum' : 'stream');
  const {
    user
  } = useAuth();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let current = true;
    if (firstRead.current) {
      setLoading(true);
      firstRead.current = false;
    }
    setError('');
    (async () => {
      try {
        const c = await base44.entities.Classroom.get(classId);
        if (!current) return;
        const ownsClass = c && (c.teacher_email === user?.email || c.teacher_id === user?.id || c.created_by_id === user?.id || c.created_by === user?.email);
        setClassroom(ownsClass ? c : null);
        setCopied(false);
      } catch {
        if (current) {
          setClassroom(null);
          setError('We couldn’t load this class. Return to your classes and try again.');
        }
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [classId, user?.email, user?.id, ctx?.workspaceId, revision, retry]);
  const copyCode = async () => {
    try {
      const latest = await base44.entities.Classroom.get(classId);
      if (!mounted.current) return;
      if (!latest || !(latest.teacher_email === user?.email || latest.teacher_id === user?.id || latest.created_by_id === user?.id || latest.created_by === user?.email)) {
        setClassroom(null);
        throw Error('Class unavailable');
      }
      if (typeof latest.join_code !== 'string' || !latest.join_code.trim()) throw Error('Class code unavailable');
      await navigator.clipboard.writeText(latest.join_code);
      if (mounted.current) setCopied(true);
    } catch {
      if (mounted.current) setError("Copy is unavailable. Select the class code and copy it manually.");
    }
  };
  if (ctx?.role === 'student' || ctx?.role === 'professional') return <Navigate to={"/dashboard/classes?class=" + classId} replace />;
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]" lang={locale} role="status" aria-label={copy('Loading classes…')}>
        <div className="w-8 h-8 border-4 border-[#dadce0] rounded-full animate-spin" style={{
        borderTopColor: accent
      }} />
      </div>;
  }
  if (!classroom) {
    return <div className="flex flex-col items-center gap-4 py-20 text-center" lang={locale}>
        <h1 className="v-title">{copy('Class unavailable')}</h1><p className="text-sm text-[#5f6368]" role="alert">{copy(error || "This class isn’t available in your teaching workspace.")}</p><button className="v-button" onClick={() => setRetry(value => value + 1)}>{copy('Retry')}</button>
        <Link to="/dashboard/classes" className="text-sm font-medium hover:underline" style={{
        color: accent
      }}>{copy("Back to classes")}</Link>
      </div>;
  }
  return <div className="v-page v-class-detail" lang={locale}>
      <nav className="flex items-center gap-1.5 text-sm text-[#5f6368]">
        <Link to="/dashboard/classes" aria-label={copy("Back to your classes")} className="flex items-center hover:text-[#121317] transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5f6368]" />
        <span className="font-medium text-[#121317]">{classroom.name}</span>
      </nav>

      <header className="v-class-heading">
          <div>
            <h1 className="v-title">
              {classroom.name}
            </h1>
            {classroom.section && <p className="v-muted mt-2">{classroom.section}</p>}
            {classroom.room && <p className="v-muted">{copy('Room {room}', {
              room: classroom.room
            })}</p>}
          </div>
          {classroom.join_code && <div className="v-class-code"><p>{copy("Share this class code")}</p><div className="mt-1 flex items-center gap-3"><p className="select-all font-mono text-sm font-medium tracking-wide">{classroom.join_code}</p><button onClick={copyCode} aria-label={copy(copied ? "Class code copied" : "Copy class code")} className="min-h-11 min-w-11 rounded-full p-2 text-[#0b57d2] hover:bg-[#e8f0fd]">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>{copied && <p role="status" className="text-xs">{copy("Copied")}</p>}</div>}
      </header>
      {error && <p role="alert" className="text-sm text-[#b3261e]">{copy(error)}</p>}


      <nav className="v-class-sections" aria-label={copy("Class sections")}>
        {TABS.map(t => {
        const active = tab === t.id;
        return <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={active} className="relative h-11 px-5 text-sm font-medium transition-colors whitespace-nowrap" style={{
          color: active ? accent : "#5f6368"
        }}>
              {copy(t.label)}
              {active && <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-full" style={{
            backgroundColor: accent
          }} />}
            </button>;
      })}
      </nav>

      {tab === "stream" && <StreamTab locale={locale} classId={classId} classroom={classroom} accent={accent} />}
      {tab === "classwork" && <ClassworkTab locale={locale} classId={classId} classroom={classroom} accent={accent} />}
      {tab === "curriculum" && <ClassCurriculum key={classId} classId={classId} />}
      {tab === "people" && <PeopleTab locale={locale} classId={classId} classroom={classroom} accent={accent} />}
      {tab === "insights" && <InsightsTab locale={locale} classId={classId} classroom={classroom} accent={accent} />}
  {tab === "community" && <CommunityTab classId={classId} accent={accent} />}
      <ClassPromotion locale={locale} classId={classId} accent={accent} />
    </div>;
}
