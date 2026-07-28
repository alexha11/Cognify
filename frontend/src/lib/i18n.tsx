"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { en } from "./translations/en";
import { vi } from "./translations/vi";
import { fi } from "./translations/fi";
import type { TranslationKeys } from "./translations/en";

// ── Types ────────────────────────────────────────────────────────────────────
export type Language = "en" | "vi" | "fi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

// ── Translations map ──────────────────────────────────────────────────────────
const translations: Record<Language, TranslationKeys> = { en, vi, fi };

const STORAGE_KEY = "cognify-lang";

// ── Context ───────────────────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && (stored === "en" || stored === "vi" || stored === "fi")) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage unavailable (SSR safety)
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
