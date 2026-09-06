import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Check, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function QuestionBar({ subject, topicName }) {
  const themeColor = useThemeColor();
  const [question, setQuestion] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || saving) return;
    setSaving(true);
    try {
      await base44.entities.Question.create({
        subject: subject || "",
        topic: topicName || "",
        question: q,
      });
      setQuestion("");
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      // silent
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-[#5f6368]">Have a question? Save it and your AGI will help.</p>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 bg-white rounded-full border border-[#dadce0] focus-within:border-[#1a73e8]/40 transition-colors"
      >
        <HelpCircle className="w-[18px] h-[18px] text-[#5f6368] shrink-0 ml-1" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask a question about ${topicName || "this topic"}…`}
          className="flex-1 bg-transparent text-sm text-[#202124] placeholder:text-[#5f6368] outline-none h-12"
        />
        <button
          type="submit"
          disabled={!question.trim() || saving}
          className="w-10 h-10 flex items-center justify-center text-white rounded-full disabled:opacity-40 active:scale-95 transition-all shrink-0 my-1"
          style={{ backgroundColor: themeColor.accent }}
        >
          {saved ? <Check className="w-[18px] h-[18px]" /> : <Send className="w-[18px] h-[18px]" />}
        </button>
      </form>
      {saved && (
        <div className="flex items-center justify-between px-5 py-3 bg-green-50 rounded-full">
          <span className="text-sm text-green-700 flex items-center gap-2">
            <Check className="w-4 h-4" /> Question saved to your AGI
          </span>
          <Link
            to="/dashboard/ask"
            className="text-sm font-medium text-green-700 hover:underline flex items-center gap-1"
          >
            View in AGI →
          </Link>
        </div>
      )}
    </div>
  );
}