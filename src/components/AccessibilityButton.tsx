import { Eye } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityButton() {
  const { toggleAccessibilityPanel } = useAccessibility();

  return (
    <button
      onClick={toggleAccessibilityPanel}
      className="accessibility-button fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      aria-label="Ouvrir le panneau d'accessibilité"
      title="Accessibilité"
    >
      <Eye className="h-6 w-6" />
    </button>
  );
}
