import { Clock } from "lucide-react";

export default function ExamReadinessCard({ exams }) {
  return (
    <div className="flex flex-col gap-6 p-8 bg-white rounded-3xl">
      {(!exams || exams.length === 0) ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Clock className="w-6 h-6 text-[#5f6368]" />
          <p className="text-base font-normal text-[#5f6368]">No upcoming exams scheduled.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {exams.map((exam) => {
            const readiness = exam.readiness || 0;
            const days = exam.days_left;
            const urgency = days <= 5 ? "text-red-500" : days <= 10 ? "text-amber-500" : "text-[#3c4043]";
            const barColor = readiness >= 70 ? "bg-green-500" : readiness >= 40 ? "bg-[#1a73e8]" : "bg-amber-500";
            return (
              <div key={exam.id} className="flex items-center gap-6 py-4">
                <div className="flex flex-col min-w-0 flex-1 gap-2">
                  <span className="text-base font-medium text-[#202124] truncate">{exam.title}</span>
                  <span className="text-sm font-normal text-[#5f6368]">{exam.subject}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden max-w-[240px]">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${readiness}%` }} />
                    </div>
                    <span className="text-sm font-medium text-[#3c4043]">{readiness}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm font-medium whitespace-nowrap ${urgency}`}>{days} days left</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}