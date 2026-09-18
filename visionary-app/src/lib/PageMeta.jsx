import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ROUTE_META, ROUTE_EXACT, PERSONA_OG } from "@/lib/routeMeta";

/* Production origin for canonical/OG URLs. Override per environment with VITE_SITE_URL. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://visionary.app").replace(/\/+$/, "");

/* Pristine index.html head values, captured before any route modifies them. */
const ORIGINAL = {
  title: document.title,
  description: document.head.querySelector('meta[name="description"]')?.getAttribute("content"),
};

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(attr, key) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertPreload(preload) {
  if (!preload) return;
  let el = document.head.querySelector('link[rel="preload"][data-page-lcp]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "preload");
    el.setAttribute("data-page-lcp", "");
    document.head.appendChild(el);
  }
  const { src, srcSet, sizes } = typeof preload === "string" ? { src: preload } : preload;
  el.setAttribute("as", "image");
  /* href and imagesrcset are mutually exclusive — setting both makes this
     Chromium build fetch the href (4096w) instead of the viewport-matched
     candidate, so src is only set for plain single-URL preloads. */
  if (src && !srcSet) el.setAttribute("href", src);
  if (srcSet) {
    /* imagesrcset keeps the preload byte-matched to the srcSet candidate the
       browser actually selects for this viewport/DPR. */
    el.setAttribute("imagesrcset", srcSet);
    el.setAttribute("imagesizes", sizes || "100vw");
  }
  el.setAttribute("fetchpriority", "high");
}

function clearPreload() {
  document.head.querySelector('link[rel="preload"][data-page-lcp]')?.remove();
}

/* JSON-LD: one managed script per entry; removed on route change. */
function injectJsonLd(entries) {
  document.head.querySelectorAll('script[data-page-jsonld]').forEach((el) => el.remove());
  for (const obj of entries || []) {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-page-jsonld", "");
    el.textContent = JSON.stringify(obj);
    document.head.appendChild(el);
  }
}

/* Restore the head to exactly the shipped index.html state — used on routes the
   landing pack does not own (auth, internal) so they are never touched. */
function resetHead() {
  document.title = ORIGINAL.title;
  if (ORIGINAL.description) upsertMeta("name", "description", ORIGINAL.description);
  for (const key of ["og:title", "og:description", "og:type", "og:site_name", "og:url", "og:image"])
    removeMeta("property", key);
  for (const key of ["twitter:title", "twitter:description", "twitter:image", "twitter:card"])
    removeMeta("name", key);
  document.head.querySelector('link[rel="canonical"]')?.remove();
  clearPreload();
}

const absolute = (url) => (url && !/^https?:\/\//.test(url) ? SITE_URL + url : url);

/**
 * Per-route head system (title, description, OG, Twitter card, canonical,
 * optional LCP image preload). Idempotent — safe across SPA navigations.
 * Pass null/undefined to reset the head to the original document defaults.
 */
export function usePageMeta(meta) {
  const { title, description, image, canonicalPath, preloadImage, jsonLd } = meta || {};
  useEffect(() => {
    if (!meta) {
      resetHead();
      injectJsonLd([]);
      return clearPreload;
    }

    if (title) document.title = title;
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:description", description);
    }
    if (title) {
      upsertMeta("property", "og:title", title);
      upsertMeta("name", "twitter:title", title);
    }
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "Visionary");
    upsertMeta("name", "twitter:card", "summary_large_image");
    if (image) {
      const img = absolute(image);
      upsertMeta("property", "og:image", img);
      upsertMeta("name", "twitter:image", img);
    }
    const path = canonicalPath || window.location.pathname;
    upsertLink("canonical", SITE_URL + path);
    upsertMeta("property", "og:url", SITE_URL + path);

    /* Preload must byte-match the <img> src (relative hashed asset) — CSP img-src 'self'. */
    if (preloadImage) upsertPreload(preloadImage);

    /* JSON-LD: per-route payloads + BreadcrumbList on every landing page (L6). */
    const crumbs = [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      ...(path !== "/" ? [{ "@type": "ListItem", position: 2, name: (title || "").replace(" | Visionary", ""), item: SITE_URL + path }] : []),
    ];
    injectJsonLd([...(jsonLd || []), { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs }]);
    return () => { clearPreload(); };
  }, [meta, title, description, image, canonicalPath, preloadImage, jsonLd]);
}

/** Declarative variant for use inside page JSX. Renders nothing. */
export function PageMeta(props) {
  usePageMeta(props);
  return null;
}

const NOT_FOUND_META = {
  title: "Page not found | Visionary",
  description: "The page you're looking for doesn't exist. Head back to Visionary to keep going.",
  image: "/og-image.png",
};

/**
 * Applies the per-route meta matrix (routeMeta.js) on every public landing
 * route. Auth surfaces and internal surfaces (dashboard, onboarding, dev) get
 * their head reset to the original index.html defaults — the landing pack
 * never modifies them.
 */
export function MetaManager() {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname] || (ROUTE_EXACT(pathname) ? NOT_FOUND_META : null);
  usePageMeta(meta ? { ...meta, image: PERSONA_OG[pathname] || meta.image, canonicalPath: pathname } : null);
  return null;
}
