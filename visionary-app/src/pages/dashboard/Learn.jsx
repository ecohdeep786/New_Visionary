import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LayoutGrid, List, MessageSquare, Boxes, ArrowRight, BookOpen, Bookmark } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useStudentData } from "@/hooks/useStudentData";
import { useThemeColor } from "@/hooks/useThemeColor";
import SubjectPills from "@/components/dashboard/learn/SubjectPills";
import SubjectHeroBanner from "@/components/dashboard/learn/SubjectHeroBanner";
import ContentsDropdown from "@/components/dashboard/learn/ContentsDropdown";
import TopicCard from "@/components/dashboard/learn/TopicCard";

function sortByChapter(topics) {
  return [...topics].sort((a, b) => {
    const getNum = (chapter) => {
      if (!chapter) return 999;
      const match = chapter.match(/\d+/);
      return match ? parseInt(match[0]) : 999;
    };
    return getNum(a.chapter) - getNum(b.chapter);
  });
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "not-started", label: "Not started" },
  { key: "in-progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

function matchesFilter(topic, filter) {
  if (filter === "all") return true;
  if (filter === "completed") return topic.status === "mastered";
  if (filter === "in-progress") return topic.status === "in-progress" || topic.status === "needs-review";
  if (filter === "not-started") return topic.status === "not-started" || !topic.status;
  return true;
}

export default function Learn() {
  const studentData = useStudentData();
  const themeColor = useThemeColor();
  const [searchParams] = useSearchParams();
  const subjectFromUrl = searchParams.get("subject");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    base44.entities.Bookmark.list("-created_date", 20).then(setBookmarks).catch(() => {});
  }, []);

  const subjects = studentData.subjects;
  const activeSubject = useMemo(
    () => selectedSubject || subjectFromUrl || subjects[0]?.name || null,
    [selectedSubject, subjectFromUrl, subjects]
  );

  const subjectObj = subjects.find((s) => s.name === activeSubject) || null;

  const allSortedTopics = useMemo(
    () => (activeSubject ? sortByChapter(studentData.topics.filter((t) => t.subject === activeSubject)) : []),
    [activeSubject, studentData.topics]
  );

  const topics = useMemo(
    () => allSortedTopics.filter((t) => matchesFilter(t, statusFilter)),
    [allSortedTopics, statusFilter]
  );

  const continueTopic = allSortedTopics.find((t) => t.status !== "mastered") || allSortedTopics[0] || null;

  if (studentData.loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: themeColor.accent }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-20 p-8 lg:p-12 max-w-[1280px] mx-auto w-full">
      <SubjectPills subjects={subjects} activeSubject={activeSubject} onSelect={setSelectedSubject} />

      <SubjectHeroBanner subject={subjectObj} topics={allSortedTopics} continueTopic={continueTopic} />

      {/* Bookmarked topics */}
      {bookmarks.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" style={{ color: themeColor.accent }} fill="currentColor" />
            <h2 className="text-[22px] font-medium text-[#202124]">Bookmarked</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((b) => (
              <Link
                key={b.id}
                to={`/dashboard/learn/${b.topic_id}`}
                className="flex items-center gap-3 p-5 bg-white rounded-2xl border border-[#dadce0]/50 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor.light }}>
                  <Bookmark className="w-4 h-4" style={{ color: themeColor.accent }} fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#202124] truncate">{b.topic_name}</p>
                  <p className="text-xs text-[#5f6368] truncate mt-0.5">{b.subject}{b.chapter ? ` · ${b.chapter}` : ""}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5f6368] shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <ContentsDropdown topics={allSortedTopics} activeTopicId={continueTopic?.id} />

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#dadce0] text-sm font-medium text-[#5f6368] hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-[18px] h-[18px]" /> Send feedback
          </button>

          <div className="inline-flex items-center rounded-full bg-[#f1f3f4] p-1">
            <button
              onClick={() => setViewMode("grid")}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium transition-all"
              style={viewMode === "grid" ? { backgroundColor: themeColor.accent, color: "#fff" } : { color: "#5f6368" }}
            >
              <LayoutGrid className="w-[14px] h-[14px]" /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium transition-all"
              style={viewMode === "list" ? { backgroundColor: themeColor.accent, color: "#fff" } : { color: "#5f6368" }}
            >
              <List className="w-[14px] h-[14px]" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.key;
          const count = f.key === "all" ? allSortedTopics.length : allSortedTopics.filter((t) => matchesFilter(t, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-medium transition-all border"
              style={isActive
                ? { backgroundColor: themeColor.accent, color: "#fff", borderColor: themeColor.accent }
                : { backgroundColor: "#fff", color: "#5f6368", borderColor: "#dadce0" }
              }
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20" : "bg-[#f1f3f4]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lessons heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-medium text-[#202124]">Lessons</h2>
          <p className="text-sm font-normal text-[#5f6368] mt-1">Follow chapter by chapter</p>
        </div>
      </div>

      {/* Topics */}
      {topics.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} variant="list" />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor.light }}>
            <BookOpen className="w-7 h-7" style={{ color: themeColor.accent }} />
          </div>
          <p className="text-sm text-[#5f6368]">No topics found for this filter.</p>
          <button
            onClick={() => setStatusFilter("all")}
            className="text-sm font-medium hover:underline"
            style={{ color: themeColor.accent }}
          >
            View all topics
          </button>
        </div>
      )}

      {/* Build section */}
      <Link
        to="/dashboard/build"
        className="flex items-center gap-4 p-6 bg-[#111827] rounded-3xl hover:bg-[#1f2937] transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <Boxes className="w-[18px] h-[18px] text-[#F9FAFB]" />
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-medium text-[#F9FAFB]">Build</p>
          <p className="text-sm font-normal text-[#9aa0a6] mt-1">Apply mastered concepts in real projects</p>
        </div>
        <ArrowRight className="w-[18px] h-[18px] text-[#9aa0a6] shrink-0" />
      </Link>
    </div>
  );
}