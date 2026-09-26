import { useState, useEffect } from 'react';
import { languageService, AppLanguage, TranslationDictionary } from '../services/languageService';

export const useTranslation = () => {
  const [lang, setLangState] = useState<AppLanguage>(() => languageService.getLanguage());

  useEffect(() => {
    const unsubscribe = languageService.onLanguageChange(newLang => {
      setLangState(newLang);
    });
    return unsubscribe;
  }, []);

  const setLanguage = (newLang: AppLanguage) => {
    languageService.setLanguage(newLang);
  };

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    return languageService.t(key, fallback);
  };

  return {
    lang,
    setLanguage,
    t,
  };
};

export default useTranslation;
