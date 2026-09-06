import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function TodayPlanCard({ topics }) {
  return (
    <div className="flex flex-col p-6 lg:p-7 bg-white rounded-3xl border border-gray-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">Today's Plan</h3>
        <span className="text-xs text-gray-400">AGI recommended</span>
      </div>
      {(!topics || topics.length === 0) ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <p className="text-sm text-gray-500">All caught up! Explore new concepts to stay ahead.</p>
          <Link to="/dashboard/learn" className="text-sm font-medium text-blue-600 hover:underline">
            Browse concepts →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                <span className="text-xs text-gray-400">{t.subject} · {t.mastery}% confidence</span>
              </div>
              <Link
                to={`/dashboard/learn/${t.id}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-colors shrink-0"
              >
                {t.status === "needs-review" ? "Review" : "Continue"} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}