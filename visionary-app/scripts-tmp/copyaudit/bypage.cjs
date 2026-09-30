// Generate by-page.md: per-page heading->subhead->body outline in document order.
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('scripts-tmp/copyaudit/raw.json', 'utf8'));

const PAGE_ORDER = [
  ['Homepage', ['src/pages/Landing.jsx']],
  ['Student (/student)', ['src/pages/landing/StudentPage.jsx', 'src/components/landing/PersonaHero.jsx', 'src/data/landingCategories.js']],
  ['Teacher (/teacher)', ['src/pages/landing/TeacherPage.jsx']],
  ['Parent (/parent)', ['src/pages/landing/ParentPage.jsx']],
  ['Professional (/professional — CollegePage.jsx)', ['src/pages/landing/CollegePage.jsx']],
  ['Organization (/organization)', ['src/pages/landing/OrganizationPage.jsx']],
  ['How it works (/how-it-works — CoachingPage.jsx)', ['src/pages/landing/CoachingPage.jsx']],
  ['Pricing (/pricing — AILearningPage.jsx)', ['src/pages/landing/AILearningPage.jsx']],
  ['Download (/download)', ['src/pages/landing/DownloadPage.jsx']],
  ['About (/about)', ['src/pages/landing/AboutUsPage.jsx', 'src/components/landing/AboutPageShared.jsx', 'src/components/landing/AboutUsHero.jsx', 'src/components/landing/StorySection.jsx', 'src/components/landing/NewPersona.jsx']],
  ['Help (/help — SchoolPage.jsx)', ['src/pages/landing/SchoolPage.jsx']],
  ['Careers (/careers)', ['src/pages/landing/CareersPage.jsx']],
  ['Research & news (/research)', ['src/pages/landing/ResearchNewsPage.jsx']],
  ['Community (/community)', ['src/pages/landing/CommunityPage.jsx']],
  ['Contact (/contact)', ['src/pages/landing/ContactPage.jsx']],
  ['Partners (/partners)', ['src/pages/landing/PartnersPage.jsx']],
  ['Updates (/updates)', ['src/pages/landing/UpdatesPage.jsx']],
  ['Referral (/referral)', ['src/pages/landing/ReferralPage.jsx']],
  ['Safety (/safety)', ['src/pages/landing/SafetyPage.jsx']],
  ['Privacy (/privacy)', ['src/pages/landing/PrivacyPage.jsx']],
  ['Terms (/terms)', ['src/pages/landing/TermsPage.jsx']],
  ['Security (/security)', ['src/pages/landing/SecurityPage.jsx']],
  ['Accessibility (/accessibility)', ['src/pages/landing/AccessibilityPage.jsx']],
  ['Cookies (/cookies)', ['src/pages/landing/CookiesPage.jsx']],
  ['Career (/career — CareerPage.jsx)', ['src/pages/landing/CareerPage.jsx']],
  ['Nav', ['src/components/landing/LandingNav.jsx']],
  ['Footer', ['src/components/landing/LandingFooter.jsx']],
  ['FAQ component', ['src/components/landing/LandingFAQ.jsx']],
  ['Shared landing components', ['src/components/landing/Breadcrumb.jsx', 'src/components/landing/HeroAnimatedText.jsx', 'src/components/landing/HeroFanCards.jsx', 'src/components/landing/PageHeading.jsx', 'src/components/landing/PolicyTabs.jsx', 'src/components/landing/TrustPage.jsx', 'src/components/landing/sections/CTASection.jsx', 'src/components/landing/sections/CategoryHero.jsx', 'src/components/landing/sections/FeatureShowcase.jsx', 'src/components/landing/sections/JourneySteps.jsx', 'src/components/landing/sections/RelatedCategories.jsx', 'src/components/landing/sections/SectionHeader.jsx', 'src/components/landing/sections/StatsBar.jsx', 'src/components/landing/sections/TestimonialBlock.jsx', 'src/components/landing/sections/UseCases.jsx', 'src/components/landing/SpotIllustration.jsx']],
  ['Auth & onboarding (non-landing public)', ['src/pages/Login.jsx', 'src/pages/Register.jsx', 'src/pages/ForgotPassword.jsx', 'src/pages/ForgotUserId.jsx', 'src/pages/ResetPassword.jsx', 'src/pages/Onboarding.jsx', 'src/pages/OAuthConsent.jsx', 'src/pages/DemoPreview.jsx']],
  ['Data', ['src/data/legalMeta.js', 'src/data/pricingConfig.js', 'src/data/landingCategories.js']],
];

const ICON_RE = /^[A-Z][a-z]+([A-Z][a-z]+)+$/; // Lucide icon identifiers
const dynRe = /\{[a-zA-Z_]/;

function outlineFor(filesArr, title, out) {
  out.push('\n\n## ' + title + '\n');
  out.push('| line | role | flag | string |\n|---|---|---|---|\n');
  const seen = new Set();
  for (const f of filesArr) {
    const rows = d.filter((r) => r.file === f).sort((a, b) => a.line - b.line);
    for (const r of rows) {
      let s = r.str;
      if (ICON_RE.test(s)) continue; // skip pure icon names
      if (/\n/.test(s)) s = s.replace(/\n/g, ' / ');
      const k = r.line + '|' + s;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r.line + ' | ' + r.role + ' | ' + (r.flags.join(' ') || '') + ' | ' + s.replace(/\|/g, '\\|') + ' |\n');
    }
  }
}

const out = ['# Copy inventory — by page (outline as rendered)\n',
  'Roles: HEADLINE (h1/h2/title props) / SUBHEAD (h3/eyebrow/tagline) / BODY / BUTTON / LINK / LABEL / META-aria / META-placeholder. Flags: TITLE_CASE, LONG_HEADING (>8w), BUZZWORD, FILLER_PHRASE, AI_SLOP(em-dash/not-just-but), EM_DASH(body), PASSIVE, ODD_PUNCT, HARD_WORD, DOUBLE_IDEA.\n',
  '(dynamic rows show the interpolated expression; copy comes from the named data constants at the line given.)'];

for (const [title, filesArr] of PAGE_ORDER) outlineFor(filesArr, title, out);

// dashboard section
const dash = d.filter((r) => r.area === 'dashboard');
const dashFiles = [...new Set(dash.map((r) => r.file))].sort();
out.push('\n\n## Dashboard (signed-in) — flagged strings only, per file\n');
for (const f of dashFiles) {
  const rows = dash.filter((r) => r.file === f && r.flags.length).sort((a, b) => a.line - b.line);
  const tot = dash.filter((r) => r.file === f).length;
  if (!rows.length) { continue; }
  out.push('\n### ' + f + '  (' + rows.length + ' flagged / ' + tot + ' strings)\n');
  out.push('| line | role | flag | string |\n|---|---|---|---|\n');
  for (const r of rows) out.push(r.line + ' | ' + r.role + ' | ' + r.flags.join(' ') + ' | ' + r.str.replace(/\|/g, '\\|').replace(/\n/g, ' / ') + ' |\n');
}
const dclean = dash.filter((r) => !r.flags.length).length;
out.push('\nUnflagged dashboard strings: ' + dclean + ' of ' + dash.length + ' (full text in inventory.tsv).\n');

fs.writeFileSync('scripts-tmp/copyaudit/by-page.md', out.join(''));
console.log('by-page.md written,', out.join('').length, 'bytes');

// dashboard per-file flag counts for report
const dashCounts = {};
dash.forEach((r) => {
  dashCounts[r.file] = dashCounts[r.file] || { f: 0, t: 0 };
  dashCounts[r.file].t++;
  if (r.flags.length) dashCounts[r.file].f++;
});
const sorted = Object.entries(dashCounts).filter(([, v]) => v.f > 0).sort((a, b) => b[1].f - a[1].f);
console.log('\nDASHBOARD FILES WITH FLAGS:');
sorted.forEach(([f, v]) => console.log(v.f + ' flagged / ' + v.t + ' total — ' + f));
console.log('dashboard files with flags:', sorted.length, 'of', dashFiles.length);
