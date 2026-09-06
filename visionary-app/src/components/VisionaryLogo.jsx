/**
 * Visionary brand logo — SVG matching the brand spec:
 * Dark grey "V" formed by two thick strokes meeting at a white circle,
 * followed by "isionary" in medium grey.
 */
export default function VisionaryLogo({ className = "", showText = true }) {
  return (
    <svg
      viewBox="0 0 156 40"
      className={`h-7 w-auto ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Visionary"
    >
      {/* V — final company mark (exact asset path, cropped to visual bounds) */}
      <svg x="0" y="10.8" width="28" height="21" viewBox="1.5 6 60 44">
        <g transform="translate(0,64) scale(0.1,-0.1)" fill="#121317" stroke="none">
          <path d="M49 551 c-16 -16 -29 -40 -29 -53 0 -14 42 -98 93 -187 l92 -163 6 38 c13 76 99 118 159 77 33 -22 44 -41 50 -83 5 -33 9 -28 98 128 60 105 92 172 92 192 0 34 -28 67 -66 76 -41 10 -72 -22 -149 -154 -38 -66 -72 -123 -75 -126 -4 -3 -41 55 -83 128 -95 164 -128 186 -188 127z" />
        </g>
      </svg>

      {/* "isionary" — same height band as the V (Google wordmark alignment) */}
      {showText && (
        <text
          x="29"
          y="29.5"
          fontFamily="'Google Sans Flex', 'Google Sans', system-ui, sans-serif"
          fontSize="34"
          fontWeight="500"
          letterSpacing="-0.5"
          fill="#9B9B9E"
        >
          isionary
        </text>
      )}
    </svg>
  );
}