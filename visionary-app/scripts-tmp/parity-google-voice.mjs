// Google-colors + short-voice pass (founder directive 2026-09-20):
//  1. Headings carry NO blue — ink only. Blue = actions/links/icons (blog.google grammar).
//  2. Caps micro-labels (eyebrows/numbers/tags) = grey, never blue (blog.google capture).
//  3. Hero sub-lines shortened to the Google/Apple short-voice (same meaning, fewer words).
//  4. Pricing plan-card name→tagline gap fixed (8px→12px = 0.545 rhythm ratio of 22px).
// Every search must match exactly once unless ":ALL".
import { readFileSync, writeFileSync } from "node:fs";

const P = "src/pages/landing/";
const BLUE = "color: COLORS.blue";
const INK = "color: COLORS.ink";

const edits = [
  // ── CONTACT (/contact) ──
  [P + "ContactPage.jsx", [
    [`<span style={{ ${BLUE} }}>Start with what you need.</span>`, `<span style={{ ${INK} }}>Start with what you need.</span>`],
    [`<span style={{ ${BLUE} }}>who at Visionary to contact.</span>`, `<span style={{ ${INK} }}>who at Visionary to contact.</span>`],
    [`<span style={{ ${BLUE} }}>We will find the conversation.</span>`, `<span style={{ ${INK} }}>We will find the conversation.</span>`],
    ["Whether you have a question about Visionary, want to bring it to an institution, have found something that needs attention, or simply want to talk about the work—we want to know what you are trying to solve.",
     "Questions, institutions, safety concerns, or just want to talk about the work."],
    ["Start with the thing you are trying to understand, fix, build, or discuss. We route the conversation from there.",
     "Start with what you need. We route it from there."],
    ["Visionary is being built through questions too. Some come from learners. Some come from teachers, parents, institutions, researchers, and people building the company.",
     "The best product decisions here started as questions."],
  ]],
  // ── CAREERS (/careers) ──
  [P + "CareersPage.jsx", [
    [`<span style={{ ${BLUE} }}>what understanding can become.</span>`, `<span style={{ ${INK} }}>what understanding can become.</span>`],
    [`<span style={{ ${BLUE} }}>should stay with you.</span>`, `<span style={{ ${INK} }}>should stay with you.</span>`],
    ["Visionary is being built around a simple idea: intelligence should understand where a person is, help them move forward, and carry what matters into what comes next.",
     "Intelligence that understands where a person is, and helps them move forward."],
  ]],
  // ── RESEARCH NEWS (/research) ──
  [P + "ResearchNewsPage.jsx", [
    [`<span style={{ ${BLUE} }}>one question at a time.</span>`, `<span style={{ ${INK} }}>one question at a time.</span>`],
    ["Research at Visionary starts with a simple question: what would make understanding work better for a real person?",
     "What would make understanding work better for a real person?"],
    ["We study learning, AI, language, memory, interaction, and the systems around them. The goal is not research for its own sake. The goal is to learn something true enough to build from.",
     "Not research for its own sake: learning something true enough to build from."],
  ]],
  // ── RESEARCH (/download) ──
  [P + "ResearchPage.jsx", [
    [`<span style={{ ${BLUE} }}>Every device.</span>`, `<span style={{ ${INK} }}>Every device.</span>`],
    ["Use Visionary in your browser with nothing to install — or take it with you on the devices you already use. Your account keeps everything connected.",
     "Use Visionary in your browser or on the devices you already use."],
    [`className="hero-fade-up inline-block capitalize" style={{ ${BLUE} }}>{SYNC_WORDS[index]}`,
     `className="hero-fade-up inline-block capitalize" style={{ ${INK} }}>{SYNC_WORDS[index]}`],
  ]],
  // ── PRICING (/pricing) ──
  [P + "AILearningPage.jsx", [
    [`className="hero-fade-up inline-block" style={{ ${BLUE} }}>{PRICING_HERO_WORDS[wordIndex]}`,
     `className="hero-fade-up inline-block" style={{ ${INK} }}>{PRICING_HERO_WORDS[wordIndex]}`],
    ["Start free. Upgrade only when it has earned it. The same Visionary for every learner, teacher, parent, professional, and organization.",
     "Start free. Upgrade only when it has earned it."],
    ['<p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: COLORS.grey }}>{plan.tagline}</p>',
     '<p className="mt-3 font-normal tracking-[0] leading-[1.5] text-[14px]" style={{ color: COLORS.grey }}>{plan.tagline}</p>'],
  ]],
  // ── HOW IT WORKS (/how-it-works) ──
  [P + "CoachingPage.jsx", [
    [`className="hero-fade-up inline-block" style={{ ${BLUE} }}>{HERO_WORDS[index]}`,
     `className="hero-fade-up inline-block" style={{ ${INK} }}>{HERO_WORDS[index]}`],
    [`<span style={{ ${BLUE} }}>{a.title}</span>`, `<span style={{ ${INK} }}>{a.title}</span>`],
    [`className="hero-fade-up inline-block" style={{ ${BLUE} }}>{stage.label.toLowerCase()}.</span>`,
     `className="hero-fade-up inline-block" style={{ ${INK} }}>{stage.label.toLowerCase()}.</span>`],
    [`<span style={{ ${BLUE} }}>Different ways to use it.</span>`, `<span style={{ ${INK} }}>Different ways to use it.</span>`],
    ["Four simple steps from sign-up to connected learning. See exactly how Visionary works for students, teachers, parents, professionals, and organizations.",
     "Four simple steps from sign-up to connected learning."],
    ['className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.blue }}',
     'className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.grey }}'],
  ]],
  // ── CAPS EYEBROWS blue→grey (blog.google: caps labels are grey) ──
  [P + "ContactPage.jsx", [[
    'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}',
    'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}', ":ALL"]]],
  [P + "CareersPage.jsx", [[
    'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}',
    'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}', ":ALL"]]],
  [P + "ResearchNewsPage.jsx", [[
    'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}',
    'text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}', ":ALL"]]],
];

let applied = 0, failed = [];
for (const [file, pairs] of edits) {
  let src = readFileSync(file, "utf8");
  for (const [search, replace, flag] of pairs) {
    if (search === "REGEX:CAREERS-PARA") continue;
    const count = src.split(search).length - 1;
    if (flag === ":ALL") {
      if (count === 0) { failed.push(`${file} :: ${search.slice(0, 50)}`); continue; }
      src = src.split(search).join(replace);
      applied += count;
    } else {
      if (count !== 1) { failed.push(`${file} :: [${count}x] ${search.slice(0, 60)}`); continue; }
      src = src.replace(search, replace);
      applied += 1;
    }
  }
  writeFileSync(file, src);
}
// Careers: drop the hero's second paragraph (contract: ≤1 hero dek)
{
  const file = P + "CareersPage.jsx";
  let src = readFileSync(file, "utf8");
  const re = /[ \t]*<p className="mt-5 max-w-\[760px\] text-\[16px\] leading-\[1\.75\]" style=\{\{ color: COLORS\.grey \}\}>\s*That takes more than one discipline\.[\s\S]*?<\/p>\r?\n/;
  if (re.test(src)) { src = src.replace(re, ""); applied += 1; writeFileSync(file, src); }
  else failed.push("CareersPage :: second hero paragraph");
}
console.log(`applied: ${applied}`);
if (failed.length) { console.log("FAILED:"); failed.forEach((f) => console.log("  " + f)); process.exit(1); }
console.log("all edits applied cleanly");
