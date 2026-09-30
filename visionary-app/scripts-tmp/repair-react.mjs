/* Rebuilds each file's React hook import from what the file ACTUALLY uses. */
import { readFileSync, writeFileSync } from "fs";

const FILES = [
  "AILearningPage", "CoachingPage", "CookiesPage", "DownloadPage",
  "SecurityPage", "PrivacyPage", "SchoolPage", "TermsPage",
];
const KNOWN = ["useCallback", "useEffect", "useId", "useLayoutEffect", "useMemo", "useReducer", "useRef", "useState"];

for (const f of FILES) {
  const p = `src/pages/landing/${f}.jsx`;
  let c = readFileSync(p, "utf8");
  const used = KNOWN.filter((n) =>
    new RegExp(`[^\\w.]${n}\\b`).test(c.replace(/import React, \{[^}]*\} from "react";/, ""))
  );
  const reactImp = used.length
    ? `import React, { ${used.join(", ")} } from "react";`
    : 'import React from "react";';
  if (/import React, \{[^}]*\} from "react";/.test(c)) {
    c = c.replace(/import React, \{[^}]*\} from "react";/, reactImp);
  } else if (/import React from "react";/.test(c)) {
    c = c.replace('import React from "react";', reactImp);
  }
  writeFileSync(p, c);
  console.log(f, "->", used.join(", ") || "(none)");
}
