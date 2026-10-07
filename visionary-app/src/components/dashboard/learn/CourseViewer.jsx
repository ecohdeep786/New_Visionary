import { legacyLearningCopy } from '@/lib/legacyLearningCopy';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getResourceEditorDraft, saveResourceEditorDraft, clearResourceEditorDraft } from '@/services/resourceEditorDraft';
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, Check, Headphones, Loader2, Maximize2, Minimize2, Send, Sparkles, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { useThemeColor } from "@/hooks/useThemeColor";
export default function CourseViewer({
  topic,
  nextTopic,
  isBookmarked,
  bookmarkBusy,
  onToggleBookmark,
  onToggleFullscreen,
  isFullscreen
}) {
  const {
    ctx,
    data: workspaceData
  } = useWorkspace();
  const locale = workspaceData?.preferences.interfaceLocale || 'en';
  const copy = legacyLearningCopy(locale);
  const scope = useRef('');
  scope.current = ctx?.personId + ':' + ctx?.workspaceId + ':' + topic.id;
  const draftKey = 'new:legacy-question:' + topic.id;
  const [backupReady, setBackupReady] = useState(false),
    [savedQuestion, setSavedQuestion] = useState('');const [backupFailure,setBackupFailure]=useState(false),[backupRetry,setBackupRetry]=useState(0);
  const Heading = isFullscreen ? 'h1' : 'h2';
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
  const context = new URLSearchParams({
    subject: topic.subject,
    topic: topic.name
  });
  useEffect(() => {
    let live = true;scope.current=ctx?.personId+':'+ctx?.workspaceId+':'+topic.id;setBackupReady(false);setBackupFailure(false);
    try {
      const backup = getResourceEditorDraft(ctx, draftKey);
      if (backup && typeof backup.draft.body === 'string') setQuestion(current=>current||backup.draft.body);
      setBackupReady(true);setError("");
    } catch (error) {
      if (live) {setError(error.message);setBackupFailure(true);}
    }
    const stop = () => {
      window.speechSynthesis?.cancel();
      if (live) setPlaying(false);
    };
    const hidden = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      live = false;
      scope.current = '';
      window.speechSynthesis?.cancel();
      window.removeEventListener('pagehide', stop);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [ctx?.personId, ctx?.workspaceId, topic.id,backupRetry]);
  useEffect(() => {
    if (!backupReady || !question || !ctx) return;
    try {
      saveResourceEditorDraft(ctx, draftKey, {
        title: topic.name,
        body: question
      });
    } catch (error) {
      setError(error.message);
    }
  }, [question, backupReady, ctx?.personId, ctx?.workspaceId, topic.id]);
  async function generateLesson() {
    if (loading) return;
    const requestScope = scope.current;
    setLoading(true);
    setError("");
    window.speechSynthesis?.cancel();
    setPlaying(false);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Explain ${topic.name} in ${topic.subject} clearly, step by step. Start with the core concept, provide a worked example, and finish with a short recap. Use markdown. State any assumptions and uncertainties.`
      });
      const text = typeof result === "string" ? result : result?.answer;
      if (!text?.trim()) throw new Error("No lesson was returned. Please try again.");
      if (scope.current === requestScope) setLesson(text);
    } catch (err) {
      if (scope.current === requestScope) setError(err.message || "The explanation is unavailable right now. Please try again.");
    } finally {
      if (scope.current === requestScope) setLoading(false);
    }
  }
  function toggleAudio() {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    if (!audioSupported || !lesson) return;
    const utterance = new SpeechSynthesisUtterance(lesson.replace(/[#*>_~]/g, ""));
    const requestScope = scope.current;
    utterance.lang = ['en', 'hi', 'bn'].includes(topic.locale) ? topic.locale : 'en';
    utterance.onend = () => {
      if (scope.current === requestScope) setPlaying(false);
    };
    utterance.onerror = () => {
      if (scope.current !== requestScope) return;
      setPlaying(false);
      setError("This browser could not read the lesson aloud.");
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }
  async function saveQuestion(event) {
    event.preventDefault();
    if (!question.trim() || saving) return;
    const requestScope = scope.current,
      body = question.trim();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const previous = await base44.entities.Question.filter({
        subject: topic.subject,
        topic: topic.name,
        question: body
      });
      if (scope.current !== requestScope) return;
      if (!previous.length) await base44.entities.Question.create({
        subject: topic.subject,
        topic: topic.name,
        question: body
      });
      if (scope.current !== requestScope) return;
      setSavedQuestion(body);
      setQuestion("");
      setSaved(true);
      try {
        clearResourceEditorDraft(ctx, draftKey);
      } catch (error) {
        setError(error.message);
      }
    } catch (err) {
      if (scope.current === requestScope) setError(err.message || "Your question could not be saved. Please try again.");
    } finally {
      if (scope.current === requestScope) setSaving(false);
    }
  }
  return <section className="min-w-0 overflow-hidden rounded-xl border border-[#dadce0] bg-white" lang={locale}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dadce0] px-4 py-3">
        <Heading className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#121317]"><BookOpen className="h-4 w-4 shrink-0" /><span className="truncate">{isFullscreen ? topic.name : copy("Lesson")}</span></Heading>
        <div className="flex items-center gap-1">
          {audioSupported && lesson && <button aria-label={playing ? copy("Stop reading") : copy("Read lesson aloud")} title={playing ? copy("Stop reading") : copy("Read aloud")} onClick={toggleAudio} className="rounded-full p-2 text-[#5f6368] hover:bg-[#121317]/5">{playing ? <Square className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}</button>}
          <button disabled={bookmarkBusy} aria-label={isBookmarked ? copy("Remove bookmark") : copy("Bookmark lesson")} aria-pressed={isBookmarked} title={isBookmarked ? copy("Remove bookmark") : copy("Bookmark lesson")} onClick={onToggleBookmark} className="rounded-full p-2 text-[#5f6368] hover:bg-[#121317]/5 disabled:opacity-40"><Bookmark className="h-4 w-4" fill={isBookmarked ? "currentColor" : "none"} /></button>
          <button aria-label={isFullscreen ? copy("Exit focus mode") : copy("Enter focus mode")} title={isFullscreen ? copy("Exit focus mode (Esc)") : copy("Focus mode")} onClick={onToggleFullscreen} className="rounded-full p-2 text-[#5f6368] hover:bg-[#121317]/5">{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
        </div>
      </header>
      <div className="min-h-[280px] p-5 sm:p-8">
        {loading ? <p role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-[#5f6368]"><Loader2 className="h-5 w-5 animate-spin" /> {copy("Preparing an explanation")}</p> : lesson ? <div lang={topic.locale || undefined}><ReactMarkdown className="prose prose-sm max-w-none break-words text-[#5f6368] [&_pre]:overflow-x-auto">{lesson}</ReactMarkdown></div> : <div className="flex flex-col items-center gap-3 py-10 text-center"><BookOpen className="h-8 w-8 text-[#5f6368]" /><h3 className="text-base font-medium">{copy("Your topic is ready to explore")}</h3><p className="max-w-md text-sm leading-6 text-[#5f6368]">{copy("Published lesson content will appear here when available. Keep a question, connect with your class, or request an explanation.")}</p><button onClick={generateLesson} className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2 text-sm font-medium" style={{
          color: theme.accent
        }}><Sparkles className="h-4 w-4" /> {copy("Request explanation")}</button></div>}
        {backupFailure&&<p className="v-notice v-error" role="alert"><span lang="en">{error}</span> <button type="button" className="v-button" onClick={()=>setBackupRetry(value=>value+1)}>{copy("Retry question recovery")}</button></p>}
        {error&&!backupFailure && <p lang="en" role="alert" className="mt-4 rounded-lg border border-[#dadce0] bg-[#ffffff] p-4 text-sm leading-6 text-[#5f6368]">{error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#dadce0] p-4">
        <Link to={`/dashboard/practice?${context}`} className="rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#0b57d2]">{copy("Practice this topic")}</Link>
        <Link to={nextTopic ? `/dashboard/learn/${nextTopic.id}` : `/dashboard/learn?subject=${encodeURIComponent(topic.subject)}`} className="ml-auto rounded-full px-4 py-2 text-sm font-medium text-[#0b57d2] hover:bg-[#e8f0fd]">{nextTopic ? copy("Next topic \u2192") : copy("All lessons \u2192")}</Link>
      </div>
      <form onSubmit={saveQuestion} className="border-t border-[#dadce0] p-5"><label htmlFor="lesson-question" className="mb-3 block text-sm font-medium">{copy("Keep a question for later")}</label><div className="flex items-center gap-2 rounded-lg border border-[#dadce0] p-2"><input disabled={saving} id="lesson-question" maxLength={6000} value={question} onChange={e => {
          setQuestion(e.target.value);
          setSaved(false);
        }} placeholder={copy("What would you like to understand?")} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" /><button disabled={saving || !question.trim()} title={copy("Save question")} aria-label={copy("Save question")} className="rounded-full p-2 text-white disabled:opacity-40" style={{
          backgroundColor: theme.accent
        }}><Send className="h-4 w-4" /></button></div>{saved && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#137333]"><Check className="h-4 w-4" /> {copy("Question saved.")} <Link to={`/dashboard/ask?${context}`} state={{
          initialQuestion: savedQuestion
        }} className="underline">{copy("Open this question in Ask")}</Link></p>}</form>
    </section>;
}
