import { GUIDE_WINGS } from './guideIdentity';
import '@/styles/guide-premium.css';

// An open book, a V, and a small point of discovery. One identity at every size.
export default function GuideMark({ size = 28, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`guide-mark ${className}`} aria-hidden="true" focusable="false">
    <path d={GUIDE_WINGS[0]} fill="currentColor" />
    <path d={GUIDE_WINGS[1]} fill="currentColor" opacity=".68" />
    <circle cx="32" cy="14" r="4" fill="currentColor" />
  </svg>;
}
