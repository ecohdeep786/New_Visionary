/** KAN-210 — the workspace product-quality floor.
 *
 *  Four findings from the 2026-10-20 review that survived on dev:
 *
 *  1. Reveal policy (P0, global): `.scroll-reveal { opacity: 0 }` gated
 *     section visibility on the IntersectionObserver — content was invisible
 *     in the first-paint DOM (no-JS, pre-hydration, print, crawlers), and the
 *     wrapper had NO reduced-motion override, so reduced-motion users could
 *     face permanently hidden sections (an L8 violation: "reduced-motion …
 *     never zero"). The law is now: content always visible in the first
 *     paint; only a JS-armed below-the-fold chapter may hide until it scrolls
 *     into view, and reduced motion snaps it fully visible instantly.
 *  2. "Workspace unavailable" escaped the shell: the preview workspace layout
 *     rendered a bare `<main class="p-8">` with no topbar, rail or brand —
 *     the error looked broken, not authored. The law now: opening and error
 *     states are rooms in the product (full shell chrome + centered panel
 *     with explanation, device-data reassurance and retry).
 *  3. Native `<select>`s on the personalization panel read as non-premium
 *     beside the custom controls on the same page. The law: the panel uses
 *     the workspace listbox control with native-grade listbox semantics.
 *  4. FadeReveal's 700ms transition ran unchanged under prefers-reduced-motion;
 *     the reveal law requires the snap to be instant (opacity-only, no ride).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");

test("KAN-210 reveal law: the scroll-reveal CSS never hides content by default", () => {
  const css = read("src/index.css");
  assert.doesNotMatch(css, /^\.scroll-reveal \{\s*opacity: 0;/m, "the old hide-by-default wrapper rule is gone");
  assert.doesNotMatch(css, /^\.scroll-reveal \.reveal-item > \* \{\s*opacity: 0;/m, "the old hide-by-default child rule is gone");
  // The armed state exists, is JS-gated, and is the ONLY hiding rule.
  assert.match(css, /\.scroll-reveal\.reveal-armed:not\(\.in-view\) \{\s*opacity: 0;/, "hiding happens only for armed chapters");
  assert.match(css, /\.scroll-reveal\.reveal-armed:not\(\.in-view\) \.reveal-item > \* \{/, "armed children hide with the offset");
  assert.match(css, /\.scroll-reveal\.reveal-armed:not\(\.in-view\) \.stagger-group \.stagger-child \{/, "armed cards hide with the rise");
});

test("KAN-210 reveal law: reduced motion snaps armed chapters fully visible", () => {
  const css = read("src/index.css");
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{\s*\.scroll-reveal\.reveal-armed:not\(\.in-view\),[\s\S]*?\n\}/);
  assert.ok(block, "a reduced-motion block covers every armed hiding rule");
  for (const selector of [
    ".scroll-reveal.reveal-armed:not(.in-view),",
    ".scroll-reveal.reveal-armed:not(.in-view) .reveal-item > *,",
    ".scroll-reveal.reveal-armed:not(.in-view) .stagger-group .stagger-child,",
    ".scroll-reveal.reveal-armed:not(.in-view) .stagger-group .stagger-child .media-settle",
  ]) {
    assert.ok(block[0].includes(selector), `reduced motion covers ${selector}`);
  }
  assert.match(block[0], /opacity: 1;/, "armed content is fully visible under reduce");
});

test("KAN-210 reveal law: print never hides an armed chapter", () => {
  const css = read("src/index.css");
  const print = css.match(/@media print \{[\s\S]*?\r?\n\}\r?\n/);
  assert.ok(print, "the print block exists");
  assert.match(print[0], /\.scroll-reveal,/, "print un-hides the reveal wrapper");
  assert.match(print[0], /opacity: 1 !important;/, "print forces content visible");
});

test("KAN-210 reveal law: the hooks arm only below-the-fold chapters after paint", () => {
  const hooks = read("src/components/landing/system/hooks.js");
  assert.match(hooks, /const \[entered, setEntered\] = useState\(false\);\s*const \[armed, setArmed\] = useState\(false\);/, "useInViewOnce tracks an armed state");
  assert.match(hooks, /belowFold = el\.getBoundingClientRect\(\)\.top > \(window\.innerHeight/, "arming checks the fold");
  assert.match(hooks, /return \{ ref, entered, armed \};/, "ScrollReveal receives armed");
  // useRevealOnce starts visible and only hides a below-fold chapter.
  assert.match(hooks, /const \[visible, setVisible\] = useState\(true\);/, "useRevealOnce starts visible — content is in the first paint");
  assert.match(hooks, /if \(!belowFold\) \{\s*hasRevealed\.current = true;\s*setVisible\(true\);/, "an above-fold chapter never hides after paint");
  const scrollReveal = read("src/components/landing/persona/sections/ScrollReveal.jsx");
  assert.match(scrollReveal, /armed && !entered \? "reveal-armed" : ""/, "the armed class applies only before the observer fires");
});

test("KAN-210 reveal law: FadeReveal snaps instantly under reduced motion", () => {
  const fade = read("src/components/landing/persona/sections/FadeReveal.jsx");
  assert.match(fade, /fade-reveal/, "FadeReveal carries a stable class for the reduce law");
  const css = read("src/index.css");
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.fade-reveal \{\s*transition: none !important;\s*\}/);
  assert.ok(block, "the reduce law kills FadeReveal's 700ms ride");
});

test("KAN-210 shell law: opening and error states render inside the full shell chrome", () => {
  const layout = read("src/components/dashboard/DashboardLayout.jsx");
  // The bare-window escapes are gone.
  assert.doesNotMatch(layout, /function unavailable\(message\)\{return <main data-font-surface="product" className="p-8"/, "the error no longer renders a bare main");
  assert.doesNotMatch(layout, /return <main data-font-surface="product" lang=\{locale\} className="p-8" role="status"/, "the opening state no longer renders a bare main");
  // shellFor is the one shell renderer and both degraded states use it.
  assert.match(layout, /function shellFor\(mainNode,presented,tier,role\)/, "the shell renders through one function");
  const unavailable = layout.match(/function unavailable\(message\)\{return shellFor\([\s\S]*?degradedPresented,'higher'\);\}/);
  assert.ok(unavailable, "the error state renders through shellFor");
  assert.match(unavailable[0], /role="alert"/, "the failure message stays a live-region alert");
  assert.match(unavailable[0], /recoveryCopy\('Retry workspace'\)/, "the panel offers the real retry action");
  assert.match(unavailable[0], /Your saved records remain on this device/, "the panel keeps the device-data reassurance");
  const opening = layout.match(/if\(!activeWorkspace\)return shellFor\(<div className="workspace-surface min-h-full overflow-hidden"><WorkspaceOpening/);
  assert.ok(opening, "the opening state renders the shared WorkspaceOpening inside the shell");
  // The degraded shell still has the chrome: topbar, rail and phone bar.
  assert.match(layout, /<DashboardTopbar userName=\{userName\}/, "the shell keeps the topbar");
  assert.match(layout, /<DashboardSidebar expanded=\{sidebarExpanded\}/, "the shell keeps the rail");
  assert.match(layout, /workspace-bottom-nav fixed/, "the shell keeps the phone bar");
  assert.match(layout, /const degradedPresented=presentNavigation\(user\?\.identity,'higher'/, "degraded navigation presents at the default tier");
});

test("KAN-210 controls law: the personalization panel uses the workspace listbox, not native selects", () => {
  const tools = read("src/pages/dashboard/WorkspaceTools.jsx");
  assert.equal(tools.includes("<select"), false, "no native select remains in the workspace tools panel");
  assert.match(tools, /import WorkspaceListbox from '@\/components\/dashboard\/WorkspaceListbox';/, "the panel imports the listbox");
  const listboxes = tools.match(/<WorkspaceListbox /g) || [];
  assert.ok(listboxes.length >= 3, `every picker uses the listbox control (found ${listboxes.length})`);
  assert.match(tools, /value=\{data\.preferences\[key\]\}/, "the language listbox keeps the save-on-change value contract");
  assert.match(tools, /Previous appearance — shown as Blue/, "the legacy appearance value stays selectable");
  assert.match(tools, /status: next/, "the resource editor's status listbox keeps the setDraft contract");

  const listbox = read("src/components/dashboard/WorkspaceListbox.jsx");
  assert.match(listbox, /aria-haspopup="listbox"/, "the trigger announces the listbox");
  assert.match(listbox, /aria-expanded=\{open\}/, "the trigger announces open state");
  assert.match(listbox, /role="listbox"/, "the panel is a real listbox");
  assert.match(listbox, /role="option"/, "rows are real options");
  assert.match(listbox, /aria-selected=\{isSelected\}/, "options announce selection");
  assert.match(listbox, /"ArrowDown"/, "arrow keys move between options");
  assert.match(listbox, /"Escape"/, "Escape closes back to the trigger");
  assert.match(listbox, /focus-visible:ring-2/, "keyboard focus is visible on the trigger");
});

test("KAN-210 listbox law: the control declares every setter it calls", () => {
  const listbox = read("src/components/dashboard/WorkspaceListbox.jsx");
  // An undeclared state setter (e.g. setActiveIndex without its useState pair)
  // would crash arrow-key navigation at runtime; node's static realm can't
  // parse JSX, so the test guards the exact class of defect instead.
  const declared = new Set([
    ...[...listbox.matchAll(/const \[\w+, (set\w+)\]/g)].map(match => match[1]),
    ...[...listbox.matchAll(/function (\w+)\(/g)].map(match => match[1]),
  ]);
  const called = [...listbox.matchAll(/\b(set[A-Z]\w*)\(/g)].map(match => match[1]);
  assert.ok(called.length > 0, "the guard stays meaningful — the control calls at least one setter");
  for (const name of called) {
    assert.ok(declared.has(name), `${name} must be declared before it is called`);
  }
});
