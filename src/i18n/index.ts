// src/i18n/index.ts
// Configuration react-i18next
// Installation : npm install react-i18next i18next

import i18n           from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr';
import en from './locales/en';

const STORAGE_KEY = 'app-language';

// Langue par défaut : lire depuis localStorage, sinon navigateur, sinon français
const savedLang = localStorage.getItem(STORAGE_KEY);
const browserLang = navigator.language.startsWith('en') ? 'en' : 'fr';
const defaultLang = savedLang ?? browserLang;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng:           defaultLang,
    fallbackLng:   'fr',
    interpolation: { escapeValue: false },
    // Pas de détection auto — on gère manuellement
    detection:     undefined,
  });

// Persister le choix de langue
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.setAttribute('lang', lng);
});

// Appliquer la langue au chargement
document.documentElement.setAttribute('lang', defaultLang);

export default i18n;

// Hook utilitaire
export { useTranslation } from 'react-i18next';