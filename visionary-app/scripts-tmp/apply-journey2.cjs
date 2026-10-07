const fs = require("fs");
const p = "src/pages/Landing.jsx";
let s = fs.readFileSync(p, "utf8");

// 1) Replace the old Journey comment + function (from the comment marker to the function's closing brace)
const startMarker = "/* 06 · THE JOURNEY — Apple's premium transformation";
const endMarker = "/* 08 · TRUST — Apple's values-band anatomy";
let si = s.indexOf(startMarker);
if (si === -1) {
  // fallback to the older comment wording we already replaced
  si = s.indexOf("/* 06 · THE JOURNEY — Apple's education-initiative");
}
if (si === -1) { throw new Error("journey start marker not found"); }
let ei = s.indexOf(endMarker, si);
if (ei === -1) { throw new Error("journey end marker not found"); }
// back up to include the blank line before endMarker
while (s[ei-1] === "\n") ei--;
const newJourney = fs.readFileSync("scripts-tmp/journey-premium.js", "utf8").trim() + "\n\n";
s = s.slice(0, si) + newJourney + s.slice(ei);

// 2) Remove now-unused cm* imports except cmContinue (still used by LX_TRUST_IMG)
s = s.replace(/import cmAdapt from "@\/assets\/student-primary\.webp";\n/, "");
s = s.replace(/import cmGrow from "@\/assets\/student-secondary\.webp";\n/, "");
s = s.replace(/import cmCreate from "@\/assets\/student-vocational\.webp";\n/, "");
// keep cmContinue

// 3) Remove the JOURNEY_STEPS const block
const jsStart = s.indexOf("const JOURNEY_STEPS = [");
if (jsStart !== -1) {
  // find the matching closing ]; — search up to next blank line + const
  let jsEnd = s.indexOf("];", jsStart);
  if (jsEnd !== -1) {
    jsEnd = s.indexOf("\n", jsEnd + 2);
    // also remove the trailing blank lines
    while (s[jsEnd] === "\n") jsEnd++;
    s = s.slice(0, jsStart) + s.slice(jsEnd);
  }
}
// 4) Remove the now-unused JOURNEY_CARD_MS? it was already removed earlier. Double check:
if (/JOURNEY_CARD_MS/.test(s)) { console.log("WARN: JOURNEY_CARD_MS still present"); }

fs.writeFileSync(p, s);
console.log("Rewritten. New length:", s.length);
console.log("cmAdapt present:", /cmAdapt/.test(s), "cmGrow:", /cmGrow/.test(s), "cmCreate:", /cmCreate/.test(s), "cmContinue:", /cmContinue/.test(s));
console.log("JOURNEY_STEPS present:", /JOURNEY_STEPS/.test(s));
