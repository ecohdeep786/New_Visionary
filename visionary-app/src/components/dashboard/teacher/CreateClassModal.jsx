import { useState } from "react";
import { X } from "lucide-react";

const COLORS = ["#1a73e8", "#34a853", "#ea4335", "#fbbc05", "#9333ea", "#f97316", "#0ea5e9", "#64748b"];

export default function CreateClassModal({ onClose, onCreate, accent = "#1a73e8" }) {
  const [form, setForm] = useState({ name: "", section: "", subject: "", room: "", color: COLORS[0] });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canCreate = form.name.trim().length > 0;

  const Field = ({ label, keyName, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-[#202124] mb-2">{label}</label>
      <input
        value={form[keyName]}
        onChange={(e) => set(keyName, e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-xl border border-[#dadce0] bg-white text-sm text-[#202124] placeholder:text-[#5f6368] outline-none focus:border-[#1a73e8] transition-colors"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-3xl p-8 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-medium text-[#202124]">Create class</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-[#5f6368]" />
          </button>
        </div>

        <Field label="Class name" keyName="name" placeholder="e.g. Algebra II" />
        <Field label="Section" keyName="section" placeholder="e.g. Period 2" />
        <Field label="Subject" keyName="subject" placeholder="e.g. Mathematics" />
        <Field label="Room" keyName="room" placeholder="e.g. 204" />

        <div>
          <label className="block text-sm font-medium text-[#202124] mb-2">Class color</label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => set("color", c)}
                className="w-9 h-9 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: form.color === c ? "scale(1.12)" : "none",
                  boxShadow: form.color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none",
                }}
                aria-label="Select color"
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => canCreate && onCreate({ ...form, name: form.name.trim() })}
          disabled={!canCreate}
          className="h-11 rounded-full text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: accent }}
        >
          Create
        </button>
      </div>
    </div>
  );
}