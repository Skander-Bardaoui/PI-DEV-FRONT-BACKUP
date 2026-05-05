// src/utils/aria-helpers.ts
// Utilitaires pour améliorer l'accessibilité ARIA

/**
 * Génère un ID unique pour les attributs ARIA
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Annonce un message aux lecteurs d'écran
 */
export function announceToScreenReader(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', politeness);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;

  document.body.appendChild(announcer);

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 3000);
}

/**
 * Attributs ARIA pour les boutons icônes
 */
export function getIconButtonAria(label: string, expanded?: boolean) {
  return {
    'aria-label': label,
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
  };
}

/**
 * Attributs ARIA pour les menus déroulants
 */
export function getDropdownAria(
  id: string,
  label: string,
  expanded: boolean
) {
  return {
    button: {
      'aria-label': label,
      'aria-expanded': expanded,
      'aria-controls': id,
      'aria-haspopup': 'true' as const,
    },
    menu: {
      id,
      role: 'menu' as const,
      'aria-label': label,
    },
  };
}

/**
 * Attributs ARIA pour les modals
 */
export function getModalAria(titleId: string, descriptionId?: string) {
  return {
    role: 'dialog' as const,
    'aria-modal': true,
    'aria-labelledby': titleId,
    ...(descriptionId && { 'aria-describedby': descriptionId }),
  };
}

/**
 * Attributs ARIA pour les notifications/toasts
 */
export function getNotificationAria(type: 'success' | 'error' | 'warning' | 'info') {
  const politeness = type === 'error' ? 'assertive' : 'polite';
  
  return {
    role: 'status' as const,
    'aria-live': politeness as 'polite' | 'assertive',
    'aria-atomic': true,
  };
}

/**
 * Attributs ARIA pour les champs de formulaire avec erreur
 */
export function getFieldErrorAria(fieldId: string, errorId: string, hasError: boolean) {
  return {
    field: {
      'aria-invalid': hasError,
      'aria-describedby': hasError ? errorId : undefined,
    },
    error: {
      id: errorId,
      role: 'alert' as const,
      'aria-live': 'assertive' as const,
    },
  };
}

/**
 * Attributs ARIA pour les onglets
 */
export function getTabsAria(
  tabId: string,
  panelId: string,
  selected: boolean
) {
  return {
    tab: {
      role: 'tab' as const,
      id: tabId,
      'aria-selected': selected,
      'aria-controls': panelId,
      tabIndex: selected ? 0 : -1,
    },
    panel: {
      role: 'tabpanel' as const,
      id: panelId,
      'aria-labelledby': tabId,
      tabIndex: 0,
    },
  };
}

/**
 * Attributs ARIA pour les badges de compteur
 */
export function getBadgeAria(count: number, label: string) {
  return {
    'aria-label': `${count} ${label}`,
    role: 'status' as const,
  };
}

/**
 * Attributs ARIA pour les éléments de navigation
 */
export function getNavItemAria(label: string, current: boolean) {
  return {
    'aria-label': label,
    'aria-current': current ? ('page' as const) : undefined,
  };
}

/**
 * Attributs ARIA pour les boutons de chargement
 */
export function getLoadingButtonAria(isLoading: boolean, label: string) {
  return {
    'aria-label': isLoading ? `${label} - Chargement en cours` : label,
    'aria-busy': isLoading,
    disabled: isLoading,
  };
}