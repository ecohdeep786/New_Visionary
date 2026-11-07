import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRouteGraph } from '../scripts/route-graph.mjs';

/* F-01 (Principal Frontend Architecture & Route Engineer): the route contract.
 * These assertions fail if a required route is removed, repointed, unguarded
 * or its SEO map drifts from the declared routes. The expected component
 * imports below are the recorded beta contract for App.jsx; a change here
 * requires a deliberate route review, not a silent edit. */

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(frontendRoot, relative), 'utf8');

const graph = buildRouteGraph({
  appText: read('src/App.jsx'),
  routeMetaText: read('src/lib/routeMeta.js'),
  pageMetaText: read('src/lib/PageMeta.jsx'),
  sitemapXml: read('public/sitemap.xml'),
  robotsTxt: read('public/robots.txt'),
});

const routes = new Map(graph.routes.filter(r => !r.index).map(r => [r.path, r]));
const dashboard = relative => routes.get(`/dashboard${relative === 'index' ? '' : `/${relative}`}`) ?? routes.get(`/dashboard#${relative === 'index' ? 'index' : ''}`);

const PUBLIC_ROUTES = {
  '/': { component: 'LandingEntry', componentImport: null },
  '/student': { component: 'StudentPage', componentImport: '@/pages/landing/StudentPage' },
  '/teacher': { component: 'TeacherPage', componentImport: '@/pages/landing/TeacherPage' },
  '/parent': { component: 'ParentPage', componentImport: '@/pages/landing/ParentPage' },
  '/help': { component: 'SchoolPage', componentImport: '@/pages/landing/SchoolPage' },
  '/professional': { component: 'CollegePage', componentImport: '@/pages/landing/CollegePage' },
  '/how-it-works': { component: 'CoachingPage', componentImport: '@/pages/landing/CoachingPage' },
  '/organization': { component: 'OrganizationPage', componentImport: '@/pages/landing/OrganizationPage' },
  '/download': { component: 'DownloadPage', componentImport: '@/pages/landing/DownloadPage' },
  '/about': { component: 'AboutPage', componentImport: '@/pages/landing/AboutUsPage' },
  '/pricing': { component: 'AILearningPage', componentImport: '@/pages/landing/AILearningPage' },
  '/careers': { component: 'CareersPage', componentImport: '@/pages/landing/CareersPage' },
  '/research': { component: 'ResearchNewsPage', componentImport: '@/pages/landing/ResearchNewsPage' },
  '/community': { component: 'CommunityPage', componentImport: '@/pages/landing/CommunityPage' },
  '/contact': { component: 'ContactPage', componentImport: '@/pages/landing/ContactPage' },
  '/partners': { component: 'PartnersPage', componentImport: '@/pages/landing/PartnersPage' },
  '/updates': { component: 'UpdatesPage', componentImport: '@/pages/landing/UpdatesPage' },
  '/referral': { component: 'ReferralPage', componentImport: '@/pages/landing/ReferralPage' },
  '/safety': { component: 'SafetyPage', componentImport: '@/pages/landing/SafetyPage' },
  '/privacy': { component: 'PrivacyPage', componentImport: '@/pages/landing/PrivacyPage' },
  '/terms': { component: 'TermsPage', componentImport: '@/pages/landing/TermsPage' },
  '/security': { component: 'SecurityPage', componentImport: '@/pages/landing/SecurityPage' },
  '/accessibility': { component: 'AccessibilityPage', componentImport: '@/pages/landing/AccessibilityPage' },
  '/cookies': { component: 'CookiesPage', componentImport: '@/pages/landing/CookiesPage' },
};

const AUTH_ROUTES = {
  '/login': { component: 'Login', componentImport: '@/pages/Login' },
  '/register': { component: 'Register', componentImport: '@/pages/Register' },
  '/forgot-password': { component: 'ForgotPassword', componentImport: '@/pages/ForgotPassword' },
  '/forgot-user-id': { component: 'ForgotUserId', componentImport: '@/pages/ForgotUserId' },
  '/reset-password': { component: 'ResetPassword', componentImport: '@/pages/ResetPassword' },
  '/auth/action': { component: 'AuthAction', componentImport: '@/pages/AuthAction' },
};

const DASHBOARD_ROUTES = {
  index: { component: 'DashboardHome', componentImport: '@/pages/dashboard/DashboardHome' },
  home: { component: 'DashboardHome', componentImport: '@/pages/dashboard/DashboardHome' },
  classes: { component: 'ClassesEntry', componentImport: null },
  learn: { component: 'Learn', componentImport: '@/pages/dashboard/Learn' },
  'learn/:topicId': { component: 'TopicDetail', componentImport: '@/pages/dashboard/TopicDetail' },
  ask: { component: 'DashboardHome', componentImport: '@/pages/dashboard/DashboardHome' },
  practice: { component: 'Practice', componentImport: '@/pages/dashboard/Practice' },
  build: { component: 'Build', componentImport: '@/pages/dashboard/ArtifactStudio' },
  subscription: { component: 'Subscription', componentImport: '@/pages/dashboard/Plans' },
  'class/:classId': { component: 'ClassDetail', componentImport: '@/pages/dashboard/ClassDetail' },
  child: { component: 'Children', componentImport: '@/pages/dashboard/Children' },
  people: { component: 'RoleWorkspace', componentImport: '@/pages/dashboard/RoleWorkspace' },
  curriculum: { component: 'RoleWorkspace', componentImport: '@/pages/dashboard/RoleWorkspace' },
  analytics: { component: 'RoleWorkspace', componentImport: '@/pages/dashboard/RoleWorkspace' },
  insights: { component: 'RoleWorkspace', componentImport: '@/pages/dashboard/RoleWorkspace' },
  profile: { component: 'Profile', componentImport: '@/pages/dashboard/Profile' },
  settings: { component: 'Settings', componentImport: '@/pages/dashboard/Settings' },
  connections: { component: 'Connections', componentImport: '@/pages/dashboard/Connections' },
  explore: { component: 'Explore', componentImport: '@/pages/dashboard/Explore' },
  support: { component: 'Support', componentImport: '@/pages/dashboard/Support' },
  prepare: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  library: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  career: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  growth: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  progress: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  reports: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  notifications: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  personalization: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  privacy: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  audit: { component: 'WorkspaceTools', componentImport: '@/pages/dashboard/WorkspaceTools' },
  cohorts: { component: 'Cohorts', componentImport: '@/pages/dashboard/Cohorts' },
  learners: { component: 'Learners', componentImport: '@/pages/dashboard/Learners' },
};

test('every required public route is declared and points at its owning page', () => {
  for (const [routePath, expected] of Object.entries(PUBLIC_ROUTES)) {
    const route = routes.get(routePath);
    assert.ok(route, `required public route missing: ${routePath}`);
    assert.equal(route.segment, 'public', `${routePath} must stay public`);
    assert.equal(route.component, expected.component, `${routePath} changed component`);
    assert.equal(route.componentImport, expected.componentImport, `${routePath} changed page module`);
    assert.equal(route.redirect, null, `${routePath} must not be a redirect`);
  }
  assert.equal(Object.keys(PUBLIC_ROUTES).length, 24, 'the 24 public experiences are the recorded contract');
});

test('auth surfaces are declared and the recorded aliases redirect', () => {
  for (const [routePath, expected] of Object.entries(AUTH_ROUTES)) {
    const route = routes.get(routePath);
    assert.ok(route, `required auth route missing: ${routePath}`);
    assert.equal(route.component, expected.component, `${routePath} changed component`);
    assert.equal(route.componentImport, expected.componentImport, `${routePath} changed page module`);
  }
  assert.deepEqual(graph.redirects, [
    { from: '/signin', to: '/login' },
    { from: '/career', to: '/careers' },
  ], 'redirect aliases drifted from the recorded contract');
});

test('the 404 catch-all renders PageNotFound', () => {
  const catchAll = routes.get('*');
  assert.ok(catchAll, 'catch-all 404 route missing');
  assert.equal(catchAll.component, 'PageNotFound');
  assert.equal(catchAll.componentImport, '@/lib/PageNotFound');
});

test('onboarding and every dashboard route sit behind the auth and onboarding gates', () => {
  const onboarding = routes.get('/onboarding');
  assert.ok(onboarding, '/onboarding missing');
  assert.equal(onboarding.auth, 'required');
  assert.deepEqual(onboarding.guards, ['ProtectedRoute']);
  for (const [relative, expected] of Object.entries(DASHBOARD_ROUTES)) {
    const route = relative === 'index'
      ? graph.routes.find(r => r.id === '/dashboard#index')
      : routes.get(`/dashboard/${relative}`);
    assert.ok(route, `required dashboard route missing: /dashboard/${relative}`);
    assert.equal(route.auth, 'required', `/dashboard/${relative} must be auth-required`);
    assert.deepEqual(route.guards, ['ProtectedRoute', 'OnboardingGate'], `/dashboard/${relative} must sit behind ProtectedRoute+OnboardingGate`);
    assert.equal(route.component, expected.component, `/dashboard/${relative} changed component`);
    assert.equal(route.componentImport, expected.componentImport, `/dashboard/${relative} changed page module`);
  }
  assert.equal(Object.keys(DASHBOARD_ROUTES).length, 32, 'the dashboard route set (index + 31 subroutes) is the recorded contract');
});

test('legacy Ask.jsx is not wired to any active route; /dashboard/ask serves DashboardHome', () => {
  for (const route of graph.routes) {
    assert.ok(!/pages\/dashboard\/Ask\.jsx$/.test(route.componentImport ?? ''), `legacy Ask.jsx is wired at ${route.id}`);
  }
  assert.equal(dashboard('ask').componentImport, '@/pages/dashboard/DashboardHome');
});

test('ROUTE_META and SITEMAP_ROUTES exactly cover the declared public pages', () => {
  assert.deepEqual(graph.contracts.routeMetaKeys, graph.contracts.publicPages, 'ROUTE_META keys must equal the public route set');
  assert.deepEqual([...graph.contracts.sitemapRoutes].sort(), graph.contracts.publicPages, 'SITEMAP_ROUTES must equal the public route set');
});

test('sitemap.xml and robots.txt declare the live origin and only declared public routes', () => {
  assert.equal(graph.summary.siteOrigin, 'https://visionary.org.in', 'SITE_URL default drifted from the live origin');
  assert.equal(graph.contracts.sitemapLocs.length, 24, 'sitemap.xml must list exactly the 24 public experiences');
  const robotsSitemap = /Sitemap:\s*(\S+)/.exec(read('public/robots.txt'))?.[1];
  assert.equal(robotsSitemap, 'https://visionary.org.in/sitemap.xml', 'robots.txt must point at the live-origin sitemap');
  const source = read('public/sitemap.xml') + read('public/robots.txt');
  assert.ok(!/visionary\.app/.test(source), 'the DNS-dead visionary.app origin must never reappear in sitemap.xml or robots.txt');
});

test('the auth gate preserves the intended destination for post-sign-in recovery', () => {
  const source = read('src/components/ProtectedRoute.jsx');
  assert.match(source, /<Navigate to=\{`\/login\?returnTo=\$\{encodeURIComponent\(/, 'unauthenticated access must redirect to /login with the intended destination as returnTo');
  assert.ok(!/unauthenticatedElement/.test(source), 'in-place unauthenticated rendering must stay removed so the destination is never lost');
});

test('the committed ROUTE_GRAPH.json artifact matches the live route source', () => {
  const artifactPath = path.join(frontendRoot, '..', 'docs/visionary/baseline/f01-route-graph-2026-11-07/ROUTE_GRAPH.json');
  assert.ok(fs.existsSync(artifactPath), 'ROUTE_GRAPH.json artifact is committed under docs/visionary/baseline/f01-route-graph-2026-11-07/');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  assert.deepEqual(artifact, { ...graph, generatedFrom: 'visionary-app/frontend/src/App.jsx' }, 'artifact drifted from src/App.jsx — regenerate with node scripts/route-graph.mjs');
});
