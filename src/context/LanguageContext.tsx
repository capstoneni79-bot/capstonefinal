import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppLanguage,
  languageService,
  TranslationKey,
  dictionaries,
  formatTranslation,
} from '../services/languageService';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (
    key: TranslationKey,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ) => string;
  isCebuano: boolean;
  isFilipino: boolean;
  isEnglish: boolean;
  getSwineTypeLabel: (type: string) => string;
  getFarmScaleLabel: (scale: string) => string;
  getAsfZoneLabel: (zone: string) => string;
  getStatusLabel: (status: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => languageService.getLanguage());

  useEffect(() => {
    const unsubscribe = languageService.onLanguageChange((newLang) => {
      setLanguageState(newLang);
    });
    return unsubscribe;
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    languageService.setLanguage(lang);
    setLanguageState(lang);
  };

  const t = useCallback(
    (
      key: TranslationKey,
      paramsOrFallback?: Record<string, string | number> | string,
      fallback?: string
    ): string => {
      const dict = dictionaries[language] || dictionaries.en;
      let template = dict[key];

      let params: Record<string, string | number> | undefined;
      let defaultFallback = '';

      if (typeof paramsOrFallback === 'string') {
        defaultFallback = paramsOrFallback;
      } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
        params = paramsOrFallback;
        defaultFallback = fallback || '';
      } else if (fallback) {
        defaultFallback = fallback;
      }

      if (!template) {
        template = dictionaries.en[key] || defaultFallback || String(key);
      }

      return formatTranslation(template, params);
    },
    [language]
  );

  const getSwineTypeLabel = useCallback(
    (type: string): string => {
      const normalized = (type || '').toLowerCase();
      if (normalized.includes('boar') || normalized.includes('butakal')) return t('swine_type_breeding_boar', 'Breeding Boar');
      if (normalized.includes('sow') || normalized.includes('anay')) return t('swine_type_breeding_sow', 'Breeding Sow');
      if (normalized.includes('piglet') || normalized.includes('baktin') || normalized.includes('biik')) return t('swine_type_piglet', 'Piglet');
      if (normalized.includes('grower') || normalized.includes('patuboon')) return t('swine_type_grower', 'Grower');
      if (normalized.includes('finisher') || normalized.includes('slaughter') || normalized.includes('ihawan')) return t('swine_type_finisher', 'Finisher');
      if (normalized.includes('native') || normalized.includes('bisaya') || normalized.includes('lumad')) return t('swine_type_native', 'Native Swine');
      return type;
    },
    [t]
  );

  const getFarmScaleLabel = useCallback(
    (scale: string): string => {
      const normalized = (scale || '').toUpperCase();
      if (normalized.includes('LARGE')) return t('scale_commercial_large', 'Commercial Large');
      if (normalized.includes('MEDIUM')) return t('scale_commercial_medium', 'Commercial Medium');
      if (normalized.includes('SEMI')) return t('scale_semi_commercial', 'Semi-Commercial');
      if (normalized.includes('BACKYARD') || normalized.includes('TUGKARAN')) return t('scale_backyard', 'Backyard');
      return scale;
    },
    [t]
  );

  const getAsfZoneLabel = useCallback(
    (zone: string): string => {
      const normalized = (zone || '').toUpperCase();
      if (normalized.includes('RED') || normalized.includes('PULA')) return t('zone_red', 'Red (Infected)');
      if (normalized.includes('PINK') || normalized.includes('ROSAS')) return t('zone_pink', 'Pink (Buffer)');
      if (normalized.includes('YELLOW') || normalized.includes('DILAW')) return t('zone_yellow', 'Yellow (Surveillance)');
      if (normalized.includes('LIGHT') || normalized.includes('HAYAG') || normalized.includes('MATINGKAD')) return t('zone_light_green', 'Light Green (Protected)');
      if (normalized.includes('GREEN') || normalized.includes('BERDE')) return t('zone_dark_green', 'Dark Green (Free)');
      return zone;
    },
    [t]
  );

  const getStatusLabel = useCallback(
    (status: string): string => {
      const normalized = (status || '').toLowerCase();
      if (normalized.includes('healthy') || normalized.includes('himsog') || normalized.includes('malusog')) return t('status_healthy', 'Healthy');
      if (normalized.includes('suspected') || normalized.includes('gidudahan')) return t('status_suspected', 'Suspected');
      if (normalized.includes('quarantin')) return t('status_quarantined', 'Quarantined');
      if (normalized.includes('sold') || normalized.includes('nabaligya') || normalized.includes('naibenta')) return t('status_sold', 'Sold');
      if (normalized.includes('active') || normalized.includes('aktibo')) return t('status_active', 'Active');
      if (normalized.includes('pending') || normalized.includes('gihulat')) return t('status_pending', 'Pending');
      if (normalized.includes('deceased') || normalized.includes('namatay')) return t('status_deceased', 'Deceased');
      return status;
    },
    [t]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isCebuano: language === 'ceb',
        isFilipino: language === 'fil',
        isEnglish: language === 'en',
        getSwineTypeLabel,
        getFarmScaleLabel,
        getAsfZoneLabel,
        getStatusLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    const fallbackLang = languageService.getLanguage();
    return {
      language: fallbackLang,
      setLanguage: (l) => languageService.setLanguage(l),
      t: (k, p, fb) => languageService.t(k, p, fb),
      isCebuano: fallbackLang === 'ceb',
      isFilipino: fallbackLang === 'fil',
      isEnglish: fallbackLang === 'en',
      getSwineTypeLabel: (t) => t,
      getFarmScaleLabel: (s) => s,
      getAsfZoneLabel: (z) => z,
      getStatusLabel: (st) => st,
    };
  }
  return context;
};
