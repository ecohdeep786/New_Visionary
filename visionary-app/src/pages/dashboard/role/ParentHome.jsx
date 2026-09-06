import { Link } from "react-router-dom";
import { Baby, BarChart3, Bell, Shield, ArrowRight, Heart } from "lucide-react";
import RoleGreeting from "@/components/dashboard/RoleGreeting";
import EmptyState from "@/components/dashboard/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ParentHome() {
  const { user } = useAuth();
  const userName = user?.full_name?.split(" ")[0] || "Parent";
  const themeColor = useThemeColor();
  const accent = themeColor.accent;
  const childName = user?.child_name || "your child";

  return (
    <div className="flex flex-col gap-12 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      <RoleGreeting userName={userName} role="parent" accent={accent}
        subtitle={`Here's how ${childName} is learning today.`} />

      {/* Connect child — guided empty state */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-medium text-[#202124]">Your child's progress</h2>
        <EmptyState
          icon={Baby}
          title="Connect your child's account"
          description={`Link ${childName}'s Visionary profile to see real-time mastery, daily study activity, and AI insights on how to support their learning at home — no more waiting for report cards.`}
          actionLabel="Connect your child"
          actionTo="/dashboard/subscription"
          accent={accent}
        />
      </div>

      {/* What you'll see */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-medium text-[#202124]">What you'll get</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BarChart3, title: "Concept-level visibility", desc: "Know exactly which topics your child has mastered and which still need work — before the exam." },
            { icon: Bell, title: "Smart notifications", desc: "Get gently notified when your child needs help or completes a milestone. Never spammy." },
            { icon: Shield, title: "A safe environment", desc: "No ads, no social media, no distractions. Just focused, private learning built for kids." },
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

      {/* Ask about your child */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[22px] font-medium text-[#202124]">Ask about your child</h2>
        <div className="bg-white rounded-3xl border border-[#dadce0]/60 p-8">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
              <Heart className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div className="flex-1">
              <p className="text-base text-[#202124] leading-relaxed">
                Wondering how to help with a tough subject or whether your child is on track? Ask Visionary's AI for gentle, evidence-based guidance tailored to your child's learning history.
              </p>
              <Link to="/dashboard/ask" className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium text-white transition-colors" style={{ backgroundColor: accent }}>
                Ask a question <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}