import { readFileSync, writeFileSync } from "node:fs";
const f = "src/pages/landing/PrivacyPage.jsx";
let s = readFileSync(f, "utf8");
const anchor = "Last updated: <strong style={{ color: COLORS.ink }}>{LEGAL_META.privacy.lastUpdated}</strong>\r\n          </p>\r\n        </section>";
if (!s.includes(anchor)) { console.log("MISS"); process.exit(1); }
s = s.replace(anchor, "Last updated: <strong style={{ color: COLORS.ink }}>{LEGAL_META.privacy.lastUpdated}</strong>\r\n          </p>\r\n          </div>\r\n        </section>");
writeFileSync(f, s);
console.log("container closed");
