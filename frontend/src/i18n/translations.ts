import { common } from "./common";
import { admin } from "./pages/admin";
import { logistics } from "./pages/logistics";
import { laboratory } from "./pages/laboratory";
import { production } from "./pages/production";
import { distribution } from "./pages/distribution";
import { calendar } from "./pages/calendar";
import { login } from "./pages/login";

// Helper to merge objects deeply
const mergeTranslations = (lang: "en" | "fr" | "ar") => ({
  ...common[lang],
  ...admin[lang],
  ...logistics[lang],
  ...laboratory[lang],
  ...production[lang],
  ...distribution[lang],
  ...calendar[lang],
  ...login[lang],
});

export const translations = {
  en: mergeTranslations("en"),
  fr: mergeTranslations("fr"),
  ar: mergeTranslations("ar"),
};

export type Language = keyof typeof translations;