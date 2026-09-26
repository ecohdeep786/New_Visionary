// Contact/Partners/Referral/ResearchNews → capture-grammar story bodies.
// Interactive form sections + honest-state sections are extracted from the
// current files and re-embedded verbatim; concept/document sections are
// distilled into StorySection + A-grid + contact-bar grammar.
import { readFileSync, writeFileSync } from "node:fs";

const P = "src/pages/landing/";

function grab(src, id) {
  const re = new RegExp(` {16}\\{\\/\\* [^*]*\\*\\/\\}\\r?\\n( {16}<section id="${id}"[\\s\\S]*?\\r?\\n {16}<\\/section>)`);
  const start = src.indexOf(`<section id="${id}"`);
  if (start === -1) throw new Error("grab failed: " + id);
  const end = src.indexOf("</section>", start);
  return src.slice(start, end + "</section>".length);
}

function convert(file, formIds, keepIds, sectionsJs, extraCleanup = []) {
  let s = readFileSync(P + file, "utf8");
  if (s.includes("StorySection")) { console.log(file, "already"); return; }
  const kept = {};
  for (const id of [...formIds, ...keepIds]) kept[id] = grab(s, id);
  if (!s.includes("StorySection")) {
    s = s.replace(
      'import PageHeading, { Accent } from "@/components/landing/PageHeading";',
      'import PageHeading, { Accent } from "@/components/landing/PageHeading";\nimport StorySection from "@/components/landing/StorySection";'
    );
  }
  const re = / {8}\{\/\* MOBILE CONTENTS \*\/\}[\s\S]*?<\/section>\r?\n {6}<\/main>/;
  if (!re.test(s)) throw new Error("body anchor failed: " + file);
  s = s.replace(re, sectionsJs(kept));
  for (const [cr, rep] of extraCleanup) s = s.replace(cr, rep);
  // state cleanup (contents spy)
  s = s.replace(/ {2}const \[activeId, setActiveId\] = useState\([^)]*\);\r?\n/, "");
  s = s.replace(/ {2}const \[showMobileContents, setShowMobileContents\] = useState\(false\);\r?\n/, "");
  s = s.replace(/ {2}const activeSection = useMemo\([\s\S]*?\);\r?\n/, "");
  s = s.replace(/ {2}useEffect\(\(\) => \{\s*const observers = \[\];[\s\S]*?\}, \[\]\);\r?\n\r?\n/, "");
  s = s.replace(/ {2}useEffect\(\(\) => \{\s*const hash = window\.location\.hash[\s\S]*?\}, \[\]\);\r?\n\r?\n/, "");
  writeFileSync(P + file, s);
  console.log(file, "converted");
}

/* ── CONTACT ─────────────────────────────────────────────────────────── */
convert(
  "ContactPage.jsx",
  ["form"],
  [],
  (k) => `        {/* 01 · CONTACT ROUTES — story grammar */},
        <StorySection
          id="contact-routes"
          title="Contact routes"
          featured={{
            subject: "mail",
            label: "One inbox",
            title: "Start with what you need.",
            dek: "We route the conversation from there.",
          }}
          rows={[
            { label: "Learners and teachers", title: "Help with using Visionary." },
            { label: "Institutions", title: "Bring Visionary to your school." },
            { label: "Safety and privacy", title: "Something that needs attention." },
            { label: "Press and research", title: "Questions about the work." },
          ]}
        />

${k.form}

        {/* CONTACT one-liner */}
        <section id="company" aria-label="Other ways to reach us" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Replies within two business days.</p>
            <div className="flex flex-wrap items-center gap-5">
              <a href="mailto:hello@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
                hello@visionary.org.in
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </a>
              <Link to="/privacy" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Privacy and safety
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </section>
      </main>
`);

/* ── PARTNERS ────────────────────────────────────────────────────────── */
convert(
  "PartnersPage.jsx",
  ["become"],
  ["directory"],
  (k) => `        {/* 01 · WHY A PARTNER */},
        <StorySection
          id="why-partner"
          title="Why work with a partner"
          featured={{
            subject: "handshake",
            label: "Partnerships",
            title: "Closer to where learning happens.",
            dek: "The right partner makes Visionary more useful in a specific place.",
          }}
          rows={[
            { label: "Schools", title: "Visionary inside real classrooms." },
            { label: "Platforms", title: "Learning where it already happens." },
            { label: "Regions", title: "Languages and contexts we serve." },
            { label: "Governments", title: "Programs that reach everyone." },
          ]}
        />

        {/* 02 · WHAT PARTNERS DO */}
        <StorySection
          id="what-partners-do"
          title="What partners can do"
          flip
          featured={{
            subject: "community",
            label: "The work",
            title: "Build for more places.",
            dek: "Deployment, integration, support, and reach — together.",
          }}
          rows={[
            { label: "Education", title: "Curriculum and classroom fit." },
            { label: "Implementation", title: "Rollout, training, and support." },
            { label: "Technology", title: "Integration with existing systems." },
            { label: "Regional", title: "Language and community reach." },
          ]}
        />

${k.directory}

${k.become}

        {/* CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Partnership questions?</p>
            <a href="mailto:partners@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              partners@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>
`);

/* ── REFERRAL ────────────────────────────────────────────────────────── */
convert(
  "ReferralPage.jsx",
  ["start"],
  [],
  (k) => `        {/* 01 · WHY REFERRALS */},
        <StorySection
          id="why"
          title="Why referrals exist"
          featured={{
            subject: "gift",
            label: "The idea",
            title: "Help someone start.",
            dek: "A simple way to introduce Visionary to someone who needs it.",
          }}
          rows={[
            { label: "01 · Share", title: "Tell one person who needs it." },
            { label: "02 · They start", title: "Your invite opens the door." },
            { label: "03 · Both move", title: "You both get more Visionary." },
          ]}
        />

        {/* 02 · WHO IT IS FOR — A-grid */}
        <section id="students" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1240px]">
            <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              Who it is for
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <RoleCard icon={GraduationCap} eyebrow="Students" title="Learn together" description="Invite classmates learning the same things." />
              <RoleCard icon={UsersRound} eyebrow="Teachers" title="Reach your class" description="Bring Visionary to the people you teach." />
              <RoleCard icon={Lightbulb} eyebrow="Creators" title="Share what you built" description="Show your work to people who can use it." />
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
            </div>
          </div>
        </section>

        {/* 03 · REWARDS + RULES rows */}
        <StorySection
          id="rewards"
          title="Rewards and rules"
          flip
          featured={{
            subject: "growth",
            label: "What you earn",
            title: "Both of you move forward.",
            dek: "Rewards apply when the person you invite stays and learns.",
          }}
          rows={[
            { label: "Reward", title: "More Visionary for both of you." },
            { label: "Recognition", title: "Attributed, never tracked." },
            { label: "Keep it useful", title: "Share with people who need it." },
          ]}
        />

${k.start}

        {/* CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Referral questions?</p>
            <a href="mailto:hello@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              hello@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>
`);

/* ── RESEARCH ────────────────────────────────────────────────────────── */
convert(
  "ResearchNewsPage.jsx",
  [],
  ["publications"],
  (k) => `        {/* 01 · WHY WE RESEARCH */},
        <StorySection
          id="why"
          title="Why we research"
          featured={{
            subject: "research",
            label: "The point",
            title: "True enough to build from.",
            dek: "Not research for its own sake — learning something a person can use.",
          }}
          rows={[
            { label: "Learning", title: "How people actually learn." },
            { label: "Intelligence", title: "How it should adapt." },
            { label: "Language", title: "Understanding across scripts." },
            { label: "Continuity", title: "Learning that lasts." },
          ]}
        />

        {/* 02 · QUESTIONS WE ARE EXPLORING */}
        <StorySection
          id="questions"
          title="Questions we explore"
          flip
          featured={{
            subject: "loop",
            label: "Open questions",
            title: "What we are chasing.",
            dek: "Each question connects to something a learner experiences.",
          }}
          rows={[
            { label: "01", title: "What makes understanding stick?" },
            { label: "02", title: "When should help arrive?" },
            { label: "03", title: "How does language shape it?" },
            { label: "04", title: "What carries across years?" },
          ]}
        />

        {/* 03 · RESEARCH TO PRODUCT */}
        <StorySection
          id="work"
          title="Research to product"
          featured={{
            subject: "build",
            label: "The path",
            title: "From question to capability.",
            dek: "Numbered steps from a finding to something a learner can use.",
          }}
          rows={[
            { label: "01 · Ask", title: "A question from a real learner." },
            { label: "02 · Study", title: "Evidence over assumption." },
            { label: "03 · Build", title: "A capability in the product." },
            { label: "04 · Learn", title: "Measure, then improve." },
          ]}
        />

${k.publications}

        {/* CONTACT one-liner */}
        <section id="contact" aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Research questions?</p>
            <a href="mailto:research@visionary.org.in" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.blue }}>
              research@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>
`);
