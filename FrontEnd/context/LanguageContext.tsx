"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, translations, TranslationSchema } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSchema;
  isKinyarwanda: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "rw",
  setLanguage: () => {},
  t: translations.rw,
  isKinyarwanda: true,
});

const STORAGE_KEY = "agrimarket_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default language is Kinyarwanda ("rw")
  const [language, setLanguageState] = useState<Language>("rw");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (stored === "en" || stored === "rw") {
          setLanguageState(stored);
        } else {
          // Explicitly initialize with Kinyarwanda as default
          localStorage.setItem(STORAGE_KEY, "rw");
          setLanguageState("rw");
        }
      } catch (e) {
        console.error("Language hydration error:", e);
      }
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch (e) {
        console.error("Failed to persist language:", e);
      }
    }
  };

  const t: TranslationSchema = translations[language] || translations.rw;
  const isKinyarwanda = language === "rw";

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isKinyarwanda,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
