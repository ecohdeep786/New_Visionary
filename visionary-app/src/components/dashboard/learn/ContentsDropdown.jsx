import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ContentsDropdown({ topics, activeTopicId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const themeColor = useThemeColor();

  const currentTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#f1f3f4] hover:bg-[#e8eaed] transition-colors"
      >
        <span className="text-sm font-medium text-[#5f6368]">Contents</span>
        {currentTopic && (
          <span className="text-sm font-normal text-[#202124] truncate max-w-[200px]">
            {currentTopic.name}
          </span>
        )}
        <ChevronDown
          className={`w-[18px] h-[18px] text-[#5f6368] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-12 left-0 w-80 max-w-[90vw] bg-white rounded-2xl shadow-lg border border-[#dadce0]/50 py-2 z-40 max-h-[400px] overflow-y-auto">
          {topics.map((t) => {
            const isActive = t.id === activeTopicId;
            const isMastered = t.status === "mastered";
            return (
              <Link
                key={t.id}
                to={`/dashboard/learn/${t.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 transition-colors"
                style={{ backgroundColor: isActive ? themeColor.light : "transparent" }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: isMastered ? themeColor.accent : "#dadce0",
                    backgroundColor: isMastered ? themeColor.accent : "transparent",
                  }}
                >
                  {isMastered && <Check className="w-3 h-3 text-white" />}
                </div>
                <span
                  className="text-sm font-normal truncate"
                  style={{ color: isActive ? themeColor.accent : "#202124", fontWeight: isActive ? 500 : 400 }}
                >
                  {t.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}