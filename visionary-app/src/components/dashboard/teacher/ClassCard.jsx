import { useWorkspace } from '@/hooks/useWorkspace';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** A quiet class destination; the full classroom context opens with the class. */
export default function ClassCard({
  classroom
}) {
  const {
    data: copyWorkspace
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  return <Link to={`/dashboard/class/${classroom.id}`} className="v-class-card" title={[classroom.name, classroom.section, classroom.room].filter(Boolean).join(' · ')}>
      <div className="v-class-card-copy">
        <h3>{classroom.name}</h3>
        <p className="v-muted">{[classroom.section, classroom.room].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="v-class-card-footer">
        <span>{Number.isFinite(classroom.student_count)?copy('{count} students',{count:classroom.student_count}):copy('Unavailable')} </span>
        <ArrowRight size={18} aria-hidden="true" />
      </div>
    </Link>;
}
