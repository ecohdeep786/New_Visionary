import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

const masteryColors = {
  low: "#ef4444",
  medium: "#f59e0b",
  high: "#22c55e",
  mastered: "#16a34a",
};

function getColor(value) {
  if (value >= 80) return masteryColors.mastered;
  if (value >= 60) return masteryColors.high;
  if (value >= 35) return masteryColors.medium;
  return masteryColors.low;
}

export default function MasteryMap({ subjects }) {
  const data = subjects.map((s) => ({
    name: s.name,
    value: s.mastery,
    fill: getColor(s.mastery),
  }));

  return (
    <div className="flex flex-col p-6 bg-white rounded-2xl border border-slate-200 flex-1 min-w-[420px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-slate-900">Mastery Map</h3>
        <span className="text-xs text-slate-500">Confidence by subject</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-[200px] h-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="30%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: "#f1f5f9" }} dataKey="value" cornerRadius={8} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5 flex-1">
          {subjects.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getColor(s.mastery) }}
                />
                <span className="text-sm text-slate-700">{s.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">{s.mastery}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}