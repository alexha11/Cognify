"use client";

import { useState, useRef, useEffect } from "react";
import { Languages } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const langOptions: { value: Language; flag: string; label: string }[] = [
  { value: "en", flag: "🇬🇧", label: "English" },
  { value: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  { value: "fi", flag: "🇫🇮", label: "Suomi" },
];

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFlag = langOptions.find((o) => o.value === language)?.flag ?? "🇬🇧";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-secondary",
          open && "bg-secondary text-foreground",
        )}
        aria-label="Change language"
      >
        <span className="text-base leading-none">{activeFlag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 origin-top-right animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden rounded-xl border border-border/80 bg-[var(--background)] shadow-xl z-[200]">
          <div className="p-1.5">
            {langOptions.map(({ value, flag, label }) => (
              <button
                key={value}
                onClick={() => {
                  setLanguage(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  language === value
                    ? "bg-secondary text-foreground font-medium"
                    : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <span className="text-base leading-none">{flag}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
