// src/hooks/useColorTheme.ts
// Hook pour gérer les thèmes de couleur adaptés au daltonisme

import { useState, useEffect } from 'react';

export type ColorTheme = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';

// Fonction pour changer les couleurs des éléments
const changeElementColors = (colors: { primary: string; success: string; danger: string; warning: string }) => {
  // Boutons primaires (indigo)
  document.querySelectorAll('.bg-indigo-600, .bg-indigo-500').forEach(el => {
    (el as HTMLElement).style.backgroundColor = colors.primary;
  });
  
  document.querySelectorAll('.text-indigo-600').forEach(el => {
    (el as HTMLElement).style.color = colors.primary;
  });
  
  document.querySelectorAll('.border-indigo-500, .border-indigo-600').forEach(el => {
    (el as HTMLElement).style.borderColor = colors.primary;
  });
  
  // Boutons de succès (vert)
  document.querySelectorAll('.bg-green-600, .bg-green-500').forEach(el => {
    (el as HTMLElement).style.backgroundColor = colors.success;
  });
  
  document.querySelectorAll('.text-green-600, .text-green-500').forEach(el => {
    (el as HTMLElement).style.color = colors.success;
  });
  
  // Boutons de danger (rouge)
  document.querySelectorAll('.bg-red-600, .bg-red-500').forEach(el => {
    (el as HTMLElement).style.backgroundColor = colors.danger;
  });
  
  document.querySelectorAll('.text-red-600, .text-red-500').forEach(el => {
    (el as HTMLElement).style.color = colors.danger;
  });
  
  // Boutons d'avertissement (jaune)
  document.querySelectorAll('.bg-yellow-600, .bg-yellow-500').forEach(el => {
    (el as HTMLElement).style.backgroundColor = colors.warning;
  });
  
  document.querySelectorAll('.text-yellow-600, .text-yellow-500').forEach(el => {
    (el as HTMLElement).style.color = colors.warning;
  });
};

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('normal');

  useEffect(() => {
    // Charger le thème depuis localStorage
    const saved = localStorage.getItem('colorTheme') as ColorTheme;
    if (saved && ['normal', 'protanopia', 'deuteranopia', 'tritanopia', 'monochrome'].includes(saved)) {
      setColorTheme(saved);
      applyColorTheme(saved);
    }
    
    // Observer les changements du DOM pour appliquer les couleurs aux nouveaux éléments
    const observer = new MutationObserver(() => {
      if (saved && saved !== 'normal') {
        const themes = {
          protanopia: { primary: '#0ea5e9', success: '#0891b2', danger: '#f97316', warning: '#eab308' },
          deuteranopia: { primary: '#3b82f6', success: '#06b6d4', danger: '#f59e0b', warning: '#eab308' },
          tritanopia: { primary: '#ec4899', success: '#10b981', danger: '#ef4444', warning: '#f97316' },
          monochrome: { primary: '#374151', success: '#6b7280', danger: '#1f2937', warning: '#9ca3af' },
        };
        changeElementColors(themes[saved]);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  const changeColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
    localStorage.setItem('colorTheme', theme);
    applyColorTheme(theme);
  };

  const applyColorTheme = (theme: ColorTheme) => {
    const root = document.documentElement;
    
    // Retirer tous les thèmes existants
    root.classList.remove('theme-protanopia', 'theme-deuteranopia', 'theme-tritanopia', 'theme-monochrome');
    
    // Appliquer le nouveau thème
    if (theme !== 'normal') {
      root.classList.add(`theme-${theme}`);
      
      // Appliquer les couleurs directement via CSS variables
      applyThemeColors(theme);
    } else {
      // Restaurer les couleurs normales
      resetThemeColors();
    }
    
    // Annoncer aux lecteurs d'écran
    const themeNames: Record<ColorTheme, string> = {
      normal: 'Normal',
      protanopia: 'Protanopie (rouge-vert)',
      deuteranopia: 'Deutéranopie (rouge-vert)',
      tritanopia: 'Tritanopie (bleu-jaune)',
      monochrome: 'Monochrome (noir et blanc)',
    };
    
    announceToScreenReader(`Thème de couleur changé: ${themeNames[theme]}`);
    console.log(`🎨 Thème de couleur: ${themeNames[theme]}`);
  };

  const applyThemeColors = (theme: ColorTheme) => {
    const root = document.documentElement;
    
    const themes = {
      protanopia: {
        primary: '#0ea5e9',    // Bleu ciel
        success: '#0891b2',    // Cyan
        danger: '#f97316',     // Orange
        warning: '#eab308',    // Jaune
      },
      deuteranopia: {
        primary: '#3b82f6',    // Bleu
        success: '#06b6d4',    // Cyan
        danger: '#f59e0b',     // Ambre
        warning: '#eab308',    // Jaune
      },
      tritanopia: {
        primary: '#ec4899',    // Rose
        success: '#10b981',    // Vert
        danger: '#ef4444',     // Rouge
        warning: '#f97316',    // Orange
      },
      monochrome: {
        primary: '#374151',    // Gris foncé
        success: '#6b7280',    // Gris moyen
        danger: '#1f2937',     // Gris très foncé
        warning: '#9ca3af',    // Gris clair
      },
    };

    if (theme !== 'normal') {
      const colors = themes[theme];
      
      // Appliquer via CSS variables
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-success', colors.success);
      root.style.setProperty('--color-danger', colors.danger);
      root.style.setProperty('--color-warning', colors.warning);
      
      // Appliquer le filtre monochrome si nécessaire
      if (theme === 'monochrome') {
        document.body.style.filter = 'grayscale(100%)';
      } else {
        document.body.style.filter = '';
      }
      
      // Changer les couleurs des éléments existants
      changeElementColors(colors);
    }
  };

  const resetThemeColors = () => {
    const root = document.documentElement;
    
    // Retirer les CSS variables
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-success');
    root.style.removeProperty('--color-danger');
    root.style.removeProperty('--color-warning');
    
    // Retirer le filtre
    document.body.style.filter = '';
    
    // Restaurer les couleurs originales en retirant les styles inline
    // Cela permet aux classes Tailwind de reprendre le contrôle
    document.querySelectorAll('.bg-indigo-600, .bg-indigo-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('background-color');
    });
    
    document.querySelectorAll('.text-indigo-600').forEach(el => {
      (el as HTMLElement).style.removeProperty('color');
    });
    
    document.querySelectorAll('.border-indigo-500, .border-indigo-600').forEach(el => {
      (el as HTMLElement).style.removeProperty('border-color');
    });
    
    document.querySelectorAll('.bg-green-600, .bg-green-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('background-color');
    });
    
    document.querySelectorAll('.text-green-600, .text-green-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('color');
    });
    
    document.querySelectorAll('.bg-red-600, .bg-red-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('background-color');
    });
    
    document.querySelectorAll('.text-red-600, .text-red-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('color');
    });
    
    document.querySelectorAll('.bg-yellow-600, .bg-yellow-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('background-color');
    });
    
    document.querySelectorAll('.text-yellow-600, .text-yellow-500').forEach(el => {
      (el as HTMLElement).style.removeProperty('color');
    });
    
    console.log('✅ Couleurs normales restaurées');
  };

  const announceToScreenReader = (message: string) => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  };

  return {
    colorTheme,
    changeColorTheme,
  };
}