const fs = require("fs");
const p = "src/pages/Landing.jsx";
const s = fs.readFileSync(p, "utf8");

// Anchor: from "function LandingJourneySection() {" up to the FIRST "}\n\n/* 08 · TRUST"
const startMarker = "function LandingJourneySection() {";
const endMarker = "\n}\n\n/* 08 · TRUST";

const si = s.indexOf(startMarker);
if (si === -1) { throw new Error("start marker not found"); }
const ei = s.indexOf(endMarker, si);
if (ei === -1) { throw new Error("end marker not found"); }
const before = s.slice(0, si);
const after = s.slice(ei + 1); // keep the trailing \n after }

// load the new function body
const replacement = fs.readFileSync("scripts-tmp/journey-rewrite.txt", "utf8").trim() + "\n";

const out = before + replacement + after;
fs.writeFileSync(p, out);
console.log("Journey rewritten; new length:", out.length);
