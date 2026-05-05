// src/components/ReadingModeToggle.tsx
// Bouton pour activer/désactiver le mode lecture

import { BookOpen, X } from 'lucide-react';
import { useReadingMode } from '@/hooks/useReadingMode';

export default function ReadingModeToggle() {
  const { isReadingMode, toggleReadingMode } = useReadingMode();

  return (
    <button
      onClick={toggleReadingMode}
      className="reading-mode-toggle"
      aria-label={isReadingMode ? 'Désactiver le mode lecture' : 'Activer le mode lecture'}
      aria-pressed={isReadingMode}
      title={isReadingMode ? 'Quitter le mode lecture' : 'Activer le mode lecture'}
    >
      {isReadingMode ? (
        <>
          <X className="inline-block h-5 w-5 mr-2 reading-mode-icon" aria-hidden="true" />
          Quitter la lecture
        </>
      ) : (
        <>
          <BookOpen className="inline-block h-5 w-5 mr-2 reading-mode-icon" aria-hidden="true" />
          Mode lecture
        </>
      )}
    </button>
  );
}