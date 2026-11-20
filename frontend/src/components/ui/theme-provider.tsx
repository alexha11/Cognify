"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "cognify-theme";
const EXPLICIT_KEY = "cognify-theme-explicit";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Sync theme based on explicit preference, defaulting to light
  useEffect(() => {
    // Storage can throw (site data blocked); fall back to the default theme
    // instead of failing the whole render, as the inline script in the layout does.
    let isExplicit = false;
    let stored: Theme | null = null;
    try {
      isExplicit = localStorage.getItem(EXPLICIT_KEY) === "true";
      stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    } catch {
      // keep the defaults
    }

    let targetTheme: Theme;
    if (isExplicit && stored) {
      targetTheme = stored;
    } else {
      // Default theme is always light mode
      targetTheme = "light";
    }

    // Hydrating from localStorage, which the server render cannot read: this
    // is the "synchronise with an external system" case effects exist for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(targetTheme);

    const resolved =
      targetTheme === "system" ? getSystemTheme() : targetTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, [pathname]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      localStorage.setItem(EXPLICIT_KEY, "true");
    } catch {
      // Not persisted, but the switch still applies to this visit.
    }

    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Prevent hydration mismatch — render children immediately but
  // the theme values only become accurate after mount
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
