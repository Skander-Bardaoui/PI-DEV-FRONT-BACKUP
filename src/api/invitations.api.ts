// src/api/invitations.api.ts
import axiosInstance from './axiosInstance';

export interface Invitation {
  id: string;
  business_id: string;
  email: string;
  role: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
  business?: {
    id: string;
    name: string;
    logo?: string;
  };
  inviter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  permissions?: string;
  is_active: boolean;
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    jobTitle?: string;
  };
}

// Send invitation to join a business
export const sendInvitation = async (
  businessId: string,
  email: string,
  role: string,
): Promise<Invitation> => {
  const response = await axiosInstance.post(
    `/businesses/${businessId}/invitations`,
    { email, role },
  );
  return response.data;
};

// Get all invitations for a business
export const getBusinessInvitations = async (
  businessId: string,
): Promise<Invitation[]> => {
  const response = await axiosInstance.get(
    `/businesses/${businessId}/invitations`,
  );
  return response.data;
};

// Cancel an invitation
export const cancelInvitation = async (
  businessId: string,
  invitationId: string,
): Promise<void> => {
  await axiosInstance.delete(
    `/businesses/${businessId}/invitations/${invitationId}`,
  );
};

// Get invitation by token (public)
export const getInvitationByToken = async (
  token: string,
): Promise<Invitation> => {
  const response = await axiosInstance.get(`/invitations/${token}`);
  return response.data;
};

// Accept invitation
export const acceptInvitation = async (token: string): Promise<Invitation> => {
  const response = await axiosInstance.post(`/invitations/${token}/accept`);
  return response.data;
};

// Reject invitation
export const rejectInvitation = async (token: string): Promise<Invitation> => {
  const response = await axiosInstance.post(`/invitations/${token}/reject`);
  return response.data;
};

// Get business members
export const getBusinessMembers = async (
  businessId: string,
): Promise<BusinessMember[]> => {
  const response = await axiosInstance.get(`/businesses/${businessId}/members`);
  return response.data;
};

// Remove member from business
export const removeMember = async (
  businessId: string,
  userId: string,
): Promise<void> => {
  await axiosInstance.delete(`/businesses/${businessId}/members/${userId}`);
};

// Update member role
export const updateMemberRole = async (
  businessId: string,
  userId: string,
  role: string,
): Promise<BusinessMember> => {
  const response = await axiosInstance.patch(
    `/businesses/${businessId}/members/${userId}/role`,
    { role },
  );
  return response.data;
};
