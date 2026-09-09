import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Send, Lightbulb, GraduationCap, BookOpen, Brain, ArrowRight, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData, buildStudentContext } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/AuthContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import ReactMarkdown from "react-markdown";

export default function Ask() {
  const studentData = useStudentData();
  const { user } = useAuth();
  const themeColor = useThemeColor();
  const [searchParams] = useSearchParams();

  const contextSubject = searchParams.get("subject");
  const contextTopic = searchParams.get("topic");

  const userName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Learner";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = useMemo(() => {
    if (contextTopic && contextSubject) {
      return [
        `Explain "${contextTopic}" step by step`,
        `Give me a real-world example of ${contextTopic}`,
        `Quiz me on ${contextTopic}`,
        `I'm confused about ${contextTopic}`,
      ];
    }
    return [
      "What should I focus on today?",
      "Explain a topic I'm struggling with",
      "Quiz me on recent topics",
      "Help me prepare for my next exam",
    ];
  }, [contextTopic, contextSubject]);

  useEffect(() => {
    if (contextTopic && contextSubject && messages.length === 0 && !loading) {
      askQuestion(`Explain "${contextTopic}" in ${contextSubject} step by step`);
    }
  }, [contextTopic, contextSubject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    base44.entities.Question.list("-created_date", 10)
      .then(setSavedQuestions)
      .catch(() => {});
  }, []);

  const context = buildStudentContext(studentData, userName);
  const hasMessages = messages.length > 0;

  const askQuestion = async (question, overrideSubject, overrideTopic) => {
    if (!question.trim()) return;
    const activeSubject = overrideSubject || contextSubject;
    const activeTopic = overrideTopic || contextTopic;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const topicContext = activeTopic && activeSubject
        ? `\n\nThe student is currently studying "${activeTopic}" in ${activeSubject}. Focus your answer on this topic unless they ask about something else.`
        : "";

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Visionary, a personal AGI teacher for ${userName}. You have PhD-level expertise across every subject and topic. You are not a chatbot — you are their personal AGI, their teacher, mentor, and guide.

How you teach:
- When explaining any concept, break it down STEP BY STEP. Start from the absolute fundamentals, build up complexity gradually, and never assume prior knowledge. Number your steps so the student can follow along.
- Use simple analogies and real-world examples that a K-12 student can relate to.
- If they want to DO something (build a project, solve a problem, learn a topic, prepare for an exam), guide them through it step by step — like a PhD expert walking a student through a lab.
- If they're confused, re-explain differently — try a new analogy, a simpler framing, or a visual description.
- You know their entire learning history and current state. You talk to them naturally, like a teacher who cares about them as a person — not just academically but emotionally. You motivate, you celebrate their wins, and you help them through tough topics.
- Always reflect on their courses and subjects. If they ask a general question, tie it back to their subjects and current topics when relevant.

Here is ${userName}'s current learning context:
${context}${topicContext}

Now respond to this message from ${userName}: "${question}"

Keep your response warm, clear, and actionable. Use markdown with headers and numbered steps for complex explanations. For simple questions, be conversational and concise.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: typeof res === "string" ? res : res.answer || "I'm here for you. Could you rephrase that?" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble right now, but I'm still here. Try again in a moment." },
      ]);
    }
    setLoading(false);
  };

  /* ── Empty state: Gemini-style centered ── */
  if (!hasMessages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 lg:px-8 max-w-[720px] mx-auto w-full">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: themeColor.light }}
        >
          <GraduationCap className="w-8 h-8" style={{ color: themeColor.accent }} />
        </div>

        <h1 className="text-[32px] font-medium text-[#202124] tracking-tight text-center">
          Hi {userName}
        </h1>
        <p className="text-base text-[#5f6368] mt-3 text-center max-w-md">
          {contextTopic
            ? <>Ask me about <span className="font-medium" style={{ color: themeColor.accent }}>{contextTopic}</span> — I'll teach you step by step</>
            : "Your AGI knows your courses, your progress, and what's next. How can I help?"}
        </p>

        {/* Context pill */}
        {!studentData.loading && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm mt-6"
            style={{ backgroundColor: themeColor.light, color: themeColor.accent }}
          >
            {contextTopic ? (
              <>
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>{contextSubject} · {contextTopic}</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 shrink-0" />
                <span>{studentData.subjects.length} subjects · {studentData.topics.length} topics</span>
              </>
            )}
          </div>
        )}

        {/* Input bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); askQuestion(input); }}
          className="w-full mt-8"
        >
          <div className="flex items-center gap-2 w-full p-2 bg-white rounded-full border border-[#dadce0] shadow-sm focus-within:border-[#1a73e8]/40 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={contextTopic ? `Ask about ${contextTopic}...` : "Ask your AGI anything..."}
              className="flex-1 bg-transparent px-4 text-base text-[#202124] placeholder:text-[#5f6368] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full disabled:opacity-40 active:scale-95 transition-colors shrink-0"
              style={{ backgroundColor: themeColor.accent }}
            >
              <Send className="w-[18px] h-[18px]" />
            </button>
          </div>
        </form>

        {/* Saved questions from learning */}
        {savedQuestions.length > 0 && (
          <div className="w-full mt-10">
            <p className="text-sm font-medium text-[#5f6368] mb-3">Your saved questions</p>
            <div className="flex flex-col gap-2">
              {savedQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => askQuestion(q.question, q.subject, q.topic)}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#dadce0] text-left hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 shrink-0" style={{ color: themeColor.accent }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#202124] truncate">{q.question}</p>
                    {q.topic && (
                      <p className="text-xs text-[#5f6368] mt-0.5">{q.subject} · {q.topic}</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#5f6368] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-3 mt-6 justify-center">
          {suggestedPrompts.map((p) => (
            <button
              key={p}
              onClick={() => askQuestion(p)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-[#dadce0] text-sm text-[#3c4043] hover:bg-gray-50 transition-colors"
            >
              <Lightbulb className="w-4 h-4" style={{ color: themeColor.accent }} />
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Active state: input at top, document-style responses ── */
  return (
    <div className="flex flex-col h-full">
      {/* Top input bar */}
      <div className="px-6 lg:px-8 py-4 max-w-[760px] mx-auto w-full">
        <form
          onSubmit={(e) => { e.preventDefault(); askQuestion(input); }}
          className="w-full"
        >
          <div className="flex items-center gap-2 w-full p-2 bg-white rounded-full border border-[#dadce0] shadow-sm focus-within:border-[#1a73e8]/40 transition-colors">
            <Sparkles className="w-[18px] h-[18px] ml-2 shrink-0" style={{ color: themeColor.accent }} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AGI anything..."
              className="flex-1 bg-transparent px-2 text-base text-[#202124] placeholder:text-[#5f6368] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full disabled:opacity-40 active:scale-95 transition-colors shrink-0"
              style={{ backgroundColor: themeColor.accent }}
            >
              <Send className="w-[18px] h-[18px]" />
            </button>
          </div>
        </form>
      </div>

      {/* Document-style responses */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-4 max-w-[760px] mx-auto w-full">
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end mb-6">
                <p className="text-sm text-[#3c4043] bg-[#f1f3f4] px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                  {msg.content}
                </p>
              </div>
            );
          }
          return (
            <div key={i} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: themeColor.accent }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-[#202124]">Visionary AGI</span>
              </div>
              <div className="pl-10">
                <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1 prose-strong:font-medium">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: themeColor.accent }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-[#202124]">Visionary AGI</span>
            </div>
            <div className="pl-10 flex items-center gap-2">
              <span className="text-sm text-[#5f6368]">Thinking</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor.accent, animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor.accent, animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: themeColor.accent, animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}