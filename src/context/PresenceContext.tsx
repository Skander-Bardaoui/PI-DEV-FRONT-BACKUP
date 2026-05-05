import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../hooks/useAuth';

interface PresenceContextType {
  onlineUsers: string[];
  userStatuses: Map<string, 'online' | 'offline'>;
  isConnected: boolean;
  setCurrentBusinessId: (businessId: string | null) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const usePresenceContext = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresenceContext must be used within PresenceProvider');
  }
  return context;
};

interface PresenceProviderProps {
  children: ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);
  
  // Initialize with user's business_id or from localStorage
  useEffect(() => {
    // If user is null (logged out), clear business ID immediately
    if (!user) {
      setCurrentBusinessId(null);
      localStorage.removeItem('currentBusinessId');
      return;
    }
    
    // Try multiple sources for businessId
    let businessId = null;
    
    if (user) {
      // Check user object for business_id (try multiple possible field names)
      businessId = user.business_id || (user as any).businessId || (user as any).business?.id;
      
      // Store in localStorage for persistence
      if (businessId) {
        localStorage.setItem('currentBusinessId', businessId);
        setCurrentBusinessId(businessId);
      } else {
        // Fallback to localStorage only if user exists but has no business_id
        businessId = localStorage.getItem('currentBusinessId');
        if (businessId) {
          setCurrentBusinessId(businessId);
        }
      }
    }
  }, [user]);
  
  const { onlineUsers, userStatuses, isConnected } = usePresence(currentBusinessId);

  return (
    <PresenceContext.Provider value={{ onlineUsers, userStatuses, isConnected, setCurrentBusinessId }}>
      {children}
    </PresenceContext.Provider>
  );
};
