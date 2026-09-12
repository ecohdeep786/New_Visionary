import { ClipboardCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function TeacherInsightCard({ accent, classes = [], assignmentCount = 0, pendingReviews = 0 }) {
  const message = classes.length === 0
    ? "Start with a class, then share its code with your students. Your assignments, submissions, and feedback will stay together here."
    : pendingReviews > 0
      ? `${pendingReviews} submission${pendingReviews === 1 ? " is" : "s are"} ready for your feedback. Open a class and choose Classwork to review and return work.`
      : assignmentCount === 0
        ? "Your class is ready. Add a first assignment and tag the concepts it covers to start tracking learning."
        : "You’re up to date on submitted work. Use class insights to review concept coverage and plan your next lesson.";
  return <div className="flex items-start gap-4 rounded-2xl border border-[#d3e3fd] bg-[#f8fafd] p-6"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white"><ClipboardCheck className="h-5 w-5" style={{ color: accent }} /></div><div className="min-w-0"><h2 className="text-sm font-medium text-[#202124]">Your teaching overview</h2><p className="mt-2 text-sm leading-relaxed text-[#5f6368]">{message}</p>{classes[0] && <Link to={`/dashboard/class/${classes[0].id}`} className="mt-3 inline-flex items-center gap-2 text-sm font-medium" style={{ color: accent }}>Open class <ArrowRight className="h-4 w-4" /></Link>}</div></div>;
}
