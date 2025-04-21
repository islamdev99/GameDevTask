import { en } from "./en";
import { ar } from "./ar";

export type SupportedLanguage = 'en' | 'ar';
export const supportedLanguages: SupportedLanguage[] = ["en", "ar"];

export type TranslationsType = {
  en: typeof en;
  ar: typeof ar;
};

export const translations: TranslationsType = {
  en,
  ar,
};
