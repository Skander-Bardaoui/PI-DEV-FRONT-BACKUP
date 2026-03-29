// src/context/AccessibilityContext.tsx
// Ajouter zoom et scrollToZoom dans le type Settings
// et l'effet qui applique le zoom + écoute Ctrl+Scroll

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AccessibilitySettings {
  fontSize:         number;
  contrast:         'normal' | 'high' | 'dark';
  lineHeight:       number;
  letterSpacing:    number;
  cursorSize:       'normal' | 'large' | 'extra-large';
  dyslexiaFont:     boolean;
  highlightLinks:   boolean;
  reduceAnimations: boolean;
  // ── Nouveaux champs zoom ──────────────────────────────────────────────────
  zoom:             number;   // 50–200, défaut 100
  scrollToZoom:     boolean;  // Ctrl+Scroll active le zoom
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize:         16,
  contrast:         'normal',
  lineHeight:       1.5,
  letterSpacing:    0,
  cursorSize:       'normal',
  dyslexiaFont:     false,
  highlightLinks:   false,
  reduceAnimations: false,
  zoom:             100,
  scrollToZoom:     false,
};

interface AccessibilityContextType {
  settings:                  AccessibilitySettings;
  updateSetting:             <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings:             () => void;
  isAccessibilityPanelOpen:  boolean;
  toggleAccessibilityPanel:  () => void;
  isFingerScrollActive:      boolean;
  toggleFingerScroll:        () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings,                setSettings]                = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const [isFingerScrollActive,     setIsFingerScrollActive]     = useState(false);

  // ── Persistance ───────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // ── Appliquer les styles sur <html> ───────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    body.style.fontSize = `${settings.fontSize}px`;

    // Contraste
    root.setAttribute('data-contrast',         settings.contrast);
    root.setAttribute('data-cursor',           settings.cursorSize);
    root.setAttribute('data-highlight-links',  String(settings.highlightLinks));
    root.setAttribute('data-reduce-animations',String(settings.reduceAnimations));

    // Hauteur de ligne & espacement
    root.style.setProperty('--line-height',    String(settings.lineHeight));
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);
    body.style.lineHeight    = String(settings.lineHeight);
    body.style.letterSpacing = `${settings.letterSpacing}px`;

    // Police dyslexie
    body.style.fontFamily = settings.dyslexiaFont
      ? "'OpenDyslexic', sans-serif"
      : '';

    // Animations
    root.style.setProperty(
      '--animation-duration',
      settings.reduceAnimations ? '0.01ms' : '',
    );

    // ── ZOOM ────────────────────────────────────────────────────────────────
    applyZoom(settings.zoom);

  }, [settings]);

  // ── Fonction zoom fluide ───────────────────────────────────────────────────
  const applyZoom = (zoom: number) => {
    const clamped = Math.max(50, Math.min(200, zoom));
    // Utiliser transform sur le body pour un zoom fluide
    // On préfère zoom CSS natif car il préserve le layout
    document.body.style.zoom = `${clamped}%`;
    // Fallback pour Firefox (ne supporte pas CSS zoom)
    if (typeof document.body.style.zoom === 'undefined' || document.body.style.zoom === '') {
      document.body.style.transform       = `scale(${clamped / 100})`;
      document.body.style.transformOrigin = 'top left';
      document.body.style.width           = `${10000 / clamped}%`;
    }
  };

  // ── Ctrl + Scroll pour zoomer ──────────────────────────────────────────────
  useEffect(() => {
    if (!settings.scrollToZoom) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const delta   = e.deltaY > 0 ? -10 : 10;
      const current = settings.zoom ?? 100;
      const next    = Math.max(50, Math.min(200, current + delta));

      // Mettre à jour de façon fluide
      setSettings(prev => {
        const updated = { ...prev, zoom: next };
        localStorage.setItem('accessibility-settings', JSON.stringify(updated));
        applyZoom(next);
        return updated;
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [settings.scrollToZoom, settings.zoom]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    document.body.style.zoom           = '';
    document.body.style.transform      = '';
    document.body.style.transformOrigin= '';
    document.body.style.width          = '';
  }, []);

  const toggleAccessibilityPanel = useCallback(() => {
    setIsAccessibilityPanelOpen(p => !p);
  }, []);

  const toggleFingerScroll = useCallback(() => {
    setIsFingerScrollActive(p => !p);
  }, []);

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      isAccessibilityPanelOpen,
      toggleAccessibilityPanel,
      isFingerScrollActive,
      toggleFingerScroll,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}