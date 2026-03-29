// src/components/FocusModeManager.tsx
// Gestionnaire global du mode focus

import { useAccessibility } from '../context/AccessibilityContext';
import { useFocusMode } from '../hooks/useFocusMode';
import { Target } from 'lucide-react';

export default function FocusModeManager() {
  const { settings } = useAccessibility();

  useFocusMode({
    enabled: settings.focusMode || false,
    overlayOpacity: 0.85,
    highlightPadding: 20,
    fontSizeIncrease: 2,
  });

  // Indicateur visuel quand le mode focus est actif
  if (!settings.focusMode) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: 24,
        fontSize: 12,
        fontWeight: 600,
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
        zIndex: 9997,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        marginBottom: settings.textToSpeech ? 50 : 0,
      }}
    >
      <Target size={16} />
      Mode Focus actif
    </div>
  );
}
