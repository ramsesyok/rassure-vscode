import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';
import en from './locales/en.json';

function detectLocale(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="rassure-lang"]');
  const lang = meta?.content ?? navigator.language ?? 'en';
  return lang.startsWith('ja') ? 'ja' : 'en';
}

i18next
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: detectLocale(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18next;
