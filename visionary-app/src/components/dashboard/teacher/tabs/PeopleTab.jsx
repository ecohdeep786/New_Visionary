import { useState, useEffect } from "react";
import { UserPlus, GraduationCap, Mail, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function PeopleTab({ classId, classroom, accent }) {
  const { user } = useAuth();
  const teacherName = user?.full_name || user?.email?.split("@")[0] || "Teacher";
  const initial = teacherName.charAt(0).toUpperCase();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const list = await base44.entities.Enrollment.filter({ class_id: classId });
      setEnrollments(list || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [classId]);

  const invite = async () => {
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      await base44.entities.Enrollment.create({
        class_id: classId,
        student_email: value,
        student_name: value.split("@")[0],
        status: "invited",
      });
      try {
        await base44.users.inviteUser(value, "user");
      } catch {}
      if (classroom) {
        try {
          await base44.entities.Classroom.update(classroom.id, {
            student_count: (classroom.student_count || 0) + 1,
          });
        } catch {}
      }
      setEmail("");
      load();
    } catch {
      setError("Couldn't invite that student. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[680px]">
      {/* Invite box */}
      <div className="p-6 bg-white rounded-3xl border border-[#dadce0]/60">
        <p className="text-sm font-medium text-[#202124] mb-1">Invite students</p>
        <p className="text-xs text-[#5f6368] mb-4">Add a student by email — they'll get an invite to join Visionary and this class.</p>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-xl border border-[#dadce0] focus-within:border-[#1a73e8]">
            <Mail className="w-4 h-4 text-[#5f6368] shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()}
              placeholder="student@example.com"
              className="flex-1 bg-transparent text-sm text-[#202124] placeholder:text-[#5f6368] outline-none"
            />
          </div>
          <button
            onClick={invite}
            disabled={busy || !email.trim()}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invite
          </button>
        </div>
        {error && <p className="text-xs text-[#ea4335] mt-2">{error}</p>}
      </div>

      {/* Teachers */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#dadce0]/60">
          <h3 className="text-sm font-medium text-[#202124]">Teachers</h3>
        </div>
        <div className="flex items-center gap-4 px-6 py-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0" style={{ backgroundColor: accent }}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#202124] truncate">{teacherName}</p>
            <p className="text-xs text-[#5f6368] truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="bg-white rounded-3xl border border-[#dadce0]/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#dadce0]/60 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#202124]">Students</h3>
          {enrollments.length > 0 && <span className="text-xs text-[#5f6368]">{enrollments.length} invited</span>}
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: accent }} />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
            <GraduationCap className="w-10 h-10 text-[#dadce0]" />
            <p className="text-sm text-[#5f6368] max-w-sm">No students yet. Invite your first student above to see them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#dadce0]/40">
            {enrollments.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium bg-[#f1f3f4] text-[#3c4043] shrink-0">
                  {(e.student_name || e.student_email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#202124] truncate">{e.student_name || e.student_email}</p>
                  <p className="text-xs text-[#5f6368] truncate">{e.student_email}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#fef7e0] text-[#b06000]">{e.status || "invited"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}