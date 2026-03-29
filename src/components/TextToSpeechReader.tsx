// src/components/TextToSpeechReader.tsx
// Composant global pour le lecteur d'écran vocal

import { useEffect, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export default function TextToSpeechReader() {
  const { settings } = useAccessibility();
  const { speak, stop } = useTextToSpeech({
    enabled: settings.textToSpeech,
    rate: 1,
    pitch: 1,
    volume: 1,
    lang: 'fr-FR',
  });

  // Fonction pour extraire le texte d'un élément
  const getTextContent = useCallback((element: HTMLElement): string => {
    // Ignorer les éléments cachés
    if (element.style.display === 'none' || element.style.visibility === 'hidden') {
      return '';
    }

    // Pour les boutons, inputs, etc., utiliser aria-label ou title en priorité
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const title = element.getAttribute('title');
    if (title) return title;

    const placeholder = element.getAttribute('placeholder');
    if (placeholder) return placeholder;

    // Pour les éléments avec du texte
    return element.textContent?.trim() || '';
  }, []);

  // Gestionnaire pour la sélection de texte
  const handleTextSelection = useCallback(() => {
    if (!settings.textToSpeech) return;

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      speak(selectedText);
    }
  }, [settings.textToSpeech, speak]);

  // Gestionnaire pour le survol des éléments interactifs
  const handleMouseOver = useCallback((event: MouseEvent) => {
    if (!settings.textToSpeech) return;

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
      target.classList.contains('clickable') ||
      target.hasAttribute('onclick');

    if (isInteractive) {
      const text = getTextContent(target);
      if (text) {
        // Ajouter un préfixe selon le type d'élément
        let prefix = '';
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
          prefix = 'Bouton : ';
        } else if (target.tagName === 'A' || target.getAttribute('role') === 'link') {
          prefix = 'Lien : ';
        } else if (target.tagName === 'INPUT') {
          const inputType = target.getAttribute('type') || 'text';
          prefix = `Champ ${inputType} : `;
        }

        speak(prefix + text);
      }
    }
  }, [settings.textToSpeech, speak, getTextContent]);

  // Gestionnaire pour quitter un élément (arrêter la lecture)
  const handleMouseOut = useCallback((event: MouseEvent) => {
    if (!settings.textToSpeech) return;

    const target = event.target as HTMLElement;
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.getAttribute('role') === 'button' ||
      target.getAttribute('role') === 'link';

    if (isInteractive) {
      stop();
    }
  }, [settings.textToSpeech, stop]);

  // Gestionnaire pour le focus (navigation au clavier)
  const handleFocus = useCallback((event: FocusEvent) => {
    if (!settings.textToSpeech) return;

    const target = event.target as HTMLElement;
    const text = getTextContent(target);

    if (text) {
      let prefix = '';
      if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
        prefix = 'Bouton : ';
      } else if (target.tagName === 'A' || target.getAttribute('role') === 'link') {
        prefix = 'Lien : ';
      } else if (target.tagName === 'INPUT') {
        const inputType = target.getAttribute('type') || 'text';
        prefix = `Champ ${inputType} : `;
      }

      speak(prefix + text);
    }
  }, [settings.textToSpeech, speak, getTextContent]);

  // Ajouter les écouteurs d'événements
  useEffect(() => {
    if (!settings.textToSpeech) {
      stop();
      return;
    }

    // Sélection de texte
    document.addEventListener('mouseup', handleTextSelection);

    // Survol des éléments
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // Focus (navigation clavier)
    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('focusin', handleFocus);
      stop();
    };
  }, [settings.textToSpeech, handleTextSelection, handleMouseOver, handleMouseOut, handleFocus, stop]);

  // Indicateur visuel quand le TTS est actif
  if (!settings.textToSpeech) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 24,
        fontSize: 12,
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
      Lecteur vocal actif
    </div>
  );
}
