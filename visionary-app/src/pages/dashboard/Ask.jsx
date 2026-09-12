import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, Bookmark, BookOpen, Check, Lightbulb, Loader2, MessageCircle, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { useStudentData, buildStudentContext } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function Ask() {
  const data = useStudentData();
  const { user } = useAuth();
  const theme = useThemeColor();
  const [params] = useSearchParams();
  const location = useLocation();
  const subject = params.get("subject") || "";
  const topic = params.get("topic") || "";
  const name = user?.full_name?.split(" ")[0] || "there";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const endRef = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    setInput(location.state?.initialQuestion || (topic ? `Help me understand ${topic}.` : ""));
  }, [location.key, location.state?.initialQuestion, topic]);
  useEffect(() => {
    let active = true;
    base44.entities.Question.list("-createdAt", 50).then((rows) => { if (active) setQuestions(rows); }).catch(() => { if (active) setError("Saved questions could not be loaded. Refresh the page to try again."); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (messages.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, loading]);

  async function askQuestion(event) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy.current) return;
    busy.current = true; setLoading(true); setError(""); setNotice("");
    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages); setInput("");
    try {
      const context = buildStudentContext(data, user?.full_name || "Student");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a supportive learning assistant. Explain ideas clearly with steps and examples appropriate to the learner. Do not claim to know information outside the supplied context. If uncertain, say so. Learning context: ${context}. Current subject: ${subject}. Current topic: ${topic}. Conversation: ${JSON.stringify(nextMessages.slice(-12))}`,
      });
      const answer = typeof result === "string" ? result : result?.answer;
      if (!answer?.trim()) throw new Error("No answer was returned. Please try again.");
      setMessages((previous) => [...previous, { role: "assistant", content: answer }]);
    } catch (err) {
      setError(err.message || "An answer could not be loaded. Your question is still available to save.");
      setInput(question);
    } finally { busy.current = false; setLoading(false); }
  }
  async function saveQuestion() {
    const question = input.trim();
    if (!question || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const existing = questions.find((q) => q.question === question && q.subject === subject && q.topic === topic);
      if (!existing) {
        const created = await base44.entities.Question.create({ question, subject, topic });
        setQuestions((previous) => [created, ...previous]);
      }
      setNotice("Question saved. Find it in your saved questions below.");
    } catch (err) { setError(err.message || "This question could not be saved. Please try again."); }
    finally { setSaving(false); }
  }
  async function removeQuestion(id) {
    try { await base44.entities.Question.delete(id); setQuestions((previous) => previous.filter((q) => q.id !== id)); }
    catch { setError("This question could not be removed. Please try again."); }
  }
  const suggestions = topic ? [`Explain ${topic} step by step`, `Give me an everyday example of ${topic}`, `Help me solve a problem about ${topic}`] : ["Help me understand a difficult concept", "Walk me through a practice problem", "Help me plan my next study session"];

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 p-5 sm:p-8">
      <header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-medium tracking-tight text-[#202124]">Ask</h1><p className="mt-2 text-sm text-[#5f6368]">A place for your questions, ideas, and next steps.</p></div>{messages.length > 0 && <button disabled={loading} onClick={() => { setMessages([]); setError(""); setInput(""); }} className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-4 py-2 text-sm font-medium text-[#5f6368] disabled:opacity-40"><Plus className="h-4 w-4" /> New chat</button>}</header>
      {topic && <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f8fafd] px-4 py-3 text-sm text-[#5f6368]"><BookOpen className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{subject} · {topic}</span><Link to={`/dashboard/learn?subject=${encodeURIComponent(subject)}`} className="ml-auto text-blue-700 hover:underline">View lessons</Link></div>}
      {messages.length ? <section aria-label="Conversation" className="space-y-6 rounded-xl border border-[#dadce0] bg-white p-5 sm:p-7">{messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-auto max-w-[90%] rounded-2xl bg-[#f1f3f4] p-4" : "min-w-0"}>
        {message.role === "assistant" && <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4 text-blue-700" /> Visionary</div>}
        <div className="break-words text-sm leading-7 text-[#3c4043]">{message.role === "user" ? <p className="whitespace-pre-wrap">{message.content}</p> : <ReactMarkdown className="prose prose-sm max-w-none [&_pre]:overflow-x-auto">{message.content}</ReactMarkdown>}</div>
      </div>)}{loading && <p role="status" className="flex items-center gap-2 text-sm text-[#5f6368]"><Loader2 className="h-4 w-4 animate-spin" /> Working on your question…</p>}<div ref={endRef} /></section> : <section className="rounded-xl border border-[#dadce0] bg-white px-5 py-10 text-center sm:py-14"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.light, color: theme.accent }}><MessageCircle className="h-7 w-7" /></div><h2 className="text-2xl font-medium text-[#202124]">What are you curious about, {name}?</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#5f6368]">Start with a question in your own words. You can save it for your next study session.</p><div className="mx-auto mt-7 grid max-w-xl gap-2 text-left">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => { setInput(suggestion); setNotice(""); }} className="flex items-center gap-3 rounded-xl border border-[#dadce0] px-4 py-3 text-sm text-[#3c4043] hover:bg-[#f8fafd]"><Lightbulb className="h-4 w-4 shrink-0 text-blue-700" /><span className="flex-1">{suggestion}</span><ArrowRight className="h-4 w-4 shrink-0 text-[#5f6368]" /></button>)}</div></section>}
      <form onSubmit={askQuestion} className="rounded-2xl border border-[#dadce0] bg-white p-4 focus-within:border-blue-500">
        <label htmlFor="ask-question" className="sr-only">Your question</label><textarea id="ask-question" value={input} onChange={(e) => { setInput(e.target.value); setNotice(""); }} maxLength={6000} rows={3} placeholder={topic ? `Ask about ${topic}…` : "What would you like to understand?"} className="w-full resize-y bg-transparent text-sm leading-6 outline-none" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={saveQuestion} disabled={!input.trim() || saving} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#5f6368] hover:bg-gray-50 disabled:opacity-40"><Bookmark className="h-4 w-4" />{saving ? "Saving…" : "Save question"}</button><button type="submit" disabled={loading || !input.trim() || data.loading} className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: theme.accent }}><Send className="h-4 w-4" />{loading ? "Sending…" : "Ask Visionary"}</button></div>
      </form>
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</p>}
      {notice && <p role="status" className="flex items-center gap-2 text-sm text-green-800"><Check className="h-4 w-4" />{notice}</p>}
      {questions.length > 0 && <section className="rounded-xl border border-[#dadce0] bg-white"><div className="border-b border-[#dadce0] px-5 py-4"><h2 className="text-base font-medium text-[#202124]">Saved questions <span className="ml-2 text-sm font-normal text-[#5f6368]">{questions.length}</span></h2></div><div className="divide-y divide-[#eef0f2]">{questions.map((question) => <div key={question.id} className="flex items-center gap-3 p-4 sm:px-5"><Bookmark className="h-4 w-4 shrink-0 text-[#5f6368]" /><Link to={`/dashboard/ask?${new URLSearchParams({ subject: question.subject || "", topic: question.topic || "" })}`} state={{ initialQuestion: question.question }} className="min-w-0 flex-1 hover:text-blue-700"><p className="break-words text-sm">{question.question}</p>{question.subject && <p className="mt-1 text-xs text-[#5f6368]">{question.subject}{question.topic ? ` · ${question.topic}` : ""}</p>}</Link><button onClick={() => removeQuestion(question.id)} className="rounded-full p-2 text-[#5f6368] hover:bg-gray-100" aria-label={`Remove saved question: ${question.question}`}><Trash2 className="h-4 w-4" /></button></div>)}</div></section>}
    </div>
  );
}
