import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import Czech translations
import csCommon from './locales/cs/common.json';
import csAuth from './locales/cs/auth.json';
import csPages from './locales/cs/pages.json';
import csMessages from './locales/cs/messages.json';

// Import English translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enPages from './locales/en/pages.json';
import enMessages from './locales/en/messages.json';

const resources = {
  cs: {
    common: csCommon,
    auth: csAuth,
    pages: csPages,
    messages: csMessages,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    pages: enPages,
    messages: enMessages,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'cs', // Default to Czech
    defaultNS: 'common',
    ns: ['common', 'auth', 'pages', 'messages'],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
