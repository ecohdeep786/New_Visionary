import { useState, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StreamTab({ classId, classroom, accent }) {
  const [text, setText] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);

  const load = async () => {
    try {
      const list = await base44.entities.Announcement.filter({ class_id: classId });
      setAnnouncements(list || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [classId]);

  const post = async () => {
    if (!text.trim()) return;
    try {
      const created = await base44.entities.Announcement.create({ class_id: classId, text: text.trim() });
      setAnnouncements((p) => [created, ...p]);
      setText("");
    } catch {}
  };

  const draftWithAI = async () => {
    setDrafting(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Draft a short, warm class announcement (2-3 sentences) for a class named "${classroom?.name || "your class"}"${classroom?.section ? ` (${classroom.section})` : ""}. It should gently motivate students and mention upcoming work. Plain text, no greeting header, no sign-off.`,
      });
      setText(typeof res === "string" ? res : "");
    } catch {}
    setDrafting(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[680px]">
      <div className="flex flex-col gap-3 p-6 bg-white rounded-3xl border border-[#dadce0]/60">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share something with your class..."
          rows={3}
          className="w-full text-sm text-[#202124] placeholder:text-[#5f6368] outline-none resize-none bg-transparent leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={draftWithAI}
            disabled={drafting}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-[#3c4043] hover:bg-gray-50 border border-[#dadce0]/70"
          >
            <Sparkles className="w-4 h-4" style={{ color: accent }} />
            {drafting ? "Drafting…" : "Draft with AI"}
          </button>
          <button
            onClick={post}
            disabled={!text.trim()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            <Send className="w-4 h-4" /> Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-[#5f6368] max-w-sm">
            No announcements yet. Share a welcome message — or draft one with AI — to get the conversation started.
          </p>
        </div>
      ) : (
        announcements.map((a) => (
          <div key={a.id} className="p-6 bg-white rounded-3xl border border-[#dadce0]/60">
            <p className="text-sm text-[#3c4043] leading-relaxed whitespace-pre-wrap">{a.text}</p>
          </div>
        ))
      )}
    </div>
  );
}