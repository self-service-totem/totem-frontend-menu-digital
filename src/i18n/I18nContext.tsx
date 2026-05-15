import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  DEFAULT_LANGUAGE,
  format,
  labels,
  type LabelKey,
  type LanguageCode,
} from './labels';

interface I18nContextValue {
  language: LanguageCode;
  t: (key: LabelKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  language,
  children,
}: {
  language: LanguageCode;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const lang = labels[language] ? language : DEFAULT_LANGUAGE;
    const dict = labels[lang];
    return {
      language: lang,
      t: (key, params) => format(dict[key] ?? key, params),
    };
  }, [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLabels(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLabels must be used within I18nProvider');
  return ctx;
}
