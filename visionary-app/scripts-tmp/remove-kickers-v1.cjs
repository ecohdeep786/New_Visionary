/* Remove the journey kicker <p> (3 lines: <p …> / kicker text / </p>) from
   the four persona pages, by line inspection — no regex, CRLF-safe. */
const fs = require("node:fs");
const jobs = [
  ["src/pages/landing/StudentPage.jsx", "Your learning, your journey"],
  ["src/pages/landing/TeacherPage.jsx", "Your teaching, your journey"],
  ["src/pages/landing/ParentPage.jsx", "Your child's learning, your journey"],
  ["src/pages/landing/OrganizationPage.jsx", "Your institution, your journey"],
];
for (const [p, kicker] of jobs) {
  const lines = fs.readFileSync(p, "utf8").split("\n");
  const i = lines.findIndex((l) => l.includes(kicker));
  if (i < 0) { console.log("not found:", p.split("/").pop()); continue; }
  // lines[i-1] should be the <p …> opener, lines[i+1] the </p>
  const openOk = /<p className="text-\[15px\] font-normal"/.test(lines[i - 1] || "");
  const closeOk = /<\/p>/.test(lines[i + 1] || "");
  if (openOk && closeOk) {
    lines.splice(i - 1, 3);
    fs.writeFileSync(p, lines.join("\n"));
    console.log("kicker removed:", p.split("/").pop());
  } else {
    console.log("structure mismatch:", p.split("/").pop(), JSON.stringify([lines[i - 1], lines[i], lines[i + 1]].map((x) => (x || "").trim().slice(0, 40))));
  }
}
