import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import itTranslation from './locales/it.json';
import ptTranslation from './locales/pt.json';
import ruTranslation from './locales/ru.json';
import zhTranslation from './locales/zh.json';
import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';
import arTranslation from './locales/ar.json';
import hiTranslation from './locales/hi.json';
import trTranslation from './locales/tr.json';
import nlTranslation from './locales/nl.json';
import plTranslation from './locales/pl.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
      fr: { translation: frTranslation },
      de: { translation: deTranslation },
      it: { translation: itTranslation },
      pt: { translation: ptTranslation },
      ru: { translation: ruTranslation },
      zh: { translation: zhTranslation },
      ja: { translation: jaTranslation },
      ko: { translation: koTranslation },
      ar: { translation: arTranslation },
      hi: { translation: hiTranslation },
      tr: { translation: trTranslation },
      nl: { translation: nlTranslation },
      pl: { translation: plTranslation }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n; 