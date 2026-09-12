import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export const googleColors = [
  { name: "blue", accent: "#1a73e8", light: "#e8f0fe" },
  { name: "green", accent: "#34a853", light: "#e6f4ea" },
  { name: "amber", accent: "#fbbc05", light: "#fef7e0" },
  { name: "red", accent: "#ea4335", light: "#fce8e6" },
  { name: "purple", accent: "#a142f4", light: "#f3e8fd" },
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
    }
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
