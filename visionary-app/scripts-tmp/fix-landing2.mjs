import { readFileSync, writeFileSync } from "fs";

let src = readFileSync("src/pages/Landing.jsx", "utf8");
let n = 0;
/* Landing.jsx uses CRLF — convert \n in patterns to \r\n */
const rep = (from, to) => {
  const f = from.replace(/\n/g, "\r\n");
  const t = to.replace(/\n/g, "\r\n");
  if (!src.includes(f)) { console.log("MISS:", from.slice(0, 80)); return; }
  src = src.replace(f, t);
  n++;
};

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
rep(`const LX_IMG = "https://storage.googleapis.com/gweb-research2023-media/images/AlphaEvolve.width-800.png";\r\n`, ``);

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

/* n) main id for skip link */
rep(`      <main>
        <LandingHeroSection />`, `      <main id="main">
        <LandingHeroSection />`);

writeFileSync("src/pages/Landing.jsx", src);
console.log("Landing.jsx CRLF edits applied:", n);
