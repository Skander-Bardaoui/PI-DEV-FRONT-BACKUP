import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  fontSize: number;
  contrast: 'normal' | 'high' | 'dark';
  lineHeight: number;
  letterSpacing: number;
  cursorSize: 'normal' | 'large' | 'extra-large';
  readingGuide: boolean;
  textToSpeech: boolean;
  focusMode: boolean;
  reduceAnimations: boolean;
  highlightLinks: boolean;
  dyslexiaFont: boolean;
  fingerScroll: boolean;
  handScrollMode: boolean;
  cameraGestureControl: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
  isAccessibilityPanelOpen: boolean;
  toggleAccessibilityPanel: () => void;
  isFingerScrollActive: boolean;
  toggleFingerScroll: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 16,
  contrast: 'normal',
  lineHeight: 1.5,
  letterSpacing: 0,
  cursorSize: 'normal',
  readingGuide: false,
  textToSpeech: false,
  focusMode: false,
  reduceAnimations: false,
  highlightLinks: false,
  dyslexiaFont: false,
  fingerScroll: false,
  handScrollMode: false,
  cameraGestureControl: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          handScrollMode: parsed.handScrollMode ?? false,
          cameraGestureControl: parsed.cameraGestureControl ?? false,
          focusMode: parsed.focusMode ?? false,
        };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);
  const [isFingerScrollActive, setIsFingerScrollActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${settings.fontSize}px`;

    // Contrast
    root.setAttribute('data-contrast', settings.contrast);

    // Line height
    root.style.setProperty('--line-height', settings.lineHeight.toString());

    // Letter spacing
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);

    // Cursor size
    root.setAttribute('data-cursor', settings.cursorSize);

    // Hand Scroll Mode
    root.setAttribute('data-hand-scroll', (settings.handScrollMode ?? false).toString());

    // Reduce animations
    if (settings.reduceAnimations) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    // Highlight links
    root.setAttribute('data-highlight-links', settings.highlightLinks.toString());

    // Dyslexia font
    if (settings.dyslexiaFont) {
      root.style.fontFamily = 'OpenDyslexic, Arial, sans-serif';
    } else {
      root.style.fontFamily = '';
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const toggleAccessibilityPanel = () => {
    setIsAccessibilityPanelOpen((prev) => !prev);
  };

  const toggleFingerScroll = () => {
    setIsFingerScrollActive((prev) => !prev);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        isAccessibilityPanelOpen,
        toggleAccessibilityPanel,
        isFingerScrollActive,
        toggleFingerScroll,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
