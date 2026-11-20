"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
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
const CHANGE_EVENT = "cognify-language-change";

/** Used only when storage writes fail, so switching still works for the session. */
let fallbackLanguage: Language | null = null;

function readStoredLanguage(): Language {
  if (fallbackLanguage) return fallbackLanguage;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "vi" || stored === "fi") return stored;
  } catch {
    // Storage blocked (private mode): fall back to the default.
  }
  return "en";
}

/** Re-render on changes from this tab (custom event) or another tab (storage). */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// ── Context ───────────────────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // The server renders English; the browser then switches to the stored choice.
  const language = useSyncExternalStore<Language>(
    subscribe,
    readStoredLanguage,
    () => "en",
  );

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      fallbackLanguage = null;
    } catch {
      // Storage blocked: keep the choice in memory for this session.
      fallbackLanguage = lang;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
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
