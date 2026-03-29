// src/hooks/useFocusMode.ts
// Hook pour le mode focus - réduit les distractions

import { useEffect, useCallback, useRef } from 'react';

interface UseFocusModeOptions {
  enabled?: boolean;
  overlayOpacity?: number; // Opacité de l'overlay (0 à 1, défaut: 0.85)
  highlightPadding?: number; // Padding autour de l'élément actif (défaut: 20)
  fontSizeIncrease?: number; // Augmentation de la taille de police (défaut: 2)
}

export function useFocusMode(options: UseFocusModeOptions = {}) {
  const {
    enabled = false,
    overlayOpacity = 0.85,
    highlightPadding = 20,
    fontSizeIncrease = 2,
  } = options;

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const currentFocusedElement = useRef<HTMLElement | null>(null);

  // Créer l'overlay et le highlight
  const createOverlays = useCallback(() => {
    if (overlayRef.current || !enabled) return;

    // Overlay sombre
    const overlay = document.createElement('div');
    overlay.id = 'focus-mode-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, ${overlayOpacity});
      pointer-events: none;
      z-index: 9998;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    // Zone de highlight (découpe dans l'overlay)
    const highlight = document.createElement('div');
    highlight.id = 'focus-mode-highlight';
    highlight.style.cssText = `
      position: fixed;
      border: 3px solid #6366f1;
      border-radius: 12px;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 0 0 30px rgba(99, 102, 241, 0.3);
      transition: all 0.2s ease;
      display: none;
    `;
    document.body.appendChild(highlight);
    highlightRef.current = highlight;
  }, [enabled, overlayOpacity]);

  // Supprimer les overlays
  const removeOverlays = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
    if (highlightRef.current) {
      highlightRef.current.remove();
      highlightRef.current = null;
    }
    if (currentFocusedElement.current) {
      currentFocusedElement.current.style.position = '';
      currentFocusedElement.current.style.zIndex = '';
      currentFocusedElement.current.style.fontSize = '';
      currentFocusedElement.current = null;
    }
  }, []);

  // Mettre à jour la position du highlight
  const updateHighlight = useCallback((element: HTMLElement) => {
    if (!highlightRef.current || !enabled) return;

    const rect = element.getBoundingClientRect();
    const highlight = highlightRef.current;

    highlight.style.display = 'block';
    highlight.style.top = `${rect.top - highlightPadding}px`;
    highlight.style.left = `${rect.left - highlightPadding}px`;
    highlight.style.width = `${rect.width + highlightPadding * 2}px`;
    highlight.style.height = `${rect.height + highlightPadding * 2}px`;

    // Augmenter la taille de police de l'élément actif
    if (currentFocusedElement.current && currentFocusedElement.current !== element) {
      currentFocusedElement.current.style.fontSize = '';
      currentFocusedElement.current.style.position = '';
      currentFocusedElement.current.style.zIndex = '';
    }

    const currentFontSize = window.getComputedStyle(element).fontSize;
    const newFontSize = parseFloat(currentFontSize) + fontSizeIncrease;
    element.style.fontSize = `${newFontSize}px`;
    element.style.position = 'relative';
    element.style.zIndex = '10000';

    currentFocusedElement.current = element;
  }, [enabled, highlightPadding, fontSizeIncrease]);

  // Cacher le highlight
  const hideHighlight = useCallback(() => {
    if (highlightRef.current) {
      highlightRef.current.style.display = 'none';
    }
    if (currentFocusedElement.current) {
      currentFocusedElement.current.style.fontSize = '';
      currentFocusedElement.current.style.position = '';
      currentFocusedElement.current.style.zIndex = '';
      currentFocusedElement.current = null;
    }
  }, []);

  // Gestionnaires d'événements
  const handleFocus = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (target && enabled) {
      updateHighlight(target);
    }
  }, [enabled, updateHighlight]);

  const handleBlur = useCallback(() => {
    if (enabled) {
      hideHighlight();
    }
  }, [enabled, hideHighlight]);

  const handleMouseEnter = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Vérifier si c'est un élément interactif
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.getAttribute('role') === 'button' ||
      target.getAttribute('role') === 'link' ||
      target.classList.contains('clickable');

    if (isInteractive && enabled) {
      updateHighlight(target);
    }
  }, [enabled, updateHighlight]);

  const handleMouseLeave = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.getAttribute('role') === 'button' ||
      target.getAttribute('role') === 'link';

    if (isInteractive && enabled) {
      hideHighlight();
    }
  }, [enabled, hideHighlight]);

  // Gérer le scroll pour mettre à jour la position
  const handleScroll = useCallback(() => {
    if (currentFocusedElement.current && enabled) {
      updateHighlight(currentFocusedElement.current);
    }
  }, [enabled, updateHighlight]);

  // Initialiser et nettoyer
  useEffect(() => {
    if (enabled) {
      createOverlays();

      // Ajouter les écouteurs
      document.addEventListener('focusin', handleFocus);
      document.addEventListener('focusout', handleBlur);
      document.addEventListener('mouseover', handleMouseEnter);
      document.addEventListener('mouseout', handleMouseLeave);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);

      return () => {
        document.removeEventListener('focusin', handleFocus);
        document.removeEventListener('focusout', handleBlur);
        document.removeEventListener('mouseover', handleMouseEnter);
        document.removeEventListener('mouseout', handleMouseLeave);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
        removeOverlays();
      };
    } else {
      removeOverlays();
    }
  }, [enabled, createOverlays, removeOverlays, handleFocus, handleBlur, handleMouseEnter, handleMouseLeave, handleScroll]);

  return {
    enabled,
  };
}
