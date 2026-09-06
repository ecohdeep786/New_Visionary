import { createContext, useContext, useState, useEffect } from "react";

const googleColors = [
  { name: "blue", accent: "#1a73e8", light: "#e8f0fe" },
  { name: "green", accent: "#34a853", light: "#e6f4ea" },
  { name: "amber", accent: "#fbbc05", light: "#fef7e0" },
  { name: "red", accent: "#ea4335", light: "#fce8e6" },
  { name: "purple", accent: "#a142f4", light: "#f3e8fd" },
  { name: "teal", accent: "#00897b", light: "#e0f2f1" },
];

const ONE_HOUR = 60 * 60 * 1000;

function randomIndexExcept(excludeIndex) {
  if (googleColors.length <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * googleColors.length);
  } while (next === excludeIndex);
  return next;
}

const ThemeColorContext = createContext(googleColors[0]);

export function ThemeColorProvider({ children }) {
  const [index, setIndex] = useState(() => {
    // Stable per hour so the color stays consistent within a 1-hour window
    const hourBucket = Math.floor(Date.now() / ONE_HOUR);
    return hourBucket % googleColors.length;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => randomIndexExcept(prev));
    }, ONE_HOUR);
    return () => clearInterval(timer);
  }, []);

  return (
    <ThemeColorContext.Provider value={googleColors[index]}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  return useContext(ThemeColorContext);
}