import axiosInstance from './axiosInstance';

export interface SalaryMember {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    avatarUrl?: string;
    role: string;
  };
}

export interface SendProposalPayload {
  userId: string;
  amount: number;
  currency: string;
  message?: string;
  businessName: string;
}

export interface AcceptedProposal {
  id: string;
  recipientName: string;
  recipientEmail: string;
  proposedAmount: number;
  currency: string;
  status: 'ACCEPTED' | 'PAID';
  respondedAt: string;
  paidAt: string | null;
  transactionId: string | null;
}

export interface PaySalaryPayload {
  accountId: string;
}

export interface PaySalaryPayload {
  accountId: string;
  paymentMethod: string;
  stripePaymentIntentId?: string;
}

export const salaryApi = {
  getMembers: async (businessId: string): Promise<SalaryMember[]> => {
    const res = await axiosInstance.get(`/salary/${businessId}/members`);
    return res.data;
  },

  sendProposal: async (
    businessId: string,
    payload: SendProposalPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.post(`/salary/${businessId}/propose`, payload);
    return res.data;
  },

  getAcceptedProposals: async (businessId: string): Promise<AcceptedProposal[]> => {
    const res = await axiosInstance.get(`/salary/${businessId}/accepted-proposals`);
    return res.data;
  },

  paySalary: async (
    businessId: string,
    proposalId: string,
    payload: PaySalaryPayload,
  ): Promise<{ success: boolean }> => {
    const res = await axiosInstance.post(
      `/salary/${businessId}/pay/${proposalId}`,
      payload,
    );
    return res.data;
  },
};
