const rows = [
  { label: "Lessons Started", count: 1 },
  { label: "Quests", count: 0 },
  { label: "Practices", count: 0 },
  { label: "Skills", count: 0 },
];

export default function ProgressListCard() {
  return (
    <div className="flex flex-col p-5 bg-white rounded-2xl border border-[#e2e8f0]">
      <h3 className="text-base font-semibold text-[#0f172a] mb-4">Progress</h3>
      <div className="flex flex-col divide-y divide-[#e2e8f0]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3">
            <span className="text-sm text-[#64748b]">{row.label}</span>
            <span className="text-sm font-semibold text-[#0f172a]">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}