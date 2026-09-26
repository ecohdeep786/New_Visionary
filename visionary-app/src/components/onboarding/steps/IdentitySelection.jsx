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
// Portrait spots (student/teacher/parent/team, 120×160) need a 3:4 tile or slice crops them.
const PORTRAIT = ["student", "teacher", "parent", "team"];

export default function IdentitySelection({ onContinue }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      <header className="shrink-0 flex items-center justify-between px-6 lg:px-10 py-4">
        <VisionaryLogo />
        <LanguageSelector />
      </header>

      <form
        onSubmit={(event) => { event.preventDefault(); if (selected) onContinue(selected); }}
        className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-4"
      >
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
            const portrait = PORTRAIT.includes(role.illustration);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                aria-pressed={isSelected}
                className={`group flex flex-col items-center gap-4 p-8 rounded-[24px] border-2 transition-all bg-white ${
                  isSelected
                    ? "border-[#4285F4] shadow-md"
                    : "border-[#dadce0] hover:border-[#4285F4]"
                }`}
              >
                <div
                  className={`${portrait ? "w-[72px] h-24" : "w-16 h-16"} rounded-2xl flex items-center justify-center overflow-hidden transition-colors ${
                    isSelected ? "bg-[#d7e3fc]" : "bg-[#e8f0fd] group-hover:bg-[#dbe6fb]"
                  }`}
                >
                  {role.illustration ? (
                    <SpotIllustration subject={role.illustration} className="w-full h-full" />
                  ) : (
                    <Icon
                      className={`w-8 h-8 transition-colors ${
                        isSelected
                          ? "text-[#0b57d2]"
                          : "text-[#4285F4] group-hover:text-[#0b57d2]"
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
          type="submit"
          disabled={!selected}
          className="mt-8 flex items-center gap-2 h-12 px-8 bg-[#4285F4] text-white rounded-full text-sm font-medium hover:bg-[#3367d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
