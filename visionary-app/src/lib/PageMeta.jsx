import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ROUTE_META, ROUTE_EXACT } from "@/lib/routeMeta";

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

function upsertPreload(href) {
  let el = document.head.querySelector('link[rel="preload"][data-page-lcp]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "preload");
    el.setAttribute("data-page-lcp", "");
    document.head.appendChild(el);
  }
  el.setAttribute("as", "image");
  el.setAttribute("href", href);
  el.setAttribute("fetchpriority", "high");
}

function clearPreload() {
  document.head.querySelector('link[rel="preload"][data-page-lcp]')?.remove();
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
  const { title, description, image, canonicalPath, preloadImage } = meta || {};
  useEffect(() => {
    if (!meta) {
      resetHead();
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
    return clearPreload;
  }, [meta, title, description, image, canonicalPath, preloadImage]);
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
  usePageMeta(meta ? { ...meta, canonicalPath: pathname } : null);
  return null;
}
