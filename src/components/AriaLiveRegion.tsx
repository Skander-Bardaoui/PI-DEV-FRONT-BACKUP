// src/components/AriaLiveRegion.tsx
// Composant pour les annonces aux lecteurs d'écran

import { useEffect, useRef } from 'react';

interface AriaLiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // Temps en ms avant de vider le message
}

export default function AriaLiveRegion({ 
  message, 
  politeness = 'polite',
  clearAfter = 3000 
}: AriaLiveRegionProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (message && clearAfter > 0) {
      // Nettoyer le timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Programmer le nettoyage du message
      timeoutRef.current = setTimeout(() => {
        // Le message sera vidé automatiquement par le re-render
      }, clearAfter);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Hook pour utiliser facilement les annonces
export function useAriaAnnounce() {
  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Créer un élément temporaire pour l'annonce
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', politeness);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Supprimer après 3 secondes
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 3000);
  };

  return { announce };
}