import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt', 'fr', 'de', 'pl', 'bg', 'ro'],
    load: 'languageOnly', // Simplifica 'es-ES', 'en-US', 'pt-BR', etc. a su código base ('es', 'en', 'pt')
    nonExplicitSupportedLngs: true, // Permite que variantes como 'pt-BR' o 'en-US' coincidan con 'pt' o 'en'
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
