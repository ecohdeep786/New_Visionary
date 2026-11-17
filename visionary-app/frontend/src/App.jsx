import React, { lazy, Suspense } from 'react'
import AuthAction from '@/pages/AuthAction'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from '@/lib/PageNotFound'
import ScrollToTop from '@/components/ScrollToTop'
import { MetaManager } from '@/lib/PageMeta'
import { RoutePrefetcher } from '@/lib/RoutePrefetcher'
import { WorkspaceChunkPrefetcher } from '@/lib/WorkspaceChunkPrefetcher'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import OnboardingGate from '@/components/OnboardingGate'
import { needsAssetReload, recoverRouteAssets } from '@/lib/assetRecovery'
import { fontSurfaceForPath } from '@/lib/fontSurface'

class AppErrorBoundary extends React.Component {
  state = { error: null, errorInfo: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    if (import.meta.env.PROD && recoverRouteAssets(error)) return;
    console.error('[Visionary Resilience Diagnostic]:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null })
    window.location.href = '/dashboard/home'
  }

  render() {
    if (this.state.error) {
      const internal = window.location.pathname.startsWith('/dashboard');
      const reloadAssets = needsAssetReload(this.state.error);
      return (
        <main data-font-surface={fontSurfaceForPath(window.location.pathname)} className="flex min-h-screen items-center justify-center bg-[#ffffff] px-6 py-12 text-center text-[#1d1d1f]">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#d2d2d7]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fce8e6] text-red-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-medium tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-[#6e6e73] leading-relaxed">
              {reloadAssets ? 'This page could not load its files. Check your connection and reload.' : internal ? 'This page could not open. Try again or return Home. Check your last saved work when you reopen it.' : 'Visionary encountered an unexpected state. Your session and data remain safe.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => reloadAssets ? window.location.reload() : this.setState({ error: null })}
                className={`flex-1 rounded-full bg-[#0066cc] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0071e3]${internal ? ' min-h-11' : ''}`}
              >
                {reloadAssets ? 'Reload page' : 'Try again'}
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 rounded-full border border-[#d2d2d7] bg-white px-5 py-2.5 text-sm font-medium text-[#0066cc] transition-colors hover:bg-[#ffffff]"
              >
                Go to home
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-[#6e6e73] cursor-pointer hover:underline">Diagnostic details</summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-[#ffffff] p-2 text-[11px] text-[#6e6e73]">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

/* The four measured front-door routes render eagerly (T13 2026-11-15): behind
 * a lazy boundary their LCP element painted ~1.2s after the first paint — the
 * Suspense fallback won FCP, then the route chunk (plus its shared-section
 * chunks) had to cross the wire before the hero/text could render, and the
 * mount-time chunk flood starved the /student hero for ~1s (observed LCP
 * 3.2-3.8s against the 2.5s target under the Lighthouse mobile throttle
 * profile). Eager imports put the pages in the entry graph: the hero/text
 * paints in the first commit and the mount window carries the hero image
 * alone. Measured against three lazy+modulepreload variants — eager won LCP
 * on every route; the ~0.3s FCP cost is the accepted trade (FCP is a
 * diagnostic, LCP is the vital). The remaining public pages stay lazy and
 * keep their idle prefetch warm-up. */
import Landing from '@/pages/Landing'
import CoachingPage from '@/pages/landing/CoachingPage'
import AILearningPage from '@/pages/landing/AILearningPage'
import StudentPage from '@/pages/landing/StudentPage'
const Login = lazy(() => import('@/pages/Login'))
// toaster exports Toaster as a NAMED export — map it to default for lazy()
const LazyToaster = lazy(() => import('@/components/ui/toaster').then((m) => ({ default: m.Toaster })))
const Register = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ForgotUserId = lazy(() => import('@/pages/ForgotUserId'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const DashboardLayout = lazy(() => import('@/components/dashboard/DashboardLayout'))
const DashboardHome = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/DashboardHome')) : null
const Learn = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Learn')) : null
const StudentClasses = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/StudentClasses')) : null
const TopicDetail = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/TopicDetail')) : null
const TeacherClasses = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/role/TeacherHome')) : null
const Practice = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Practice')) : null
const Build = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/ArtifactStudio')) : null
const Subscription = lazy(() => import('@/pages/dashboard/Plans'))
const Children = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Children')) : null
const Cohorts = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Cohorts')) : null
const Learners = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Learners')) : null
const WorkspaceTools = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/WorkspaceTools')) : null
const Profile = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Profile')) : null
const Settings = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Settings')) : null
const ClassDetail = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/ClassDetail')) : null
const RoleWorkspace = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/RoleWorkspace')) : null
const Connections = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Connections')) : null
const Explore = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Explore')) : null
const Support = import.meta.env.DEV ? lazy(() => import('@/pages/dashboard/Support')) : null
const TeacherPage = lazy(() => import('@/pages/landing/TeacherPage'))
const ParentPage = lazy(() => import('@/pages/landing/ParentPage'))
const SchoolPage = lazy(() => import('@/pages/landing/SchoolPage'))
const CollegePage = lazy(() => import('@/pages/landing/CollegePage'))
const OrganizationPage = lazy(() => import('@/pages/landing/OrganizationPage'))
const CompetitiveExamsPage = lazy(() => import('@/pages/landing/AboutUsPage'))
const AboutPage = lazy(() => import('@/pages/landing/AboutUsPage'))
const DownloadPage = lazy(() => import('@/pages/landing/DownloadPage'))

const CareersPage = lazy(() => import('@/pages/landing/CareersPage'))
const ResearchNewsPage = lazy(() => import('@/pages/landing/ResearchNewsPage'))
const CommunityPage = lazy(() => import('@/pages/landing/CommunityPage'))
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'))
const PartnersPage = lazy(() => import('@/pages/landing/PartnersPage'))
const UpdatesPage = lazy(() => import('@/pages/landing/UpdatesPage'))
const ReferralPage = lazy(() => import('@/pages/landing/ReferralPage'))
const SafetyPage = lazy(() => import('@/pages/landing/SafetyPage'))
const PrivacyPage = lazy(() => import('@/pages/landing/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/landing/TermsPage'))
const SecurityPage = lazy(() => import('@/pages/landing/SecurityPage'))
const AccessibilityPage = lazy(() => import('@/pages/landing/AccessibilityPage'))
const CookiesPage = lazy(() => import('@/pages/landing/CookiesPage'))

const RouteFallback = () => (
  <main data-font-surface={fontSurfaceForPath(window.location.pathname)} className="flex min-h-screen items-center justify-center bg-white" aria-busy="true">
    <span className="text-sm text-[#6e6e73]">Loading...</span>
  </main>
)

function LandingEntry() {
  const { isAuthenticated, authChecked, user } = useAuth();
  // The landing page is always publicly accessible. A market visitor must
  // never sit on the route fallback while the auth probe resolves — the
  // front door renders immediately, and the authenticated redirect is a
  // follow-up navigation once the probe lands (a signed-in user may see the
  // landing for a beat on a slow network; that is standard public-site
  // behaviour, not a blocker). Authenticated users who have completed
  // onboarding are sent straight to their dashboard; everyone else
  // (anonymous visitors and users mid-onboarding) sees the landing page.
  if (authChecked && isAuthenticated && user?.onboarding_complete) {
    return <Navigate to="/dashboard/home" replace />;
  }
  return <Landing />;
}
function ClassesEntry() { const { user } = useAuth(); return user?.identity === 'teacher' ? <TeacherClasses /> : <StudentClasses />; }
const PublicApp = () => (
  <Routes>
    <Route path="/" element={<LandingEntry />} />
    <Route path="/signin" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/forgot-user-id" element={<ForgotUserId />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/auth/action" element={<AuthAction />} />
    <Route path="/student" element={<StudentPage />} />
    <Route path="/teacher" element={<TeacherPage />} />
    <Route path="/parent" element={<ParentPage />} />
    <Route path="/help" element={<SchoolPage />} />
    <Route path="/professional" element={<CollegePage />} />
    <Route path="/how-it-works" element={<CoachingPage />} />
    <Route path="/organization" element={<OrganizationPage />} />
    <Route path="/download" element={<DownloadPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/pricing" element={<AILearningPage />} />
    <Route path="/career" element={<Navigate to="/careers" replace />} />
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/research" element={<ResearchNewsPage />} />
    <Route path="/community" element={<CommunityPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/partners" element={<PartnersPage />} />
    <Route path="/updates" element={<UpdatesPage />} />
    <Route path="/referral" element={<ReferralPage />} />
    <Route path="/safety" element={<SafetyPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/security" element={<SecurityPage />} />
    <Route path="/accessibility" element={<AccessibilityPage />} />
    <Route path="/cookies" element={<CookiesPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<OnboardingGate />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* FHE-20 route-table split: every intercepted dashboard child keeps
           * its route declaration (so direct production links match and the
           * connected shell renders the right surface by pathname) but its
           * element is DEV-conditional — the static DEV replacement makes the
           * element null in production and, together with the DEV-conditional
           * lazy declarations above, drops the preview chunks from the
           * artifact entirely (147 → 87 chunks; the preview store's chunk no
           * longer ships). Production URL behavior is byte-identical to the
           * pre-split build: declared paths render the connected surface or
           * the honest room through the shell's pathname interception, and
           * undeclared paths still reach the 404 catch-all. */}
          <Route index element={import.meta.env.DEV ? <DashboardHome /> : null} />
          <Route path="home" element={import.meta.env.DEV ? <DashboardHome /> : null} />
          <Route path="classes" element={import.meta.env.DEV ? <ClassesEntry /> : null} />
          <Route path="learn" element={import.meta.env.DEV ? <Learn /> : null} />
          <Route path="learn/:topicId" element={import.meta.env.DEV ? <TopicDetail /> : null} />
          <Route path="ask" element={import.meta.env.DEV ? <DashboardHome /> : null} />
          <Route path="practice" element={import.meta.env.DEV ? <Practice /> : null} />
          <Route path="build" element={import.meta.env.DEV ? <Build /> : null} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="class/:classId" element={import.meta.env.DEV ? <ClassDetail /> : null} />
          <Route path="child" element={import.meta.env.DEV ? <Children /> : null} />
          <Route path="people" element={import.meta.env.DEV ? <RoleWorkspace area="people" /> : null} />
          <Route path="curriculum" element={import.meta.env.DEV ? <RoleWorkspace area="curriculum" /> : null} />
          <Route path="analytics" element={import.meta.env.DEV ? <RoleWorkspace area="analytics" /> : null} />
          <Route path="insights" element={import.meta.env.DEV ? <RoleWorkspace area="insights" /> : null} />
          <Route path="profile" element={import.meta.env.DEV ? <Profile /> : null} />
          <Route path="settings" element={import.meta.env.DEV ? <Settings /> : null} />
          <Route path="connections" element={import.meta.env.DEV ? <Connections /> : null} />
          <Route path="explore" element={import.meta.env.DEV ? <Explore /> : null} />
          <Route path="support" element={import.meta.env.DEV ? <Support /> : null} />
          {['prepare', 'library', 'career', 'growth', 'progress', 'reports', 'notifications', 'personalization', 'privacy', 'audit'].map(area => <Route key={area} path={area} element={import.meta.env.DEV ? <WorkspaceTools area={area} /> : null} />)}
          <Route path="cohorts" element={import.meta.env.DEV ? <Cohorts /> : null} />
          <Route path="learners" element={import.meta.env.DEV ? <Learners /> : null} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<PageNotFound />} />
  </Routes>
)

function App() {
  return (
    <AuthProvider>
      <Router>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-6 focus:py-3 focus:text-[14px] focus:text-[#1d1d1f]"
          >
            Skip to content
          </a>
          <ScrollToTop />
          <MetaManager />
          <RoutePrefetcher />
          {import.meta.env.DEV && <WorkspaceChunkPrefetcher />}
          <AppErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <PublicApp />
            </Suspense>
          </AppErrorBoundary>
        </Router>
        {/* Toaster is not needed for first paint: toast state lives at module
            scope in use-toast, so a toast fired before the chunk loads still
            renders once the Toaster mounts. Keeps the shadcn ui chain (and
            tailwind-merge) out of the entry graph. */}
        <Suspense fallback={null}>
          <LazyToaster />
        </Suspense>
      </AuthProvider>
  )
}

export default App
