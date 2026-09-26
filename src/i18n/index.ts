import { en } from './en';
import { ceb } from './ceb';
import { fil } from './fil';

export type AppLanguage = 'en' | 'ceb' | 'fil';

export type TranslationKey = keyof typeof en | string;

export const dictionaries: Record<AppLanguage, Record<string, string>> = {
  en,
  ceb: { ...en, ...ceb },
  fil: { ...en, ...fil },
};

/**
 * Format string with interpolation variables:
 * replace {var} or {{var}} with params[var]
 */
export function formatTranslation(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return Object.entries(params).reduce((acc, [key, val]) => {
    const valStr = String(val);
    return acc
      .replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), valStr)
      .replace(new RegExp(`\\{${key}\\}`, 'g'), valStr);
  }, template);
}
