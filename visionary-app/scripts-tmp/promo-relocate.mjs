// Repair: move the checkup promo card from the file tail to before the chips nav.
import { readFileSync, writeFileSync } from "node:fs";
const f = "src/pages/landing/PrivacyPage.jsx";
let s = readFileSync(f, "utf8");
const promo = [
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
].join("\n");
if (!s.includes(promo)) { console.log("PROMO-EXACT-MISS"); process.exit(1); }
s = s.replace(promo, ""); // excise the dangling copy
const anchor = "          {/* On this page — anchor chips (C-pattern wayfinding) */}";
if (!s.includes(anchor)) { console.log("CHIPS-COMMENT-MISS"); process.exit(1); }
s = s.replace(anchor, promo + "\n" + anchor);
writeFileSync(f, s);
console.log("promo relocated");
