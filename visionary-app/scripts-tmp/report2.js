import { readFileSync } from "node:fs";
const j = JSON.parse(readFileSync("scripts-tmp/landing-audit/final-check.json", "utf8"));
for (const t of ["320", "390", "768", "1024", "1440", "1920"]) {
  const m = j[t];
  const prom = m.sections.find((s) => s.key === "03-promise");
  console.log(`=== ${t} === promise pad ${prom.padT}/${prom.padB}  / overflow count ${m.overflows.length}`);
  // identify each overflow: is it inside an overflow-hidden/x-auto container?
  // The probe already collected them; list by description
  console.log("  overflows:", JSON.stringify(m.overflows));
}
