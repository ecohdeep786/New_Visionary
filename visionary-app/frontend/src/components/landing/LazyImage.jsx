import React, { useState, useEffect, useRef } from "react";

/**
 * LazyImage — defers offscreen images until they intersect the viewport,
 * then swaps in the full-src image. Shows a lightweight placeholder color
 * block while loading so layout doesn't shift when the real image arrives.
 *
 * Props:
 *   src        — the real image URL (loaded only when near viewport)
 *   srcSet     — optional responsive srcSet
 *   sizes      — optional sizes attribute
 *   alt        — alt text
 *   className  — applied to the img
 *   style      — inline styles for the placeholder frame
 *   eager      — if true, load immediately (above-fold hero images)
 *   fetchPriority — passed to the img (e.g. "high")
 *   placeholderBg — background color for the loading placeholder (default: #f3f4f6)
 */
export default function LazyImage({
  src,
  srcSet,
  sizes,
  alt = "",
  className = "",
  style,
  eager = false,
  fetchPriority,
  placeholderBg = "#f3f4f6",
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(eager);
  const imgRef = useRef(null);

  useEffect(() => {
    if (eager) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [eager]);

  const placeholderStyle = {
    backgroundColor: placeholderBg,
    ...style,
  };

  if (!inView) {
    return (
      <div
        ref={imgRef}
        className={`lazy-placeholder ${className}`}
        style={placeholderStyle}
        aria-label={alt ? `Loading ${alt}` : undefined}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={fetchPriority}
      onLoad={() => setLoaded(true)}
      className={`${className} ${!loaded ? "lazy-loading" : "lazy-loaded"}`}
      style={placeholderStyle}
      {...rest}
    />
  );
}
