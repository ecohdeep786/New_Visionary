const fs = require("fs");
const p = "src/pages/Landing.jsx";
let s = fs.readFileSync(p, "utf8");
const needle = ' ${' + "i === active ? \"animate-fadeIn\" : \"\"" + '}';
const idx = s.indexOf(needle);
if (idx === -1) { console.log("needle not found"); process.exit(0); }
s = s.slice(0, idx) + s.slice(idx + needle.length);
fs.writeFileSync(p, s);
console.log("cleaned");
