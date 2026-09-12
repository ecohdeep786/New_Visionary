import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, Check, Headphones, Loader2, Maximize2, Minimize2, Send, Sparkles, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function CourseViewer({ topic, nextTopic, isBookmarked, bookmarkBusy, onToggleBookmark, onToggleFullscreen, isFullscreen }) {
  const theme = useThemeColor();
  const initialContent = topic.lesson_content || topic.content || "";
  const [lesson, setLesson] = useState(typeof initialContent === "string" ? initialContent : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [question, setQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const audioSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const context = new URLSearchParams({ subject: topic.subject, topic: topic.name });

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  async function generateLesson() {
    if (loading) return;
    setLoading(true); setError(""); window.speechSynthesis?.cancel(); setPlaying(false);
    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt: `Explain ${topic.name} in ${topic.subject} clearly, step by step. Start with the core concept, provide a worked example, and finish with a short recap. Use markdown. State any assumptions and uncertainties.` });
      const text = typeof result === "string" ? result : result?.answer;
      if (!text?.trim()) throw new Error("No lesson was returned. Please try again.");
      setLesson(text);
    } catch (err) { setError(err.message || "The explanation is unavailable right now. Please try again."); }
    finally { setLoading(false); }
  }
  function toggleAudio() {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return; }
    if (!audioSupported || !lesson) return;
    const utterance = new SpeechSynthesisUtterance(lesson.replace(/[#*>_~]/g, ""));
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => { setPlaying(false); setError("This browser could not read the lesson aloud."); };
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); setPlaying(true);
  }
  async function saveQuestion(event) {
    event.preventDefault();
    if (!question.trim() || saving) return;
    setSaving(true); setError(""); setSaved(false);
    try { await base44.entities.Question.create({ subject: topic.subject, topic: topic.name, question: question.trim() }); setQuestion(""); setSaved(true); }
    catch (err) { setError(err.message || "Your question could not be saved. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#dadce0] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#202124]"><BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">{isFullscreen ? topic.name : "Lesson"}</span></h2>
        <div className="flex items-center gap-1">
          {audioSupported && lesson && <button aria-label={playing ? "Stop reading" : "Read lesson aloud"} title={playing ? "Stop reading" : "Read aloud"} onClick={toggleAudio} className="rounded-full p-2 text-[#5f6368] hover:bg-gray-100">{playing ? <Square className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}</button>}
          <button disabled={bookmarkBusy} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark lesson"} aria-pressed={isBookmarked} title={isBookmarked ? "Remove bookmark" : "Bookmark lesson"} onClick={onToggleBookmark} className="rounded-full p-2 text-[#5f6368] hover:bg-gray-100 disabled:opacity-40"><Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} /></button>
          <button aria-label={isFullscreen ? "Exit focus mode" : "Enter focus mode"} title={isFullscreen ? "Exit focus mode (Esc)" : "Focus mode"} onClick={onToggleFullscreen} className="rounded-full p-2 text-[#5f6368] hover:bg-gray-100">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
        </div>
      </header>
      <div className="min-h-[280px] p-5 sm:p-8">
        {loading ? <p role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-[#5f6368]"><Loader2 className="h-5 w-5 animate-spin" /> Preparing an explanation</p> : lesson ? <ReactMarkdown className="prose prose-sm max-w-none break-words text-[#3c4043] [&_pre]:overflow-x-auto">{lesson}</ReactMarkdown> : <div className="flex flex-col items-center gap-3 py-10 text-center"><BookOpen className="h-8 w-8 text-[#5f6368]" /><h3 className="text-base font-medium">Your topic is ready to explore</h3><p className="max-w-md text-sm leading-6 text-[#5f6368]">Published lesson content will appear here when available. Keep a question, connect with your class, or request an explanation.</p><button onClick={generateLesson} className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2 text-sm font-medium" style={{ color: theme.accent }}><Sparkles className="h-4 w-4" /> Request explanation</button></div>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#dadce0] p-4">
        <Link to={`/dashboard/practice?${context}`} className="rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-blue-700">Practice this topic</Link>
        <Link to={nextTopic ? `/dashboard/learn/${nextTopic.id}` : `/dashboard/learn?subject=${encodeURIComponent(topic.subject)}`} className="ml-auto rounded-full px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">{nextTopic ? "Next topic →" : "All lessons →"}</Link>
      </div>
      <form onSubmit={saveQuestion} className="border-t border-[#dadce0] p-5"><label htmlFor="lesson-question" className="mb-3 block text-sm font-medium">Keep a question for later</label><div className="flex items-center gap-2 rounded-lg border border-[#dadce0] p-2"><input id="lesson-question" maxLength={6000} value={question} onChange={(e) => { setQuestion(e.target.value); setSaved(false); }} placeholder="What would you like to understand?" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><button disabled={saving || !question.trim()} title="Save question" aria-label="Save question" className="rounded-full p-2 text-white disabled:opacity-40" style={{ backgroundColor: theme.accent }}><Send className="h-4 w-4" /></button></div>{saved && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-green-800"><Check className="h-4 w-4" /> Question saved. <Link to="/dashboard/ask" className="underline">View in Ask</Link></p>}</form>
    </section>
  );
}
