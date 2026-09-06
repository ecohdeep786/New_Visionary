import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Building2, ArrowRight } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import PricingCard from "@/components/dashboard/PricingCard";

const plans = [
  {
    id: "free",
    tagline: "Free",
    badge: "Current",
    monthly: 0,
    yearly: 0,
    outcome: "Full access to learning — with ads.",
    cta: "Get Started",
    features: [
      { text: "Learn, Ask & Practice on every topic", included: true },
      { text: "Mastery tracking across all subjects", included: true },
      { text: "10 AI questions per day", included: false },
      { text: "Ad-supported experience", included: false },
    ],
  },
  {
    id: "premium",
    tagline: "Premium",
    badge: "Most popular",
    popular: true,
    monthly: 199,
    yearly: 1990,
    outcome: "Unlimited AI tutoring, zero ads, full mastery tracking.",
    cta: "Go Premium",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Unlimited AI tutoring & questions", included: true },
      { text: "Zero ads, everywhere", included: true },
      { text: "Market trends & project building", included: true },
      { text: "Priority AGI responses", included: true },
    ],
  },
  {
    id: "family",
    tagline: "Family Pack",
    monthly: 499,
    yearly: 4990,
    perPerson: 83,
    perPersonYearly: 69,
    outcome: "Premium for the whole family. Up to 6 accounts.",
    cta: "Get Family Pack",
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Up to 6 separate accounts", included: true },
      { text: "Individual progress tracking", included: true },
      { text: "Shared family dashboard", included: true },
    ],
  },
];

export default function Subscription() {
  const studentData = useStudentData();
  const { user } = useAuth();
  const themeColor = useThemeColor();
  const [billing, setBilling] = useState("monthly");
  const userName = user?.full_name?.split(" ")[0] || "Learner";

  const avgMastery = studentData.subjects.length > 0
    ? Math.round(studentData.subjects.reduce((sum, s) => sum + (s.overall_mastery || 0), 0) / studentData.subjects.length)
    : 0;
  const topSubject = [...studentData.subjects].sort((a, b) => (b.overall_mastery || 0) - (a.overall_mastery || 0))[0];
  const masteredCount = studentData.topics.filter((t) => t.status === "mastered").length;

  return (
    <div className="flex flex-col gap-12 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      {/* Personalized hero */}
      <div className="flex flex-col items-center gap-5 text-center pt-4">
        <h1 className="text-[30px] lg:text-[36px] font-medium text-[#202124] tracking-tight max-w-2xl leading-tight">
          {studentData.loading
            ? "Unlock your full potential"
            : `${userName}, you're ${avgMastery}% through your subjects`}
        </h1>
        <p className="text-base text-[#5f6368] max-w-xl leading-relaxed">
          {studentData.loading || !topSubject
            ? "Go ad-free with unlimited AI tutoring and finish your journey faster."
            : `You've mastered ${masteredCount} topics so far. Unlock unlimited AI tutoring to finish faster.`}
        </p>

        {/* Top subject progress */}
        {!studentData.loading && topSubject && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-full mt-2" style={{ backgroundColor: themeColor.light }}>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" style={{ color: themeColor.accent }} />
            </div>
            <span className="text-sm font-medium text-[#202124]">{topSubject.name}</span>
            <div className="w-28 h-1.5 bg-white rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${topSubject.overall_mastery || 0}%`, backgroundColor: themeColor.accent }} />
            </div>
            <span className="text-sm font-medium" style={{ color: themeColor.accent }}>{topSubject.overall_mastery || 0}%</span>
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${billing === "monthly" ? "font-medium text-[#202124]" : "text-[#5f6368]"}`}>
          Monthly
        </span>
        <button
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          className="relative w-12 h-6 rounded-full transition-colors"
          style={{ backgroundColor: billing === "yearly" ? themeColor.accent : "#dadce0" }}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              billing === "yearly" ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={`text-sm ${billing === "yearly" ? "font-medium text-[#202124]" : "text-[#5f6368]"}`}>
          Yearly
        </span>
        <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333] text-xs font-medium">
          2 months free
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} billing={billing} isCurrent={plan.id === "free"} accent={themeColor.accent} />
        ))}
      </div>

      {/* Organizations callout */}
      <div className="flex items-center gap-4 p-6 lg:p-8 bg-white rounded-3xl border border-[#dadce0]/60">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColor.accent}15` }}>
          <Building2 className="w-6 h-6" style={{ color: themeColor.accent }} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-[#202124]">Need Visionary for your school or coaching center?</h3>
          <p className="text-sm text-[#5f6368] mt-1">Check out Visionary for Organizations — no-cost plans for institutions.</p>
        </div>
        <Link to="/dashboard/subscription" className="hidden sm:flex items-center gap-1 text-sm font-medium shrink-0 whitespace-nowrap" style={{ color: themeColor.accent }}>
          Get access <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[#5f6368] leading-relaxed max-w-3xl">
        *Free plan is ad-supported with a daily limit of 10 AI questions. Premium and Family plans include unlimited
        AI tutoring, ad-free experience, and full mastery tracking. Family Pack supports up to 6 accounts with
        individual progress tracking. Cancel anytime. Prices in INR. Taxes may apply.
      </p>
    </div>
  );
}