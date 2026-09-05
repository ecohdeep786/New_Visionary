import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useEffect } from 'react'; 
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import Learn from '@/pages/dashboard/Learn';
import StudentClasses from '@/pages/dashboard/StudentClasses';
import TopicDetail from '@/pages/dashboard/TopicDetail';
import Ask from '@/pages/dashboard/Ask';
import Practice from '@/pages/dashboard/Practice';
import Build from '@/pages/dashboard/Build';
import Subscription from '@/pages/dashboard/Subscription';
import Profile from '@/pages/dashboard/Profile';
import ClassDetail from '@/pages/dashboard/ClassDetail';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ForgotUserId from '@/pages/ForgotUserId';
import Landing from '@/pages/Landing';
import StudentPage from '@/pages/landing/StudentPage';
import TeacherPage from '@/pages/landing/TeacherPage';
import ParentPage from '@/pages/landing/ParentPage';
import SchoolPage from '@/pages/landing/SchoolPage';
import CollegePage from '@/pages/landing/CollegePage';
import CoachingPage from '@/pages/landing/CoachingPage';
import OrganizationPage from '@/pages/landing/OrganizationPage';
import CompetitiveExamsPage from '@/pages/landing/CompetitiveExamsPage';
import AILearningPage from '@/pages/landing/AILearningPage';
import DownloadPage from '@/pages/landing/ResearchPage';
import CareerPage from '@/pages/landing/CareerPage';
import CareersPage from '@/pages/landing/CareersPage';
import ResearchNewsPage from '@/pages/landing/ResearchNewsPage';
import CommunityPage from '@/pages/landing/CommunityPage';
import ContactPage from '@/pages/landing/ContactPage';
import PartnersPage from '@/pages/landing/PartnersPage';
import UpdatesPage from '@/pages/landing/UpdatesPage';
import ReferralPage from '@/pages/landing/ReferralPage';
import SafetyPage from '@/pages/landing/SafetyPage';
import PrivacyPage from '@/pages/landing/PrivacyPage';
import TermsPage from '@/pages/landing/TermsPage';
import SecurityPage from '@/pages/landing/SecurityPage';
import AccessibilityPage from '@/pages/landing/AccessibilityPage';
import CookiesPage from '@/pages/landing/CookiesPage';
import { CATEGORIES } from '@/data/landingCategories';





const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();
  const location = useLocation();
  
  /* ✅ Dev-only horizontal overflow detector */
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const check = () => {
      const d = document.documentElement;
      if (d.scrollWidth > d.clientWidth) {
        console.warn("[overflow-x]", window.innerWidth, "→", d.scrollWidth);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/forgot-user-id'];
  const isAuthPage = authPages.includes(location.pathname);
  const landingPaths = ['/', ...CATEGORIES.map((c) => c.path)];
  const isLandingPage = landingPaths.includes(location.pathname);
  const isPreview = new URLSearchParams(location.search).has('preview');

 

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Authenticated users skip landing/auth pages and go to dashboard
  // (unless ?preview is set on a landing page — lets you view/edit it while logged in)
  if (isAuthenticated && !(isPreview && isLandingPage)) {
    const onboardingDone = !!user?.onboarding_complete;
    if (isAuthPage || isLandingPage) {
      return <Navigate to={onboardingDone ? '/dashboard/home' : '/onboarding'} replace />;
    }
    if (onboardingDone && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard/home" replace />;
    }
    if (!onboardingDone && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return (
    
    

    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-user-id" element={<ForgotUserId />} />
      <Route path="/" element={<Landing />} />
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
      <Route path="/onboarding" element={<Onboarding />} />
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    
  );
};

/**<Route path="/research" element={<ResearchPage />} /> **/


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
        {/* Skip link — lives inside Router so focus works across pages */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-6 focus:py-3 focus:text-[14px] focus:text-[#121317]"
          >
            Skip to content
          </a>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App