import { useState } from "react";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * LeetCode-style streak: a 7-day week on the dashboard, expandable to a full
 * month contribution grid. A perfect month (no missed day) earns a badge.
 */
export default function StreakCard({ streak = 0, studyLogs = [] }) {
  const themeColor = useThemeColor();
  const [expanded, setExpanded] = useState(false);
  const today = new Date();
  const studiedSet = new Set((studyLogs || []).map((l) => l.date));
  const isStudied = (dateStr) => studiedSet.has(dateStr);
  const fmt = (d) => d.toISOString().split("T")[0];

  // Week — last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7.push({ date: d, key: fmt(d), label: dayLabels[d.getDay()], isToday: i === 0 });
  }

  // Month — current month, day 1..today, in a Sun-start 7-col grid
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthCells = [];
  for (let i = 0; i < firstWeekday; i++) monthCells.push(null);
  for (let day = 1; day <= todayDate; day++) {
    const d = new Date(year, month, day);
    monthCells.push({ date: d, key: fmt(d), isToday: day === todayDate });
  }

  const studiedThisMonth = monthCells.filter((c) => c && isStudied(c.key)).length;
  const perfectMonth = todayDate > 0 && studiedThisMonth === todayDate;

  return (
    <div className="flex flex-col gap-5 px-6 py-6 min-w-[280px]">
      <div className="flex items-start gap-2">
        <span className="text-[56px] font-medium text-[#202124] leading-none">{streak}</span>
        <div className="flex flex-col gap-1 pt-1.5">
          <Flame className="w-[18px] h-[18px] text-orange-500" fill="currentColor" />
          <span className="text-sm text-[#5f6368]">day streak</span>
        </div>
      </div>

      <div className="h-px bg-[#dadce0]" />

      {expanded ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#202124]">{today.toLocaleString("default", { month: "long" })}</span>
            <span className="text-xs text-[#5f6368]">{studiedThisMonth}/{todayDate} days</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((c, i) =>
              c ? (
                <div
                  key={i}
                  className="aspect-square rounded-[5px]"
                  style={{
                    backgroundColor: isStudied(c.key) ? themeColor.accent : "#f1f3f4",
                    boxShadow: c.isToday ? `0 0 0 2px ${themeColor.accent}` : undefined,
                  }}
                  title={`${c.key}${isStudied(c.key) ? " · studied" : ""}`}
                />
              ) : (
                <div key={i} />
              )
            )}
          </div>
          {perfectMonth ? (
            <div className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full bg-[#fef7e0] text-[#b06000] text-xs font-medium">
              <Flame className="w-3.5 h-3.5" fill="currentColor" /> Perfect month — every day studied
            </div>
          ) : (
            <p className="text-xs text-[#5f6368]">Study every day this month to earn a monthly badge.</p>
          )}
        </div>
      ) : (
        <div className="flex items-end justify-between gap-1.5">
          {last7.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-7 h-7 rounded-[7px] flex items-center justify-center"
                style={{ backgroundColor: isStudied(d.key) ? themeColor.accent : "#f1f3f4" }}
              >
                {isStudied(d.key) && <Flame className="w-3 h-3 text-white" fill="currentColor" />}
              </div>
              <span className="text-xs" style={d.isToday ? { color: themeColor.accent, fontWeight: 500 } : { color: "#5f6368" }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded((e) => !e)}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#5f6368] hover:text-[#202124] self-start"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? "Show week" : "Show month"}
      </button>
    </div>
  );
}