import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getMyBusinesses } from '../api/business.api';

/**
 * Custom hook to get the businessId for the current user
 * - For BUSINESS_OWNER: uses user.business_id
 * - For other roles (ACCOUNTANT, TEAM_MEMBER, etc.): fetches from business membership
 */
export function useBusinessId() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // If user has business_id directly, use it
        if (user.business_id) {
          setBusinessId(user.business_id);
          setLoading(false);
          return;
        }

        // Otherwise, fetch from business membership
        const businesses = await getMyBusinesses();
        if (businesses && businesses.length > 0) {
          setBusinessId(businesses[0].id);
        } else {
          setError('No business associated with your account');
        }
      } catch (err: any) {
        console.error('Error fetching business:', err);
        setError(err.message || 'Failed to fetch business information');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessId();
  }, [user]);

  return { businessId, loading, error };
}
