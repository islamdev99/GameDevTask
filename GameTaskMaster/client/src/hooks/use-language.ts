import { useState, useEffect } from "react";
import { translations, supportedLanguages, SupportedLanguage, TranslationsType } from "@/lib/i18n";

// Create a standalone implementation not relying on Context Provider
export function useLanguage() {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  
  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as SupportedLanguage | null;
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
        setLanguage(browserLang as SupportedLanguage);
      }
    }
  }, []);

  // Update when language changes
  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    
    // Set direction based on language
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
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
  
  // Toggle between English and Arabic
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };
  
  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    dir: language === "ar" ? "rtl" : "ltr" as const,
    isRtl: language === "ar"
  };
}
