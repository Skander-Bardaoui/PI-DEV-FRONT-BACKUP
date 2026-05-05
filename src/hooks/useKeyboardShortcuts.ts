// src/hooks/useKeyboardShortcuts.ts
// Hook pour gérer les raccourcis clavier globaux

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  // Définir tous les raccourcis
  const shortcuts: KeyboardShortcut[] = [
    // Navigation principale
    {
      key: '1',
      alt: true,
      action: () => navigate('/app/dashboard'),
      description: 'Aller au Dashboard',
    },
    {
      key: '2',
      alt: true,
      action: () => navigate('/app/purchases/orders'),
      description: 'Aller aux Achats',
    },
    {
      key: '3',
      alt: true,
      action: () => navigate('/app/sales/dashboard'),
      description: 'Aller aux Ventes',
    },
    {
      key: '4',
      alt: true,
      action: () => navigate('/app/stock'),
      description: 'Aller au Stock',
    },
    {
      key: '5',
      alt: true,
      action: () => navigate('/app/treasury/accounts'),
      description: 'Aller à la Trésorerie',
    },
    // Recherche globale
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Focus sur le champ de recherche dans le header
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Recherche globale',
    },
    // Fermer modal/panel avec Escape (géré séparément)
  ];

  // Gestionnaire d'événements clavier
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorer si l'utilisateur est en train de taper dans un champ
    const target = event.target as HTMLElement;
    const isTyping = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Exception: Ctrl+K fonctionne même dans les champs
    if (!(event.ctrlKey && event.key === 'k') && isTyping) {
      return;
    }

    // Chercher le raccourci correspondant
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        
        // Afficher une notification visuelle
        showShortcutNotification(shortcut.description);
        break;
      }
    }

    // Gestion spéciale de la touche Escape
    if (event.key === 'Escape') {
      handleEscape();
    }
  }, [navigate, shortcuts]);

  // Fonction pour fermer les modals/panels avec Escape
  const handleEscape = useCallback(() => {
    // Fermer le panel d'accessibilité
    const accessibilityPanel = document.querySelector('[role="dialog"][aria-labelledby="accessibility-title"]');
    if (accessibilityPanel) {
      const closeButton = accessibilityPanel.querySelector('button[aria-label*="Fermer"]') as HTMLButtonElement;
      closeButton?.click();
      return;
    }

    // Fermer les modals (chercher les éléments avec role="dialog")
    const modals = document.querySelectorAll('[role="dialog"]:not([aria-labelledby="accessibility-title"])');
    if (modals.length > 0) {
      const lastModal = modals[modals.length - 1];
      const closeButton = lastModal.querySelector('button[aria-label*="Fermer"], button[aria-label*="fermer"]') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
        return;
      }
    }

    // Fermer les dropdowns/menus ouverts
    const openMenus = document.querySelectorAll('[role="menu"][aria-hidden="false"]');
    openMenus.forEach(menu => {
      const button = document.querySelector(`[aria-controls="${menu.id}"]`) as HTMLButtonElement;
      button?.click();
    });
  }, []);

  // Afficher une notification visuelle du raccourci utilisé
  const showShortcutNotification = useCallback((description: string) => {
    const notification = document.createElement('div');
    notification.textContent = description;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      z-index: 10000;
      animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
      pointer-events: none;
    `;

    // Ajouter les animations CSS
    if (!document.getElementById('keyboard-shortcuts-styles')) {
      const style = document.createElement('style');
      style.id = 'keyboard-shortcuts-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Supprimer après 3 secondes
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }, []);

  // Ajouter l'écouteur d'événements
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Retourner la liste des raccourcis pour affichage dans l'aide
  return {
    shortcuts,
  };
}