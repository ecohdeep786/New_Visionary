import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Target, ArrowRight, RotateCcw } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useStudentData } from "@/hooks/useStudentData";
import { cubeExercises, scoreExercises } from "@/lib/practiceExercises";
import JourneyCatalogue from "@/components/dashboard/JourneyCatalogue";
import { localDate } from "@/lib/learningMetrics";

export default function Practice() {
  const data = useStudentData();
  const [params] = useSearchParams();
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useRef(null);
  const start = () => { session.current = { id: crypto.randomUUID(), started: Date.now() }; setAnswers({}); setResult(null); setNotice(""); setActive(true); };
  async function saveResult() {
    if (busy || Object.keys(answers).length !== cubeExercises.length) return;
    const score = scoreExercises(cubeExercises, answers);
    const minutes = Math.floor((Date.now() - session.current.started) / 60000);
    setBusy(true); setNotice("");
    try {
      const existing = await appClient.entities.PracticeSession.filter({ session_key: session.current.id });
      if (!existing.length) await appClient.entities.PracticeSession.create({ session_key: session.current.id, subject: "Geometry", topic: "Understanding cube volume", score, total: cubeExercises.length, duration_minutes: minutes, date: localDate() });
      if (minutes > 0 && !(await appClient.entities.StudyLog.filter({ session_key: session.current.id })).length) {
        await appClient.entities.StudyLog.create({ session_key: session.current.id, subject: "Geometry", topic: "Understanding cube volume", duration_minutes: minutes, assessment_accuracy: Math.round(score / cubeExercises.length * 100), date: localDate(), activity_type: "practice" });
      }
      setResult(score); await data.refresh(); setNotice("Practice result saved. This short check does not establish overall mastery.");
    } catch (error) { setNotice(error.message || "Could not save. Your answers are still here; please retry."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-[1000px] space-y-6 p-5 sm:p-8">
    <header><h1 className="text-2xl font-medium">Practice</h1><p className="mt-2 text-sm text-[#5f6368]">Try an idea for yourself. Understand the why—not just the answer.</p></header>
    <JourneyCatalogue practice/>
    {params.get("topic") && <section className="rounded-xl bg-[#ffffff] p-4"><p className="text-sm font-medium">{params.get("subject")} · {params.get("topic")}</p><p className="mt-2 text-sm leading-6 text-[#5f6368]">Personalized practice for this topic becomes available when the AI model is connected. The geometry example below is ready to try now.</p><Link to={"/dashboard/ask?" + params.toString()} className="mt-3 inline-block text-sm text-[#4285F4]">Keep a question about this topic</Link></section>}
    {!active ? <section className="rounded-2xl border border-[#dadce0] bg-[#ffffff] p-6 sm:p-8"><Target className="mb-4 h-8 w-8 text-[#4285F4]" /><p className="text-xs font-medium text-[#4285F4]">Ready-to-try example · 3 questions</p><h2 className="mt-3 text-2xl font-medium">Think in three dimensions</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#5f6368]">Use what you discover in the cube lab to check your understanding of volume. Review an explanation for every answer.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={start} className="inline-flex items-center gap-2 rounded-full bg-[#4285F4] px-5 py-2.5 text-sm text-white">Start practice<ArrowRight className="h-4 w-4" /></button><Link to="/dashboard/explore" className="rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-sm text-[#4285F4]">Explore the lab first</Link></div></section> : <section className="space-y-5">
      {cubeExercises.map((q,index) => <fieldset key={q.question} disabled={result !== null || busy} className="rounded-2xl border border-[#dadce0] p-6"><legend className="sr-only">Question {index + 1}</legend><h2 className="text-base font-medium"><span className="mr-2 text-[#5f6368]">{index + 1}.</span>{q.question}</h2><div className="mt-5 grid gap-3">{q.options.map((option,answer) => <label key={option} className={"flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm " + (answers[index] === answer ? "border-[#4285F4] bg-[#e8f0fd]" : "border-[#dadce0]")}><input type="radio" name={"question-" + index} checked={answers[index] === answer} onChange={() => setAnswers(current => ({ ...current, [index]: answer }))} className="accent-[#4285F4]" />{option}</label>)}</div>{result !== null && <div className="mt-4 rounded-xl bg-[#ffffff] p-4 text-sm leading-6"><p className="font-medium">{answers[index] === q.correct_answer ? "Correct" : "Let’s look at the reasoning"}</p><p className="mt-1 text-[#5f6368]">{q.explanation}</p></div>}</fieldset>)}
      {result === null ? <button onClick={saveResult} disabled={busy || Object.keys(answers).length < cubeExercises.length} className="rounded-full bg-[#4285F4] px-6 py-3 text-sm text-white disabled:opacity-40">{busy ? "Saving…" : "Check my understanding"}</button> : <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dadce0] p-6"><CheckCircle2 className="h-6 w-6 text-[#137333]" /><p className="text-lg font-medium">{result} of {cubeExercises.length} correct</p><button onClick={start} className="ml-auto inline-flex items-center gap-2 text-sm text-[#4285F4]"><RotateCcw className="h-4 w-4" />Try again</button><Link to="/dashboard/build?subject=Geometry&topic=Understanding%20cube%20volume" className="rounded-full border border-[#dadce0] px-4 py-2 text-sm text-[#4285F4]">Apply it in a project</Link></div>}
    </section>}
    {notice && <p role="status" className="rounded-xl bg-[#ffffff] p-4 text-sm leading-6 text-[#5f6368]">{notice}</p>}
    <section><h2 className="mb-4 text-lg font-medium">From your learning</h2>{data.loading ? <p role="status" className="text-sm">Loading topics…</p> : data.error ? <p role="alert" className="text-sm">Could not load topics. <button onClick={() => data.refresh()} className="underline">Retry</button></p> : data.topics.length ? <div className="grid gap-3 sm:grid-cols-2">{data.topics.slice(0,8).map(t => <Link key={t.id} to={"/dashboard/learn/" + t.id} className="rounded-xl border border-[#dadce0] p-4"><h3 className="text-sm font-medium">{t.name}</h3><p className="mt-1 text-xs text-[#5f6368]">{t.subject} · Review the idea</p></Link>)}</div> : <p className="rounded-xl border border-dashed border-[#5f6368] p-6 text-sm text-[#5f6368]">Add a topic in <Link to="/dashboard/learn" className="text-[#4285F4] underline">Learn</Link> to keep your practice and learning together.</p>}</section>
  </div>;
}
