import SpotIllustration from '@/components/landing/SpotIllustration';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Users, ClipboardList, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import ClassCard from "@/components/dashboard/teacher/ClassCard";
import CreateClassModal from "@/components/dashboard/teacher/CreateClassModal";
import TeacherInsightCard from "@/components/dashboard/teacher/TeacherInsightCard";
import TeacherUpskillCard from "@/components/dashboard/teacher/TeacherUpskillCard";
import { useWorkspace } from "@/hooks/useWorkspace";
import { createTeacherClass } from "@/services/classroomService";

/**
 * Teacher home — Google Classroom vibe with Visionary's AI layer on top.
 * Greeting → AI teaching insight (the moat) → real stats → classes grid.
 * One clear primary action: Create class. No plan redirects here.
 */
export default function TeacherHome() {
  const {
    data: copyWorkspace
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  const {
    user
  } = useAuth();
  const {
    ctx,
    revision
  } = useWorkspace();
  const themeColor = useThemeColor();
  const accent = themeColor.accent;
  const [classes, setClasses] = useState([]);
  const [assignmentCount, setAssignmentCount] = useState(0);const [studentCount,setStudentCount]=useState(0);
  const [pendingLoading,setLoading]=useState(true);const [loadedScope,setLoadedScope]=useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [error, setError] = useState("");
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get("create") === "1") {
      setShowCreate(true);
      setParams({}, {
        replace: true
      });
    }
  }, [params, setParams]);
  const scopeRef=useRef('');const scope=ctx?.personId+':'+ctx?.workspaceId;scopeRef.current=scope;const loading=pendingLoading||loadedScope!==scope;
  const previousScope=useRef(scope);useEffect(()=>{if(previousScope.current!==scope)setShowCreate(false);previousScope.current=scope;},[scope]);
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setClasses([]);
    setAssignmentCount(0);setStudentCount(0);
    setPendingReviews(0);
    setLoading(true);
    setError("");
    try {
      const [classList, allAssignments, enrollments, submissions] = await Promise.all([base44.entities.Classroom.list("-created_date"), base44.entities.Assignment.list(), base44.entities.Enrollment.list(), base44.entities.Submission.list()]);
      if (sequence !== loadSequence.current) return;
      const ownClasses = (classList || []).filter(c => c.teacher_email === user?.email || c.teacher_id === user?.id || c.created_by_id === user?.id || c.created_by === user?.email);
      const ids = new Set(ownClasses.map(c => c.id));
      setStudentCount(new Set(enrollments.filter(e=>ids.has(e.class_id)&&e.status==='active'&&typeof e.student_email==='string'&&e.student_email.trim()).map(e=>e.student_email)).size);
      setClasses(ownClasses.map(c => ({
        ...c,
        student_count: new Set(enrollments.filter(e => e.class_id === c.id && e.status === "active" && typeof e.student_email==='string' && e.student_email.trim()).map(e => e.student_email)).size
      })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setAssignmentCount((allAssignments || []).filter(a => ids.has(a.class_id)).length);
      setPendingReviews(submissions.filter(s => ids.has(s.class_id) && s.status === "submitted").length);
    } catch {
      if (sequence !== loadSequence.current) return;
      setError("We couldn’t load your classes. Please try again.");
    }
    if (sequence === loadSequence.current){setLoadedScope(scope);setLoading(false);}
  }, [user?.email, user?.id, ctx?.personId, ctx?.workspaceId, revision]);
  useEffect(() => {
    load();
    window.addEventListener("visionary:workspace-change", load);
    return () => {
      loadSequence.current++;
      window.removeEventListener("visionary:workspace-change", load);
    };
  }, [load]);
  const handleCreate = async data => {
    const currentScope=scope;
    const created = await createTeacherClass(ctx, data);
    if(currentScope!==scopeRef.current)return;
    setClasses(prev => [created, ...prev]);
    setShowCreate(false);
    window.dispatchEvent(new CustomEvent("visionary:workspace-change"));
  };
  const stats = [{
    label: "Classes",
    value: (classes || []).length,
    icon: BookOpen
  }, {
    label: "Students",
    value: studentCount,
    icon: Users
  }, {
    label: "Assignments",
    value: assignmentCount,
    icon: ClipboardList
  }];
  return <div className="v-page" lang={locale}>
      <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="v-title">{copy("Your classes")}</h1><p className="v-muted mt-2">{copy("Create a class, add students, and start teaching")}</p></div><button onClick={()=>setShowCreate(true)} className="v-button primary"><Plus size={18} aria-hidden="true"/>{copy("Create class")}</button></header>

      {error && <div role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]"> {copy(error)}  <button onClick={load} className="ml-2 font-medium underline"> {copy("Retry")} </button></div>}
      {!loading && !error && classes.length > 0 && <TeacherInsightCard accent={accent} classes={classes} assignmentCount={assignmentCount} pendingReviews={pendingReviews} />}

      {/* Stats */}
      {classes.length > 0 && <div className="v-class-stats">
        {stats.map(s => {
        const Icon = s.icon;
        return <div key={s.label} className="flex flex-wrap items-center gap-2">
              <Icon className="w-5 h-5 text-[#5f6368]" />
              <p className="text-[28px] font-medium text-[#121317] leading-none">{loading || error ? "—" : s.value}</p>
              <p className="text-sm text-[#5f6368]">{copy(s.label)}</p>
            </div>;
      })}
      </div>}

      {loading ? <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#dadce0] rounded-full animate-spin" style={{
        borderTopColor: accent
      }} />
        </div> : error ? null : classes.length === 0 ? <div className="flex flex-col items-center gap-5 py-16 text-center">
          <SpotIllustration subject="study" className="v-empty-illustration" />
          <div>
            <h3 className="text-[18px] font-medium text-[#121317] mb-2"> {copy("No classes yet")} </h3>
            <p className="text-sm text-[#5f6368] max-w-sm leading-relaxed"> {copy("Create your first class to post announcements, assign work tagged to concepts, and review recorded work, concept coverage, and feedback.")} </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-sm font-medium text-white transition-colors" style={{
        backgroundColor: accent
      }}>
            <Plus className="w-4 h-4" /> {copy("Create your first class")} </button>
        </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(c => <ClassCard key={c.id} classroom={c} />)}
        </div>}

      {showCreate && <CreateClassModal key={ctx?.personId + ':' + ctx?.workspaceId} onClose={() => setShowCreate(false)} onCreate={handleCreate} accent={accent} />}
      <details className="v-home-module"><summary className="font-medium">{copy("Grow as a teacher")}</summary><TeacherUpskillCard accent={accent}/></details>
    </div>;
}
