/* Google x Apple writing pass — landing pages only.
   Exact-string replacements derived from scripts-tmp/copyaudit inventory.
   g:true = replace all occurrences. Reports any entry that matched 0 times. */
import fs from "node:fs";

const EDITS = [
  /* ── Landing.jsx (homepage) ── */
  ["src/pages/Landing.jsx", 'persona: "A Teacher"', 'persona: "A teacher"'],
  ["src/pages/Landing.jsx", 'persona: "A Parent"', 'persona: "A parent"'],
  ["src/pages/Landing.jsx", 'persona: "A Student"', 'persona: "A student"'],
  ["src/pages/Landing.jsx", 'persona: "A Professional"', 'persona: "A professional"'],
  ["src/pages/Landing.jsx", 'copy: "Visionary is designed to help people learn, work, and create."', 'copy: "Visionary helps people learn, work, and create."'],
  ["src/pages/Landing.jsx", "context forward — across", "context across"],
  ["src/pages/Landing.jsx", "One Intelligence. Always with you.", "One intelligence. Always with you."],
  ["src/pages/Landing.jsx", "understands what you mean — in the language", "understands what you mean, in the language"],
  ["src/pages/Landing.jsx", "Visionary is built to keep it that way", "Visionary keeps it that way"],
  ["src/pages/Landing.jsx", "Have questions? We've got answers.", "Questions, answered."],

  /* ── TeacherPage.jsx ── */
  ["src/pages/landing/TeacherPage.jsx", "Lesson Planning", "Lesson planning", true],
  ["src/pages/landing/TeacherPage.jsx", "In Class", "In class", true],
  ["src/pages/landing/TeacherPage.jsx", "Checking Understanding", "Checking understanding", true],
  ["src/pages/landing/TeacherPage.jsx", "Supporting Individuals", "Supporting individuals", true],
  ["src/pages/landing/TeacherPage.jsx", "Show it. Hear it. Teach it another way.", "Show it, hear it, teach it another way."],
  ["src/pages/landing/TeacherPage.jsx", "Check who's with you before the exam tells you.", "Know who's with you before the exam."],
  ["src/pages/landing/TeacherPage.jsx", "New syllabus, new subject — your preparation keeps pace with your classroom.", "New syllabus, new subject: your preparation keeps pace with your classroom."],
  ["src/pages/landing/TeacherPage.jsx", "One class, many minds. See who's with you — before the next bell.", "One class, many minds. See who is with you before the next bell."],
  ["src/pages/landing/TeacherPage.jsx", "See who got it and who needs another explanation — before the exam tells you.", "See who got it and who needs another explanation, before the exam tells you."],
  ["src/pages/landing/TeacherPage.jsx", "Turn this year's teaching into next year's craft — every lesson builds on the last.", "Turn this year's teaching into next year's craft. Every lesson builds on the last."],
  ["src/pages/landing/TeacherPage.jsx", "When a concept doesn't land the first time, you need another way — not another period.", "When a concept doesn't land the first time, you need another way, not another period."],
  ["src/pages/landing/TeacherPage.jsx", "Learners ask naturally — in their own words and language.", "Learners ask naturally, in their own words and language."],
  ["src/pages/landing/TeacherPage.jsx", "A second explanation, a new example, a simpler start — instantly.", "A second explanation, a new example, a simpler start. Instantly."],
  ["src/pages/landing/TeacherPage.jsx", "which didn't, and what to change — while the teaching is still happening.", "which didn't, and what to change while the teaching is still happening."],
  ["src/pages/landing/TeacherPage.jsx", "Understanding becomes visible — per learner, per concept, per class.", "Understanding becomes visible: per learner, per concept, per class."],
  ["src/pages/landing/TeacherPage.jsx", "A different example or a slower path — without leaving the lesson behind.", "A different example or a slower path, without leaving the lesson behind."],
  ["src/pages/landing/TeacherPage.jsx", "Every learner's understanding is visible — not only the volunteers.", "Every learner's understanding is visible, not only the volunteers."],
  ["src/pages/landing/TeacherPage.jsx", "New syllabus, new methods — your own learning keeps pace.", "New syllabus, new methods: your own learning keeps pace."],
  ["src/pages/landing/TeacherPage.jsx", "Teach your way — voice or text, in the language you're comfortable with", "Teach your way: voice or text, in the language you're comfortable with"],
  ["src/pages/landing/TeacherPage.jsx", 'copy: "Your personal information is treated with care."', 'copy: "We treat your personal information with care."'],
  ["src/pages/landing/TeacherPage.jsx", "Your classes, conversations, ideas, and progress are personal. Visionary is built to keep it that way.", "Your classes, conversations, ideas, and progress are personal. Visionary keeps it that way."],

  /* ── ParentPage.jsx ── */
  ["src/pages/landing/ParentPage.jsx", "Early Years", "Early years", true],
  ["src/pages/landing/ParentPage.jsx", "Secondary & Higher secondary", "Secondary and higher secondary", true],
  ["src/pages/landing/ParentPage.jsx", "Beyond School", "Beyond school", true],
  ["src/pages/landing/ParentPage.jsx", "Not just what was covered — what actually made sense, in minutes.", "Not just what was covered. What actually made sense, in minutes."],
  ["src/pages/landing/ParentPage.jsx", "See the exact idea that stopped them — before it becomes a grade.", "See the exact idea that stopped them before it becomes a grade."],
  ["src/pages/landing/ParentPage.jsx", "Understand whether confidence is building or slipping — and what changed along the way.", "Understand whether confidence is building or slipping, and what changed along the way."],
  ["src/pages/landing/ParentPage.jsx", "You see more when everyone sees the same picture.", "You see more when everyone shares one view."],
  ["src/pages/landing/ParentPage.jsx", "A clear picture of what shaped your child's week — no report card needed.", "A clear picture of what shaped your child's week, no report card needed."],
  ["src/pages/landing/ParentPage.jsx", "Know what your child is learning — before the report card.", "Know what your child is learning before the report card."],
  ["src/pages/landing/ParentPage.jsx", "First questions, first wins — and you see them all.", "First questions, first wins, and you see them all."],
  ["src/pages/landing/ParentPage.jsx", "Streams, boards, big decisions — and how to support them.", "Streams, boards, big decisions, and how to support them."],
  ["src/pages/landing/ParentPage.jsx", "gentle, and joyful — and keeps you close to every step.", "gentle, and joyful, and keeps you close to every step."],
  ["src/pages/landing/ParentPage.jsx", "in the language your child thinks in — and yours.", "in the language your child thinks in, and yours."],
  ["src/pages/landing/ParentPage.jsx", "keeps you part of the journey — with the context to support without hovering.", "keeps you part of the journey, with the context to support without hovering."],
  ["src/pages/landing/ParentPage.jsx", "Know what their choices require — and how they're progressing toward it.", "Know what their choices require and how they're progressing toward them."],
  ["src/pages/landing/ParentPage.jsx", "how preparation is actually moving — and when to push and when to pause.", "how preparation is actually moving, and when to push and when to pause."],
  ["src/pages/landing/ParentPage.jsx", "Whatever they choose next — further study, skills, or work — the understanding they've built travels with them", "Whatever they choose next, the understanding they've built travels with them"],
  ["src/pages/landing/ParentPage.jsx", "Ask your way — use voice or text in the way you're comfortable", "Ask your way: use voice or text in the way you're comfortable"],
  ["src/pages/landing/ParentPage.jsx", "Your child's questions, conversations, and progress are personal. Visionary is built to keep it that way.", "Your child's questions, conversations, and progress are personal. Visionary keeps it that way."],

  /* ── CollegePage.jsx ── */
  ["src/pages/landing/CollegePage.jsx", "Early Career", "Early career", true],
  ["src/pages/landing/CollegePage.jsx", "Career Change", "Career change", true],
  ["src/pages/landing/CollegePage.jsx", "New Project", "New project", true],
  ["src/pages/landing/CollegePage.jsx", "Turn every first project into real skill — not just another line on your resume.", "Turn every first project into real skill, not just another line on your resume."],
  ["src/pages/landing/CollegePage.jsx", "Harder questions, bigger decisions — reasoned through with you.", "Harder questions, bigger decisions, reasoned through with you."],
  ["src/pages/landing/CollegePage.jsx", "See whether your skills are growing — and what comes next.", "See whether your skills are growing, and what comes next."],
  ["src/pages/landing/CollegePage.jsx", "Turn learning into shipped work — skills that grow over your career.", "Turn learning into shipped work, skills that grow over your career."],
  ["src/pages/landing/CollegePage.jsx", "Understand the code, the client, and the decision — not just the ticket.", "Understand the code, the client, and the decision, not just the ticket."],
  ["src/pages/landing/CollegePage.jsx", "Lead with clarity — see what your team understands", "Lead with clarity: see what your team understands"],
  ["src/pages/landing/CollegePage.jsx", "Turn ideas into shipped work — with intelligence that remembers every decision and every lesson.", "Turn ideas into shipped work, with intelligence that remembers every decision and every lesson."],
  ["src/pages/landing/CollegePage.jsx", "Speed and depth together — decisions you can defend later.", "Speed and depth together, decisions you can defend later."],
  ["src/pages/landing/CollegePage.jsx", "Think your way — voice or text, in the language you're comfortable with", "Think your way: voice or text, in the language you're comfortable with"],
  ["src/pages/landing/CollegePage.jsx", "Your projects, ideas, and career decisions are personal. Visionary is built to keep it that way.", "Your projects, ideas, and career decisions are personal. Visionary keeps it that way."],

  /* ── OrganizationPage.jsx ── */
  ["src/pages/landing/OrganizationPage.jsx", "Colleges & Universities", "Colleges and universities", true],
  ["src/pages/landing/OrganizationPage.jsx", "Students · Teachers · Parents · Leaders", "Students, teachers, parents, and leaders"],
  ["src/pages/landing/OrganizationPage.jsx", "Students · Faculty · Departments · Placement", "Students, faculty, departments, and placement"],
  ["src/pages/landing/OrganizationPage.jsx", "Learners · Mentors · Parents · Coaches", "Learners, mentors, parents, and coaches"],
  ["src/pages/landing/OrganizationPage.jsx", "Professionals · Managers · Teams · L&D", "Professionals, managers, teams, and learning leads"],
  ["src/pages/landing/OrganizationPage.jsx", "Know where people are stuck — before small gaps become outcomes.", "Know where people are stuck before small gaps become outcomes."],
  ["src/pages/landing/OrganizationPage.jsx", "Give teachers, coaches, and leaders what they need — before results drop.", "Give teachers, coaches, and leaders what they need before results drop."],
  ["src/pages/landing/OrganizationPage.jsx", "One intelligence across every classroom, team, and program — understanding that stays inside your institution.", "One intelligence across every classroom, team, and program. Understanding stays inside your institution."],
  ["src/pages/landing/OrganizationPage.jsx", "See where training turns into capability — and where it stalls.", "See where training turns into capability, and where it stalls."],
  ["src/pages/landing/OrganizationPage.jsx", "Every learner, teacher, and professional — one clear picture you can act on.", "Every learner, teacher, and professional in one clear picture you can act on."],
  ["src/pages/landing/OrganizationPage.jsx", "Connected learning, stronger results — for everyone you serve.", "Connected learning, stronger results for everyone you serve."],
  ["src/pages/landing/OrganizationPage.jsx", "Your people's questions, conversations, and progress are personal. Visionary is built to keep it that way.", "Your people's questions, conversations, and progress are personal. Visionary keeps it that way."],
  ["src/pages/landing/OrganizationPage.jsx", "Start with one class, one team — and build from there.", "Start with one class, one team, and build from there."],

  /* ── StudentPage.jsx ── */
  ["src/pages/landing/StudentPage.jsx", "Independent Learning", "Independent learning", true],
  ["src/pages/landing/StudentPage.jsx", "Secondary & Higher secondary", "Secondary and higher secondary", true],
  ["src/pages/landing/StudentPage.jsx", "become better at — and let your learning take shape from there.", "become better at, and let your learning take shape from there."],
  ["src/pages/landing/StudentPage.jsx", "understanding keeps up — every chapter, every exam.", "understanding keeps up through every chapter and every exam."],
  ["src/pages/landing/StudentPage.jsx", "Vocational learning is meant to be used.", "Vocational learning works best when you use it."],
  ["src/pages/landing/StudentPage.jsx", "Skills build through doing — guidance never gives the answer away.", "Skills build through doing. Guidance never gives the answer away."],
  ["src/pages/landing/StudentPage.jsx", "become better at — and let the learning take shape from there.", "become better at, and let the learning take shape from there."],
  ["src/pages/landing/StudentPage.jsx", "Think your way — voice or text, in the language you're comfortable with", "Think your way: voice or text, in the language you're comfortable with"],
  ["src/pages/landing/StudentPage.jsx", 'copy: "Your personal information is treated with care."', 'copy: "We treat your personal information with care."', true],
  ["src/pages/landing/StudentPage.jsx", "Your questions, conversations, ideas, and progress are personal. Visionary is built to keep it that way.", "Your questions, conversations, ideas, and progress are personal. Visionary keeps it that way."],

  /* ── ResearchNewsPage.jsx ── */
  ["src/pages/landing/ResearchNewsPage.jsx", "The Daily Mentor plan", "The daily mentor plan"],
  ["src/pages/landing/ResearchNewsPage.jsx", "The Daily Mentor Engine", "The daily mentor engine"],
  ["src/pages/landing/ResearchNewsPage.jsx", "evidence the mentor plans from — progress described by", "evidence the mentor plans from: progress described by"],
  ["src/pages/landing/ResearchNewsPage.jsx", "handles the follow-through — and the learner's private learning stays the learner's own.", "handles the follow-through, and the learner's private learning stays the learner's own."],
  ["src/pages/landing/ResearchNewsPage.jsx", "student submission, and a reviewed check — one connected loop.", "student submission, and a reviewed check. One connected loop."],
  ["src/pages/landing/ResearchNewsPage.jsx", "summaries scoped by consent — support at home without opening the learner's private world.", "summaries scoped by consent, support at home without opening the learner's private world."],
  ["src/pages/landing/ResearchNewsPage.jsx", "what the learner's consent allows — nothing more appears anywhere.", "what the learner's consent allows. Nothing more appears anywhere."],
  ["src/pages/landing/ResearchNewsPage.jsx", "Progress is described by evidence — invented confidence scores", "Progress is described by evidence. Invented confidence scores"],
  ["src/pages/landing/ResearchNewsPage.jsx", "presentations of the same intelligence — one memory, one way of teaching, one safety policy.", "presentations of the same intelligence: one memory, one way of teaching, one safety policy."],
  ["src/pages/landing/ResearchNewsPage.jsx", "The learning loop the research feeds — explore, check, practise, build.", "The learning loop the research feeds: explore, check, practise, build."],
  ["src/pages/landing/ResearchNewsPage.jsx", "sit behind one contract — so the mind can improve", "sit behind one contract, so the mind can improve"],
  ["src/pages/landing/ResearchNewsPage.jsx", "share what the evidence supports — with methods and limits described clearly.", "share what the evidence supports, with methods and limits described clearly."],
  ["src/pages/landing/ResearchNewsPage.jsx", "describes questions and methods — not claims of proven outcomes — and the product treats", "describes questions and methods, not claims of proven outcomes, and the product treats"],
  ["src/pages/landing/ResearchNewsPage.jsx", "use the product every day — their experience is a primary source", "use the product every day, and their experience is a primary source"],
  ["src/pages/landing/ResearchNewsPage.jsx", "Help turn these questions into a product — research-minded people", "Help turn these questions into a product: research-minded people"],

  /* ── AccessibilityPage.jsx ── */
  ["src/pages/landing/AccessibilityPage.jsx", "operating-system features — zoom, text scaling", "operating-system features: zoom, text scaling"],
  ["src/pages/landing/AccessibilityPage.jsx", "vary by device, browser, and language — Visionary identifies", "vary by device, browser, and language. Visionary identifies"],
  ["src/pages/landing/AccessibilityPage.jsx", "English, Hindi, and Bengali — with more on the roadmap.", "English, Hindi, and Bengali, with more on the roadmap."],
  ["src/pages/landing/AccessibilityPage.jsx", "flags it for human review — usually within 24 hours.", "flags it for human review, usually within 24 hours."],
  ["src/pages/landing/AccessibilityPage.jsx", "Read, hear, speak, or navigate — accessibility increases choice", "Read, hear, speak, or navigate: accessibility increases choice"],
  ["src/pages/landing/AccessibilityPage.jsx", "Web, desktop, and mobile — the platforms sync covers.", "Web, desktop, and mobile: the platforms sync covers."],
  ["src/pages/landing/AccessibilityPage.jsx", "testing, and research — not something added after the product is finished.", "testing, and research, not something added after the product is finished."],
  ["src/pages/landing/AccessibilityPage.jsx", "we say plainly what is still being built.", "we say plainly what we are still building."],
  ["src/pages/landing/AccessibilityPage.jsx", "your learning follows you — end to end encrypted.", "your learning follows you, end to end encrypted."],
  ["src/pages/landing/AccessibilityPage.jsx", "End to end encrypted — the key stays with you", "End to end encrypted. The key stays with you"],
  ["src/pages/landing/AccessibilityPage.jsx", "One Sync Encrypted ID — the encryption stays with your account", "One Sync Encrypted ID. The encryption stays with your account"],
  ["src/pages/landing/AccessibilityPage.jsx", "Move at your own speed — every resource below is free to read", "Move at your own speed. Every resource below is free to read"],
  ["src/pages/landing/AccessibilityPage.jsx", "It is part of how Visionary is designed, built, and tested", "We design, build, and test Visionary with accessibility as part of the work"],
  ["src/pages/landing/AccessibilityPage.jsx", "Visionary is built around the idea that people learn differently. Accessibility is part of making that idea real — and your feedback is part of building it.", "Visionary grows from the idea that people learn differently. Accessibility makes that idea real, and your feedback builds it."],
  ["src/pages/landing/AccessibilityPage.jsx", "Help Center", "Help center", true],

  /* ── CookiesPage.jsx ── */
  ["src/pages/landing/CookiesPage.jsx", "Essential cookies for sign-in and security — no ad networks", "Essential cookies for sign-in and security. No ad networks"],
  ["src/pages/landing/CookiesPage.jsx", "Session, preference, and optional analytics — what each one does, in one line.", "Session, preference, and optional analytics: what each one does, in one line."],
  ["src/pages/landing/CookiesPage.jsx", "on this device and save — it takes one tap.", "on this device and save. It takes one tap."],
  ["src/pages/landing/CookiesPage.jsx", "Only what's needed — nothing extra, nothing sold.", "Only what's needed, nothing extra, nothing sold."],
  ["src/pages/landing/CookiesPage.jsx", "remember your preferences — never to follow you around the internet", "remember your preferences, never to follow you around the internet"],
  ["src/pages/landing/CookiesPage.jsx", "Only with your consent — and you can opt out anytime.", "Only with your consent, and you can opt out anytime."],
  ["src/pages/landing/CookiesPage.jsx", "your Visionary settings — no emails, no waiting.", "your Visionary settings. No emails, no waiting."],
  ["src/pages/landing/CookiesPage.jsx", "Essential cookies cannot be turned off — they're what make Visionary work.", "Essential cookies cannot be turned off. They're what make Visionary work."],
  ["src/pages/landing/CookiesPage.jsx", "apply to this device only — set them again on devices you use.", "apply to this device only. Set them again on devices you use."],
  ["src/pages/landing/CookiesPage.jsx", "read the Privacy Policy — it sits under the same tab bar as this page.", "read the privacy policy. It sits under the same tab bar as this page."],
  ["src/pages/landing/CookiesPage.jsx", "Read the Privacy Policy", "Read the privacy policy"],
  ["src/pages/landing/CookiesPage.jsx", "before optional cookies are used — and your ability to say no", "before we use optional cookies, and your ability to say no"],
  ["src/pages/landing/CookiesPage.jsx", 'label: "Privacy Policy"', 'label: "Privacy policy"', true],

  /* ── PartnersPage.jsx ── */
  ["src/pages/landing/PartnersPage.jsx", "want us to understand — from a single classroom to a whole network.", "want us to understand, from a single classroom to a whole network."],
  ["src/pages/landing/PartnersPage.jsx", "might not fit — and help shape what should exist instead.", "might not fit, and help shape what should exist instead."],
  ["src/pages/landing/PartnersPage.jsx", "consent-based access — documented for your context.", "consent-based access, documented for your context."],
  ["src/pages/landing/PartnersPage.jsx", "success measures — in writing.", "success measures, in writing."],
  ["src/pages/landing/PartnersPage.jsx", "decide what continues — with findings written up either way.", "decide what continues, with findings written up either way."],
  ["src/pages/landing/PartnersPage.jsx", "Two partners meeting at a table over a laptop", "Two partners meeting over a laptop"],
  ["src/pages/landing/PartnersPage.jsx", "different kinds of knowledge — the contexts our product must understand", "different kinds of knowledge, the contexts our product must understand"],
  ["src/pages/landing/PartnersPage.jsx", "for every partner — scaled to the work we agree on together", "for every partner, scaled to the work we agree on together"],
  ["src/pages/landing/PartnersPage.jsx", "is agreed together — measured in outcomes, not tiers", "is agreed together, measured in outcomes, not tiers"],
  ["src/pages/landing/PartnersPage.jsx", "work in progress — with writing at every hinge.", "work in progress, with writing at every hinge."],
  ["src/pages/landing/PartnersPage.jsx", "works with learners — in a classroom, a system, or a region — we want to understand your context", "works with learners, in a classroom, a system, or a region, we want to understand your context"],
  ["src/pages/landing/PartnersPage.jsx", "how partnerships work — and what they do not promise", "how partnerships work, and what they do not promise"],
  ["src/pages/landing/PartnersPage.jsx", "scoped piece of work — before that work begins.", "scoped piece of work before that work begins."],

  /* ── SchoolPage.jsx (help) ── */
  ["src/pages/landing/SchoolPage.jsx", "Sign in with the same email — your journey syncs automatically.", "Sign in with the same email, and your journey syncs automatically."],
  ["src/pages/landing/SchoolPage.jsx", "what you built — never private conversations.", "what you built. Never private conversations."],
  ["src/pages/landing/SchoolPage.jsx", "builds on the last — across devices, classes, and years.", "builds on the last, across devices, classes, and years."],
  ["src/pages/landing/SchoolPage.jsx", "Yes — ask Visionary for another explanation level", "Yes. Ask Visionary for another explanation level"],
  ["src/pages/landing/SchoolPage.jsx", "Progress and support signals — never private conversations.", "Progress and support signals, never private conversations."],
  ["src/pages/landing/SchoolPage.jsx", "Start, Personal, Family — upgrades, downgrades, cancellation.", "Start, Personal, Family: upgrades, downgrades, cancellation."],
  ["src/pages/landing/SchoolPage.jsx", "Yes — Start is free forever:", "Yes. Start is free forever:"],
  ["src/pages/landing/SchoolPage.jsx", "Which devices are supported?", "Which devices can I use?"],
  ["src/pages/landing/SchoolPage.jsx", "iOS, and Android — one account, all of them.", "iOS, and Android. One account, all of them."],
  ["src/pages/landing/SchoolPage.jsx", "Yes — guidance follows the learner's age by default", "Yes. Guidance follows the learner's age by default"],
  ["src/pages/landing/SchoolPage.jsx", "Search, or browse a topic — then reach us.", "Search, or browse a topic, then reach us."],
  ["src/pages/landing/SchoolPage.jsx", "No answers match here yet — email us below", "No answers match here yet. Email us below"],
  ["src/pages/landing/SchoolPage.jsx", "Tell us what you need — a human answers within one business day.", "Tell us what you need. A human answers within one business day."],

  /* ── CoachingPage.jsx ── */
  ["src/pages/landing/CoachingPage.jsx", "what you want to work on — it shapes everything around that", "what you want to work on. It shapes everything around that"],
  ["src/pages/landing/CoachingPage.jsx", "Organization — one intelligence, shaped for you.", "Organization: one intelligence, shaped for you."],
  ["src/pages/landing/CoachingPage.jsx", "shows what matters to you — your progress, your questions, your next step.", "shows what matters to you: your progress, your questions, your next step."],
  ["src/pages/landing/CoachingPage.jsx", "Step 01 · Sign up", "Step 01: sign up"],
  ["src/pages/landing/CoachingPage.jsx", "Step 01 · Sign in", "Step 01: sign in"],
  ["src/pages/landing/CoachingPage.jsx", "your context — all waiting for you.", "your context, all waiting for you."],
  ["src/pages/landing/CoachingPage.jsx", "You set the goal — a subject, a skill, or a question", "You set the goal: a subject, a skill, or a question"],
  ["src/pages/landing/CoachingPage.jsx", "the missing piece — in your language, at your pace", "the missing piece: in your language, at your pace"],
  ["src/pages/landing/CoachingPage.jsx", "Practice is drawn from what you just learned — short, focused, and adaptive.", "Practice comes from what you just learned: short, focused, and adaptive."],
  ["src/pages/landing/CoachingPage.jsx", "something real with it — a project, a solution, work of your own.", "something real with it: a project, a solution, work of your own."],
  ["src/pages/landing/CoachingPage.jsx", "feeds your next goal — and the loop begins again.", "feeds your next goal, and the loop begins again."],
  ["src/pages/landing/CoachingPage.jsx", "through the same loop — from your goal to what you can build with it.", "through the same loop, from your goal to what you can build with it."],

  /* ── PrivacyPage.jsx ── */
  ["src/pages/landing/PrivacyPage.jsx", "preference information — explained by category.", "preference information, explained by category."],
  ["src/pages/landing/PrivacyPage.jsx", "Information is kept only for as long as it is needed", "We keep information only for as long as it is needed"],
  ["src/pages/landing/PrivacyPage.jsx", "which type of storage is being used.", "which type of storage is in use."],
  ["src/pages/landing/PrivacyPage.jsx", "diagnostic information may be used to keep the service reliable", "Visionary may use basic browser, device, and diagnostic information to keep the service reliable"],
  ["src/pages/landing/PrivacyPage.jsx", "whether optional learning memory is used.", "whether optional learning memory is active."],
  ["src/pages/landing/PrivacyPage.jsx", "Personal information is used to provide your workspace", "We use personal information to provide your workspace"],
  ["src/pages/landing/PrivacyPage.jsx", "summaries for connected children — not private conversations.", "summaries for connected children, not private conversations."],
  ["src/pages/landing/PrivacyPage.jsx", "Grievance Officer", "Grievance officer", true],
  ["src/pages/landing/PrivacyPage.jsx", "in a browser — it holds the questions", "in a browser. It holds the questions"],
  ["src/pages/landing/PrivacyPage.jsx", "Digital Personal Data Protection Act — the law whose consent", "Digital Personal Data Protection Act, the law whose consent"],

  /* ── CommunityPage.jsx ── */
  ["src/pages/landing/CommunityPage.jsx", "share what you build — only the people in your class are inside", "share what you build. Only the people in your class are inside"],
  ["src/pages/landing/CommunityPage.jsx", "in the same space — real work, not noise.", "in the same space. Real work, not noise."],
  ["src/pages/landing/CommunityPage.jsx", "moderation built in — reports and rate limits", "moderation built in: reports and rate limits"],
  ["src/pages/landing/CommunityPage.jsx", "Reported content is held for the teacher's review — nothing spreads through the class unreviewed.", "Reported content waits for the teacher's review, so nothing spreads through the class unreviewed."],
  ["src/pages/landing/CommunityPage.jsx", "consent allows — nothing more is rendered anywhere.", "consent allows, and nothing more renders anywhere."],
  ["src/pages/landing/CommunityPage.jsx", "institution-scoped spaces — insight across the group", "institution-scoped spaces: insight across the group"],
  ["src/pages/landing/CommunityPage.jsx", "communities grow around — learn, ask, practise, build.", "communities grow around: learn, ask, practise, build."],
  ["src/pages/landing/CommunityPage.jsx", "scoped to the class — they are not public spaces", "scoped to the class: they are not public spaces"],
  ["src/pages/landing/CommunityPage.jsx", "language journeys — English, Hindi, and Bengali — and a missing language", "language journeys, English, Hindi, and Bengali, and a missing language"],
  ["src/pages/landing/CommunityPage.jsx", "Yes — class communities with teacher moderation", "Yes. Class communities with teacher moderation"],
  ["src/pages/landing/CommunityPage.jsx", "grow together — kept safe by teachers", "grow together, kept safe by teachers"],

  /* ── SafetyPage.jsx ── */
  ["src/pages/landing/SafetyPage.jsx", "boundaries are applied with the learner's age and context in mind — a twelve-year-old", "boundaries follow the learner's age and context: a twelve-year-old"],
  ["src/pages/landing/SafetyPage.jsx", "with confidence — summaries shaped by consent", "with confidence: summaries shaped by consent"],
  ["src/pages/landing/SafetyPage.jsx", "see and do — without changing the default safety posture", "see and do, without changing the default safety posture"],
  ["src/pages/landing/SafetyPage.jsx", "stay individual — by design.", "stay individual, by design."],
  ["src/pages/landing/SafetyPage.jsx", "Flagging is always available — no special mode", "Flagging is always available: no special mode"],
  ["src/pages/landing/SafetyPage.jsx", "Automated filters help, but the decision about what stayed wrong — and what changes — is made by a person.", "Automated filters help, but a person decides what stayed wrong and what changes."],
  ["src/pages/landing/SafetyPage.jsx", "Our safety policies are reviewed regularly and updated as we learn from real use — just like the product itself.", "We review our safety policies regularly and update them as we learn from real use, just like the product itself."],
  ["src/pages/landing/SafetyPage.jsx", "sensitive learner information — not with us, not with anyone.", "sensitive learner information. Not with us, not with anyone."],
  ["src/pages/landing/SafetyPage.jsx", "You shouldn't have to configure safety — it should be there before you ask your first question, and it should be visible enough to check", "You shouldn't have to configure safety. It should be there before you ask your first question, and visible enough to check"],
  ["src/pages/landing/SafetyPage.jsx", "everywhere in the product — and every report is read by a person, not a queue.", "everywhere in the product, and a person reads every report, not a queue."],
  ["src/pages/landing/SafetyPage.jsx", "write to the safety team directly — a human reads every message.", "write to the safety team directly. A human reads every message."],

  /* ── SecurityPage.jsx ── */
  ["src/pages/landing/SecurityPage.jsx", "to every device — only you can open it.", "to every device. Only you can open it."],
  ["src/pages/landing/SecurityPage.jsx", "clear account tools — described plainly", "clear account tools, described plainly"],
  ["src/pages/landing/SecurityPage.jsx", "The Privacy Policy explains what information Visionary collects, why it is used, how it is handled, and the choices available to you.", "The privacy policy explains what information Visionary collects, why Visionary uses it, how Visionary handles it, and the choices available to you."],
  ["src/pages/landing/SecurityPage.jsx", "See what information is collected and how it is used through the Privacy Policy.", "See what information Visionary collects and how Visionary uses it in the privacy policy."],
  ["src/pages/landing/SecurityPage.jsx", "to every device you use — your questions, progress, and memory arrive", "to every device you use: your questions, progress, and memory arrive"],
  ["src/pages/landing/SecurityPage.jsx", "One encrypted identity unlocks Visionary on a new device — the encryption stays", "One encrypted identity opens Visionary on a new device. The encryption stays"],
  ["src/pages/landing/SecurityPage.jsx", "phone, tablet, and laptop — pick up exactly where you stopped.", "phone, tablet, and laptop. Pick up exactly where you stopped."],
  ["src/pages/landing/SecurityPage.jsx", "Visit the Help Center", "Visit the Help center"],
  ["src/pages/landing/SecurityPage.jsx", "from your sessions — on-device or linked to your account.", "from your sessions, on-device or linked to your account."],
  ["src/pages/landing/SecurityPage.jsx", "If you find one, report it — we investigate every report.", "If you find one, report it. We investigate every report."],
  ["src/pages/landing/SecurityPage.jsx", 'label: "Privacy Policy"', 'label: "Privacy policy"', true],

  /* ── ReferralPage.jsx ── */
  ["src/pages/landing/ReferralPage.jsx", "everyone gets — the product tour, the learning loop, and the plans.", "everyone gets: the product tour, the learning loop, and the plans."],
  ["src/pages/landing/ReferralPage.jsx", "You had a part in it — quietly.", "You had a part in it, quietly."],
  ["src/pages/landing/ReferralPage.jsx", "keeps your place — with parent summaries, shared with consent.", "keeps your place, with parent summaries shared with consent."],
  ["src/pages/landing/ReferralPage.jsx", "whole institution — never individual answers.", "whole institution, never individual answers."],
  ["src/pages/landing/ReferralPage.jsx", "everyone gets — no codes, no tracking, nothing to manage.", "everyone gets. No codes, no tracking, nothing to manage."],
  ["src/pages/landing/ReferralPage.jsx", "Send the one that fits — or the how-it-works tour for everyone", "Send the one that fits, or the how-it-works tour for everyone"],
  ["src/pages/landing/ReferralPage.jsx", "Works for every persona — no account needed to copy it", "Works for every persona, no account needed to copy it"],
  ["src/pages/landing/ReferralPage.jsx", "sharing Visionary — including what this page does not promise", "sharing Visionary, including what this page does not promise"],
  ["src/pages/landing/ReferralPage.jsx", "explains the loop — Learn, Ask, Practice, Build — and each persona page", "explains the loop (Learn, Ask, Practice, Build), and each persona page"],
  ["src/pages/landing/ReferralPage.jsx", "learn with Visionary — then share when it feels right.", "learn with Visionary, then share when it feels right."],

  /* ── UpdatesPage.jsx ── */
  ["src/pages/landing/UpdatesPage.jsx", "Learn, Ask, Practice, Build — one workspace now carries every step", "Learn, Ask, Practice, Build: one workspace now carries every step"],
  ["src/pages/landing/UpdatesPage.jsx", "with confidence — without opening the learner's private space.", "with confidence, without opening the learner's private space."],
  ["src/pages/landing/UpdatesPage.jsx", "reporting and human review — usually within 24 hours.", "reporting and human review, usually within 24 hours."],
  ["src/pages/landing/UpdatesPage.jsx", "Safety policies are updated as we learn from real use — just like the product itself.", "We update safety policies as we learn from real use, just like the product itself."],
  ["src/pages/landing/UpdatesPage.jsx", "launch updates — as they land, with the date on each one.", "launch updates as they land, with the date on each one."],
  ["src/pages/landing/UpdatesPage.jsx", "One intelligence, every learner — in their language.", "One intelligence, every learner, in their language."],
  ["src/pages/landing/UpdatesPage.jsx", "publish what we find — what worked, what did not, and what changed as a result.", "publish what we find: what worked, what did not, and what changed as a result."],
  ["src/pages/landing/UpdatesPage.jsx", "choose whether to send — this page has not subscribed you automatically.", "choose whether to send. This page has not subscribed you automatically."],
  ["src/pages/landing/UpdatesPage.jsx", "Nothing is submitted from this page — your email app opens a draft", "Nothing is submitted from this page. Your email app opens a draft"],

  /* ── AboutUsPage.jsx ── */
  ["src/pages/landing/AboutUsPage.jsx", 'anywhere — from student to organization — in India', "anywhere, from student to organization, in India"],
  ["src/pages/landing/AboutUsPage.jsx", 'as on the "Benefits at Google" card', "as on the google.com benefits card"],
  ["src/pages/landing/AboutUsPage.jsx", "AI can make the next step clearer for more people.", "AI can make the next step clearer."],
  ["src/pages/landing/AboutUsPage.jsx", "Different people. One connected journey.", "Different people, one connected journey."],
  ["src/pages/landing/AboutUsPage.jsx", 'text-[#5f6368]">Find the experience that fits your work today. Visionary can keep growing with where you go next.</p>', 'text-[#5f6368]">\n            Find the experience that fits your work today. Visionary can keep growing with where you go next.\n          </p>'],
  ["src/pages/landing/AboutUsPage.jsx", "One journey. Many beginnings.", "One journey, many beginnings."],
  ["src/pages/landing/AboutUsPage.jsx", "Visionary is designed for learning that continues through them all.", "Visionary exists for learning that continues through them all."],

  /* ── TermsPage.jsx ── */
  ["src/pages/landing/TermsPage.jsx", "who use it — without the obscure language.", "who use it, without the obscure language."],
  ["src/pages/landing/TermsPage.jsx", "Read the Privacy Policy", "Read the privacy policy"],
  ["src/pages/landing/TermsPage.jsx", "must be kept consistent with the actual pricing", "must stay consistent with the actual pricing"],
  ["src/pages/landing/TermsPage.jsx", '"The service is being used in a way that creates a safety, security, or legal risk."', '"Use of the service creates a safety, security, or legal risk."'],
  ["src/pages/landing/TermsPage.jsx", "Visionary is provided subject to applicable law.", "Visionary operates subject to applicable law."],
  ["src/pages/landing/TermsPage.jsx", "in a browser — it holds the questions", "in a browser. It holds the questions"],
  ["src/pages/landing/TermsPage.jsx", 'label: "Privacy Policy"', 'label: "Privacy policy"', true],

  /* ── CareerPage.jsx ── */
  ["src/pages/landing/CareerPage.jsx", "From skill gaps to job offer — Visionary guides every step.", "From skill gaps to job offer, Visionary guides every step."],
  ["src/pages/landing/CareerPage.jsx", "Software Engineer · Bengaluru", "Software engineer · Bengaluru"],
  ["src/pages/landing/CareerPage.jsx", "functioning products — not toy exercises.", "functioning products, not toy exercises."],
  ["src/pages/landing/CareerPage.jsx", "adapts to where you are — whether you're a fresh graduate", "adapts to where you are, whether you're a fresh graduate"],
  ["src/pages/landing/CareerPage.jsx", "you get a direct introduction — no middlemen.", "you get a direct introduction with no middlemen."],

  /* ── CareersPage.jsx ── */
  ["src/pages/landing/CareersPage.jsx", "not advertised vacancies — current openings, if any, are listed below.", "not advertised vacancies. Current openings, if any, are listed below."],
  ["src/pages/landing/CareersPage.jsx", "introduce yourself — the work you share helps us know who to reach", "introduce yourself: the work you share helps us know who to reach"],
  ["src/pages/landing/CareersPage.jsx", "Accessibility request — Careers", "Accessibility request (Careers)"],

  /* ── ContactPage.jsx ── */
  ["src/pages/landing/ContactPage.jsx", "what happened instead — with links or screenshots if they help.", "what happened instead, with links or screenshots if they help."],
  ["src/pages/landing/ContactPage.jsx", "From the basics to beyond — information and support", "From the basics to beyond: information and support"],
  ["src/pages/landing/ContactPage.jsx", "visit the Help Center — or write to us directly", "visit the Help center, or write to us directly"],
  ["src/pages/landing/ContactPage.jsx", "Help Center", "Help center", true],

  /* ── DownloadPage.jsx ── */
  ["src/pages/landing/DownloadPage.jsx", "desktop and mobile — faster, offline-friendly, and synced to your account.", "desktop and mobile: faster, offline-friendly, and synced to your account."],
  ["src/pages/landing/DownloadPage.jsx", "valid email address — we can't notify you without one.", "valid email address. We can't notify you without one."],
  ["src/pages/landing/DownloadPage.jsx", "web, desktop, and mobile — automatically, and privately.", "web, desktop, and mobile, automatically and privately."],

  /* ── AILearningPage.jsx ── */
  ["src/pages/landing/AILearningPage.jsx", "Your journey is already happening. Start free.", "Your journey is already happening, so start free."],

  /* ── Shared landing chrome (AboutUsHero, LandingNav) ── */
  ["src/components/landing/AboutUsHero.jsx", "Lesson Planning", "Lesson planning", true],
  ["src/components/landing/AboutUsHero.jsx", "In Class", "In class", true],
  ["src/components/landing/AboutUsHero.jsx", "Checking Understanding", "Checking understanding", true],
  ["src/components/landing/AboutUsHero.jsx", "Supporting Individuals", "Supporting individuals", true],
  ["src/components/landing/AboutUsHero.jsx", "Early Years", "Early years", true],
  ["src/components/landing/AboutUsHero.jsx", "Early Career", "Early career", true],
  ["src/components/landing/AboutUsHero.jsx", "Colleges & Universities", "Colleges and universities", true],
  ["src/components/landing/LandingNav.jsx", "Colleges & Universities", "Colleges and universities", true],

  /* ── Scanner blind-spot sweep (strings with @ emails or ${} placeholders) ── */
  ["src/pages/landing/PartnersPage.jsx", "Your email app opens a draft — nothing is submitted from this page.", "Your email app opens a draft. Nothing is submitted from this page."],
  ["src/pages/landing/PartnersPage.jsx", "Yes — that is the most common starting point. Write to", "Yes. That is the most common starting point. Write to"],
  ["src/pages/landing/ContactPage.jsx", "Yes — write to partnerships@visionary.org.in", "Yes. Write to partnerships@visionary.org.in"],
  ["src/pages/landing/AccessibilityPage.jsx", "Describe the task and the barrier — accessibility@visionary.org.in", "Describe the task and the barrier: accessibility@visionary.org.in"],
  ["src/pages/landing/ReferralPage.jsx", "Yes — write to hello@visionary.org.in", "Yes. Write to hello@visionary.org.in"],
];

let applied = 0, missed = [];
for (const [file, from, to, g] of EDITS) {
  if (!fs.existsSync(file)) { missed.push(["MISSING FILE", file, from]); continue; }
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes(from)) { missed.push([file, from]); continue; }
  const next = g ? src.split(from).join(to) : src.replace(from, to);
  if (next === src) { missed.push([file, from, "no change"]); continue; }
  fs.writeFileSync(file, next);
  applied++;
}
console.log(`applied: ${applied}/${EDITS.length}`);
if (missed.length) {
  console.log("MISSED (" + missed.length + "):");
  for (const m of missed) console.log("  " + m.join("  ::  "));
  process.exitCode = 1;
}
