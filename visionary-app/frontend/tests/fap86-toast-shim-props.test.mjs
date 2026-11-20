/** FAP-86 — the toast shim must not forward store-only props to DOM elements.
 *
 *  Defect at beta f6b34750: the use-toast store attaches Radix-compat
 *  fields (open, onOpenChange) to every toast; Toaster spread the rest of
 *  the toast object straight into <Toast {...props}>, whose raw <div>
 *  received the camelCase handler — React warned on every toast render:
 *  "Warning: Unknown event handler property `onOpenChange`. It will be
 *  ignored." (receipted live from the register "Code sent" toast in the
 *  FAP-70 before-capture, and re-verified via the real store path). The
 *  shim's ToastClose was also dead: no onClick, so x never dismissed and
 *  the toast stayed until the 1e6 ms remove timer.
 *
 *  The law: the two store fields are consumed in Toaster (never forwarded
 *  to the DOM); open === false hides the toast, and ToastClose calls
 *  onOpenChange(false) — the Radix semantic — so x dismisses. The store
 *  (use-toast.jsx) and the primitives (toast.jsx) stay byte-identical.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const toaster = readFileSync(join(root, "src/components/ui/toaster.jsx"), "utf8");

test("FAP-86: Toaster consumes the store's open/onOpenChange instead of spreading them to the DOM", () => {
  assert.match(
    toaster,
    /\{ id, title, description, action, open = true, onOpenChange, \.\.\.props \}/,
    "both store fields are destructured out of the mapped toast"
  );
  assert.match(toaster, /if \(!open\) return null;/, "open === false hides the toast (Radix semantic)");
  assert.match(toaster, /<Toast key=\{id\} \{\.\.\.props\}>/, "only DOM-safe props reach the Toast element");
  const spread = toaster.slice(toaster.indexOf("<Toast key={id}"));
  assert.ok(!/\{\.\.\.toast\}/.test(spread), "no whole-toast object is ever spread");
});

test("FAP-86: the shim's close control dismisses through the store's onOpenChange(false)", () => {
  assert.match(
    toaster,
    /<ToastClose onClick=\{\(\) => onOpenChange\(false\)\} \/>/,
    "x is wired to the Radix-semantic close"
  );
  const store = readFileSync(join(root, "src/components/ui/use-toast.jsx"), "utf8");
  assert.match(store, /onOpenChange: \(open\) => \{\s*if \(!open\) dismiss\(\);\s*\}/, "the store's onOpenChange(false) dismisses (byte-identical law)");
});

test("FAP-86: the toast primitives stay DOM-clean (regression guard)", () => {
  const toast = readFileSync(join(root, "src/components/ui/toast.jsx"), "utf8");
  assert.doesNotMatch(toast, /onOpenChange/, "ui/toast.jsx never names the handler (raw-div spreads stay safe)");
  assert.doesNotMatch(toast, /\bopen\b(?==)/, "ui/toast.jsx never forwards a bare open prop");
});
