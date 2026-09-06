import { useState, useEffect } from "react";
import { Plus, GraduationCap, Users, ClipboardList, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import RoleGreeting from "@/components/dashboard/RoleGreeting";
import ClassCard from "@/components/dashboard/teacher/ClassCard";
import CreateClassModal from "@/components/dashboard/teacher/CreateClassModal";
import TeacherInsightCard from "@/components/dashboard/teacher/TeacherInsightCard";
import TeacherUpskillCard from "@/components/dashboard/teacher/TeacherUpskillCard";

/**
 * Teacher home — Google Classroom vibe with Visionary's AI layer on top.
 * Greeting → AI teaching insight (the moat) → real stats → classes grid.
 * One clear primary action: Create class. No plan redirects here.
 */
export default function TeacherHome() {
  const { user } = useAuth();
  const themeColor = useThemeColor();
  const accent = themeColor.accent;
  const userName = user?.full_name?.split(" ")[0] || "Teacher";
  const [classes, setClasses] = useState([]);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [classList, allAssignments] = await Promise.all([
        base44.entities.Classroom.list("-created_date"),
        base44.entities.Assignment.list().catch(() => []),
      ]);
      setClasses(classList || []);
      setAssignmentCount((allAssignments || []).length);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data) => {
    try {
      const created = await base44.entities.Classroom.create(data);
      setClasses((prev) => [created, ...prev]);
      setShowCreate(false);
    } catch {}
  };

  const studentCount = (classes || []).reduce((sum, c) => sum + (c.student_count || 0), 0);

  const stats = [
    { label: "Classes", value: (classes || []).length, icon: BookOpen },
    { label: "Students", value: studentCount, icon: Users },
    { label: "Assignments", value: assignmentCount, icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col gap-12 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <RoleGreeting userName={userName} role="teacher" accent={accent} subtitle="Your teaching command center" />

      <TeacherInsightCard accent={accent} />
      <TeacherUpskillCard accent={accent} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-white border border-[#dadce0]/60 p-6 flex flex-col gap-2">
              <Icon className="w-5 h-5 text-[#5f6368]" />
              <p className="text-[28px] font-medium text-[#202124] leading-none">{loading ? "—" : s.value}</p>
              <p className="text-sm text-[#5f6368]">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-medium text-[#202124]">Your classes</h2>
          <p className="text-sm text-[#5f6368] mt-1">Create a class, add students, and start teaching</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-4 h-4" /> Create class
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
            <GraduationCap className="w-8 h-8" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-[#202124] mb-2">No classes yet</h3>
            <p className="text-sm text-[#5f6368] max-w-sm leading-relaxed">
              Create your first class to post announcements, assign work tagged to concepts, and watch your students' mastery map grow.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: accent }}
          >
            <Plus className="w-4 h-4" /> Create your first class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <ClassCard key={c.id} classroom={c} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateClassModal onClose={() => setShowCreate(false)} onCreate={handleCreate} accent={accent} />
      )}
    </div>
  );
}