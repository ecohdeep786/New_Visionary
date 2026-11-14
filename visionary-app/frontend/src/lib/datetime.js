/**
 * Date formatting for the workspace — one India-first rule.
 *
 * `interfaceLocale` is a copy key ('en' | 'hi' | 'bn'); handing it straight to
 * toLocaleString makes bare 'en' resolve to en-US date order (11/5/2026), which
 * reads wrong for the product's home market. Every user-facing date goes
 * through `dateLocale`, which maps the copy key onto its BCP47 region tag
 * ('en' -> 'en-IN', 'hi' -> 'hi-IN', 'bn' -> 'bn-IN') and passes any explicit
 * region tag through unchanged.
 */
const DATE_LOCALES = { en: "en-IN", hi: "hi-IN", bn: "bn-IN" };

export function dateLocale(locale) {
  return DATE_LOCALES[locale] || locale || "en-IN";
}
