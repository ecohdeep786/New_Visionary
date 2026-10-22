import { appendFileSync } from "node:fs";

// D-104 recorded for C3/FAP-51 (append-only log, per docs/visionary/DECISIONS.md convention).
const section = `
## D-104 - Dashboard action blue retires the Material candidate - 2026-10-22

C3/KAN-201 (FAP-51) retires the leaked Material values from the dashboard. The workspace action token resolves \`#0071e3\` in light theme with hover \`#0077ed\` (the FAP-42 commerce blue family the landing law already uses; the non-Material candidate), \`--v-on-action\` stays \`#fff\`, and \`workspace-design.css\` remains the single definition point. Every raw \`#4285F4\`/\`#dadce0\` occurrence in the Ask, Build, StudentClasses, Subscription, Settings, RoleWorkspace and Guide surfaces moves to \`var(--v-action)\`/\`var(--v-border)\`, including case variants and the shared dashboard sheets, so no control renders the old values underneath new tokens. \`workspace.css\` stops redefining the forked token block (\`--v-border\`, \`--v-action\`, \`--v-action-hover\` now come only from \`workspace-design.css\`) and \`--v-brand\` aliases the action token, keeping its remaining consumers on the one decision. \`Subscription.jsx\` renders its plan, usage and current-plan containers as \`v-card\` panels. Links keep the C1 link token \`#0066cc\`; the dark theme keeps its on-dark action value \`#aac7ff\`; the user-selectable account accent palette (\`useThemeColor\`) remains preference content, not the action token, and its blue swatch remains \`#0b57d2\` until a later cycle reviews that palette. Claude's delivery amendment for this chain (founder instruction, this date): task branches merge to \`beta\` first, then \`dev\`, both pushed and remote-verified before receipt.
`;
appendFileSync('docs/visionary/DECISIONS.md', section.startsWith('\n') ? section : '\n' + section);
console.log('D-104 appended');
