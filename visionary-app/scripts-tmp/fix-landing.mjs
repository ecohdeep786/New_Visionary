import { readFileSync, writeFileSync } from "fs";

let src = readFileSync("src/pages/Landing.jsx", "utf8");
let n = 0;
const rep = (from, to) => {
  if (!src.includes(from)) { console.log("MISS:", from.slice(0, 80)); return; }
  src = src.replace(from, to);
  n++;
};

/* imports: local images + lucide icons */
rep(`import problemunderstanding from "@/assets/problem-understanding.png";`,
`import problemunderstanding from "@/assets/problem-understanding.png";
import teacherSlide from "@/assets/teacher-hero-main.png";
import parentSlide from "@/assets/parent-hero-main.png";
import proSlide from "@/assets/pro-face-main.png";
import cmAdapt from "@/assets/student-primary.png";
import cmGrow from "@/assets/student-secondary.png";
import cmCreate from "@/assets/student-vocational.png";
import cmContinue from "@/assets/student-higher.png";
import { ShieldCheck, HeartHandshake, Scale } from "lucide-react";`);

/* a) problem slides -> local persona images */
rep(`persona: "A Teacher", quote: "I taught the whole class. Half of them still left lost.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `persona: "A Teacher", quote: "I taught the whole class. Half of them still left lost.", image: teacherSlide`);
rep(`persona: "A Parent", quote: "The report card says fine. I still don't know how to help at home.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `persona: "A Parent", quote: "The report card says fine. I still don't know how to help at home.", image: parentSlide`);
rep(`persona: "A Professional", quote: "I have all the articles. I still can't turn them into the work.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `persona: "A Professional", quote: "I have all the articles. I still can't turn them into the work.", image: proSlide`);

/* b) commitment steps -> local journey images */
rep(`{ title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `{ title: "Adapt", copy: "When what you need changes, the way you learn can change with it.", image: cmAdapt`);
rep(`{ title: "Grow", copy: "When you know more, you should be able to go further.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `{ title: "Grow", copy: "When you know more, you should be able to go further.", image: cmGrow`);
rep(`{ title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `{ title: "Create", copy: "When an idea becomes real, your intelligence should come with you.", image: cmCreate`);
rep(`{ title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png"`,
    `{ title: "Continue", copy: "Wherever you go next, you shouldn't have to begin again.", image: cmContinue`);

/* c1) trust row container: overflow fix */
rep(`<div className="flex flex-col gap-8 lg:flex-row lg:gap-10 lg:pr-[6%]">`,
    `<div className="flex flex-col gap-8 2xl:grid 2xl:grid-cols-2 2xl:gap-10 lg:pr-[6%]">`);

/* c2) active trust card: drop shrink-0, pass cardIndex */
rep(`className="hero-fade-up w-full max-w-[780px] shrink-0"><LXTrustCard card={activeCard} /></div>`,
    `className="hero-fade-up w-full max-w-[780px]"><LXTrustCard card={activeCard} cardIndex={cardIndex} /></div>`);

/* c3) next trust card: hidden below 2xl, pass cardIndex */
rep(`className="hero-fade-up w-full max-w-[780px] shrink-0 [animation-delay:80ms] [animation-fill-mode:both]"><LXTrustCard card={nextCard} /></div>`,
    `className="hero-fade-up hidden w-full max-w-[780px] 2xl:block [animation-delay:80ms] [animation-fill-mode:both]"><LXTrustCard card={nextCard} cardIndex={(cardIndex + 1) % LX_TRUST_CARDS.length} /></div>`);

/* d) trust model: icons + links */
rep(`const LX_TRUST_CARDS = [
  { title: "Private by Design", copy: "Your personal information is treated with care.", alt: "Person working privately on a laptop" },
  { title: "Safe to grow with", copy: "Built from the first question to what's next.", alt: "Shield protecting a learner's journey" },
  { title: "Built responsibly.", copy: "Intelligence should help people without compromising matters to them.", alt: "Responsibly built intelligence illustration" },
];`,
`const LX_TRUST_CARDS = [
  { title: "Private by Design", copy: "Your personal information is treated with care.", alt: "Person working privately on a laptop", Icon: ShieldCheck, to: "/privacy", link: "Read the privacy approach" },
  { title: "Safe to grow with", copy: "Built from the first question to what's next.", alt: "Shield protecting a learner's journey", Icon: HeartHandshake, to: "/security", link: "See security practices" },
  { title: "Built responsibly.", copy: "Intelligence should help people without compromising matters to them.", alt: "Responsibly built intelligence illustration", Icon: Scale, to: "/terms", link: "Terms & commitments" },
];
const LX_TRUST_IMG = [cmContinue, teacherSlide, parentSlide];`);

/* e) trust card view: white chip + icon + link (persona parity) */
rep(`const LXTrustCard = React.memo(function LXTrustCard({ card }) {
  return (
    <div className="relative w-full max-w-[780px] shrink-0 overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: \`\${COLORS.ink}1A\`, boxShadow: "0 8px 24px rgba(60,64,67,0.08)" }}>
      <img src={LX_IMG} alt={card.alt} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      <p className="absolute left-8 top-8 max-w-[220px] font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{card.copy}</p>
    </div>
  );
});`,
`const LXTrustCard = React.memo(function LXTrustCard({ card, cardIndex }) {
  const img = LX_TRUST_IMG[cardIndex % LX_TRUST_IMG.length];
  return (
    <div className="elevation-1 relative w-full max-w-[780px] overflow-hidden rounded-[32px] border bg-white" style={{ borderColor: \`\${COLORS.ink}1A\` }}>
      <img src={img} alt={card.alt} loading="lazy" decoding="async" className="aspect-[8/5] w-full object-cover" />
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8 sm:max-w-[320px]">
        <div className="rounded-[20px] bg-white/95 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.chipBg, color: COLORS.blue }}>
            <card.Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-3 font-normal tracking-[0] leading-[22px] text-[15px]" style={{ color: COLORS.ink }}>{card.copy}</p>
          <Link to={card.to} className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
            {card.link}
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
});`);

/* LX_IMG const no longer used */
rep(`const LX_IMG = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";\n`, ``);

/* f) CTA focus ring */
rep(`className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]"`,
    `className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"`);

/* g) carousel dots tap target */
rep("className={`h-2 rounded-full transition-all duration-300 ${i === active ? \"w-10\" : \"w-2 hover:opacity-70\"}`}",
    "className={`relative h-2 rounded-full transition-all duration-300 after:absolute after:-inset-y-3 after:-inset-x-1.5 after:content-[''] ${i === active ? \"w-10\" : \"w-2 hover:opacity-70\"}`}");

/* h) hero display: prevent "One Intelligence." clipping on 320-390px phones */
rep(`const display = "block whitespace-nowrap font-medium tracking-[0] leading-[1] text-[#121317] text-[clamp(40px,9.57vw,168px)]";`,
    `const display = "block whitespace-nowrap font-medium tracking-[0] leading-[1] text-[#121317] text-[clamp(34px,9.57vw,168px)] sm:text-[clamp(40px,9.57vw,168px)]";`);

/* i) language section: flat Google design */
rep(`        <div className="mx-auto mt-24 max-w-[760px] lg:mt-32">
          <p className="text-left font-normal tracking-[0] leading-[16px] text-[12px]" style={{ color: COLORS.lightGrey }}>Listening........</p>
          <p className="mt-4 text-center font-normal tracking-[0] leading-[1.15] text-[clamp(30px,3.75vw,54px)]" style={{ color: COLORS.blue }}>
            <span key={\`\${lang}-\${qIndex}\`} className="hero-fade-up inline">{question}</span>
          </p>
        </div>
        <div className="mt-14 flex justify-center" style={{ color: COLORS.ink }}><VoiceIcon /></div>
        <div className="mt-16"><LGLanguageChips active={lang} onSelect={setLang} /></div>`,
`        <div className="mt-14 lg:mt-20"><LGLanguageChips active={lang} onSelect={setLang} /></div>
        <div className="mx-auto mt-16 w-full max-w-[860px] lg:mt-24">
          <div className="flex items-end justify-center gap-2" aria-hidden="true">
            {["#4285F4", "#4285F4", "#4285F4", "#4285F4"].map((c, i) => (
              <span key={c} className="h-8 w-1.5 rounded-full" style={{ backgroundColor: c, transformOrigin: "center", animation: \`voiceDot 1.2s ease-in-out \${i * 0.15}s infinite\` }} />
            ))}
          </div>
          <p aria-live="polite" className="mx-auto mt-8 max-w-[760px] text-center font-normal tracking-[0] leading-[1.25] text-[clamp(26px,3.4vw,48px)]" style={{ color: COLORS.blue }}>
            <span key={\`\${lang}-\${qIndex}\`} className="hero-fade-up inline">{question}</span>
          </p>
          <p className="mt-6 text-center font-normal tracking-[0] leading-[20px] text-[13px]" style={{ color: COLORS.lightGrey }}>
            Listening in {LG_CHIPS.find((c) => c.code === lang)?.label || lang} · understood in every language
          </p>
        </div>`);

/* j) voiceDot keyframes */
rep(`<section ref={ref} data-section="07-language" className="relative overflow-hidden bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>`,
    `<section ref={ref} data-section="07-language" className="relative overflow-hidden bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <style>{"@keyframes voiceDot{0%,100%{transform:scaleY(0.35)}50%{transform:scaleY(1)}}"}</style>`);

/* k) helper pill: surface style + blue icon */
rep(`        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-5 rounded-[70px] px-10 py-6" style={{ backgroundColor: \`\${COLORS.ink}05\` }}>
            <VoiceIcon className="h-8 w-8 shrink-0" />`,
`        <div className="mt-14 flex justify-center lg:mt-20">
          <div className="flex items-center gap-4 rounded-full px-8 py-4" style={{ backgroundColor: COLORS.surface }}>
            <VoiceIcon className="h-6 w-6 shrink-0" style={{ color: COLORS.blue }} />`);

/* l) VoiceIcon: forward style prop */
rep(`function VoiceIcon({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>`,
`function VoiceIcon({ className = "h-9 w-9", style }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>`);

/* m) explore card elevation parity */
rep(`className="block w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: \`\${COLORS.ink}1A\`, boxShadow: "0 8px 24px rgba(60,64,67,0.08)" }}`,
    `className="elevation-1 block w-[260px] shrink-0 snap-start overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: \`\${COLORS.ink}1A\` }}`);

/* n) main id for skip link */
rep(`      <main>
        <LandingHeroSection />`, `      <main id="main">
        <LandingHeroSection />`);

writeFileSync("src/pages/Landing.jsx", src);
console.log("Landing.jsx edits applied:", n);
