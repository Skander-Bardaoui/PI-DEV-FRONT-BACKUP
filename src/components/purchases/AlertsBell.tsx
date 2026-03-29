// src/components/purchases/AlertsBell.tsx
// Cloche de notification à placer dans votre navbar
// Affiche le nombre d'alertes non lues et ouvre le panneau au clic
//
// Usage dans votre navbar :
// <AlertsBell businessId={businessId} />

import { useState, useRef, useEffect } from 'react';
import { Bell }        from 'lucide-react';
import { useAlertUnreadCount } from '@/hooks/usePurchaseAlerts';
import AlertsPanel     from '@/components/purchases/AlertsPanel';
import { useAuth }     from '@/hooks/useAuth';

export default function AlertsBell() {
  const { user }       = useAuth();
  const businessId     = (user as any)?.business_id ?? '';
  const [open, setOpen]= useState(false);
  const ref            = useRef<HTMLDivElement>(null);

  const { data: count = 0 } = useAlertUnreadCount(businessId);

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative p-2 rounded-xl transition-colors ${
          open ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position:  'absolute',
            right:     0,
            top:       '100%',
            marginTop: 8,
            width:     380,
            zIndex:    1000,
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            borderRadius: 16,
          }}
        >
          <AlertsPanel
            businessId={businessId}
            onNavigate={(entityType, entityId) => {
              setOpen(false);
              // Navigation selon le type d'entité
              // Adaptez selon votre router
            }}
          />
        </div>
      )}
    </div>
  );
}