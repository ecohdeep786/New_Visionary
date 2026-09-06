import { Link } from "react-router-dom";
import { Users, BarChart3, BookOpen, Shield, ArrowRight, Building2, UserPlus } from "lucide-react";
import RoleGreeting from "@/components/dashboard/RoleGreeting";
import EmptyState from "@/components/dashboard/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function OrgHome() {
  const { user } = useAuth();
  const userName = user?.org_name || user?.full_name?.split(" ")[0] || "Institution";
  const themeColor = useThemeColor();
  const accent = themeColor.accent;

  const orgTypeLabel = {
    school: "School", college: "College", university: "University",
    coaching: "Coaching Institute", training: "Training Institute",
  }[user?.org_type] || "Institution";

  return (
    <div className="flex flex-col gap-12 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <RoleGreeting userName={userName} role="organization" accent={accent}
        subtitle={`${orgTypeLabel} dashboard · oversee learning across your institution`} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: UserPlus, label: "Invite teachers", desc: "Onboard your faculty", to: "/dashboard/subscription" },
          { icon: Users, label: "Manage students", desc: "Add students & cohorts", to: "/dashboard/subscription" },
          { icon: BookOpen, label: "Set curriculum", desc: "Align syllabus & content", to: "/dashboard/subscription" },
          { icon: BarChart3, label: "View analytics", desc: "Institution-wide outcomes", to: "/dashboard/subscription" },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} to={a.to} className="bg-white rounded-3xl border border-[#dadce0]/60 p-6 hover:shadow-md transition-all group">
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${accent}15` }}>
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <h3 className="text-base font-medium text-[#202124] mb-1">{a.label}</h3>
              <p className="text-sm text-[#5f6368]">{a.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Institutional overview — guided empty state */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-medium text-[#202124]">Institutional overview</h2>
        <EmptyState
          icon={Building2}
          title="Your institution isn't populated yet"
          description="Invite teachers and add students to unlock institution-wide analytics. Visionary will show you how curriculum choices correlate with real student mastery growth over time — your strategic moat."
          actionLabel="Invite your first teachers"
          actionTo="/dashboard/subscription"
          accent={accent}
        />
      </div>

      {/* Ecosystem governance */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-medium text-[#202124]">Ecosystem governance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: "Curriculum alignment", desc: "Define your board syllabus once and roll it out to every classroom automatically." },
            { icon: Users, title: "People management", desc: "Manage teachers, students, and cohorts with role-based access controls." },
            { icon: Shield, title: "Compliance & data", desc: "FERPA and DPDP-ready. Full control over how student data is stored and exported." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="bg-white rounded-3xl border border-[#dadce0]/60 p-8">
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: `${accent}15` }}>
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <h3 className="text-base font-medium text-[#202124] mb-2">{c.title}</h3>
                <p className="text-sm text-[#5f6368] leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}