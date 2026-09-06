import { Link } from "react-router-dom";
import { User } from "lucide-react";

/**
 * Google Classroom–style class card.
 * Solid color banner (no gradient) with the class name on it,
 * then a white footer showing the student count.
 */
export default function ClassCard({ classroom }) {
  const color = classroom.color || "#1a73e8";
  return (
    <Link
      to={`/dashboard/class/${classroom.id}`}
      className="flex flex-col rounded-2xl overflow-hidden bg-white border border-[#dadce0]/60 hover:shadow-md transition-all"
    >
      <div className="h-28 p-5 flex flex-col justify-end" style={{ backgroundColor: color }}>
        <h3 className="text-white text-lg font-medium leading-tight line-clamp-2">{classroom.name}</h3>
        {classroom.section && <p className="text-white/85 text-sm mt-0.5">{classroom.section}</p>}
        {classroom.room && <p className="text-white/70 text-sm">{classroom.room}</p>}
      </div>
      <div className="px-5 py-4 flex items-center gap-2 text-sm text-[#5f6368]">
        <User className="w-4 h-4" />
        <span>{classroom.student_count || 0} students</span>
      </div>
    </Link>
  );
}