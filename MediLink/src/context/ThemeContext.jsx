import React, { createContext, useContext, useEffect, useState } from "react";
import { COLOR_THEMES } from "../utils/theme.js";

const ThemeContext = createContext(null);

const THEME_KEY = "medilink_theme_pref";
const COLOR_THEME_KEY = "medilink_color_palette";
const FONT_SIZE_KEY = "medilink_font_size";
const HIGH_CONTRAST_KEY = "medilink_high_contrast";

export { COLOR_THEMES };

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(THEME_KEY) || "light";
  });

  const [colorTheme, setColorThemeState] = useState(() => {
    return localStorage.getItem(COLOR_THEME_KEY) || "ocean";
  });

  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem(FONT_SIZE_KEY) || "normal";
  });

  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem(HIGH_CONTRAST_KEY) === "true";
  });

  // Calculate whether dark mode is currently active
  const [isDark, setIsDark] = useState(() => {
    if (theme === "dark") return true;
    if (theme === "system") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply theme class and active color palette CSS tokens to <html> element
  useEffect(() => {
    const root = document.documentElement;
    let effectiveDark = false;

    if (theme === "dark") {
      effectiveDark = true;
    } else if (theme === "system") {
      effectiveDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    setIsDark(effectiveDark);

    if (effectiveDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Apply color palette tokens dynamically
    const activePalette = COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0];
    const tokens = effectiveDark ? activePalette.dark : activePalette.light;

    root.setAttribute("data-color-theme", activePalette.id);
    root.style.setProperty("--medilink-blue", tokens.blue);
    root.style.setProperty("--medilink-blue-dark", tokens.blueDark);
    root.style.setProperty("--medilink-blue-tint", tokens.blueTint);
    root.style.setProperty("--medilink-blue-tint2", tokens.blueTint2);
    root.style.setProperty("--medilink-navy", tokens.navy);
    root.style.setProperty("--medilink-navy-soft", tokens.navySoft);
    root.style.setProperty("--medilink-border", tokens.border);
    root.style.setProperty("--medilink-border-soft", tokens.borderSoft);
    root.style.setProperty("--medilink-bg", tokens.bg);
    root.style.setProperty("--medilink-card", tokens.card);

    // Font size scaling on root element
    if (fontSize === "comfortable") {
      root.style.fontSize = "16.5px";
    } else if (fontSize === "large") {
      root.style.fontSize = "17.5px";
    } else {
      root.style.fontSize = "15px";
    }

    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
    localStorage.setItem(FONT_SIZE_KEY, fontSize);
    localStorage.setItem(HIGH_CONTRAST_KEY, String(highContrast));
  }, [theme, colorTheme, fontSize, highContrast]);

  // Listen for system color-scheme changes if theme is 'system'
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      setIsDark(e.matches);
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t) => {
    setThemeState(t);
  };

  const setColorTheme = (c) => {
    setColorThemeState(c);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setFontSize = (size) => {
    setFontSizeState(size);
  };

  const setHighContrast = (hc) => {
    setHighContrastState(hc);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colorTheme,
        setColorTheme,
        colorThemes: COLOR_THEMES,
        activePalette: COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0],
        setTheme,
        toggleTheme,
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
