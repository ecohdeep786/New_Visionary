import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import {
  Box, FileText, Image as ImageIcon, Headphones, Bookmark, Maximize2, Minimize2,
  Play, Pause, Volume2, Captions, RefreshCw, ArrowRight, Paperclip, Mic, Check, Loader2,
} from "lucide-react";
import { useThemeColor } from "@/hooks/useThemeColor";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";

const MEDIA_TABS = [
  { key: "text", label: "Text", icon: FileText },
  { key: "video", label: "3D / Video", icon: Box },
  { key: "photo", label: "Photo", icon: ImageIcon },
  { key: "audio", label: "Audio", icon: Headphones },
];

export default function CourseViewer({ topic, nextTopic, isBookmarked, onToggleBookmark, onToggleFullscreen, isFullscreen }) {
  const themeColor = useThemeColor();
  const [activeTab, setActiveTab] = useState("text");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);
  const [simplified, setSimplified] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [doubt, setDoubt] = useState("");
  const [doubtSaved, setDoubtSaved] = useState(false);

  useEffect(() => {
    if (topic && !lesson && !loading) generateLesson();
  }, [topic?.id]);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const generateLesson = async (simplify = false) => {
    setLoading(true);
    setSimplified(simplify);
    setLesson("");
    try {
      const prompt = simplify
        ? `Explain "${topic.name}" from ${topic.subject} in very simple terms for a young student. Use short sentences, simple analogies, and clear examples. Use markdown with ## headers and bullet points. Keep it brief and easy.`
        : `You are a PhD-level expert teacher. Teach "${topic.name}" from ${topic.subject} to a K-12 student. Break it down step by step — start with the core concept, explain why it matters with a real-world example, use a simple analogy, and include 2 worked examples. Make it clear, engaging, and easy to understand. Use markdown with ## headers, bullet points, and numbered lists.`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      setLesson(typeof res === "string" ? res : res.answer || "");
    } catch {
      setLesson("Unable to load this lesson right now. Please try again in a moment.");
    }
    setLoading(false);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }
    if (window.speechSynthesis && lesson) {
      const plainText = lesson.replace(/[#*`>_~-]/g, "");
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleDoubt = async (e) => {
    e.preventDefault();
    const q = doubt.trim();
    if (!q) return;
    try {
      await base44.entities.Question.create({
        subject: topic.subject || "",
        topic: topic.name || "",
        question: q,
      });
      setDoubt("");
      setDoubtSaved(true);
      setTimeout(() => setDoubtSaved(false), 3000);
    } catch {
      // silent
    }
  };

  const practiceLink = `/dashboard/practice?subject=${encodeURIComponent(topic.subject)}&topic=${encodeURIComponent(topic.name)}`;
  const nextLink = nextTopic ? `/dashboard/learn/${nextTopic.id}` : null;
  const showMediaControls = activeTab === "video" || activeTab === "audio";

  return (
    <div className="flex flex-col bg-white rounded-3xl border border-[#dadce0]/50 overflow-hidden">
      {/* Top: centered tabs + right icons */}
      <div className="relative flex items-center justify-center px-6 py-4 border-b border-[#dadce0]/40">
        <div className="flex items-center gap-1 bg-[#f1f3f4] rounded-full p-1">
          {MEDIA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-medium transition-all"
                style={isActive
                  ? { backgroundColor: "#fff", color: "#202124", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }
                  : { color: "#5f6368" }
                }
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: bookmark + fullscreen */}
        <div className="absolute right-4 flex items-center gap-1">
          <button
            onClick={onToggleBookmark}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={isBookmarked
              ? { backgroundColor: themeColor.light, color: themeColor.accent }
              : { color: "#5f6368" }
            }
            title={isBookmarked ? "Remove bookmark" : "Save bookmark"}
          >
            <Bookmark className="w-[18px] h-[18px]" fill={isBookmarked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#5f6368] hover:bg-gray-100 transition-colors"
            title={isFullscreen ? "Exit focus mode (Esc)" : "Focus mode"}
          >
            {isFullscreen ? <Minimize2 className="w-[16px] h-[16px]" /> : <Maximize2 className="w-[16px] h-[16px]" />}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="px-8 lg:px-12 py-10 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: themeColor.accent }} />
            <p className="text-sm text-[#5f6368]">Preparing your lesson...</p>
          </div>
        ) : activeTab === "text" ? (
          <ReactMarkdown
            className="prose prose-sm max-w-none
              prose-headings:text-[#202124] prose-headings:font-medium
              prose-p:text-[#3c4043] prose-p:leading-relaxed
              prose-li:text-[#3c4043] prose-strong:text-[#202124]
              prose-a:text-[#1a73e8]"
          >
            {lesson}
          </ReactMarkdown>
        ) : activeTab === "video" ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="w-full max-w-md h-56 rounded-2xl overflow-hidden bg-[#f8f9fa] flex items-center justify-center">
              <SubjectIllustration subject={topic.subject} className="w-full h-full" />
            </div>
            <p className="text-sm font-medium text-[#202124]">{topic.name}</p>
            <p className="text-xs text-[#5f6368] text-center max-w-xs">
              {topic.has_3d
                ? "Interactive 3D model — drag to explore."
                : "Video content will be available here soon."}
            </p>
          </div>
        ) : activeTab === "photo" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-md h-56 rounded-2xl overflow-hidden">
              <SubjectIllustration subject={topic.subject} className="w-full h-full" />
            </div>
            <p className="text-sm text-[#5f6368] text-center">Visual reference for {topic.name}</p>
          </div>
        ) : activeTab === "audio" ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor.light }}>
              <Headphones className="w-8 h-8" style={{ color: themeColor.accent }} />
            </div>
            <p className="text-sm text-[#5f6368]">Listen to the lesson narrated step by step</p>
          </div>
        ) : null}
      </div>

      {/* Media controls */}
      {showMediaControls && (
        <div className="flex items-center justify-center gap-8 py-4 border-t border-[#dadce0]/40">
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-[#3c4043] hover:bg-gray-100 transition-colors" title="Captions">
            <Captions className="w-5 h-5" />
          </button>
          <button
            onClick={toggleAudio}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: themeColor.accent }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-[#3c4043] hover:bg-gray-100 transition-colors" title="Volume">
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-[#dadce0]/40 flex-wrap">
        {/* Left: Re-Explain + Practice */}
        <button
          onClick={() => generateLesson(!simplified)}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-sm font-medium border border-[#dadce0] transition-colors hover:bg-gray-50"
          style={{ color: themeColor.accent }}
        >
          <RefreshCw className="w-4 h-4" /> Re-Explain
        </button>
        <Link
          to={practiceLink}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-sm font-medium border border-[#dadce0] transition-colors hover:bg-gray-50"
          style={{ color: themeColor.accent }}
        >
          Practice
        </Link>

        <div className="flex-1" />

        {/* Right: Next + doubt input */}
        <Link
          to={nextLink || "/dashboard/learn"}
          className="inline-flex items-center gap-1.5 h-10 px-6 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: themeColor.accent }}
        >
          {nextTopic ? (
            <>Next: {nextTopic.name} <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>Back to Learn <ArrowRight className="w-4 h-4" /></>
          )}
        </Link>

        {/* Doubt input */}
        <form onSubmit={handleDoubt} className="flex items-center gap-2 h-10 px-4 rounded-full border border-[#dadce0] bg-white">
          <Paperclip className="w-4 h-4 text-[#5f6368] shrink-0" />
          <input
            type="text"
            value={doubt}
            onChange={(e) => setDoubt(e.target.value)}
            placeholder="I have a doubt"
            className="w-32 lg:w-48 bg-transparent text-sm text-[#202124] placeholder:text-[#5f6368] outline-none"
          />
          <button
            type="submit"
            disabled={!doubt.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white disabled:opacity-40 transition-opacity shrink-0"
            style={{ backgroundColor: themeColor.accent }}
          >
            {doubtSaved ? <Check className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Doubt saved confirmation */}
      {doubtSaved && (
        <div className="px-6 pb-4">
          <Link
            to="/dashboard/ask"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: themeColor.accent }}
          >
            <Check className="w-4 h-4" /> Question saved — View in AGI →
          </Link>
        </div>
      )}
    </div>
  );
}