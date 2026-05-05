// src/hooks/useAIAccess.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AIAccessInfo {
  hasAIAccess: boolean;
  planName: string;
  planSlug: string;
  loading: boolean;
}

/**
 * Hook to check if the current user has AI access based on their subscription plan
 * Returns hasAIAccess: true for Premium plan, false for Free/Standard
 */
export function useAIAccess(): AIAccessInfo {
  const [hasAIAccess, setHasAIAccess] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planSlug, setPlanSlug] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAIAccess();
  }, []);

  const checkAIAccess = async () => {
    try {
      // Get current user's tenant subscription info
      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });

      // The backend should include subscription info in the user response
      // If not, we'll need to make a separate call
      const subscription = response.data.tenant?.subscription;
      
      if (subscription && subscription.plan) {
        const aiEnabled = subscription.plan.ai_enabled === true;
        setHasAIAccess(aiEnabled);
        setPlanName(subscription.plan.name || '');
        setPlanSlug(subscription.plan.slug || '');
      } else {
        // Fallback: assume no AI access if subscription info not available
        setHasAIAccess(false);
      }
    } catch (error) {
      console.error('Failed to check AI access:', error);
      setHasAIAccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasAIAccess, planName, planSlug, loading };
}
