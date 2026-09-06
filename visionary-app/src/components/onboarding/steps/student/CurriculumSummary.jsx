import { BookOpen } from "lucide-react";

function SummaryChip({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2 rounded-xl bg-[#f8f9fa] border border-[#e8eaed]">
      <span className="text-xs text-[#5f6368]">{label}</span>
      <span className="text-sm font-medium text-[#202124]">{value}</span>
    </div>
  );
}

export default function CurriculumSummary({ data }) {
  const subjects = data.subjects || [];
  const boardLabel = data.board === "State" ? data.state || "State Board" : data.board;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-wrap gap-3">
        <SummaryChip label="Board" value={boardLabel} />
        <SummaryChip label="Medium" value={data.medium} />
        <SummaryChip label="Class" value={data.grade_level} />
      </div>

      <div>
        <p className="text-sm font-medium text-[#202124] mb-3">Your subjects</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subjects.map((s) => (
            <div
              key={s}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#f8f9fa] border border-[#e8eaed]"
            >
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-[#1a73e8]" />
              </div>
              <span className="text-sm text-[#202124]">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#5f6368]">
        All subjects, textbooks, and your academic calendar have been auto-configured.
        You can adjust these later in settings.
      </p>
    </div>
  );
}