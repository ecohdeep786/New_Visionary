/* Start only the universal hero's LCP request before the application bundle.
   The stable public URLs byte-match the rendered AVIF source. PageMeta reuses
   this tagged link and owns every later SPA cleanup/restoration. */
if (window.location.pathname === "/" && !document.head.querySelector('link[rel="preload"][data-page-lcp]')) {
  const link = document.createElement("link");
  link.setAttribute("rel", "preload");
  link.setAttribute("as", "image");
  link.setAttribute("data-page-lcp", "");
  link.setAttribute("imagesrcset", "/hero/student-480w.avif 480w, /hero/student-800w.avif 800w");
  link.setAttribute("imagesizes", "(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 24vw");
  link.setAttribute("type", "image/avif");
  link.setAttribute("fetchpriority", "high");
  document.head.appendChild(link);
}
