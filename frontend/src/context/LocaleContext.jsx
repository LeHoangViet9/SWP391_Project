import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';

const LocaleContext = createContext(null);
const LOCALE_KEY = 'hms_locale';

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem(LOCALE_KEY) || 'vi';
  });

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      value = value?.[k];
    }
    return value ?? key;
  };

  const acceptLanguage = locale === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, acceptLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
