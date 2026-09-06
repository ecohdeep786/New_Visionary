import { Grid3x3 } from "lucide-react";

/**
 * Knowledge Heatmap — Visionary's teacher moat.
 * A student × concept matrix where each cell is colored by that student's
 * live mastery of that concept (avg of their graded submissions on
 * assignments tagged with that concept). This is the instructional insight
 * Google Classroom can't surface.
 */
export default function KnowledgeHeatmap({ submissions, assignments, accent }) {
  // assignment -> topics
  const aMap = {};
  (assignments || []).forEach((a) => (aMap[a.id] = a.topics || []));

  // ordered concept list (first appearance)
  const concepts = [];
  (assignments || []).forEach((a) =>
    (a.topics || []).forEach((t) => {
      if (!concepts.includes(t)) concepts.push(t);
    })
  );

  // students with per-concept grade buckets
  const studentMap = {};
  (submissions || [])
    .filter((s) => s.status === "graded")
    .forEach((s) => {
      const key = s.student_id || s.student_email || s.id;
      const name = s.student_name || s.student_email || "Student";
      if (!studentMap[key]) studentMap[key] = { name, concepts: {} };
      (aMap[s.assignment_id] || []).forEach((c) => {
        if (!studentMap[key].concepts[c]) studentMap[key].concepts[c] = [];
        studentMap[key].concepts[c].push(s.grade || 0);
      });
    });
  const students = Object.values(studentMap);

  const cellGrade = (stu, c) => {
    const g = stu.concepts[c];
    if (!g || !g.length) return null;
    return Math.round(g.reduce((x, y) => x + y, 0) / g.length);
  };
  const colorFor = (v) => {
    if (v === null) return "#f1f3f4";
    if (v >= 70) return "#34a853";
    if (v >= 40) return accent;
    return "#ea4335";
  };

  return (
    <div className="bg-white rounded-3xl border border-[#dadce0]/60 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Grid3x3 className="w-5 h-5" style={{ color: accent }} />
        <h3 className="text-sm font-medium text-[#202124]">Knowledge heatmap</h3>
      </div>
      <p className="text-xs text-[#5f6368] mb-6">
        Each student's mastery per concept — spot exactly who needs help on what.
      </p>

      {concepts.length === 0 || students.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Grid3x3 className="w-10 h-10 text-[#dadce0]" />
          <p className="text-sm text-[#5f6368] max-w-sm">
            The heatmap fills in once you tag concepts on assignments and return graded work.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="border-separate border-spacing-1 min-w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 text-left text-xs font-medium text-[#5f6368] px-2 py-1.5 whitespace-nowrap">
                    Student
                  </th>
                  {concepts.map((c) => (
                    <th
                      key={c}
                      className="text-xs font-medium text-[#5f6368] px-2 py-1.5 whitespace-nowrap"
                      style={{ minWidth: 64 }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((stu, i) => (
                  <tr key={i}>
                    <td className="sticky left-0 bg-white z-10 text-sm text-[#3c4043] px-2 py-1.5 whitespace-nowrap">
                      {stu.name}
                    </td>
                    {concepts.map((c) => {
                      const v = cellGrade(stu, c);
                      return (
                        <td key={c} className="px-0.5 py-0.5">
                          <div
                            className="h-9 min-w-[56px] rounded-lg flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: colorFor(v),
                              color: v === null ? "#9aa0a6" : "#fff",
                            }}
                            title={v === null ? "No graded work yet" : `${v}%`}
                          >
                            {v === null ? "—" : `${v}`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5">
            {[
              { label: "Mastered 70%+", color: "#34a853" },
              { label: "Developing 40–69%", color: accent },
              { label: "At risk <40%", color: "#ea4335" },
              { label: "Not yet graded", color: "#f1f3f4" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-[#5f6368]">{l.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}