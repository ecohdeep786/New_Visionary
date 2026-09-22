import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export const googleColors = [
  { name: "blue", accent: "#4285F4", light: "#e8f0fd" },
  { name: "green", accent: "#137333", light: "#e6f4ea" },
  { name: "amber", accent: "#8a5700", light: "#ffffff" },
  { name: "red", accent: "#b3261e", light: "#fce8e6" },
  { name: "purple", accent: "#7627bb", light: "#f3e8fd" },
  { name: "teal", accent: "#00897b", light: "#e0f2f1" },
];

const ThemeColorContext = createContext(googleColors[0]);

export function ThemeColorProvider({ children }) {
  const { user } = useAuth();
  const [colorName, setColorName] = useState("blue");

  useEffect(() => {
    const preferredColor = user?.preferences?.theme_color;
    if (googleColors.some((color) => color.name === preferredColor)) {
      setColorName(preferredColor);
    } else setColorName("blue");
  }, [user?.preferences?.theme_color]);

  const value = useMemo(() => {
    const color = googleColors.find((item) => item.name === colorName) || googleColors[0];
    return { ...color, setColorName };
  }, [colorName]);

  return (
    <ThemeColorContext.Provider value={value}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  return useContext(ThemeColorContext);
}
