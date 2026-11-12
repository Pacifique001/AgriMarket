"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "header" | "pill" | "select" | "cards";
  className?: string;
}

export function LanguageSwitcher({ variant = "header", className }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "rw" as const, label: "Kinyarwanda", nativeLabel: "Ikinyarwanda", flag: "🇷🇼", tag: "Ku Nkomoko" },
    { code: "en" as const, label: "English", nativeLabel: "English", flag: "🇬🇧", tag: "Default Int." },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  if (variant === "cards") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={cn(
                "p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all",
                isSelected
                  ? "border-green-600 bg-green-50/70 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{l.flag}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-sm text-slate-900">{l.nativeLabel}</p>
                    {l.code === "rw" && (
                      <span className="text-[9px] font-bold bg-green-200 text-green-900 px-1.5 py-0.2 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{l.label}</p>
                </div>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <Check size={14} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 shadow-sm"
        title={t.common.switchLanguage}
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="tracking-tight">{currentLang.label}</span>
        <ChevronDown size={13} className={cn("text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
            {t.common.language} / Language
          </div>

          <div className="py-1 space-y-1">
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLanguage(l.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors text-left",
                    isSelected
                      ? "bg-green-50 text-green-800"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{l.flag}</span>
                    <div>
                      <span className="block leading-snug">{l.nativeLabel}</span>
                      {l.code === "rw" && (
                        <span className="text-[9px] text-green-700 font-medium block">
                          Ku Nkomoko (Default)
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-green-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
