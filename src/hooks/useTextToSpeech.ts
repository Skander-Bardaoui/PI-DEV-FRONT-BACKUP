// src/hooks/useTextToSpeech.ts
// Hook pour le lecteur d'écran vocal (Text-to-Speech)

import { useCallback, useEffect, useRef } from 'react';

interface UseTextToSpeechOptions {
  enabled?: boolean;
  rate?: number; // Vitesse de lecture (0.1 à 10, défaut: 1)
  pitch?: number; // Tonalité (0 à 2, défaut: 1)
  volume?: number; // Volume (0 à 1, défaut: 1)
  lang?: string; // Langue (défaut: 'fr-FR')
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    enabled = true,
    rate = 1,
    pitch = 1,
    volume = 1,
    lang = 'fr-FR',
  } = options;

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);

  // Fonction pour parler
  const speak = useCallback((text: string) => {
    if (!enabled || !text || !window.speechSynthesis) return;

    // Arrêter toute lecture en cours
    window.speechSynthesis.cancel();

    // Nettoyer le texte (enlever les emojis et caractères spéciaux)
    const cleanText = text
      .replace(/[^\w\s.,!?;:àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ-]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = lang;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [enabled, rate, pitch, volume, lang]);

  // Fonction pour arrêter
  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  // Fonction pour mettre en pause
  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeakingRef.current) {
      window.speechSynthesis.pause();
    }
  }, []);

  // Fonction pour reprendre
  const resume = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }, []);

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking: isSpeakingRef.current,
  };
}
