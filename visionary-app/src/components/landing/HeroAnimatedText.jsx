import { useState, useEffect } from "react";

const PHRASES = ["you", "your classroom", "their journey", "your work", "your people"];

/**
 * Cycles the hero's final word with a vertical fade-up on each swap.
 * Remounts via key so the CSS animation re-runs every cycle.
 */
export default function HeroAnimatedText() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PHRASES.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <span key={idx} className="hero-fade-up inline-block">
      {PHRASES[idx]}
    </span>
  );
}