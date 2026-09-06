import { useAuth } from "@/lib/AuthContext";
import StudentHome from "./role/StudentHome";
import TeacherHome from "./role/TeacherHome";
import OrgHome from "./role/OrgHome";
import ParentHome from "./role/ParentHome";

/**
 * Role-aware dashboard router.
 * Branches the home experience by the user's onboarding identity.
 * The student experience is preserved verbatim; teacher / organization / parent
 * each get a purpose-built dashboard with the shared Understanding meter.
 */
export default function DashboardHome() {
  const { user } = useAuth();
  const identity = user?.identity || "student";

  if (identity === "teacher") return <TeacherHome />;
  if (identity === "organization") return <OrgHome />;
  if (identity === "parent") return <ParentHome />;
  return <StudentHome />;
}