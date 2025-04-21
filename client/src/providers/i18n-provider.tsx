import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, supportedLanguages, SupportedLanguage, TranslationsType } from "@/lib/i18n";

type I18nContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

  // Type-safe setLanguage function
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  // Helper function to validate language
  const validateLanguage = (lang: string): SupportedLanguage => {
    return (supportedLanguages.includes(lang as SupportedLanguage) 
      ? (lang as SupportedLanguage) 
      : "en");
  };

  // Initialize language from browser or localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setLanguage(validateLanguage(savedLanguage));
    } else {
      const browserLang = navigator.language.split("-")[0];
      setLanguage(validateLanguage(browserLang));
    }
  }, []);

  // Update when language changes
  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    
    // Set direction based on language
    const newDirection: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";
    setDirection(newDirection);
    document.documentElement.dir = newDirection;
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    return value as string;
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    dir: direction,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
