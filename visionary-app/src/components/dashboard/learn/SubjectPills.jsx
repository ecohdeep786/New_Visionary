import { useThemeColor } from "@/hooks/useThemeColor";

export default function SubjectPills({ subjects, activeSubject, onSelect }) {
  const themeColor = useThemeColor();

  const userBoard = subjects.find((s) => s.board)?.board;

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* Large centered academy text */}
      {userBoard && (
        <h1 className="text-[28px] lg:text-[32px] font-medium text-[#202124] tracking-tight text-center">
          {userBoard}
        </h1>
      )}

      {/* Full-width rectangle toggle — matches reference image */}
      <div className="w-full">
        <div className="flex items-center gap-2 w-full p-2.5 bg-white rounded-full border border-[#dadce0]/60 shadow-sm overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {subjects.map((s) => {
            const isActive = activeSubject === s.name;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.name)}
                className="flex items-center justify-center flex-1 h-12 px-8 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-[140px]"
                style={
                  isActive
                    ? { backgroundColor: themeColor.accent, color: "#fff" }
                    : { color: "#5f6368" }
                }
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}