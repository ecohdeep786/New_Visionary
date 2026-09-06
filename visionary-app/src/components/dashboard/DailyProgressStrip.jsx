import { BookOpen, Clock, Flame, TrendingUp } from "lucide-react";

export default function DailyProgressStrip({ stats }) {
  const { topicsToday, minutesToday, streak, avgConfidenceToday } = stats;
  const items = [
    { icon: BookOpen, label: "Topics Today", value: topicsToday, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Clock, label: "Study Minutes", value: minutesToday, color: "text-teal-600", bg: "bg-teal-50" },
    { icon: Flame, label: "Day Streak", value: streak, color: "text-amber-600", bg: "bg-amber-50" },
    { icon: TrendingUp, label: "Confidence", value: avgConfidenceToday > 0 ? `${avgConfidenceToday}%` : "—", color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-4 p-6 lg:p-7 bg-white rounded-3xl border border-gray-200">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${item.bg} shrink-0`}>
              <Icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1.5 truncate">{item.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}