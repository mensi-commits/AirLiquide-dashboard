// src/hooks/useLanguage.ts
import { useState, useEffect } from "react";
import { translations, type Language } from "../i18n/translations";

export function useLanguage() {
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem("appLanguage") as Language) || "en"
  );

  useEffect(() => {
    const updateLanguage = () => {
      const currentLang = (localStorage.getItem("appLanguage") as Language) || "en";
      setLang(currentLang);
      
      // This flips the entire app layout for Arabic (Right-to-Left)
      document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = currentLang;
    };

    updateLanguage();
    
    window.addEventListener("languageChanged", updateLanguage);
    window.addEventListener("storage", updateLanguage);

    return () => {
      window.removeEventListener("languageChanged", updateLanguage);
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  const t = (key: keyof typeof translations.en) => {
    return translations[lang][key] || key;
  };

  return { lang, t };
}