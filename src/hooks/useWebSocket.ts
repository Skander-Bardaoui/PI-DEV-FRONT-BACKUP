// src/hooks/useWebSocket.ts
// Hook pour gérer les connexions WebSocket et notifications en temps réel

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  type: 'PO_CONFIRMED' | 'PO_REFUSED' | 'INVOICE_OVERDUE' | 'ALERT_CRITICAL' | 'PAYMENT_RECEIVED';
  title: string;
  message: string;
  businessId: string;
  entityId?: string;
  entityType?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
}

interface UseWebSocketOptions {
  businessId: string;
  enabled?: boolean;
  onNotification?: (notification: Notification) => void;
}

export function useWebSocket({ businessId, enabled = true, onNotification }: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !businessId || socketRef.current?.connected) return;

    console.log('🔄 Attempting to connect WebSocket...');
    console.log('📍 Business ID:', businessId);
    console.log('📍 Server URL:', 'http://localhost:3001/notifications');

    const socket = io('http://localhost:3001/notifications', {
      query: { businessId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      console.log('✅ Transport:', socket.io.engine.transport.name);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('🎉 Connection confirmed by server:', data);
    });

    socket.on('notification', (notification: Notification) => {
      console.log('📬 Notification received:', notification);
      setLastNotification(notification);
      onNotification?.(notification);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error type:', error.type);
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    socketRef.current = socket;
  }, [businessId, enabled, onNotification]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendPing = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping');
    }
  }, []);

  useEffect(() => {
    if (enabled && businessId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, businessId, connect, disconnect]);

  return {
    isConnected,
    lastNotification,
    sendPing,
    disconnect,
    reconnect: connect,
  };
}
