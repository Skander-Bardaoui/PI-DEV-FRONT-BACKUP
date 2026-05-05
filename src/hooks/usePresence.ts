import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UserStatus {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: Date;
}

interface UsePresenceReturn {
  onlineUsers: string[];
  userStatuses: Map<string, 'online' | 'offline'>;
  isConnected: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://pi-dev-backend.onrender.com';

export const usePresence = (businessId: string | null): UsePresenceReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [userStatuses, setUserStatuses] = useState<Map<string, 'online' | 'offline'>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Don't connect if no businessId
    if (!businessId) {
      // Clean up existing connection if any
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      setOnlineUsers([]);
      setUserStatuses(new Map());
      return;
    }

    // Connect to WebSocket /presence namespace
    // Use withCredentials to send HTTP-only cookies
    const newSocket = io(`${API_BASE}/presence`, {
      withCredentials: true,
      query: {
        businessId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Presence connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      // Only log unexpected disconnects
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        console.warn('Presence disconnected:', reason);
      }
    });

    // Listen for online users list
    newSocket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(users);
      
      // Update user statuses
      const newStatuses = new Map<string, 'online' | 'offline'>();
      users.forEach(userId => {
        newStatuses.set(userId, 'online');
      });
      setUserStatuses(newStatuses);
    });

    // Listen for user status changes
    newSocket.on('userStatusChanged', (data: UserStatus) => {
      setUserStatuses(prev => {
        const newStatuses = new Map(prev);
        newStatuses.set(data.userId, data.status);
        return newStatuses;
      });

      if (data.status === 'online') {
        setOnlineUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat');
      }
    }, 30000);

    setSocket(newSocket);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
      setIsConnected(false);
    };
  }, [businessId]);

  return {
    onlineUsers,
    userStatuses,
    isConnected,
  };
};
