import { classColors } from '@/lib/classColors';
import { useWorkspace } from '@/hooks/useWorkspace';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import { Link } from "react-router-dom";
import { User } from "lucide-react";

/**
 * Google Classroom–style class card.
 * Solid color banner (no gradient) with the class name on it,
 * then a white footer showing the student count.
 */
export default function ClassCard({
  classroom
}) {
  const {
    data: copyWorkspace
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  const color = classroom.color;
  return <Link to={`/dashboard/class/${classroom.id}`} className="flex flex-col rounded-2xl overflow-hidden bg-white border border-[#dadce0]/60 hover:shadow-md transition-all">
      <div className="h-28 p-5 flex flex-col justify-end" style={{
      ...classColors(color)
    }}>
        <h3 className="text-lg font-medium leading-tight line-clamp-2">{classroom.name}</h3>
        {classroom.section && <p className="text-sm mt-0.5">{classroom.section}</p>}
        {classroom.room && <p className="text-sm">{classroom.room}</p>}
      </div>
      <div className="px-5 py-4 flex items-center gap-2 text-sm text-[#5f6368]">
        <User className="w-4 h-4" />
        <span>{Number.isFinite(classroom.student_count)?copy('{count} students',{count:classroom.student_count}):copy('Unavailable')} </span>
      </div>
    </Link>;
}
