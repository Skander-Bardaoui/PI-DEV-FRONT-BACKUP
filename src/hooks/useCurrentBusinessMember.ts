// src/hooks/useCurrentBusinessMember.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useParams } from 'react-router-dom';
import { getBusinessMembers } from '../api/invitations.api';
import { BusinessMember } from '../types/permissions.types';

/**
 * Hook to get the current user's business member record with permissions
 * Fetches from the first business if no businessId is provided
 */
export function useCurrentBusinessMember() {
  const { user } = useAuth();
  const [businessMember, setBusinessMember] = useState<BusinessMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessMember = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get the first business ID from localStorage or session
        // This assumes the app stores the current business ID somewhere
        const storedBusinessId = localStorage.getItem('currentBusinessId');
        
        if (!storedBusinessId) {
          setError('No business selected');
          setIsLoading(false);
          return;
        }

        // Fetch all members for this business
        const members = await getBusinessMembers(storedBusinessId);
        
        // Find the current user's membership
        const currentMember = members.find(m => m.user_id === user.id);
        
        if (currentMember) {
          setBusinessMember(currentMember);
        } else {
          setError('User is not a member of this business');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch business member');
        console.error('Error fetching business member:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessMember();
  }, [user]);

  return { businessMember, isLoading, error };
}
