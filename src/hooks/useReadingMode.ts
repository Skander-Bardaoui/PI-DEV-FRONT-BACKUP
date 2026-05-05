// src/hooks/useReadingMode.ts
// Hook pour gérer le mode lecture

import { useState, useEffect } from 'react';

export function useReadingMode() {
  const [isReadingMode, setIsReadingMode] = useState(false);

  useEffect(() => {
    // Charger l'état depuis localStorage
    const saved = localStorage.getItem('readingMode');
    if (saved === 'true') {
      setIsReadingMode(true);
      applyReadingMode(true);
    }
  }, []);

  const toggleReadingMode = () => {
    const newState = !isReadingMode;
    setIsReadingMode(newState);
    localStorage.setItem('readingMode', String(newState));
    applyReadingMode(newState);
  };

  const applyReadingMode = (enabled: boolean) => {
    const root = document.documentElement;
    
    if (enabled) {
      root.classList.add('reading-mode');
      
      // Masquer uniquement la sidebar et le header
      const sidebar = document.querySelector('.sidebar-container') as HTMLElement;
      const sidebarParent = document.querySelector('.lg\\:flex.lg\\:w-72') as HTMLElement;
      const header = document.querySelector('.top-header') as HTMLElement;
      const mainContainer = document.querySelector('.lg\\:pl-72') as HTMLElement;
      
      if (sidebar) {
        sidebar.style.display = 'none';
      }
      
      if (sidebarParent) {
        sidebarParent.style.display = 'none';
      }
      
      if (header) {
        header.style.display = 'none';
      }
      
      if (mainContainer) {
        mainContainer.style.paddingLeft = '0';
      }
      
      console.log('✅ Mode lecture activé - Sidebar et header masqués');
      announceToScreenReader('Mode lecture activé');
      
    } else {
      root.classList.remove('reading-mode');
      
      // Restaurer la sidebar et le header
      const sidebar = document.querySelector('.sidebar-container') as HTMLElement;
      const sidebarParent = document.querySelector('.lg\\:flex.lg\\:w-72') as HTMLElement;
      const header = document.querySelector('.top-header') as HTMLElement;
      const mainContainer = document.querySelector('.lg\\:pl-72') as HTMLElement;
      
      if (sidebar) {
        sidebar.style.display = '';
      }
      
      if (sidebarParent) {
        sidebarParent.style.display = '';
      }
      
      if (header) {
        header.style.display = '';
      }
      
      if (mainContainer) {
        mainContainer.style.paddingLeft = '';
      }
      
      console.log('❌ Mode lecture désactivé - Sidebar et header restaurés');
      announceToScreenReader('Mode lecture désactivé');
    }
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
    isReadingMode,
    toggleReadingMode,
  };
}