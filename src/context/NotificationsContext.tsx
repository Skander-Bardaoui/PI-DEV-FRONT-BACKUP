// src/context/NotificationsContext.tsx
// Contexte pour gérer les notifications WebSocket et les afficher dans le panel

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface WebSocketNotification {
  id: string;
  type: 'PO_CONFIRMED' | 'PO_REFUSED' | 'INVOICE_OVERDUE' | 'ALERT_CRITICAL' | 'PAYMENT_RECEIVED';
  title: string;
  message: string;
  businessId: string;
  entityId?: string;
  entityType?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextType {
  notifications: WebSocketNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<WebSocketNotification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);

  const addNotification = useCallback((notification: Omit<WebSocketNotification, 'id' | 'read'>) => {
    const newNotification: WebSocketNotification = {
      ...notification,
      id: `ws-${Date.now()}-${Math.random()}`,
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Garder max 50 notifications
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
