import fs from 'node:fs';
const f = 'src/components/landing/LandingNav/index.jsx';
let s = fs.readFileSync(f, 'utf8');
const from = `  const closeMobile = () => {
    setMobileOpen(false);
    window.setTimeout(() => menuBtnRef.current?.focus({ preventScroll: true }), 0);
  };`;
const to = `  /* Focus restores at the first frame the trigger is actually visible. The
     single setTimeout(0) raced React's commit under prefers-reduced-motion:
     the drawer unmounted while the trigger still carried the closing
     "invisible" class, so focus() hit a visibility:hidden button and fell
     to <body> (the quality gate caught it: Escape restored scroll but not
     focus). Retrying per frame until the button paints is deterministic —
     the class removal and the focus land in the same frame, every time. */
  const closeMobile = () => {
    setMobileOpen(false);
    let frames = 0;
    const restoreFocus = () => {
      const btn = menuBtnRef.current;
      if (!btn || frames++ > 12) return;
      if (btn.offsetWidth > 0 && getComputedStyle(btn).visibility !== "hidden") {
        btn.focus({ preventScroll: true });
        return;
      }
      requestAnimationFrame(restoreFocus);
    };
    requestAnimationFrame(restoreFocus);
  };`;
if (s.split(from).length !== 2) { console.error('closeMobile miss ' + s.split(from).length); process.exit(1); }
s = s.split(from).join(to);
fs.writeFileSync(f, s);
console.log('focus restore fixed');
