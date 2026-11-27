import * as React from "react";

import { applyTheme, STORAGE_KEY, ThemeContext, type Theme } from "@/hooks/use-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server and the first client render must agree, so start from "system"
  // and read storage after mount instead of inside the state initializer.
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isTheme(stored)) setThemeState(stored);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies); keep defaults.
    }
    setMounted(true);
  }, []);

  // Same value the server renders, so hydration matches; the real theme
  // arrives right after mount.
  const resolvedTheme: "light" | "dark" = mounted
    ? theme === "system"
      ? systemTheme
      : theme
    : "light";

  React.useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
  }, [mounted, theme]);

  React.useEffect(() => {
    if (!mounted) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      setSystemTheme(mql.matches ? "dark" : "light");
      if (theme === "system") applyTheme("system");
    };
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [mounted, theme]);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable; keep the choice for this session.
    }
    setThemeState(next);
    applyTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
