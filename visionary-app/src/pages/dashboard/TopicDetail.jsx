import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, ChevronRight, FileText, PanelRightOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import CourseIntro from "@/components/dashboard/learn/CourseIntro";
import CourseViewer from "@/components/dashboard/learn/CourseViewer";
import ConceptNavigator from "@/components/dashboard/learn/ConceptNavigator";

export default function TopicDetail() {
  const { topicId } = useParams();
  const studentData = useStudentData();
  const themeColor = useThemeColor();
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [subConcepts, setSubConcepts] = useState([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);

  const topic = studentData.topics.find((t) => t.id === topicId);
  const subjectTopics = studentData.topics.filter((t) => t.subject === topic?.subject);
  const sortedSubjectTopics = [...subjectTopics].sort((a, b) => {
    const getNum = (ch) => {
      if (!ch) return 999;
      const match = ch.match(/\d+/);
      return match ? parseInt(match[0]) : 999;
    };
    return getNum(a.chapter) - getNum(b.chapter);
  });
  const currentIndex = sortedSubjectTopics.findIndex((t) => t.id === topicId);
  const nextTopic = sortedSubjectTopics[currentIndex + 1] || null;

  // Reset state on topic change
  useEffect(() => {
    setStarted(false);
    setFullscreen(false);
    setSidebarCollapsed(false);
    setSubConcepts([]);
  }, [topicId]);

  // Fetch bookmarks
  useEffect(() => {
    base44.entities.Bookmark.list().then(setBookmarks).catch(() => {});
  }, []);

  // Generate sub-concepts for the current topic
  useEffect(() => {
    if (!topic || !started) return;
    generateSubConcepts();
  }, [topic?.id, started]);

  // ESC key to exit fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fullscreen]);

  // Mark topic as in-progress when started
  useEffect(() => {
    if (topic && started && (topic.status === "not-started" || !topic.status)) {
      base44.entities.Topic.update(topic.id, { status: "in-progress" }).catch(() => {});
    }
  }, [topic?.id, started]);

  const generateSubConcepts = async () => {
    setLoadingConcepts(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Break down the topic "${topic.name}" in ${topic.subject} into 5-7 sequential sub-concepts that a student learns step by step to master this topic. Each should be a short descriptive title (e.g., "Introduction", "Key Principles", "Real-world Examples", "Worked Problems", "Summary"). Return ONLY a JSON object.`,
        response_json_schema: {
          type: "object",
          properties: {
            concepts: { type: "array", items: { type: "string" } },
          },
        },
        model: "gemini_3_flash",
      });
      const data = typeof res === "string" ? JSON.parse(res) : res;
      const chapterPrefix = topic.chapter ? topic.chapter.split(".")[0] : "1";
      const concepts = (data.concepts || []).map((title, i) => ({
        title,
        number: `${chapterPrefix}.${i + 1}`,
      }));
      setSubConcepts(concepts.length > 0 ? concepts : getDefaultConcepts());
    } catch {
      setSubConcepts(getDefaultConcepts());
    }
    setLoadingConcepts(false);
  };

  const getDefaultConcepts = () => {
    const chapterPrefix = topic?.chapter ? topic.chapter.split(".")[0] : "1";
    return [
      { title: "Introduction", number: `${chapterPrefix}.1` },
      { title: "Core Concepts", number: `${chapterPrefix}.2` },
      { title: "Key Principles", number: `${chapterPrefix}.3` },
      { title: "Real-world Examples", number: `${chapterPrefix}.4` },
      { title: "Worked Problems", number: `${chapterPrefix}.5` },
      { title: "Summary", number: `${chapterPrefix}.6` },
    ];
  };

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: themeColor.accent }} />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor.light }}>
          <FileText className="w-7 h-7" style={{ color: themeColor.accent }} />
        </div>
        <p className="text-sm text-[#5f6368]">Topic not found.</p>
        <Link to="/dashboard/learn" className="text-sm font-medium hover:underline" style={{ color: themeColor.accent }}>
          Back to Learn
        </Link>
      </div>
    );
  }

  const isBookmarked = bookmarks.some((b) => b.topic_id === topic.id);

  const toggleBookmark = async () => {
    const existing = bookmarks.find((b) => b.topic_id === topic.id);
    if (existing) {
      await base44.entities.Bookmark.delete(existing.id);
      setBookmarks(bookmarks.filter((b) => b.id !== existing.id));
    } else {
      const created = await base44.entities.Bookmark.create({
        topic_id: topic.id,
        subject: topic.subject,
        topic_name: topic.name,
        chapter: topic.chapter || "",
      });
      setBookmarks([...bookmarks, created]);
    }
  };

  // Fullscreen: only content, ESC to exit
  if (fullscreen && started) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 lg:p-10 min-h-screen">
        <div className="w-full max-w-[1000px]">
          <CourseViewer
            topic={topic}
            nextTopic={nextTopic}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
            onToggleFullscreen={() => setFullscreen(false)}
            isFullscreen={true}
          />
        </div>
      </div>
    );
  }

  // Course intro (before starting)
  if (!started) {
    return (
      <div className="flex flex-col gap-8 p-8 lg:p-12 max-w-[1200px] mx-auto w-full">
        <CourseIntro topic={topic} onStart={() => setStarted(true)} isBookmarked={isBookmarked} />
      </div>
    );
  }

  // Main learning view: breadcrumb+title at top, content left, navigator right
  return (
    <div className="flex flex-col gap-8 p-6 lg:p-10 max-w-[1280px] mx-auto w-full">
      {/* Top: breadcrumb + topic title + progress */}
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-1.5 text-sm text-[#5f6368]">
          <Link to="/dashboard/home" className="flex items-center hover:text-[#202124] transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9aa0a6]" />
          <Link to="/dashboard/learn" className="hover:text-[#202124] transition-colors">Learn</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9aa0a6]" />
          <span className="text-[#3c4043]">{topic.subject}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#9aa0a6]" />
          <span className="font-medium text-[#202124]">{topic.chapter || topic.name}</span>
        </nav>

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-[28px] lg:text-[32px] font-medium text-[#202124] tracking-tight leading-tight">
            {topic.name}
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${topic.mastery || 0}%`, backgroundColor: themeColor.accent }}
              />
            </div>
            <span className="text-xs font-medium text-[#5f6368]">{topic.mastery || 0}% mastery</span>
          </div>
        </div>
      </div>

      {/* Content (left, wide) + navigator (right) */}
      <div className={sidebarCollapsed ? "flex flex-col gap-4" : "flex gap-6"}>
        <div className="flex-1 min-w-0">
          <CourseViewer
            topic={topic}
            nextTopic={nextTopic}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
            onToggleFullscreen={() => setFullscreen(true)}
            isFullscreen={false}
          />
        </div>

        {!sidebarCollapsed ? (
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <ConceptNavigator
                topic={topic}
                subConcepts={subConcepts}
                loadingConcepts={loadingConcepts}
                onToggleCollapse={() => setSidebarCollapsed(true)}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex items-center gap-2 h-10 px-4 rounded-full border border-[#dadce0] text-sm font-medium text-[#5f6368] hover:bg-gray-50 transition-colors shrink-0 self-start mt-1"
          >
            <PanelRightOpen className="w-[18px] h-[18px]" /> Contents
          </button>
        )}
      </div>
    </div>
  );
}