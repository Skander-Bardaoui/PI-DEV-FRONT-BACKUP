// src/components/KeyboardShortcutsHelp.tsx
// Modal d'aide pour les raccourcis clavier

import { X, Keyboard } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: Props) {
  // Gérer le focus trap et l'annonce d'ouverture
  useEffect(() => {
    if (isOpen) {
      // Annoncer l'ouverture du modal aux lecteurs d'écran
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = 'Modal d\'aide des raccourcis clavier ouverte';
      document.body.appendChild(announcer);

      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);

      // Focus sur le modal
      const modal = document.getElementById('shortcuts-modal');
      modal?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Alt', '1'], description: 'Aller au Dashboard' },
        { keys: ['Alt', '2'], description: 'Aller aux Achats' },
        { keys: ['Alt', '3'], description: 'Aller aux Ventes' },
        { keys: ['Alt', '4'], description: 'Aller au Stock' },
        { keys: ['Alt', '5'], description: 'Aller à la Trésorerie' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Activer la recherche' },
        { keys: ['Échap'], description: 'Fermer modal/panel (touche en haut à gauche du clavier)' },
      ],
    },
    {
      category: 'Navigation au clavier',
      items: [
        { keys: ['Tab'], description: 'Élément suivant' },
        { keys: ['Shift', 'Tab'], description: 'Élément précédent' },
        { keys: ['Enter'], description: 'Activer/Cliquer' },
        { keys: ['Space'], description: 'Cocher/Décocher' },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        id="shortcuts-modal"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-[101] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-describedby="shortcuts-description"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 id="shortcuts-title" className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Keyboard className="h-6 w-6 text-indigo-600" />
              </div>
              Raccourcis Clavier
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Fermer l'aide des raccourcis clavier"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <p id="shortcuts-description" className="text-sm text-gray-600 mt-2">
            Utilisez ces raccourcis pour naviguer plus rapidement
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">
                {section.category}
              </h3>
              <div className="space-y-2" role="list" aria-label={`Raccourcis ${section.category}`}>
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    role="listitem"
                  >
                    <span className="text-sm text-gray-700">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          <kbd className="px-3 py-1.5 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold text-gray-700 shadow-sm min-w-[40px] text-center">
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="text-gray-400 text-xs font-bold">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Info supplémentaire */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-900">
              <strong>💡 Astuce:</strong> Tous les éléments interactifs sont accessibles avec la touche <kbd className="px-2 py-1 bg-white border border-indigo-300 rounded text-xs font-bold">Tab</kbd>. 
              Utilisez <kbd className="px-2 py-1 bg-white border border-indigo-300 rounded text-xs font-bold">Enter</kbd> ou <kbd className="px-2 py-1 bg-white border border-indigo-300 rounded text-xs font-bold">Space</kbd> pour activer les boutons.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}