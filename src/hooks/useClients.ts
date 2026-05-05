// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getClients, 
  getClient, 
  createClient, 
  updateClient, 
  deleteClient,
  inviteClient,
  getInvitationDetails,
  completeClientOnboarding,
  type InviteClientDto,
  type CompleteClientOnboardingDto,
  type Client
} from '@/api/clients';
import { toast } from 'sonner';

export const CLIENTS_KEY = 'clients';

export const useClients = (
  businessId: string,
  params?: { page?: number; limit?: number; search?: string }
) =>
  useQuery({
    queryKey: [CLIENTS_KEY, businessId, params],
    queryFn: () => getClients(businessId, params),
    enabled: !!businessId,
  });

export const useClient = (businessId: string, id: string) =>
  useQuery({
    queryKey: [CLIENTS_KEY, businessId, id],
    queryFn: () => getClient(businessId, id),
    enabled: !!businessId && !!id,
  });

export const useCreateClient = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<Client>) => createClient(businessId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY, businessId] });
      toast.success('Client créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du client');
    },
  });
};

export const useUpdateClient = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Client> }) => 
      updateClient(businessId, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY, businessId] });
      toast.success('Client mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du client');
    },
  });
};

export const useDeleteClient = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(businessId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY, businessId] });
      toast.success('Client supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du client');
    },
  });
};

export const useInviteClient = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: InviteClientDto) => inviteClient(businessId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY, businessId] });
      toast.success('Invitation envoyée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation');
    },
  });
};

export const useInvitationDetails = (token: string) =>
  useQuery({
    queryKey: ['client-invitation', token],
    queryFn: () => getInvitationDetails(token),
    enabled: !!token,
    retry: false,
  });

export const useCompleteClientOnboarding = () => {
  return useMutation({
    mutationFn: ({ token, dto }: { token: string; dto: CompleteClientOnboardingDto }) =>
      completeClientOnboarding(token, dto),
    onSuccess: () => {
      toast.success('Votre fiche client a été créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de votre fiche');
    },
  });
};
