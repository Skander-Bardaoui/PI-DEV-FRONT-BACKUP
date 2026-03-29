// src/components/LanguageSwitcher.tsx
// Switcher de langue FR/EN — fonctionne partout (authentifié ou non)
// Usage : <LanguageSwitcher /> — à placer dans la navbar ET sur les pages publiques

import { useTranslation } from 'react-i18next';

interface Props {
  variant?: 'navbar'    // compact — pour la navbar
           | 'page'     // boutons côte à côte — pour login, portail, etc.
           | 'minimal'; // juste le texte FR / EN
}

export default function LanguageSwitcher({ variant = 'navbar' }: Props) {
  const { i18n } = useTranslation();
  const current  = i18n.language.startsWith('en') ? 'en' : 'fr';

  const toggle = () => i18n.changeLanguage(current === 'fr' ? 'en' : 'fr');
  const switchTo = (lang: string) => { if (lang !== current) i18n.changeLanguage(lang); };

  // ── Variant navbar : bouton compact avec drapeau ──────────────────────────
  if (variant === 'navbar') {
    return (
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600"
        title={current === 'fr' ? 'Switch to English' : 'Passer en français'}
      >
        <span style={{ fontSize: 16 }}>{current === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
        <span className="hidden sm:inline">{current === 'fr' ? 'FR' : 'EN'}</span>
      </button>
    );
  }

  // ── Variant page : deux boutons côte à côte ───────────────────────────────
  if (variant === 'page') {
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {(['fr', 'en'] as const).map(lang => (
          <button
            key={lang}
            onClick={() => switchTo(lang)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              current === lang
                ? 'bg-white shadow-sm text-indigo-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span style={{ fontSize: 16 }}>{lang === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
            {lang === 'fr' ? 'Français' : 'English'}
          </button>
        ))}
      </div>
    );
  }

  // ── Variant minimal : FR | EN ─────────────────────────────────────────────
  return (
    <div className="flex items-center gap-1 text-sm">
      {(['fr', 'en'] as const).map((lang, i) => (
        <span key={lang} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">|</span>}
          <button
            onClick={() => switchTo(lang)}
            className={`font-medium transition-colors ${
              current === lang
                ? 'text-indigo-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}