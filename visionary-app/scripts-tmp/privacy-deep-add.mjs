// Privacy deep-review additions (policies.google/privacy comparison):
// 1) Key terms glossary (their dedicated Key-terms section, D-pattern accordion)
// 2) "Privacy checkup" promo card after the at-a-glance grid (their signature element)
// 3) Export/Delete control tiles become honest mailto CTAs (their embedded-account-CTA law)
import { readFileSync, writeFileSync } from "node:fs";
const f = "src/pages/landing/PrivacyPage.jsx";
let s = readFileSync(f, "utf8");

// 1a. KEY_TERMS fixture after FAQ const
const faqAnchor = "const FAQ = [";
if (!s.includes("KEY_TERMS")) {
  s = s.replace(faqAnchor, L([
    "const KEY_TERMS = [",
    "  {",
    "    term: \"Personal data\",",
    "    def: \"Any information that can identify a person — account details, the questions and content someone provides, learning activity, and progress.\" },",
    "  {",
    "    term: \"Processing\",",
    "    def: \"Anything done with personal data — storing it, using it to answer a question, improving the service, or deleting it.\" },",
    "  {",
    "    term: \"Consent\",",
    "    def: \"A clear, informed yes. Optional features that use personal data run only while consent is on, and it can be withdrawn at any time.\" },",
    "  {",
    "    term: \"Retention\",",
    "    def: \"How long personal data is kept. Learning records are kept while an account is active, then removed under the retention rules described on this page.\" },",
    "  {",
    "    term: \"Data fiduciary\",",
    "    def: \"The entity responsible for how personal data is handled. Under India's DPDP Act, 2023, Visionary (Ecoh Solution Pvt. Ltd.) is the data fiduciary for this service.\" },",
    "  {",
    "    term: \"Grievance officer\",",
    "    def: \"The named person responsible for answering privacy requests and complaints, with published response timelines.\" },",
    "];",
    "",
    "const FAQ = [",
  ]));
}

// 1b. openTerm state next to openFaq
s = s.replace(
  /const \[openFaq, setOpenFaq\] = useState\([^)]*\);\r?\n/,
  (m) => m + "  const [openTerm, setOpenTerm] = useState(null);\n"
);

// 1c. Key terms section inserted before the closing CTA section
const ctaAnchor = "stays yours to manage.";
const keyTermsSection = L([
  "        {/* KEY TERMS — the policies.google glossary pattern */}",
  "        <section id=\"key-terms\" className=\"scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-28\">",
  "          <div className=\"mx-auto max-w-[1000px]\">",
  "            <div className=\"text-center\">",
  "              <p className=\"text-[12px] uppercase tracking-[0.43px]\" style={{ color: COLORS.grey }}>Key terms</p>",
  "              <h2 className=\"mt-[18px] text-[30px] sm:text-[36px] lg:text-[42px] font-normal tracking-[-0.025em] leading-[1.15]\" style={{ color: COLORS.ink }}>",
  "                The words, in plain language.",
  "              </h2>",
  "            </div>",
  "            <div className=\"mt-14 border-t\" style={{ borderColor: COLORS.mist }}>",
  "              {KEY_TERMS.map((item, index) => (",
  "                <div key={item.term} className=\"border-b\" style={{ borderColor: COLORS.mist }}>",
  "                  <button",
  "                    type=\"button\"",
  "                    aria-expanded={openTerm === index}",
  "                    onClick={() => setOpenTerm(openTerm === index ? null : index)}",
  "                    className=\"flex w-full items-center justify-between gap-8 py-6 text-left hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]\"",
  "                  >",
  "                    <span className=\"text-[17px] leading-[1.45]\" style={{ color: COLORS.ink }}>{item.term}</span>",
  "                    <ChevronDown className={[\"h-5 w-5 shrink-0 transition-transform duration-300\", openTerm === index ? \"rotate-180\" : \"\"].join(\" \")} style={{ color: COLORS.grey }} strokeWidth={1.8} />",
  "                  </button>",
  "                  {openTerm === index && (",
  "                    <p className=\"pb-6 max-w-[760px] text-[15px] leading-[1.7]\" style={{ color: COLORS.grey }}>",
  "                      {item.def}",
  "                    </p>",
  "                  )}",
  "                </div>",
  "              ))}",
  "            </div>",
  "            <p className=\"mt-8 text-[13px] leading-[1.6]\" style={{ color: COLORS.grey }}>",
  "              These summaries explain this page. The full legal meaning of each term follows India's Digital Personal Data Protection Act, 2023.",
  "            </p>",
  "          </div>",
  "        </section>",
]);
if (!s.includes("id=\"key-terms\"")) {
  const ctaIdx = s.indexOf(ctaAnchor);
  if (ctaIdx === -1) { console.log("CTA-ANCHOR-MISS"); process.exit(1); }
  // insert before the SECTION that contains the CTA: find the last "        {/* CLOSING" or the section open before ctaAnchor
  const sectionStart = s.lastIndexOf("        <section", ctaIdx);
  s = s.slice(0, sectionStart) + keyTermsSection + "\n\n" + s.slice(sectionStart);
}
// closing CTA h2 -> unified 36/48 scale
s = s.replace(
  'className="mt-4 text-[clamp(38px,5vw,70px)] font-medium leading-[1.05]"',
  'className="mt-4 text-[36px] sm:text-[48px] font-normal tracking-[-0.03em] leading-[1.12]"'
);

// 2. Privacy checkup promo card after the at-a-glance grid (before the anchor chips nav)
const chipsAnchor = "On this page";
if (!s.includes("two-minute privacy checkup")) {
  const chipsIdx = s.indexOf(chipsAnchor);
  if (chipsIdx === -1) { console.log("CHIPS-ANCHOR-MISS"); process.exit(1); }
  const navStart = s.lastIndexOf("<nav", chipsIdx);
  const promo = L([
  "          {/* Privacy checkup promo — the policies.google signature card */}",
  "          <div className=\"mx-auto mt-10 max-w-[1280px] rounded-[20px] border bg-white p-6 sm:p-7\" style={{ borderColor: COLORS.mist }}>",
  "            <div className=\"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between\">",
  "              <div className=\"flex items-start gap-4\">",
  "                <span className=\"flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-white\" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>",
  "                  <Settings2 className=\"h-5 w-5\" strokeWidth={1.7} />",
  "                </span>",
  "                <div>",
  "                  <h2 className=\"text-[17px] font-medium leading-[1.4]\" style={{ color: COLORS.ink }}>A two-minute privacy checkup.</h2>",
  "                  <p className=\"mt-1 text-[14px] leading-[1.6]\" style={{ color: COLORS.grey }}>Where your data lives, what we keep, and the choices you have — all on this page.</p>",
  "                </div>",
  "              </div>",
  "              <a href=\"#your-controls\" className=\"inline-flex h-11 shrink-0 items-center justify-center rounded-full px-6 text-[14px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2\" style={{ backgroundColor: COLORS.blue }}>",
  "                Review your options",
  "              </a>",
  "            </div>",
  "          </div>",
  "",
  ]);
  s = s.slice(0, navStart) + promo + s.slice(navStart);
}

// 3. Export/Delete tiles → honest mailto CTAs (embedded-account-CTA law)
s = s.replace(
  /<ActionCard\s+Icon=\{Download\}\s+title="Export"\s+text="([^"]*)"\s+\/>/,
  '<a href="mailto:grievance@visionary.org.in?subject=Data%20export%20request" className="block rounded-[24px] transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" aria-label="Export: request account information by email">\n              <ActionCard Icon={Download} title="Export" text="$1" />\n            </a>'
);
s = s.replace(
  /<ActionCard\s+Icon=\{Trash2\}\s+title="Delete"\s+text="([^"]*)"\s+\/>/,
  '<a href="mailto:grievance@visionary.org.in?subject=Account%20deletion%20request" className="block rounded-[24px] transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" aria-label="Delete: request account deletion by email">\n              <ActionCard Icon={Trash2} title="Delete" text="$1" />\n            </a>'
);

function L(arr) { return arr.join("\n"); }
writeFileSync(f, s);
console.log("privacy deep-review additions applied");
