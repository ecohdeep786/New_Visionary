/**
 * FAP-73 — the branded opening shell for workspace core-route mounts.
 *
 * Defect: the six core workspace routes (/dashboard/learn, /dashboard/ask,
 * /dashboard/practice, /dashboard/build, /dashboard/progress,
 * /dashboard/career) mounted an unbranded one-line placeholder ("Opening this
 * workspace…") for the first 1–2s of a cold first visit — no landmark, no h1,
 * no skeleton. The V6 five-question law requires designed loading paths.
 *
 * This shell keeps the same neutral chrome (`v-page`), announces the target
 * route with a real h1 (screen readers land on the destination's name, not a
 * bare status line), carries the honest localized note, and shows a
 * non-oversized skeleton that paints immediately at mount. The skeleton's
 * pulse runs only under `prefers-reduced-motion: no-preference` (and the
 * workspace-wide reduce law in workspace-design.css disables it as a backstop).
 */
export default function WorkspaceOpening({
  title,
  note,
  locale,
  eyebrow,
}) {
  return (
    <section
      className="v-page v-opening"
      role="status"
      aria-busy="true"
      lang={locale || undefined}
      data-workspace-opening="true"
    >
      {eyebrow && <p className="v-home-eyebrow">{eyebrow}</p>}
      <h1 className="v-title mt-2">{title}</h1>
      <p className="v-muted mt-2">{note}</p>
      <div className="v-opening-skeleton mt-6" aria-hidden="true">
        <span className="v-opening-art" />
        <span className="v-opening-row" style={{ width: "62%" }} />
        <span className="v-opening-row" style={{ width: "48%" }} />
        <span className="v-opening-row" style={{ width: "34%" }} />
      </div>
    </section>
  );
}
