import { useState } from "react";
import { ChevronRight, GraduationCap, BookOpen, Building2, Baby, Briefcase } from "lucide-react";
import VisionaryLogo from "@/components/VisionaryLogo";
import LanguageSelector from "@/components/auth/LanguageSelector";
import SpotIllustration from "@/components/landing/SpotIllustration";

const roles = [
  { id: "student", label: "I am a Learner", desc: "Student · Independent learning", icon: GraduationCap, illustration: "student" },
  { id: 'professional', label: 'I am a Professional', desc: 'Career · Skills · Portfolio', icon: Briefcase, illustration: "growth" },
  {
    id: "teacher",
    label: "I am a Teacher",
    desc: "School · College · Coaching · Independent",
    icon: BookOpen,
    illustration: "teacher",
  },
  {
    id: "parent",
    label: "I am a Parent",
    desc: "Track your child's learning journey",
    icon: Baby,
    illustration: "parent",
  },
  {
    id: "organization",
    label: "We are an Organization",
    desc: "School · College · University · Coaching",
    icon: Building2,
    illustration: "team",
  },
];

export default function IdentitySelection({ onContinue }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      <header className="shrink-0 flex items-center justify-between px-6 lg:px-10 py-4">
        <VisionaryLogo />
        <LanguageSelector />
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-4">
        <div className="w-full max-w-[900px] text-center mb-8">
          <h1 className="text-[28px] lg:text-[32px] font-normal text-[#121317] leading-tight">
            Let's personalize your learning journey
          </h1>
          <p className="text-sm lg:text-base text-[#5f6368] mt-2">
            How would you like to use Visionary? Choose your role
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-[1000px]">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role.id)}
                className={`group flex flex-col items-center gap-4 p-8 rounded-[24px] border-2 transition-all bg-white ${
                  isSelected
                    ? "border-[#4285F4] shadow-md"
                    : "border-[#dadce0] hover:border-[#4285F4]"
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#4285F4]"
                      : "bg-[#e8f0fd] group-hover:bg-[#4285F4]"
                  }`}
                >
                  {role.illustration ? (
                    <div className="w-10 h-10">
                      <SpotIllustration subject={role.illustration} />
                    </div>
                  ) : (
                    <Icon
                      className={`w-8 h-8 transition-colors ${
                        isSelected
                          ? "text-white"
                          : "text-[#4285F4] group-hover:text-white"
                      }`}
                    />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-[#121317]">{role.label}</p>
                  <p className="text-xs text-[#5f6368] mt-1">{role.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => selected && onContinue(selected)}
          disabled={!selected}
          className="mt-8 flex items-center gap-2 h-12 px-8 bg-[#4285F4] text-white rounded-full text-sm font-medium hover:bg-[#3367d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
