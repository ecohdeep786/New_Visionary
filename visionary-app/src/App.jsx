import React, { lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import PageNotFound from '@/lib/PageNotFound'
import ScrollToTop from '@/components/ScrollToTop'
import { AuthProvider } from '@/lib/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

class AppErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-[#121317]">
          <div>
            <h1 className="text-2xl font-semibold">Visionary could not load</h1>
            <p className="mt-3 text-sm text-[#5f6368]">{this.state.error.message}</p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ForgotUserId = lazy(() => import('@/pages/ForgotUserId'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const DashboardLayout = lazy(() => import('@/components/dashboard/DashboardLayout'))
const DashboardHome = lazy(() => import('@/pages/dashboard/DashboardHome'))
const Learn = lazy(() => import('@/pages/dashboard/Learn'))
const StudentClasses = lazy(() => import('@/pages/dashboard/StudentClasses'))
const TopicDetail = lazy(() => import('@/pages/dashboard/TopicDetail'))
const Ask = lazy(() => import('@/pages/dashboard/Ask'))
const Practice = lazy(() => import('@/pages/dashboard/Practice'))
const Build = lazy(() => import('@/pages/dashboard/Build'))
const Subscription = lazy(() => import('@/pages/dashboard/Subscription'))
const Profile = lazy(() => import('@/pages/dashboard/Profile'))
const ClassDetail = lazy(() => import('@/pages/dashboard/ClassDetail'))
const StudentPage = lazy(() => import('@/pages/landing/StudentPage'))
const TeacherPage = lazy(() => import('@/pages/landing/TeacherPage'))
const ParentPage = lazy(() => import('@/pages/landing/ParentPage'))
const SchoolPage = lazy(() => import('@/pages/landing/SchoolPage'))
const CollegePage = lazy(() => import('@/pages/landing/CollegePage'))
const CoachingPage = lazy(() => import('@/pages/landing/CoachingPage'))
const OrganizationPage = lazy(() => import('@/pages/landing/OrganizationPage'))
const CompetitiveExamsPage = lazy(() => import('@/pages/landing/CompetitiveExamsPage'))
const AILearningPage = lazy(() => import('@/pages/landing/AILearningPage'))
const DownloadPage = lazy(() => import('@/pages/landing/ResearchPage'))
const CareerPage = lazy(() => import('@/pages/landing/CareerPage'))
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
  <main className="flex min-h-screen items-center justify-center bg-white" aria-busy="true">
    <span className="text-sm text-[#5f6368]">Loading...</span>
  </main>
)

const PublicApp = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/forgot-user-id" element={<ForgotUserId />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/student" element={<StudentPage />} />
    <Route path="/teacher" element={<TeacherPage />} />
    <Route path="/parent" element={<ParentPage />} />
    <Route path="/help" element={<SchoolPage />} />
    <Route path="/professional" element={<CollegePage />} />
    <Route path="/how-it-works" element={<CoachingPage />} />
    <Route path="/organization" element={<OrganizationPage />} />
    <Route path="/download" element={<DownloadPage />} />
    <Route path="/about" element={<CompetitiveExamsPage />} />
    <Route path="/pricing" element={<AILearningPage />} />
    <Route path="/career" element={<CareerPage />} />
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
    <Route element={<ProtectedRoute unauthenticatedElement={<Login />} />}>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="home" element={<DashboardHome />} />
        <Route path="classes" element={<StudentClasses />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/:topicId" element={<TopicDetail />} />
        <Route path="ask" element={<Ask />} />
        <Route path="practice" element={<Practice />} />
        <Route path="build" element={<Build />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="class/:classId" element={<ClassDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Route>
    <Route path="*" element={<PageNotFound />} />
  </Routes>
)

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-6 focus:py-3 focus:text-[14px] focus:text-[#121317]"
          >
            Skip to content
          </a>
          <ScrollToTop />
          <AppErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <PublicApp />
            </Suspense>
          </AppErrorBoundary>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
