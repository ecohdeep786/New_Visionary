import { BookOpen, CheckCircle2, Clock, PencilRuler } from "lucide-react";
import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ProgressCard({ studentData }) {
  const themeColor = useThemeColor();
  const topics = studentData.topics || [];
  const studyLogs = studentData.studyLogs || [];

  const lessons = topics.filter((t) => t.status === "mastered" || t.status === "in-progress").length;
  const mastered = topics.filter((t) => t.status === "mastered").length;
  const studyHours = Math.round(studyLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / 60);
  const practiceCount = studyLogs.length;

  const metrics = [
    { icon: BookOpen, label: "Lessons completed", value: lessons },
    { icon: CheckCircle2, label: "Topics mastered", value: mastered },
    { icon: Clock, label: "Study hours", value: studyHours },
    { icon: PencilRuler, label: "Practice sessions", value: practiceCount },
  ];

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const minutes = studyLogs
      .filter((l) => l.date === dateStr)
      .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    last7Days.push({ day: d.toLocaleDateString("en", { weekday: "short" }), minutes });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 bg-white rounded-3xl">
      {/* Left — metrics list */}
      <div className="flex flex-col">
        <h3 className="text-[17px] font-medium text-[#202124] mb-4">This week</h3>
        <div className="flex flex-col divide-y divide-gray-100">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-[#f8f9fa] flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px] text-[#5f6368]" />
                </div>
                <span className="text-base font-normal text-[#3c4043] flex-1">{m.label}</span>
                <span className="text-[22px] font-medium text-[#202124]">{m.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — study activity chart */}
      <div className="flex flex-col">
        <h3 className="text-[17px] font-medium text-[#202124] mb-4">Study activity</h3>
        <div className="flex-1 min-h-[200px] flex items-end">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={last7Days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={themeColor.accent} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={themeColor.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="minutes"
                stroke={themeColor.accent}
                strokeWidth={2}
                fill="url(#studyGradient)"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 14, fill: "#5f6368", fontWeight: 400 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}