import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

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
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.split('-')[0], // Get language code from device
    fallbackLng: 'cs',
    defaultNS: 'common',
    ns: ['common', 'auth', 'pages', 'messages'],

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
