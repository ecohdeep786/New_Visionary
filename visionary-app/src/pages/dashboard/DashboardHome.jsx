import React, { lazy, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";

const StudentHome = lazy(() => import("./role/StudentHome"));
const TeacherHome = lazy(() => import("./role/TeacherHome"));
const OrgHome = lazy(() => import("./role/OrgHome"));
const ParentHome = lazy(() => import("./role/ParentHome"));

function DashboardSkeleton() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col gap-6 p-6 animate-pulse" aria-busy="true">
      <div className="h-28 w-full bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-slate-100 rounded-2xl" />
        <div className="h-44 bg-slate-100 rounded-2xl" />
        <div className="h-44 bg-slate-100 rounded-2xl" />
      </div>
      <div className="h-64 w-full bg-slate-100 rounded-2xl" />
    </div>
  );
}

/**
 * Role-aware dashboard router.
 * Branches the home experience by the user's onboarding identity.
 * Uses lazy chunking so students do not download teacher/parent/org bundles.
 */
export default function DashboardHome() {
  const { user } = useAuth();
  const identity = user?.identity || "student";

  let Component = StudentHome;
  if (identity === "teacher") Component = TeacherHome;
  else if (identity === "organization") Component = OrgHome;
  else if (identity === "parent") Component = ParentHome;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Component />
    </Suspense>
  );
}