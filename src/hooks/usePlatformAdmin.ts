// src/hooks/usePlatformAdmin.ts
import { useContext } from 'react';
import { PlatformAdminContext } from '../context/PlatformAdminContext';

export function usePlatformAdmin() {
  const context = useContext(PlatformAdminContext);

  if (context === undefined) {
    throw new Error('usePlatformAdmin must be used within a PlatformAdminProvider');
  }

  return context;
}
