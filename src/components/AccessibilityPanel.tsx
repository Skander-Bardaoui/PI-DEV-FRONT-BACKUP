// src/components/AccessibilityPanel.tsx
import { X, Plus, Minus, RotateCcw, Eye, Type, Contrast, MousePointer, BookOpen, Zap, Link as LinkIcon, Hand, Volume2, Target, Palette } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useReadingMode } from '../hooks/useReadingMode';
import { useColorTheme, ColorTheme } from '../hooks/useColorTheme';

export default function AccessibilityPanel() {
  const {
    settings, updateSetting, resetSettings,
    isAccessibilityPanelOpen, toggleAccessibilityPanel,
    isFingerScrollActive, toggleFingerScroll,
  } = useAccessibility();

  const { isReadingMode, toggleReadingMode } = useReadingMode();
  const { colorTheme, changeColorTheme } = useColorTheme();

  if (!isAccessibilityPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity"
        onClick={toggleAccessibilityPanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-gradient-to-br from-white to-gray-50 shadow-2xl z-[101] overflow-y-auto accessibility-panel"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 shadow-sm z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 id="accessibility-title" className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              Accessibilité
            </h2>
            <button
              onClick={toggleAccessibilityPanel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-600"
              aria-label="Fermer le panneau d'accessibilité"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600">Personnalisez votre expérience de navigation</p>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Section: Taille du texte ──────────────────────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Type className="h-5 w-5 text-indigo-600" />
              </div>
              Taille du texte
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 2))}
                className="p-3 border-2 border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                aria-label="Diminuer la taille du texte"
              >
                <Minus className="h-5 w-5 text-gray-700" />
              </button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-indigo-600">{settings.fontSize}</div>
                <div className="text-xs text-gray-500 mt-1">pixels</div>
              </div>
              <button
                onClick={() => updateSetting('fontSize', Math.min(24, settings.fontSize + 2))}
                className="p-3 border-2 border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                aria-label="Augmenter la taille du texte"
              >
                <Plus className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* ── Section: Contraste ────────────────────────────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Contrast className="h-5 w-5 text-purple-600" />
              </div>
              Contraste
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['normal','high','dark'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => updateSetting('contrast', c)}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    settings.contrast === c
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  aria-pressed={settings.contrast === c}
                >
                  <div className={`text-sm font-semibold ${settings.contrast === c ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {c === 'normal' ? 'Normal' : c === 'high' ? 'Élevé' : 'Sombre'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Section: Thèmes de Couleur (Daltonisme) ───────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Palette className="h-5 w-5 text-pink-600" />
              </div>
              Thème de Couleur
            </label>
            <p className="text-xs text-gray-600 mb-4">Palettes adaptées au daltonisme</p>
            <div className="space-y-2">
              {([
                { value: 'normal', label: 'Normal', desc: 'Couleurs standard' },
                { value: 'protanopia', label: 'Protanopie', desc: 'Rouge-vert (rouge)' },
                { value: 'deuteranopia', label: 'Deutéranopie', desc: 'Rouge-vert (vert)' },
                { value: 'tritanopia', label: 'Tritanopie', desc: 'Bleu-jaune' },
                { value: 'monochrome', label: 'Monochrome', desc: 'Noir et blanc' },
              ] as const).map(theme => (
                <button
                  key={theme.value}
                  onClick={() => changeColorTheme(theme.value)}
                  className={`w-full p-3 border-2 rounded-xl transition-all text-left ${
                    colorTheme === theme.value
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  aria-pressed={colorTheme === theme.value}
                >
                  <div className={`text-sm font-semibold ${colorTheme === theme.value ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {theme.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{theme.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Section: Hauteur de ligne ─────────────────────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label htmlFor="line-height" className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              Hauteur de ligne
            </label>
            <input 
              id="line-height" 
              type="range" 
              min="1" 
              max="2.5" 
              step="0.1"
              value={settings.lineHeight}
              onChange={e => updateSetting('lineHeight', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="text-center text-lg font-bold text-indigo-600 mt-3">{settings.lineHeight.toFixed(1)}</div>
          </div>

          {/* ── Section: Espacement lettres ───────────────────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label htmlFor="letter-spacing" className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              Espacement des lettres
            </label>
            <input 
              id="letter-spacing" 
              type="range" 
              min="0" 
              max="5" 
              step="0.5"
              value={settings.letterSpacing}
              onChange={e => updateSetting('letterSpacing', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="text-center text-lg font-bold text-indigo-600 mt-3">{settings.letterSpacing}px</div>
          </div>

          {/* ── Section: Taille du curseur ────────────────────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MousePointer className="h-5 w-5 text-blue-600" />
              </div>
              Taille du curseur
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['normal','large','extra-large'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => updateSetting('cursorSize', s)}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    settings.cursorSize === s
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  aria-pressed={settings.cursorSize === s}
                >
                  <div className={`text-sm font-semibold ${settings.cursorSize === s ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {s === 'normal' ? 'Normal' : s === 'large' ? 'Grand' : 'Très grand'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Section: Options avancées ─────────────────────────────── */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Options avancées</h3>
            <div className="space-y-3">
              <ModernToggle
                icon={Target}
                label="Mode Simplifié"
                description="Interface ultra-simple avec gros boutons et moins d'options"
                checked={settings.simplifiedMode}
                onChange={v => updateSetting('simplifiedMode', v)}
                color="teal"
              />
              <ModernToggle
                icon={Target}
                label="Mode Focus"
                description="Assombrit tout sauf l'élément actif"
                checked={settings.focusMode}
                onChange={v => updateSetting('focusMode', v)}
                color="orange"
              />
              <ModernToggle
                icon={BookOpen}
                label="Mode Lecture"
                description="Simplifie la page pour une lecture confortable"
                checked={isReadingMode}
                onChange={toggleReadingMode}
                color="yellow"
              />
              <ModernToggle
                icon={Volume2}
                label="Lecteur vocal"
                description="Lit le texte sélectionné à voix haute"
                checked={settings.textToSpeech}
                onChange={v => updateSetting('textToSpeech', v)}
                color="purple"
              />
              <ModernToggle
                icon={Hand}
                label="Contrôle par geste"
                description="Navigation avec les mains"
                checked={isFingerScrollActive}
                onChange={toggleFingerScroll}
                color="blue"
              />
              <ModernToggle
                icon={BookOpen}
                label="Police dyslexie"
                description="Police adaptée pour la dyslexie"
                checked={settings.dyslexiaFont}
                onChange={v => updateSetting('dyslexiaFont', v)}
                color="green"
              />
              <ModernToggle
                icon={LinkIcon}
                label="Surligner les liens"
                description="Rend les liens plus visibles"
                checked={settings.highlightLinks}
                onChange={v => updateSetting('highlightLinks', v)}
                color="indigo"
              />
              <ModernToggle
                icon={Zap}
                label="Réduire les animations"
                description="Moins de mouvements à l'écran"
                checked={settings.reduceAnimations}
                onChange={v => updateSetting('reduceAnimations', v)}
                color="yellow"
              />
            </div>
          </div>

          {/* ── Bouton Reset ──────────────────────────────────────────── */}
          <button
            onClick={resetSettings}
            className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl transition-all font-semibold shadow-sm"
          >
            <RotateCcw className="h-5 w-5" />
            Réinitialiser tous les paramètres
          </button>
        </div>
      </div>
    </>
  );
}

interface ModernToggleProps {
  icon:         React.ComponentType<{ className?: string }>;
  label:        string;
  description:  string;
  checked:      boolean;
  onChange:     (checked: boolean) => void;
  color:        'orange' | 'purple' | 'blue' | 'green' | 'indigo' | 'yellow' | 'teal' | 'pink';
}

function ModernToggle({ icon: Icon, label, description, checked, onChange, color }: ModernToggleProps) {
  const colorClasses = {
    orange:  { bg: 'bg-orange-100',  text: 'text-orange-600',  border: 'border-orange-500',  activeBg: 'bg-orange-500'  },
    purple:  { bg: 'bg-purple-100',  text: 'text-purple-600',  border: 'border-purple-500',  activeBg: 'bg-purple-500'  },
    blue:    { bg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-500',    activeBg: 'bg-blue-500'    },
    green:   { bg: 'bg-green-100',   text: 'text-green-600',   border: 'border-green-500',   activeBg: 'bg-green-500'   },
    indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-600',  border: 'border-indigo-500',  activeBg: 'bg-indigo-500'  },
    yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-600',  border: 'border-yellow-500',  activeBg: 'bg-yellow-500'  },
    teal:    { bg: 'bg-teal-100',    text: 'text-teal-600',    border: 'border-teal-500',    activeBg: 'bg-teal-500'    },
    pink:    { bg: 'bg-pink-100',    text: 'text-pink-600',    border: 'border-pink-500',    activeBg: 'bg-pink-500'    },
  };

  const colors = colorClasses[color];

  return (
    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
      checked 
        ? `${colors.border} ${colors.bg} shadow-md` 
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}>
      <div className={`p-2 rounded-lg ${checked ? colors.bg : 'bg-gray-100'}`}>
        <Icon className={`h-5 w-5 ${checked ? colors.text : 'text-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${checked ? colors.text : 'text-gray-700'}`}>
          {label}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {description}
        </div>
      </div>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-12 h-6 rounded-full transition-all ${
          checked ? colors.activeBg : 'bg-gray-300'
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </div>
      </div>
    </label>
  );
}