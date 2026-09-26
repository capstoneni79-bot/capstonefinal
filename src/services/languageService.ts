import { AppLanguage, dictionaries, formatTranslation, TranslationKey } from '../i18n';

const LANGUAGE_STORAGE_KEY = 'app_language';
const LANGUAGE_EVENT = 'app_language_change';

class LanguageService {
  private currentLanguage: AppLanguage = 'en';

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'ceb' || stored === 'fil') {
        this.currentLanguage = stored;
      } else {
        this.currentLanguage = 'en';
      }
    } catch {
      this.currentLanguage = 'en';
    }
  }

  public getLanguage(): AppLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: AppLanguage): void {
    if (lang !== 'en' && lang !== 'ceb' && lang !== 'fil') return;
    this.currentLanguage = lang;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }

    // Broadcast across windows/components for instant real-time update
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_EVENT, {
        detail: { language: lang },
      })
    );
  }

  public t(
    key: TranslationKey,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ): string {
    const dict = dictionaries[this.currentLanguage] || dictionaries.en;
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
      // Fallback to English if key missing in dialect
      template = dictionaries.en[key] || defaultFallback || String(key);
    }

    return formatTranslation(template, params);
  }

  public onLanguageChange(callback: (lang: AppLanguage) => void): () => void {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: AppLanguage }>;
      if (customEvent.detail?.language) {
        callback(customEvent.detail.language);
      } else {
        callback(this.getLanguage());
      }
    };

    window.addEventListener(LANGUAGE_EVENT, handler);
    return () => window.removeEventListener(LANGUAGE_EVENT, handler);
  }
}

export const languageService = new LanguageService();
export { dictionaries, formatTranslation } from '../i18n';
export type { AppLanguage, TranslationKey } from '../i18n';
export type TranslationDictionary = Record<string, string>;
export const translations = dictionaries;
