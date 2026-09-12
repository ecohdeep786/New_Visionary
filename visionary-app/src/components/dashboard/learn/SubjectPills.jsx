import { useThemeColor } from "@/hooks/useThemeColor";

export default function SubjectPills({ subjects, activeSubject, onSelect }) {
  const theme = useThemeColor();
  if (!subjects.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by subject">
      {subjects.map((subject) => (
        <button key={subject.id || subject.name} onClick={() => onSelect(subject.name)} aria-pressed={activeSubject === subject.name}
          className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={activeSubject === subject.name ? { backgroundColor: theme.light, color: theme.accent, borderColor: theme.accent } : { borderColor: "#dadce0", color: "#5f6368" }}>
          {subject.name}
        </button>
      ))}
    </div>
  );
}
