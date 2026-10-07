import { readFileSync } from "node:fs";
const j = JSON.parse(readFileSync("scripts-tmp/landing-audit/final-check.json", "utf8"));
for (const t of ["320", "390", "768", "1024", "1440", "1920"]) {
  const m = j[t];
  const g = (k) => m.sections.find((s) => s.key === k);
  const prob = g("02-problem"), prom = g("03-promise"), meet = g("04-meet");
  const jour = g("06-journey"), tr = g("08-trust"), cta = g("09-cta");
  console.log(`\n=== ${t} (vw ${m.vw}) ===`);
  console.log(`  problem : pad ${prob.padT}/${prob.padB}  h2 ${prob.h2Size}px`);
  console.log(`  promise : pad ${prom.padT}/${prom.padB}`);
  console.log(`  meet    : pad ${meet.padT}/${meet.padB}  h2 ${meet.h2Size}px  stripCx:${m.meet.stripCenterX} contCx:${m.meet.containerCenterX} delta:${m.meet.centerDelta}`);
  console.log(`    rows:${JSON.stringify(m.meet.rows)}`);
  console.log(`  journey : pad ${jour.padT}/${jour.padB}  h2 ${jour.h2Size}px  hdrL:${m.journeyHeaderLeft} trackPad:${m.journeyTrackLeftPad} cardRest:${m.journeyCardRestLeft} delta:${m.journeyLeftDelta}`);
  console.log(`  trust   : pad ${tr.padT}/${tr.padB}  tiles:${JSON.stringify(tr.tiles)}`);
  console.log(`  cta     : pad ${cta.padT}/${cta.padB}  h2 ${cta.h2Size}px  btns:${JSON.stringify(m.btns)}`);
  console.log(`  overflows: ${m.overflows.length}  docH: ${m.docH}`);
}
