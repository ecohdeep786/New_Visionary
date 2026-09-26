/* L6 — regenerate public/sitemap.xml + public/robots.txt with VITE_SITE_URL.
   Usage: VITE_SITE_URL=https://your-domain node scripts-tmp/generate-sitemap.mjs
   Route list mirrors SITEMAP_ROUTES in src/lib/routeMeta.js (source of truth). */
import { writeFileSync } from "fs";
const SITE = (process.env.VITE_SITE_URL || "https://visionary.app").replace(/\/+$/, "");
const ROUTES = [
  "/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/how-it-works", "/help", "/pricing", "/download", "/about", "/research", "/community",
  "/updates", "/partners", "/referral", "/privacy", "/terms", "/cookies",
  "/safety", "/security", "/accessibility", "/careers", "/contact",
];
const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map((r) => `  <url><loc>${SITE}${r}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${r === "/" ? "1.0" : "0.7"}</priority></url>`).join("\n")}
</urlset>
`;
writeFileSync("public/sitemap.xml", xml);
const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /onboarding
Disallow: /dev
Disallow: /reset-password

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync("public/robots.txt", robots);
console.log(`sitemap (${ROUTES.length} urls) + robots regenerated for ${SITE}`);
