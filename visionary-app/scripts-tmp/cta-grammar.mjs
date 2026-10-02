/* Normalizes the five category pages' mid-page CTA to the action-blue pill
   grammar: standard size, color-shift hover (no opacity/scale). */
import { readFileSync, writeFileSync } from "fs";

const OLD = `          <Link
            to="/register"
            className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
          >
            Get started
          </Link>`;
const NEW = `          <Link
            to="/register"
            className="inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0.24px] text-[15px] text-white transition-colors hover:bg-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: "#0b57d0" }}
          >
            Get started
          </Link>`;

for (const f of ["StudentPage", "TeacherPage", "ParentPage", "CollegePage", "OrganizationPage"]) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  if (!c.includes(OLD)) { console.log(f, "CTA block not found — differs"); continue; }
  c = c.replace(OLD, NEW);
  writeFileSync(p, c);
  console.log(f, "CTA normalized");
}
