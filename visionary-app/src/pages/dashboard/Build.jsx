import { Boxes, ArrowRight, Rocket, CheckCircle2, Lock, Clock } from "lucide-react";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuth } from "@/lib/AuthContext";
import BuildHero from "@/components/dashboard/BuildHero";

const projectTemplates = [
  { conceptKeyword: "Motion", title: "Projectile Motion Simulator", difficulty: "Intermediate", duration: "45 min", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop" },
  { conceptKeyword: "Gravitation", title: "Solar System Model", difficulty: "Beginner", duration: "30 min", image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=600&h=300&fit=crop" },
  { conceptKeyword: "Bonding", title: "Chemical Bonding Visualizer", difficulty: "Intermediate", duration: "40 min", image: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&h=300&fit=crop" },
  { conceptKeyword: "Trigonometry", title: "Trigonometry Explorer", difficulty: "Advanced", duration: "1 hr", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop" },
  { conceptKeyword: "Kinematics", title: "Kinematics Animation", difficulty: "Beginner", duration: "35 min", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop" },
  { conceptKeyword: "Equations", title: "Algebraic Equation Solver", difficulty: "Beginner", duration: "25 min", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop" },
  { conceptKeyword: "Reactions", title: "Chemical Reaction Simulator", difficulty: "Intermediate", duration: "40 min", image: "https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&h=300&fit=crop" },
];

const difficultyColors = {
  Beginner: "bg-green-50 text-green-700",
  Intermediate: "bg-amber-50 text-amber-700",
  Advanced: "bg-rose-50 text-rose-700",
};

export default function Build() {
  const studentData = useStudentData();
  const themeColor = useThemeColor();
  const { user } = useAuth();
  const userName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Builder";

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: themeColor.accent }} />
      </div>
    );
  }

  // Match project templates to mastered topics
  const masteredTopics = studentData.topics.filter((t) => t.status === "mastered");
  const masteredNames = masteredTopics.map((t) => t.name.toLowerCase());

  const projects = projectTemplates.map((p) => {
    const isUnlocked = masteredNames.some((n) => n.includes(p.conceptKeyword.toLowerCase()));
    const matchingTopic = masteredTopics.find((t) => t.name.toLowerCase().includes(p.conceptKeyword.toLowerCase()));
    return {
      ...p,
      concept: matchingTopic?.name || p.conceptKeyword,
      locked: !isUnlocked,
      lockedReason: `Master ${p.conceptKeyword} first`,
    };
  });

  const unlockedCount = projects.filter((p) => !p.locked).length;
  const lockedCount = projects.filter((p) => p.locked).length;
  const portfolio = [
    { title: "Kinematics Animation", concept: "Kinematics", date: "2 days ago" },
    { title: "Algebraic Equation Solver", concept: "Algebra Basics", date: "1 week ago" },
  ];
  const builtCount = portfolio.length;

  const recommendedProject = projects.find((p) => !p.locked);

  return (
    <div className="flex flex-col gap-10 p-6 lg:p-10 max-w-[1200px] mx-auto w-full">
      {/* AI Teacher Hero */}
      <BuildHero
        userName={userName}
        masteredCount={masteredTopics.length}
        unlockedCount={unlockedCount}
        recommendedProject={recommendedProject ? { ...recommendedProject, difficultyColor: difficultyColors[recommendedProject.difficulty] } : null}
      />

      {/* Stats chips */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#dadce0]/50">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: themeColor.light }}
          >
            <Rocket className="w-5 h-5" style={{ color: themeColor.accent }} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium text-[#202124] leading-none">{builtCount}</span>
            <span className="text-xs text-[#5f6368] mt-1">Projects built</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#dadce0]/50">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium text-[#202124] leading-none">{unlockedCount}</span>
            <span className="text-xs text-[#5f6368] mt-1">Unlocked</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-[#dadce0]/50">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#5f6368]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium text-[#202124] leading-none">{lockedCount}</span>
            <span className="text-xs text-[#5f6368] mt-1">Locked</span>
          </div>
        </div>
      </div>

      {/* Available projects — heading matches Up Next style */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-medium text-[#202124]">Available projects</h2>
          <p className="text-sm font-normal text-[#5f6368] mt-1">Build real applications from concepts you've mastered</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.title}
              className={`flex flex-col bg-white rounded-3xl border border-[#dadce0]/50 overflow-hidden hover:shadow-sm transition-all duration-200 ${p.locked ? "opacity-70" : ""}`}
            >
              <div className="relative h-36 overflow-hidden bg-gray-100">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                {p.locked && (
                  <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 rounded-full text-xs font-medium text-[#5f6368]">
                      <Lock className="w-3.5 h-3.5" /> {p.lockedReason}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 p-6">
                <div>
                  <p className="text-xs text-[#5f6368] mb-1">Applies: {p.concept}</p>
                  <h3 className="text-[17px] font-medium text-[#202124]">{p.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColors[p.difficulty]}`}>{p.difficulty}</span>
                  <span className="flex items-center gap-1 text-xs text-[#5f6368]">
                    <Clock className="w-3 h-3" /> {p.duration}
                  </span>
                </div>
                <button
                  disabled={p.locked}
                  className="flex items-center gap-1.5 self-start text-sm font-medium transition-colors duration-200 disabled:text-[#5f6368] disabled:cursor-not-allowed mt-1"
                  style={{ color: p.locked ? "#5f6368" : themeColor.accent }}
                >
                  {p.locked ? "Locked" : "Start building"}
                  {!p.locked && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio — heading matches Up Next style */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-medium text-[#202124]">Your portfolio</h2>
          <p className="text-sm font-normal text-[#5f6368] mt-1">Projects you've completed</p>
        </div>
        <div className="flex flex-col gap-4">
          {portfolio.map((p) => (
            <div key={p.title} className="flex items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-[#dadce0]/50 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#202124]">{p.title}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">{p.concept} · {p.date}</p>
                </div>
              </div>
              <button className="flex items-center gap-1 text-sm font-medium transition-colors shrink-0" style={{ color: themeColor.accent }}>
                View <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}