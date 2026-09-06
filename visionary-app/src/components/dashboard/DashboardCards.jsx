import { ArrowRight } from "lucide-react";

export function StatCard({ icon: Icon, label, value, accentClass }) {
  return (
    <div className="flex items-center gap-3 px-5 py-5 bg-primary rounded-2xl shadow-[inset_0_0_0_1px_#f0f0f0] flex-1 min-w-0">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accentClass}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-muted truncate">{label}</span>
        <span className="text-2xl font-semibold text-secondary">{value}</span>
      </div>
    </div>
  );
}

export function ContinueCard({ subject, chapter, part, progress, sections }) {
  return (
    <div className="flex flex-col gap-6 p-7 bg-primary rounded-[28px] shadow-[inset_0_0_0_1px_#e6e6e6] flex-1 min-w-[280px]">
      <div className="flex items-center gap-2.5">
        <span className="px-3 py-1.5 rounded-full bg-[#f4f4f4] text-sm text-muted">
          {part}
        </span>
        <span className="px-3 py-1.5 rounded-full text-sm text-muted">
          {chapter}
        </span>
      </div>
      <div>
        <p className="text-base font-medium text-secondary">{subject}</p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-sm font-semibold text-muted">
          <span>{progress}% Completed</span>
          <span>{sections}</span>
        </div>
        <div className="h-5 bg-figma-color-11 rounded-full overflow-hidden">
          <div
            className="h-full bg-figma-color-15 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <button className="self-end w-11 h-11 flex items-center justify-center bg-figma-highlight rounded-xl text-figma-color-10 hover:opacity-80 transition-opacity">
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export function CurriculumChart({ subjects }) {
  const maxVal = 100;
  return (
    <div className="p-7 bg-primary rounded-[28px] shadow-[inset_0_0_0_1px_#f0f0f0] flex-1 min-w-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-secondary">Curriculum Progress</h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 text-sm text-muted">
          All Time
        </button>
      </div>
      <div className="flex items-end justify-around gap-4 h-48 pl-8 border-l border-[#e6e6e6]">
        {subjects.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs text-muted">{s.progress}%</span>
            <div
              className="w-8 rounded-lg bg-figma-subtle"
              style={{ height: `${(s.progress / maxVal) * 100}%` }}
            />
            <span className="text-xs text-muted text-center truncate w-full">
              {s.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverallProgress({ percent }) {
  return (
    <div className="flex flex-col items-center gap-8 p-7 bg-primary rounded-[28px] shadow-[inset_0_0_0_1px_#e6e6e6] shrink-0">
      <h3 className="text-lg font-medium text-secondary self-start">Overall Progress</h3>
      <div className="relative w-44 h-44">
        <div className="absolute inset-0 rounded-full bg-[#e4e4e4]" />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(hsl(151, 81%, 35%) ${percent * 3.6}deg, transparent ${percent * 3.6}deg)`,
          }}
        />
        <div className="absolute inset-8 rounded-full bg-primary flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-secondary">{percent}%</span>
          <span className="text-sm text-muted">Overall</span>
        </div>
      </div>
    </div>
  );
}

export function WeakestTopicCard({ subject, chapter, score }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5 bg-primary rounded-2xl shadow-[inset_0_0_0_1px_#e6e6e6] w-[300px] shrink-0">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">{subject}</span>
        <span className="text-sm text-secondary">{chapter}</span>
        <span className="text-sm font-bold text-[#dd483c]">Score {score}%</span>
      </div>
      <ArrowRight className="w-5 h-5 text-muted shrink-0" />
    </div>
  );
}